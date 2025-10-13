'use client'

import { cn } from '@/lib/utils'

/**
 * Composant pour gérer le débordement de texte de manière cohérente
 */
export function TextOverflow({ 
  children, 
  className,
  as: Component = 'span',
  truncate = true,
  breakWords = false,
  ...props 
}) {
  return (
    <Component 
      className={cn(
        truncate && "truncate",
        breakWords && "break-words",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

/**
 * Composant pour les informations de contact avec gestion du débordement
 */
export function ContactInfo({ 
  icon: Icon, 
  label, 
  value, 
  className,
  iconClassName,
  labelClassName,
  valueClassName 
}) {
  return (
    <div className={cn("flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0", className)}>
      <Icon className={cn("h-4 w-4 flex-shrink-0", iconClassName)} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm text-gray-600", labelClassName)}>{label}</p>
        <TextOverflow className={cn("font-medium", valueClassName)}>
          {value}
        </TextOverflow>
      </div>
    </div>
  )
}

/**
 * Composant pour les informations d'adresse avec gestion du débordement
 */
export function AddressInfo({ 
  icon: Icon, 
  address, 
  city, 
  country, 
  postalCode,
  className,
  iconClassName,
  addressClassName,
  cityClassName,
  postalCodeClassName 
}) {
  return (
    <div className={cn("flex items-start gap-3 p-3 bg-gray-50 rounded-lg min-w-0", className)}>
      <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", iconClassName)} />
      <div className="min-w-0 flex-1">
        <TextOverflow 
          className={cn("font-medium", addressClassName)}
          breakWords={true}
        >
          {address}
        </TextOverflow>
        <TextOverflow className={cn("text-sm text-gray-600", cityClassName)}>
          {city}, {country}
        </TextOverflow>
        {postalCode && (
          <TextOverflow className={cn("text-sm text-gray-500", postalCodeClassName)}>
            {postalCode}
          </TextOverflow>
        )}
      </div>
    </div>
  )
}

/**
 * Composant pour les badges de contact avec gestion du débordement
 */
export function ContactBadge({ 
  icon: Icon, 
  value, 
  className,
  iconClassName,
  valueClassName 
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm min-h-[44px] sm:min-h-[36px] min-w-0 flex-1 sm:flex-none",
      className
    )}>
      <Icon className={cn("h-4 w-4 flex-shrink-0", iconClassName)} />
      <TextOverflow className={cn("font-medium text-sm sm:text-base", valueClassName)}>
        {value}
      </TextOverflow>
    </div>
  )
}

/**
 * Composant pour les informations de destinataire avec gestion du débordement
 */
export function RecipientInfo({ 
  icon: Icon, 
  label, 
  value, 
  className,
  iconClassName,
  labelClassName,
  valueClassName 
}) {
  return (
    <div className={cn("flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0", className)}>
      <Icon className={cn("h-4 w-4 flex-shrink-0", iconClassName)} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm text-gray-600", labelClassName)}>{label}</p>
        <TextOverflow className={cn("font-medium", valueClassName)}>
          {value}
        </TextOverflow>
      </div>
    </div>
  )
}
