// lib/rbac.js

export const Roles = ["ADMIN", "STAFF", "TRACKER", "AGENT", "CLIENT"];

export const roleHome = {
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/dashboard",
  TRACKER: "/tracker/dashboard", 
  AGENT: "/agent/dashboard",
  CLIENT: "/client/dashboard",
};

// --- Carte d'accès par route (RBAC) ---

export const accessMap = {

  // Pages communes
  "/admin": ["ADMIN"],
  "/client": ["CLIENT"],
  
  // Tableaux de bord
  "/admin/dashboard": ["ADMIN"],
  "/client/dashboard": ["CLIENT"],

  // Clients (Admin seulement)
  "/admin/clients": ["ADMIN"],
  "/admin/clients/vip": ["ADMIN"],
  "/admin/clients/new": ["ADMIN"],
  "/admin/recipients": ["ADMIN"],

  // Colis (Admin peut tout voir, Client ses propres colis)
  "/admin/packages": ["ADMIN"],

  "/admin/shipments": ["ADMIN"],


  // Conteneurs (Admin seulement)
  "/admin/containers": ["ADMIN"],
  "/admin/containers/new": ["ADMIN"],
  "/admin/containers/preparation": ["ADMIN"],
  "/admin/containers/transit": ["ADMIN"],
  "/admin/containers/tracking": ["ADMIN"],
  "/admin/containers/schedule": ["ADMIN"],

  // Finances (Admin seulement)
  "/admin/invoices": ["ADMIN"],
  "/admin/payments": ["ADMIN"],
  "/admin/pricing": ["ADMIN"],
  "/admin/finances/reports": ["ADMIN"],
  "/admin/finances/receivables": ["ADMIN"],
  "/admin/receipts": ["ADMIN"],
  "/client/receipts": ["CLIENT"], // Client peut voir ses reçus

  // Suivi & Tracking (Admin tout, Client limité)
  "/admin/tracking/live": ["ADMIN"],
  "/admin/tracking/updates": ["ADMIN"],
  "/admin/tracking/location": ["ADMIN"],
  "/admin/tracking/history": ["ADMIN"],
  "/client/tracking": ["CLIENT"], // Suivi simplifié pour client

  // Communications (Admin seulement)
  "/admin/communications/whatsapp": ["ADMIN"],
  "/admin/communications/sms": ["ADMIN"],
  "/admin/notifications": ["ADMIN"],
  "/admin/communications/templates": ["ADMIN"],
  "/admin/communications/history": ["ADMIN"],
  "/client/notifications": ["CLIENT"], // Client reçoit des notifications

  // Gestion (Admin seulement)
  "/admin/users": ["ADMIN"],
  "/admin/roles": ["ADMIN"],
  "/admin/warehouses": ["ADMIN"],
  "/admin/carriers": ["ADMIN"],
  "/admin/audit": ["ADMIN"],

  // Fichiers
  "/admin/files": ["ADMIN"],
  "/client/files": ["CLIENT"], // Client peut voir ses fichiers

  // Rapports (Admin seulement)
  "/admin/reports": ["ADMIN"],
  "/admin/reports/clients": ["ADMIN"],
  "/admin/reports/packages": ["ADMIN"],
  "/admin/reports/performance": ["ADMIN"],
  "/admin/reports/revenue": ["ADMIN"],
  "/admin/reports/export": ["ADMIN"],

  // Documentation
  "/admin/docs/user-guide": ["ADMIN", "CLIENT"],
  "/admin/docs/api": ["ADMIN"],
  "/admin/docs/procedures": ["ADMIN"],

  // Paramètres
  "/admin/settings": ["ADMIN"],
  "/client/settings": ["CLIENT"], // Paramètres de profil client


  // Colis
  "/dashboard/packages": ["ADMIN", "STAFF", "TRACKER", "AGENT", "CLIENT"],
  "/dashboard/packages/new": ["ADMIN", "STAFF", "AGENT"],
  "/dashboard/packages/pending": ["ADMIN", "STAFF", "TRACKER"],
  "/dashboard/packages/transit": ["ADMIN", "STAFF", "TRACKER", "CLIENT"],
  "/dashboard/packages/delivered": ["ADMIN", "STAFF", "TRACKER", "CLIENT"],
  "/dashboard/packages/pickup": ["ADMIN", "STAFF", "AGENT"],

  // Conteneurs
  "/dashboard/containers": ["ADMIN", "STAFF", "TRACKER"],
  "/dashboard/containers/new": ["ADMIN", "STAFF"],
  "/dashboard/containers/preparation": ["ADMIN", "STAFF"],
  "/dashboard/containers/transit": ["ADMIN", "STAFF", "TRACKER"],
  "/dashboard/containers/tracking": ["ADMIN", "STAFF", "TRACKER"],
  "/dashboard/containers/schedule": ["ADMIN", "STAFF"],

  // Finances
  "/dashboard/invoices": ["ADMIN", "STAFF"],
  "/dashboard/payments": ["ADMIN", "STAFF"],
  "/dashboard/pricing": ["ADMIN"],
  "/dashboard/finances/reports": ["ADMIN"],
  "/dashboard/finances/receivables": ["ADMIN", "STAFF"],
  "/dashboard/receipts": ["ADMIN", "STAFF", "CLIENT"],

  // Suivi & Tracking
  "/dashboard/tracking/live": ["ADMIN", "STAFF", "TRACKER", "CLIENT"],
  "/dashboard/tracking/updates": ["ADMIN", "STAFF", "TRACKER"],
  "/dashboard/tracking/location": ["ADMIN", "STAFF", "TRACKER", "CLIENT"],
  "/dashboard/tracking/history": ["ADMIN", "STAFF", "TRACKER", "CLIENT"],

  // Communications
  "/dashboard/communications/whatsapp": ["ADMIN", "STAFF"],
  "/dashboard/communications/sms": ["ADMIN", "STAFF"],
  "/dashboard/notifications": ["ADMIN", "STAFF", "TRACKER", "AGENT", "CLIENT"],
  "/dashboard/communications/templates": ["ADMIN", "STAFF"],
  "/dashboard/communications/history": ["ADMIN", "STAFF"],

  // Gestion
  "/dashboard/users": ["ADMIN"],
  "/dashboard/roles": ["ADMIN"],
  "/dashboard/warehouses": ["ADMIN", "STAFF"],
  "/dashboard/carriers": ["ADMIN", "STAFF"],
  "/dashboard/audit": ["ADMIN"],

  // Fichiers
  "/dashboard/files": ["ADMIN", "STAFF", "TRACKER", "AGENT", "CLIENT"],

  // Rapports
  "/dashboard/reports": ["ADMIN", "STAFF"],
  "/dashboard/reports/clients": ["ADMIN", "STAFF"],
  "/dashboard/reports/packages": ["ADMIN", "STAFF", "TRACKER"],
  "/dashboard/reports/performance": ["ADMIN"],
  "/dashboard/reports/revenue": ["ADMIN"],
  "/dashboard/reports/export": ["ADMIN", "STAFF"],

  // Documentation
  "/dashboard/docs/user-guide": ["ADMIN", "STAFF", "TRACKER", "AGENT", "CLIENT"],
  "/dashboard/docs/api": ["ADMIN"],
  "/dashboard/docs/procedures": ["ADMIN", "STAFF", "TRACKER"],

  // Paramètres
  "/dashboard/settings": ["ADMIN"],
};

