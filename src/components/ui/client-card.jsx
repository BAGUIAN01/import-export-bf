'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Star, Building, Phone, Mail, MapPin } from 'lucide-react'

/**
 * Composant pour les badges de statut avec gestion du débordement
 */
export function StatusBadge({ isActive, isVip, className }) {
  if (!isActive) {
    return (
      <Badge variant="outline" className={cn("bg-red-50 text-red-700 border-red-200 truncate", className)}>
        Inactif
      </Badge>
    );
  }
  if (isVip) {
    return (
      <Badge variant="outline" className={cn("bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200 shadow-sm truncate", className)}>
        <Star className="h-3 w-3 mr-1" />
        VIP
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("bg-green-50 text-green-700 border-green-200 truncate", className)}>
      Actif
    </Badge>
  );
}

/**
 * Composant pour les badges de pays avec gestion du débordement
 */
export function CountryBadge({ country, className }) {
  const conf = {
    France: { label: "France", color: "bg-blue-50 text-blue-700 border-blue-200" },
    "Burkina Faso": { label: "Burkina Faso", color: "bg-red-50 text-red-700 border-red-200" },
    "Côte d'Ivoire": { label: "Côte d'Ivoire", color: "bg-orange-50 text-orange-700 border-orange-200" },
  }[country] || { label: country || "Non défini", color: "bg-gray-50 text-gray-700 border-gray-200" };

  return (
    <Badge variant="outline" className={cn(`${conf.color} truncate max-w-[100px]`, className)}>
      {conf.label}
    </Badge>
  );
}

/**
 * Composant pour les informations de contact avec gestion du débordement
 */
export function ClientContactInfo({ 
  clientCode, 
  phone, 
  email, 
  city, 
  className 
}) {
  return (
    <div className={cn("flex items-center gap-4 text-sm text-gray-600 min-w-0 overflow-x-auto", className)}>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Building className="h-4 w-4" />
        <span className="truncate">{clientCode}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Phone className="h-4 w-4" />
        <span className="truncate">{phone}</span>
      </div>
      {email && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Mail className="h-4 w-4" />
          <span className="truncate">{email}</span>
        </div>
      )}
      <div className="flex items-center gap-1 flex-shrink-0">
        <MapPin className="h-4 w-4" />
        <span className="truncate">{city}</span>
      </div>
    </div>
  );
}

/**
 * Composant pour les informations supplémentaires avec gestion du débordement
 */
export function ClientAdditionalInfo({ 
  recipientName, 
  recipientCity, 
  shipmentsCount, 
  packagesCount, 
  totalSpent, 
  totalShipmentsAmount, 
  createdAt, 
  className 
}) {
  const formatCurrency = (amount) =>
    amount != null && amount !== "" ? `${Number(amount).toFixed(2)}€` : "-";
  
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");

  return (
    <div className={cn("grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4 text-sm", className)}>
      <div className="min-w-0">
        <p className="text-gray-500">Destinataire</p>
        <p className="font-medium truncate">{recipientName}</p>
        <p className="text-gray-500 truncate">{recipientCity}</p>
      </div>
      <div className="min-w-0">
        <p className="text-gray-500">Expéditions</p>
        <p className="font-medium">{shipmentsCount || 0}</p>
        <p className="text-gray-500">{packagesCount || 0} colis</p>
      </div>
      <div className="min-w-0">
        <p className="text-gray-500">Total dépensé</p>
        <p className="font-medium text-green-600 truncate">{formatCurrency(totalSpent)}</p>
        {totalShipmentsAmount > 0 && (
          <p className="text-gray-500 truncate">sur {formatCurrency(totalShipmentsAmount)}</p>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-gray-500">Statut paiement</p>
        <p className="font-medium">
          {totalSpent > 0 ? (
            totalSpent >= totalShipmentsAmount ? (
              <Badge variant="default" className="bg-green-100 text-green-800">Payé</Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Partiel</Badge>
            )
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">En attente</Badge>
          )}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-gray-500">Client depuis</p>
        <p className="font-medium truncate">{formatDate(createdAt)}</p>
      </div>
    </div>
  );
}

/**
 * Composant pour l'en-tête de la carte client avec gestion du débordement
 */
export function ClientCardHeader({ 
  firstName, 
  lastName, 
  isActive, 
  isVip, 
  country, 
  className 
}) {
  return (
    <div className={cn("flex items-center gap-2 mb-1 min-w-0", className)}>
      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
        {firstName} {lastName}
      </h3>
      <div className="flex items-center gap-1 flex-shrink-0">
        <StatusBadge isActive={isActive} isVip={isVip} />
        <CountryBadge country={country} />
      </div>
    </div>
  );
}
