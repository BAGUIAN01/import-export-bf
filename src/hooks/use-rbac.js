'use client'

import { useSession } from 'next-auth/react'
import { 
  canAccess, 
  getAllowedRoles, 
  homeForRole, 
  filterNavByRole,
  hasPermission,
  canViewPackage,
  canModifyResource
} from '@/lib/rbac'

export function useRBAC() {
  const { data: session, status } = useSession()
  const userRole = session?.user?.role
  const userId = session?.user?.id
  const clientId = session?.user?.clientId // Si l'utilisateur est lié à un client

  return {
    // État de l'authentification
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    user: session?.user,
    role: userRole,
    userId,
    clientId,

    // Vérifications d'accès
    canAccess: (pathname) => canAccess(userRole, pathname),
    getAllowedRoles: (pathname) => getAllowedRoles(pathname),
    getHomeRoute: () => homeForRole(userRole),
    
    // Filtrage de navigation
    filterNavByRole: (nav, options) => filterNavByRole(nav, userRole, options),

    // Vérifications par rôle
    isAdmin: userRole === 'ADMIN',
    isClient: userRole === 'CLIENT',

    // Permissions métier simplifiées
    canManageUsers: userRole === 'ADMIN',
    canManageClients: userRole === 'ADMIN',
    canCreatePackages: userRole === 'ADMIN',
    canManageContainers: userRole === 'ADMIN',
    canViewFinance: userRole === 'ADMIN',
    canManageFinance: userRole === 'ADMIN',
    canSendCommunications: userRole === 'ADMIN',
    canUpdateTracking: userRole === 'ADMIN',
    canViewReports: userRole === 'ADMIN',
    canManageSettings: userRole === 'ADMIN',

    // Permissions spécifiques aux entités
    hasPackagePermission: (permission) => hasPermission(userRole, permission, 'PACKAGE'),
    hasClientPermission: (permission) => hasPermission(userRole, permission, 'CLIENT'),
    hasContainerPermission: (permission) => hasPermission(userRole, permission, 'CONTAINER'),
    hasFinancePermission: (permission) => hasPermission(userRole, permission, 'FINANCE'),
    hasCommunicationPermission: (permission) => hasPermission(userRole, permission, 'COMMUNICATION'),

    // Vérifications contextuelles
    canViewPackage: (packageClientId) => canViewPackage(userRole, clientId, packageClientId),
    canModifyResource: (resourceOwnerId) => canModifyResource(userRole, resourceOwnerId, userId),

    // Permissions granulaires par action
    canCreateInvoice: ['ADMIN', 'STAFF'].includes(userRole),
    canProcessPayment: ['ADMIN', 'STAFF'].includes(userRole),
    canAssignContainer: ['ADMIN', 'STAFF'].includes(userRole),
    canUpdatePackageStatus: ['ADMIN', 'STAFF', 'TRACKER'].includes(userRole),
    canDeletePackage: userRole === 'ADMIN',
    canViewVipClients: ['ADMIN', 'STAFF'].includes(userRole),
    canManageCredits: ['ADMIN', 'STAFF'].includes(userRole),
    canViewAuditLogs: userRole === 'ADMIN',
    canExportData: ['ADMIN', 'STAFF'].includes(userRole),
    canManagePricing: userRole === 'ADMIN',
    canViewGPS: ['ADMIN', 'STAFF', 'TRACKER'].includes(userRole),
    canSendWhatsApp: ['ADMIN', 'STAFF'].includes(userRole),
    canManageTemplates: ['ADMIN', 'STAFF'].includes(userRole),

    // Permissions combinées pour l'interface
    canAccessDashboard: !!userRole,
    canAccessClientSection: ['ADMIN', 'STAFF', 'AGENT'].includes(userRole),
    canAccessPackageSection: !!userRole, // Tous peuvent accéder mais avec restrictions
    canAccessContainerSection: ['ADMIN', 'STAFF', 'TRACKER'].includes(userRole),
    canAccessFinanceSection: ['ADMIN', 'STAFF'].includes(userRole),
    canAccessTrackingSection: !!userRole,
    canAccessCommunicationSection: ['ADMIN', 'STAFF'].includes(userRole),
    canAccessManagementSection: ['ADMIN', 'STAFF'].includes(userRole),
    canAccessReportsSection: ['ADMIN', 'STAFF'].includes(userRole),

    // Helpers pour l'UI
    getVisiblePackageStatuses: () => {
      if (['ADMIN', 'STAFF', 'TRACKER'].includes(userRole)) {
        return ['REGISTERED', 'COLLECTED', 'IN_CONTAINER', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED', 'RETURNED', 'CANCELLED'];
      }
      if (userRole === 'CLIENT') {
        return ['REGISTERED', 'IN_CONTAINER', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED'];
      }
      return [];
    },

    getVisibleContainerStatuses: () => {
      if (['ADMIN', 'STAFF'].includes(userRole)) {
        return ['PREPARATION', 'LOADED', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED', 'CANCELLED'];
      }
      if (userRole === 'TRACKER') {
        return ['LOADED', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED'];
      }
      return [];
    },

    // Permissions pour les notifications
    canReceiveNotifications: !!userRole,
    canSendNotifications: ['ADMIN', 'STAFF', 'TRACKER'].includes(userRole),
    canManageNotificationTemplates: ['ADMIN', 'STAFF'].includes(userRole),

    // Permissions pour les fichiers
    canUploadFiles: !!userRole,
    canDeleteFiles: ['ADMIN', 'STAFF'].includes(userRole),
    canViewAllFiles: ['ADMIN', 'STAFF'].includes(userRole),

    // Menu contextuel selon le rôle
    getAvailableActions: (entityType, entityData) => {
      const actions = [];
      
      if (entityType === 'package') {
        if (hasPermission(userRole, 'READ', 'PACKAGE')) actions.push('view');
        if (hasPermission(userRole, 'UPDATE', 'PACKAGE')) actions.push('edit');
        if (hasPermission(userRole, 'UPDATE_STATUS', 'PACKAGE')) actions.push('updateStatus');
        if (hasPermission(userRole, 'DELETE', 'PACKAGE')) actions.push('delete');
        if (hasPermission(userRole, 'VIEW_TRACKING', 'PACKAGE')) actions.push('track');
      }
      
      if (entityType === 'client') {
        if (hasPermission(userRole, 'READ', 'CLIENT')) actions.push('view');
        if (hasPermission(userRole, 'UPDATE', 'CLIENT')) actions.push('edit');
        if (hasPermission(userRole, 'DELETE', 'CLIENT')) actions.push('delete');
      }
      
      if (entityType === 'container') {
        if (hasPermission(userRole, 'READ', 'CONTAINER')) actions.push('view');
        if (hasPermission(userRole, 'UPDATE', 'CONTAINER')) actions.push('edit');
        if (hasPermission(userRole, 'UPDATE_TRACKING', 'CONTAINER')) actions.push('updateTracking');
        if (hasPermission(userRole, 'DELETE', 'CONTAINER')) actions.push('delete');
      }
      
      return actions;
    }
  }
}