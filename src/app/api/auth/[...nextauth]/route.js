// app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Configuration NextAuth pour App Router
 * Gère toutes les routes d'authentification : /api/auth/*
 */

const handler = NextAuth(authOptions)

// Export pour les méthodes HTTP supportées
export { handler as GET, handler as POST }