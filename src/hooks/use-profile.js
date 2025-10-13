"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'

const fetcher = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch profile data')
  }
  return response.json()
}

/**
 * Hook pour récupérer les données du profil utilisateur
 */
export function useProfile() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/profile` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  return {
    user: data?.user || null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook pour les mutations du profil (mise à jour, changement de mot de passe, etc.)
 */
export function useProfileMutations() {
  const [isLoading, setIsLoading] = useState(false)

  const updateProfile = async (profileData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updatePassword = async (passwordData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update password')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Password update error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const enableTwoFactor = async (phone) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enable 2FA')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('2FA enable error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const disableTwoFactor = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to disable 2FA')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('2FA disable error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateNotificationSettings = async (settings) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update notification settings')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Notification settings update error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const uploadAvatar = async (file) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload avatar')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Avatar upload error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    updateProfile,
    updatePassword,
    enableTwoFactor,
    disableTwoFactor,
    updateNotificationSettings,
    uploadAvatar,
  }
}
