'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'

const fetcher = (url) => fetch(url).then((res) => res.json())

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher)

  const updateSettings = useCallback(async (settings) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      const result = await response.json()
      mutate()
      toast.success('Paramètres sauvegardés avec succès')
      return result
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde des paramètres')
      throw error
    }
  }, [mutate])

  const resetSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/reset', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la réinitialisation')
      }

      mutate()
      toast.success('Paramètres réinitialisés')
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation')
      throw error
    }
  }, [mutate])

  const createBackup = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/backup', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la sauvegarde')
      }

      toast.success('Sauvegarde créée avec succès')
      return await response.json()
    } catch (error) {
      toast.error('Erreur lors de la création de la sauvegarde')
      throw error
    }
  }, [])

  const clearCache = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/cache', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors du vidage du cache')
      }

      toast.success('Cache vidé avec succès')
    } catch (error) {
      toast.error('Erreur lors du vidage du cache')
      throw error
    }
  }, [])

  const optimizeDatabase = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/optimize', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'optimisation')
      }

      toast.success('Base de données optimisée')
    } catch (error) {
      toast.error('Erreur lors de l\'optimisation')
      throw error
    }
  }, [])

  const testNotification = useCallback(async (type) => {
    try {
      const response = await fetch('/api/settings/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du test')
      }

      toast.success(`Notification ${type} de test envoyée`)
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du test')
      throw error
    }
  }, [])

  return {
    settings: data,
    isLoading,
    error,
    updateSettings,
    resetSettings,
    createBackup,
    clearCache,
    optimizeDatabase,
    testNotification,
    mutate
  }
}

export function useSystemStats() {
  const { data, error, isLoading, mutate } = useSWR('/api/settings/stats', fetcher, {
    refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
  })

  return {
    stats: data,
    isLoading,
    error,
    mutate
  }
}
