import 'server-only'                       
import { prisma } from '@/lib/prisma'
import { sendVerificationCode} from '@/lib/twilio'
import { PhoneUtils } from '@/lib/utils/phone'
import bcrypt from 'bcryptjs'               

export class AuthService {
  static async checkPhoneExists(phone) {
    let cleanPhone
    try { cleanPhone = PhoneUtils.normalize(phone) }
    catch (error) { throw new Error(`Numéro de téléphone invalide: ${error.message}`) }

    const user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
      select: {
        id: true, phone: true, firstName: true, lastName: true, name: true,
        email: true, isActive: true, emailVerified: true, password: true,
        role: true, createdAt: true, lastLoginAt: true
      }
    })

    const info = PhoneUtils.validate(phone)
    return {
      exists: !!user,
      user: user ? {
        id: user.id, phone: user.phone, firstName: user.firstName, lastName: user.lastName,
        name: user.name, email: user.email, role: user.role, isActive: user.isActive,
        createdAt: user.createdAt, lastLoginAt: user.lastLoginAt
      } : null,
      isVerified: !!user?.emailVerified,
      canUsePassword: !!(user?.password && user?.emailVerified),
      isActive: !!user?.isActive,
      phoneInfo: {
        country: info.country,
        countryName: info.countryName,
        formatted: info.formatted,
        international: info.international
      }
    }
  }

  static async initiatePhoneVerification(phone, isRegistration = false) {
    const v = PhoneUtils.validate(phone)
    if (!v.valid) throw new Error(v.error)
    const cleanPhone = v.international

    if (!PhoneUtils.canReceiveSMS(phone)) {
      throw new Error(`Les SMS ne sont pas supportés pour ${v.countryName}`)
    }

    const check = await this.checkPhoneExists(cleanPhone)
    if (isRegistration && check.exists) throw new Error('Un compte existe déjà avec ce numéro')
    if (!isRegistration && !check.exists) throw new Error('Aucun compte trouvé avec ce numéro')
    if (check.exists && !check.isActive) throw new Error('Ce compte a été désactivé. Contactez l’administrateur.')

    const recentAttempts = await prisma.phoneVerification.count({
      where: { phone: cleanPhone, createdAt: { gte: new Date(Date.now() - 60*60*1000) } }
    })
    if (recentAttempts >= 5) throw new Error('Trop de tentatives. Réessayez dans une heure.')

    await sendVerificationCode(cleanPhone)

    return {
      success: true,
      message: `Code SMS envoyé au numéro ${v.formatted}`,
      requiresRegistration: !check.exists,
      canUsePassword: check.canUsePassword,
      user: check.user,
      phoneInfo: check.phoneInfo
    }
  }

  static async createUser({ phone, firstName, lastName, email, password, role = 'CLIENT' }) {
    const v = PhoneUtils.validate(phone)
    if (!v.valid) throw new Error(v.error)
    const cleanPhone = v.international

    if (!firstName || !lastName) throw new Error('Nom et prénom requis')
    if (!password || password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères')

    const existing = await prisma.user.findUnique({ where: { phone: cleanPhone } })
    if (existing) throw new Error('Un compte existe déjà avec ce numéro')

    if (email) {
      const emailExists = await prisma.user.findUnique({ where: { email } })
      if (emailExists) throw new Error('Un compte existe déjà avec cet email')
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          phone: cleanPhone,
          firstName, lastName, name: `${firstName} ${lastName}`,
          email, password: hashedPassword, role, isActive: true,
          emailVerified: new Date(),
          country: v.country === 'FR' ? 'France' : v.countryName
        }
      })

      await tx.auditLog.create({
        data: {
          userId: newUser.id, action: 'USER_CREATED', resource: 'user', resourceId: newUser.id,
          details: JSON.stringify({ phone: cleanPhone, country: v.countryName, method: 'registration', email: email || null })
        }
      })

      if (role === 'CLIENT') {
        const clientCode = await AuthService.generateClientCode(tx)
        await tx.client.create({
          data: {
            clientCode, userId: newUser.id, firstName, lastName, phone: cleanPhone, email,
            address: '', city: '',
            country: v.country === 'FR' ? 'France' : v.countryName,
            recipientName: '', recipientPhone: '', recipientAddress: '', recipientCity: 'Ouagadougou'
          }
        })
      }

      return newUser
    })

    return {
      id: user.id, phone: user.phone, firstName: user.firstName, lastName: user.lastName,
      name: user.name, email: user.email, role: user.role, country: user.country
    }
  }

  static async authenticateWithPassword(phone, password) {
    let cleanPhone
    try { cleanPhone = PhoneUtils.normalize(phone) } catch { throw new Error('Format de numéro invalide') }

    const user = await prisma.user.findUnique({ where: { phone: cleanPhone } })
    if (!user) throw new Error('Utilisateur non trouvé')
    if (!user.isActive) throw new Error('Compte désactivé. Contactez l’administrateur.')
    if (!user.password) throw new Error('Aucun mot de passe défini pour ce compte. Utilisez la connexion par SMS.')

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      await prisma.auditLog.create({
        data: { userId: user.id, action: 'LOGIN_FAILED', resource: 'user', resourceId: user.id,
          details: JSON.stringify({ reason: 'invalid_password', phone: cleanPhone }) }
      })
      throw new Error('Mot de passe incorrect')
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN_SUCCESS', resource: 'user', resourceId: user.id,
        details: JSON.stringify({ method: 'password', phone: cleanPhone }) }
    })

    return {
      id: user.id, phone: user.phone, firstName: user.firstName, lastName: user.lastName,
      name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified
    }
  }

  static async generateClientCode(tx = prisma) {
    const count = await tx.client.count()
    const sequence = String(count + 1).padStart(4, '0')
    return `CLI${sequence}`
  }
}
