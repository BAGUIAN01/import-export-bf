// src/lib/auth.js
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "./prisma"
import { sendSMS } from "../lib/twilio"
import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js"

// --- helpers ---
function normalizePhone(raw) {
  if (!isValidPhoneNumber(raw)) return null
  const parsed = parsePhoneNumberFromString(raw)
  return parsed?.number ?? null // E.164
}
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString() // 6 digits
}
function getCountryNameFromPhone(countryCode) {
  const countries = {
    FR: "France",
    BF: "Burkina Faso",
    CI: "Côte d'Ivoire",
    ML: "Mali",
    SN: "Sénégal",
    NE: "Niger",
    TG: "Togo",
    BJ: "Bénin",
    GH: "Ghana",
    GN: "Guinée",
  }
  return countries[countryCode] || "Inconnu"
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    // -------------------------------
    // Login par téléphone (2 étapes)
    // -------------------------------
    CredentialsProvider({
      id: "phone",
      name: "Phone",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code: { label: "Code", type: "text" },
        step: { label: "Step", type: "text" }, // "request" | "verify"
      },
      async authorize(credentials) {
        try {
          const normalizedPhone = normalizePhone(credentials?.phone || "")
          if (!normalizedPhone) throw new Error("Numéro de téléphone invalide")

          if (credentials.step === "request") {
            // L'utilisateur doit déjà exister et être actif
            const user = await prisma.user.findUnique({
              where: { phone: normalizedPhone },
            })
            if (!user) throw new Error("Aucun compte associé à ce numéro")
            if (!user.isActive)
              throw new Error("Compte désactivé. Contactez le support.")

            // Rate-limit simple: max 3 demandes sur 5 minutes
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
            const recent = await prisma.phoneVerification.count({
              where: { phone: normalizedPhone, createdAt: { gte: fiveMinutesAgo } },
            })
            if (recent >= 3)
              throw new Error("Trop de tentatives. Attendez 5 minutes.")

            const code = generateVerificationCode()
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

            await prisma.phoneVerification.deleteMany({ where: { phone: normalizedPhone } })
            await prisma.phoneVerification.create({
              data: { phone: normalizedPhone, code, expiresAt },
            })

            const parsed = parsePhoneNumberFromString(normalizedPhone)
            const countryName = getCountryNameFromPhone(parsed?.country)
            const message = `Import Export BF: Votre code de connexion est ${code}. Valide 10 min. Ne le partagez jamais.`

            await sendSMS(normalizedPhone, message)

            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: "SMS_LOGIN_CODE_SENT",
                resource: "phone_verification",
                details: JSON.stringify({ phone: normalizedPhone, country: countryName }),
              },
            })

            // première étape : on ne connecte pas encore
            return null
          }

          if (credentials.step === "verify") {
            if (!/^\d{6}$/.test(credentials?.code || ""))
              throw new Error("Code de vérification requis (6 chiffres)")

            const verification = await prisma.phoneVerification.findFirst({
              where: {
                phone: normalizedPhone,
                code: credentials.code,
                verified: false,
                expiresAt: { gt: new Date() },
              },
            })

            if (!verification) {
              await prisma.phoneVerification.updateMany({
                where: { phone: normalizedPhone, verified: false },
                data: { attempts: { increment: 1 } },
              })
              throw new Error("Code invalide ou expiré")
            }

            if (verification.attempts >= 3) {
              throw new Error("Trop de tentatives incorrectes")
            }

            // Marquer le code utilisé + nettoyer le reste
            await prisma.$transaction([
              prisma.phoneVerification.update({
                where: { id: verification.id },
                data: { verified: true },
              }),
              prisma.phoneVerification.deleteMany({ where: { phone: normalizedPhone } }),
            ])

            const user = await prisma.user.update({
              where: { phone: normalizedPhone },
              data: { lastLoginAt: new Date() },
            })

            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: "USER_LOGIN_SMS",
                resource: "user",
                resourceId: user.id,
                details: JSON.stringify({ phone: normalizedPhone, method: "sms" }),
              },
            })

            return {
              id: user.id,
              phone: user.phone,
              name: user.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
              email: user.email,
              role: user.role,
              image: user.image,
            }
          }

          throw new Error("Étape non reconnue")
        } catch (e) {
          console.error("Erreur d'authentification SMS:", e)
          throw e
        }
      },
    }),

    // -----------------------------------------------------
    // Inscription : vérifie le code et ACTIVE le compte
    // (appelé depuis signUp: signIn("phone-sms", { ... }))
    // -----------------------------------------------------
    CredentialsProvider({
      id: "phone-sms",
      name: "Phone SMS Registration",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code: { label: "Code", type: "text" },
        firstName: { label: "First Name", type: "text" },
        lastName: { label: "Last Name", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isRegistration: { label: "Is Registration", type: "text" }, // "true"
      },
      async authorize(credentials) {
        try {
          if (credentials?.isRegistration !== "true")
            throw new Error("Provider d'inscription uniquement")

          const normalizedPhone = normalizePhone(credentials?.phone || "")
          if (!normalizedPhone) throw new Error("Numéro de téléphone invalide")
          if (!/^\d{6}$/.test(credentials?.code || ""))
            throw new Error("Code invalide ou expiré")

          // Vérifier le code
          const verification = await prisma.phoneVerification.findFirst({
            where: {
              phone: normalizedPhone,
              code: credentials.code,
              verified: false,
              expiresAt: { gt: new Date() },
            },
          })
          if (!verification) throw new Error("Code invalide ou expiré")
          if (verification.attempts >= 3)
            throw new Error("Trop de tentatives incorrectes")

          // Récupérer l'utilisateur (créé par /api/auth/register)
          let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
          if (!user)
            throw new Error("Utilisateur non trouvé. Veuillez recommencer l'inscription.")

          // Activer l'utilisateur
          const [updatedUser] = await prisma.$transaction([
            prisma.user.update({
              where: { id: user.id },
              data: { isActive: true, lastLoginAt: new Date() },
            }),
            prisma.phoneVerification.update({
              where: { id: verification.id },
              data: { verified: true },
            }),
            // Nettoyage des codes restants pour ce téléphone
            prisma.phoneVerification.deleteMany({ where: { phone: normalizedPhone } }),
            prisma.auditLog.create({
              data: {
                userId: user.id,
                action: "USER_ACCOUNT_ACTIVATED",
                resource: "user",
                resourceId: user.id,
                details: JSON.stringify({
                  phone: normalizedPhone,
                  method: "sms_verification",
                }),
              },
            }),
          ])

          user = updatedUser

          return {
            id: user.id,
            phone: user.phone,
            name: user.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
            email: user.email,
            role: user.role,
            image: user.image,
          }
        } catch (e) {
          console.error("Erreur d'inscription SMS:", e)
          throw e
        }
      },
    }),

    // --------------------------------------------
    // Auth classique (email / mot de passe)
    // --------------------------------------------
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        login: { label: "Email ou Téléphone", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.login || !credentials?.password)
            throw new Error("Email/téléphone et mot de passe requis")

          // email ou téléphone
          let whereCondition = {}
          if (credentials.login.includes("@")) {
            whereCondition = { email: credentials.login.toLowerCase() }
          } else {
            const normalized = normalizePhone(credentials.login)
            whereCondition = normalized
              ? { phone: normalized }
              : { email: credentials.login.toLowerCase() }
          }

          const user = await prisma.user.findFirst({ where: whereCondition })
          if (!user || !user.password) throw new Error("Identifiants incorrects")

          const ok = await compare(credentials.password, user.password)
          if (!ok) throw new Error("Identifiants incorrects")
          if (!user.isActive)
            throw new Error("Compte non activé. Veuillez vérifier votre téléphone.")

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "USER_LOGIN_CREDENTIALS",
              resource: "user",
              resourceId: user.id,
              details: JSON.stringify({
                loginMethod: credentials.login.includes("@") ? "email" : "phone",
              }),
            },
          })

          return {
            id: user.id,
            phone: user.phone,
            name: user.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
            email: user.email,
            role: user.role,
            image: user.image,
          }
        } catch (e) {
          console.error("Erreur d'authentification credentials:", e)
          throw e
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }) {
      if (!session.user) session.user = {}
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.phone = token.phone
      }
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },

  events: {
    async signIn({ user }) {
      console.log(`Connexion réussie pour l'utilisateur ${user.id}`)
    },
    async signOut({ token }) {
      if (token?.sub) {
        await prisma.auditLog.create({
          data: {
            userId: token.sub,
            action: "USER_LOGOUT",
            resource: "user",
            resourceId: token.sub,
          },
        })
      }
    },
  },
}
