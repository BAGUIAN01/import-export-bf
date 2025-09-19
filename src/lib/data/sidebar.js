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
      url: "/admin/finances"
    },
    {
      title: "Suivi & Tracking",
      icon: MapPin,
      url: "/admin/tracking"
    },
    {
      title: "Fichiers",
      url: "/admin/files",
      icon: FileText,
    },
    {
      title: "Paramètres",
      url: "/admin/settings",
      icon: Settings,
    },
  ],
};

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