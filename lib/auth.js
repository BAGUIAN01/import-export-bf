// lib/auth.js
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: "phone",
      name: "Phone",
      credentials: {
        phone: { 
          label: "Numéro de téléphone", 
          type: "tel",
          placeholder: "+33 6 12 34 56 78"
        },
        code: { 
          label: "Code de vérification", 
          type: "text",
          placeholder: "123456"
        }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          throw new Error("Téléphone et code requis")
        }

        try {
          // Vérifier le code SMS
          const verification = await prisma.phoneVerification.findFirst({
            where: {
              phone: credentials.phone,
              code: credentials.code,
              verified: false,
              expiresAt: {
                gt: new Date()
              }
            }
          })

          if (!verification) {
            throw new Error("Code invalide ou expiré")
          }

          // Incrémenter les tentatives
          await prisma.phoneVerification.update({
            where: { id: verification.id },
            data: { 
              attempts: verification.attempts + 1,
              verified: true 
            }
          })

          // Chercher ou créer l'utilisateur
          let user = await prisma.user.findUnique({
            where: { phone: credentials.phone }
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                phone: credentials.phone,
                role: "CLIENT",
                name: null,
                email: null
              }
            })
          }

          // Vérifier si l'utilisateur est actif
          if (!user.isActive) {
            throw new Error("Compte désactivé")
          }

          return {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image
          }
        } catch (error) {
          console.error('Erreur authentification:', error)
          throw new Error(error.message || "Erreur d'authentification")
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    updateAge: 24 * 60 * 60, // 24 heures
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Première connexion
      if (user) {
        token.role = user.role
        token.phone = user.phone
      }

      // Mise à jour de session
      if (trigger === "update" && session) {
        token.name = session.name
        token.email = session.email
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.phone = token.phone
        session.user.name = token.name
        session.user.email = token.email
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Log de connexion
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'SIGN_IN',
            resource: 'auth',
            details: JSON.stringify({ provider: account?.provider })
          }
        })
      } catch (error) {
        console.error('Erreur log connexion:', error)
      }
      
      return true
    },
    async signOut({ token }) {
      // Log de déconnexion
      try {
        if (token?.sub) {
          await prisma.auditLog.create({
            data: {
              userId: token.sub,
              action: 'SIGN_OUT',
              resource: 'auth'
            }
          })
        }
      } catch (error) {
        console.error('Erreur log déconnexion:', error)
      }
      
      return true
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`Connexion réussie: ${user.phone} (${user.role})`)
    },
    async signOut({ token }) {
      console.log(`Déconnexion: ${token?.phone}`)
    },
    async createUser({ user }) {
      console.log(`Nouvel utilisateur: ${user.phone}`)
    }
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    newUser: "/auth/profile"
  },
  debug: process.env.NODE_ENV === 'development'
}