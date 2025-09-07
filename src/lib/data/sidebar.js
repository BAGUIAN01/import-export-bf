// lib/data/sidebar.js

import {
  Home,
  Users,
  Package,
  Container,
  FileText,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  Truck,
  MapPin,
  Clock,
  Calculator,
  Bell,
  Phone,
  Building,
  Calendar,
  Archive,
  DollarSign,
  Receipt,
  UserCheck,
  Globe,
  Shield,
  Zap,
  Eye,
  BookOpen,
  Tag
} from 'lucide-react';

export const navigationData = {
  navMain: [
    {
      title: "Tableau de bord",
      url: "/admin/dashboard",
      icon: Home,
    },
    {
      title: "Tableau de bord",
      url: "/admin/client",
      icon: Home,
    },
    {
      title: "Tableau de bord", 
      url: "/admin/staff",
      icon: Home,
    },
    {
      title: "Tableau de bord",
      url: "/admin/tracker",
      icon: Home,
    },
    {
      title: "Tableau de bord",
      url: "/admin/agent",
      icon: Home,
    },
    {
      title: "Clients",
      icon: Users,
      url: "/admin/clients"
    },
    {
      title: "Colis",
      icon: Package,
      url: "/admin/packages"
    },
    {
      title: "Conteneurs",
      icon: Container,
      url: "/admin/containers"
    },
    {
      title: "Finances",
      icon: CreditCard,
      items: [
        { title: "Factures", url: "/admin/invoices", icon: FileText },
        { title: "Paiements", url: "/admin/payments", icon: CreditCard },
        { title: "Tarification", url: "/admin/pricing", icon: Tag },
        { title: "Rapports financiers", url: "/admin/finances/reports", icon: BarChart3 },
        { title: "Créances", url: "/admin/finances/receivables", icon: DollarSign },
        { title: "Reçus", url: "/admin/receipts", icon: Receipt },
      ],
    },
    {
      title: "Suivi & Tracking",
      icon: MapPin,
      items: [
        { title: "Suivi en temps réel", url: "/admin/tracking/live", icon: Eye },
        { title: "Mises à jour", url: "/admin/tracking/updates", icon: Zap },
        { title: "Localisation", url: "/admin/tracking/location", icon: Globe },
        { title: "Historique", url: "/admin/tracking/history", icon: Clock },
      ],
    },
    {
      title: "Communications",
      icon: MessageSquare,
      items: [
        { title: "WhatsApp", url: "/admin/communications/whatsapp", icon: Phone },
        { title: "SMS", url: "/admin/communications/sms", icon: MessageSquare },
        { title: "Notifications", url: "/admin/notifications", icon: Bell },
        { title: "Templates", url: "/admin/communications/templates", icon: FileText },
        { title: "Historique messages", url: "/admin/communications/history", icon: Clock },
      ],
    },
    {
      title: "Gestion",
      icon: Building,
      items: [
        { title: "Utilisateurs", url: "/admin/users", icon: Users },
        { title: "Rôles & permissions", url: "/admin/roles", icon: Shield },
        { title: "Entrepôts", url: "/admin/warehouses", icon: Building },
        { title: "Transporteurs", url: "/admin/carriers", icon: Truck },
        { title: "Audit", url: "/admin/audit", icon: Eye },
      ],
    },
    {
      title: "Fichiers",
      url: "/admin/files",
      icon: FileText,
    },
    {
      title: "Rapports",
      icon: BarChart3,
      items: [
        { title: "Vue d'ensemble", url: "/admin/reports", icon: BarChart3 },
        { title: "Rapports clients", url: "/admin/reports/clients", icon: Users },
        { title: "Rapports colis", url: "/admin/reports/packages", icon: Package },
        { title: "Performance", url: "/admin/reports/performance", icon: Zap },
        { title: "Revenus", url: "/admin/reports/revenue", icon: DollarSign },
        { title: "Export données", url: "/admin/reports/export", icon: FileText },
      ],
    },
    {
      title: "Documentation",
      icon: BookOpen,
      items: [
        { title: "Guide utilisateur", url: "/admin/docs/user-guide", icon: BookOpen },
        { title: "API Documentation", url: "/admin/docs/api", icon: FileText },
        { title: "Procédures", url: "/admin/docs/procedures", icon: Archive },
      ],
    },
    {
      title: "Paramètres",
      url: "/admin/settings",
      icon: Settings,
    },
  ],
};

// Export des icônes individuellement si besoin
export {
  Home,
  Users,
  Package,
  Container,
  FileText,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  Truck,
  MapPin,
  Clock,
  Calculator,
  Bell,
  Phone,
  Building,
  Calendar,
  Archive,
  DollarSign,
  Receipt,
  UserCheck,
  Globe,
  Shield,
  Zap,
  Eye,
  BookOpen,
  Tag
};