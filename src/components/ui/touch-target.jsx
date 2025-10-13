'use client'

import { cn } from '@/lib/utils'

/**
 * Composant pour s'assurer que les éléments respectent les touch targets
 * Minimum 44px sur mobile, 36px sur desktop
 */
export function TouchTarget({ 
  children, 
  className,
  as: Component = 'div',
  minHeight = {
    mobile: 44,
    desktop: 36
  }
}) {
  return (
    <Component 
      className={cn(
        `min-h-[${minHeight.mobile}px] sm:min-h-[${minHeight.desktop}px]`,
        className
      )}
    >
      {children}
    </Component>
  )
}

/**
 * Wrapper pour les boutons avec touch targets optimisés
 */
export function TouchButton({ 
  children, 
  className,
  ...props 
}) {
  return (
    <TouchTarget 
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </TouchTarget>
  )
}

/**
 * Wrapper pour les liens avec touch targets optimisés
 */
export function TouchLink({ 
  children, 
  className,
  ...props 
}) {
  return (
    <TouchTarget 
      as="a"
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </TouchTarget>
  )
}
