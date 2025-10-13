'use client'

import { cn } from '@/lib/utils'

/**
 * Composant de grille responsive avec breakpoints cohérents
 * Utilise une approche mobile-first avec des breakpoints optimisés
 */
export function ResponsiveGrid({ 
  children, 
  className,
  cols = {
    default: 1,
    xs: 2,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6
  },
  gap = {
    default: 3,
    xs: 4,
    sm: 4,
    md: 4,
    lg: 6
  }
}) {
  const gridCols = `grid-cols-${cols.default} xs:grid-cols-${cols.xs} sm:grid-cols-${cols.sm} md:grid-cols-${cols.md} lg:grid-cols-${cols.lg} xl:grid-cols-${cols.xl}`
  const gridGap = `gap-${gap.default} xs:gap-${gap.xs} sm:gap-${gap.sm} md:gap-${gap.md} lg:gap-${gap.lg}`

  return (
    <div className={cn("grid", gridCols, gridGap, className)}>
      {children}
    </div>
  )
}

/**
 * Composant de grille pour les statistiques
 * Optimisé pour les cards de stats avec 6 colonnes max
 */
export function StatsGrid({ children, className }) {
  return (
    <ResponsiveGrid 
      className={className}
      cols={{
        default: 1,
        xs: 2,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 6
      }}
      gap={{
        default: 3,
        xs: 4,
        sm: 4,
        md: 4,
        lg: 6
      }}
    >
      {children}
    </ResponsiveGrid>
  )
}

/**
 * Composant de grille pour les actions rapides
 * Optimisé pour les boutons d'action
 */
export function ActionsGrid({ children, className }) {
  return (
    <ResponsiveGrid 
      className={className}
      cols={{
        default: 2,
        sm: 4,
        md: 4,
        lg: 4,
        xl: 4
      }}
      gap={{
        default: 3,
        xs: 4,
        sm: 4,
        md: 4,
        lg: 4
      }}
    >
      {children}
    </ResponsiveGrid>
  )
}

/**
 * Composant de grille pour les formulaires
 * Optimisé pour les champs de formulaire
 */
export function FormGrid({ children, className, cols = 2 }) {
  return (
    <ResponsiveGrid 
      className={className}
      cols={{
        default: 1,
        xs: cols,
        sm: cols,
        md: cols,
        lg: cols,
        xl: cols
      }}
      gap={{
        default: 3,
        xs: 4,
        sm: 4,
        md: 4,
        lg: 4
      }}
    >
      {children}
    </ResponsiveGrid>
  )
}