// --- Helper : récupère la route la plus spécifique définie (prefix match) ---
export function getBestMatch(pathname) {
  const keys = Object.keys(accessMap);
  // On garde la route la plus longue qui matche en préfixe
  const match = keys
    .filter((p) => pathname === p || pathname.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0];
  // Si aucune route en préfixe, on regarde si la route exacte existe
  return match || (accessMap[pathname] ? pathname : undefined);
}

// --- Helper : renvoie true si le rôle a accès à la route ---
export function canAccess(role, pathname) {
  if (!role || !pathname) return false;
  const key = getBestMatch(pathname);
  if (!key) return false; // route non déclarée => pas d'accès
  const allowed = accessMap[key];
  return Array.isArray(allowed) && allowed.includes(role);
}

// --- Helper : renvoie les rôles autorisés pour une route (ou []) ---
export function getAllowedRoles(pathname) {
  const key = getBestMatch(pathname);
  return key ? accessMap[key] ?? [] : [];
}

// --- Helper : redirection cible par rôle (utile pour /dashboard) ---
export function homeForRole(role) {
  return roleHome[role] || "/dashboard/admin"; // Fallback vers admin si rôle inconnu
}

// --- Helper : filtre la navigation (sidebar) selon le rôle ---
// nav = navigationData.navMain (structure issue de lib/data/sidebar.js)
export function filterNavByRole(nav, role, { hideUnknown = true } = {}) {
  return nav
    .map((item) => {
      // Élément simple (avec url)
      if (item.url) {
        const known = !!accessMap[item.url];
        const ok = known ? canAccess(role, item.url) : !hideUnknown;
        return ok ? item : null;
      }
      // Élément avec sous-items
      if (item.items && Array.isArray(item.items)) {
        const items = item.items.filter((sub) => {
          const known = !!accessMap[sub.url];
          return known ? canAccess(role, sub.url) : !hideUnknown;
        });
        return items.length ? { ...item, items } : null;
      }
      return null;
    })
    .filter(Boolean);
}

