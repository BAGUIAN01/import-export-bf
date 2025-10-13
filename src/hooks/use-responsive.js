'use client'

import { useState, useEffect } from 'react'

/**
 * Hook pour gérer le responsive de manière intelligente
 * Fournit des informations sur la taille d'écran et des utilitaires
 */
export function useResponsive() {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLarge: false,
    breakpoint: 'xs'
  })

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      const isMobile = width < 640
      const isTablet = width >= 640 && width < 1024
      const isDesktop = width >= 1024 && width < 1280
      const isLarge = width >= 1280
      
      let breakpoint = 'xs'
      if (width >= 1536) breakpoint = '2xl'
      else if (width >= 1280) breakpoint = 'xl'
      else if (width >= 1024) breakpoint = 'lg'
      else if (width >= 768) breakpoint = 'md'
      else if (width >= 640) breakpoint = 'sm'
      else if (width >= 475) breakpoint = 'xs'
      
      setScreenSize({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        isLarge,
        breakpoint
      })
    }

    // Initial call
    updateScreenSize()

    // Add event listener
    window.addEventListener('resize', updateScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return screenSize
}

/**
 * Hook pour gérer les colonnes responsive
 * Retourne le nombre optimal de colonnes selon la taille d'écran
 */
export function useResponsiveColumns() {
  const { breakpoint } = useResponsive()
  
  const getColumns = (config) => {
    const { xs = 1, sm = 2, md = 3, lg = 4, xl = 6, '2xl': xxl = 6 } = config
    
    switch (breakpoint) {
      case '2xl': return xxl
      case 'xl': return xl
      case 'lg': return lg
      case 'md': return md
      case 'sm': return sm
      case 'xs': return xs
      default: return xs
    }
  }

  return { getColumns, breakpoint }
}

/**
 * Hook pour gérer les espacements responsive
 * Retourne l'espacement optimal selon la taille d'écran
 */
export function useResponsiveSpacing() {
  const { breakpoint } = useResponsive()
  
  const getSpacing = (config) => {
    const { xs = 3, sm = 4, md = 4, lg = 6, xl = 6, '2xl': xxl = 6 } = config
    
    switch (breakpoint) {
      case '2xl': return xxl
      case 'xl': return xl
      case 'lg': return lg
      case 'md': return md
      case 'sm': return sm
      case 'xs': return xs
      default: return xs
    }
  }

  return { getSpacing, breakpoint }
}

/**
 * Hook pour gérer les tailles de police responsive
 */
export function useResponsiveTypography() {
  const { isMobile, isTablet } = useResponsive()
  
  const getFontSize = (config) => {
    const { mobile = 'sm', tablet = 'base', desktop = 'lg' } = config
    
    if (isMobile) return mobile
    if (isTablet) return tablet
    return desktop
  }

  return { getFontSize, isMobile, isTablet }
}
