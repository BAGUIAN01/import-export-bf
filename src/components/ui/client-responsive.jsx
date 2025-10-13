'use client'

import { cn } from '@/lib/utils'

/**
 * Composant de grille responsive spécifique aux pages client
 * Optimisé pour les statistiques et informations client
 */
export function ClientStatsGrid({ children, className }) {
  return (
    <div className={cn(
      "grid gap-3 xs:gap-4 sm:gap-4",
      "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6",
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Composant de grille pour les informations client
 * Optimisé pour les détails et formulaires
 */
export function ClientInfoGrid({ children, className }) {
  return (
    <div className={cn(
      "grid gap-3 xs:gap-4 sm:gap-4",
      "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2",
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Composant de grille pour les onglets client
 * Responsive avec touch targets optimisés
 */
export function ClientTabsGrid({ children, className }) {
  return (
    <div className={cn(
      "grid gap-1",
      "grid-cols-2 sm:grid-cols-4",
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Composant de grille pour les actions client
 * Optimisé pour les boutons d'action
 */
export function ClientActionsGrid({ children, className }) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3",
      "w-full sm:w-auto",
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Composant de grille pour les informations de contact
 * Optimisé pour les badges de contact
 */
export function ClientContactGrid({ children, className }) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4",
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Composant de grille pour les détails client
 * Optimisé pour les sections principales
 */
export function ClientDetailsGrid({ children, className }) {
  return (
    <div className={cn(
      "grid gap-4 xs:gap-6 sm:gap-6",
      "grid-cols-1 lg:grid-cols-2",
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Composant de grille pour les formulaires client
 * Optimisé pour les champs de formulaire
 */
export function ClientFormGrid({ children, className }) {
  return (
    <div className={cn(
      "grid gap-3 xs:gap-4 sm:gap-4",
      "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2",
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Composant de grille pour les sections client
 * Optimisé pour les sections principales
 */
export function ClientSectionGrid({ children, className }) {
  return (
    <div className={cn(
      "grid gap-3 xs:gap-4 sm:gap-4",
      "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
      className
    )}>
      {children}
    </div>
  )
}
