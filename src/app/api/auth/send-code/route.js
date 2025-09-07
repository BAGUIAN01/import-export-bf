
import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const { phone, isRegistration } = await request.json()
    if (!phone) return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 })
    const result = await AuthService.initiatePhoneVerification(phone, !!isRegistration)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur send-code:', error)
    return NextResponse.json({ error: error?.message ?? 'Erreur interne' }, { status: 400 })
  }
}