// --- Permissions spécifiques pour les actions métier ---

export const PackagePermissions = {
  CREATE: ["ADMIN", "STAFF", "AGENT"],
  READ: ["ADMIN", "STAFF", "TRACKER", "AGENT", "CLIENT"],
  UPDATE: ["ADMIN", "STAFF"],
  DELETE: ["ADMIN"],
  UPDATE_STATUS: ["ADMIN", "STAFF", "TRACKER"],
  VIEW_TRACKING: ["ADMIN", "STAFF", "TRACKER", "CLIENT"],
  ASSIGN_CONTAINER: ["ADMIN", "STAFF"],
};

export const ClientPermissions = {
  CREATE: ["ADMIN", "STAFF", "AGENT"],
  READ: ["ADMIN", "STAFF", "AGENT"],
  UPDATE: ["ADMIN", "STAFF"],
  DELETE: ["ADMIN"],
  VIEW_VIP: ["ADMIN", "STAFF"],
  MANAGE_CREDIT: ["ADMIN", "STAFF"],
};

export const ContainerPermissions = {
  CREATE: ["ADMIN", "STAFF"],
  READ: ["ADMIN", "STAFF", "TRACKER"],
  UPDATE: ["ADMIN", "STAFF"],
  DELETE: ["ADMIN"],
  UPDATE_TRACKING: ["ADMIN", "STAFF", "TRACKER"],
  MANAGE_LOADING: ["ADMIN", "STAFF"],
  VIEW_GPS: ["ADMIN", "STAFF", "TRACKER"],
};

export const FinancePermissions = {
  VIEW_INVOICES: ["ADMIN", "STAFF"],
  CREATE_INVOICES: ["ADMIN", "STAFF"],
  MANAGE_PAYMENTS: ["ADMIN", "STAFF"],
  VIEW_REPORTS: ["ADMIN"],
  MANAGE_PRICING: ["ADMIN"],
  ISSUE_RECEIPTS: ["ADMIN", "STAFF"],
};

export const CommunicationPermissions = {
  SEND_WHATSAPP: ["ADMIN", "STAFF"],
  SEND_SMS: ["ADMIN", "STAFF"],
  MANAGE_TEMPLATES: ["ADMIN", "STAFF"],
  VIEW_HISTORY: ["ADMIN", "STAFF"],
  SEND_NOTIFICATIONS: ["ADMIN", "STAFF", "TRACKER"],
};

// --- Helper : vérifie les permissions pour les actions spécifiques ---
export function hasPermission(role, permission, entity) {
  if (!role || !permission || !entity) return false;
  
  const entityPermissions = {
    PACKAGE: PackagePermissions,
    CLIENT: ClientPermissions,
    CONTAINER: ContainerPermissions,
    FINANCE: FinancePermissions,
    COMMUNICATION: CommunicationPermissions,
  };

  const perms = entityPermissions[entity];
  if (!perms || !perms[permission]) return false;
  
  return perms[permission].includes(role);
}

// --- Helper : vérifie si un client peut voir un colis spécifique ---
export function canViewPackage(role, userClientId, packageClientId) {
  if (["ADMIN", "STAFF", "TRACKER", "AGENT"].includes(role)) {
    return true; // Personnel peut voir tous les colis
  }
  
  if (role === "CLIENT") {
    return userClientId === packageClientId; // Client ne voit que ses propres colis
  }
  
  return false;
}

// --- Helper : vérifie les permissions de modification selon le propriétaire ---
export function canModifyResource(role, resourceOwnerId, currentUserId) {
  if (["ADMIN"].includes(role)) {
    return true; // Admin peut tout modifier
  }
  
  if (["STAFF"].includes(role)) {
    return true; // Staff peut modifier les ressources métier
  }
  
  if (role === "CLIENT") {
    return resourceOwnerId === currentUserId; // Client ne peut modifier que ses propres ressources
  }
  
  return false;
}