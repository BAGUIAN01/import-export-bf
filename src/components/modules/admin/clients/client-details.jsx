"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientDetails, useClientMutations } from "@/hooks/use-clients";
import { usePackageBatch } from "@/hooks/use-shipments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Building,
  Star,
  ArrowLeft,
  MoreVertical,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  Package,
  Euro,
  Calendar,
  Target,
  Activity,
  TrendingUp,
  Copy,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
} from "lucide-react";
import { ClientDialog } from "./client-dialog";
import BordereauDialog from "./client-bordereau";
import PackageDialog from "@/components/modules/admin/packages/package-dialog";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const formatDateTime = (d) => (d ? new Date(d).toLocaleString("fr-FR") : "-");
const currency = (n) => (n != null ? `${Number(n).toFixed(2)}€` : "-");

const StatusBadge = ({ isActive, isVip }) => {
  if (!isActive) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Inactif
      </Badge>
    );
  }
  if (isVip) {
    return (
      <Badge variant="outline" className="bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200 shadow-sm">
        <Star className="h-3 w-3 mr-1" />
        VIP
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      <Activity className="h-3 w-3 mr-1" />
      Actif
    </Badge>
  );
};

const PaymentBadge = ({ status }) => {
  const getPaymentStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'payé':
      case 'complete':
      case 'completed':
        return {
          className: "bg-green-50 text-green-700 border-green-200",
          icon: CheckCircle,
          text: "Payé"
        };
      case 'pending':
      case 'en_attente':
      case 'awaiting':
      case 'en attente':
        return {
          className: "bg-yellow-50 text-yellow-700 border-yellow-200",
          icon: Clock,
          text: "En attente"
        };
      case 'failed':
      case 'échoué':
      case 'canceled':
      case 'annulé':
      case 'cancelled':
        return {
          className: "bg-red-50 text-red-700 border-red-200",
          icon: XCircle,
          text: "Échoué"
        };
      case 'partial':
      case 'partiel':
        return {
          className: "bg-blue-50 text-blue-700 border-blue-200",
          icon: AlertTriangle,
          text: "Partiel"
        };
      default:
        return {
          className: "bg-gray-50 text-gray-700 border-gray-200",
          icon: AlertTriangle,
          text: status || "Inconnu"
        };
    }
  };

  const style = getPaymentStyle(status);
  const Icon = style.icon;

  return (
    <Badge variant="outline" className={style.className}>
      <Icon className="h-3 w-3 mr-1" />
      {style.text}
    </Badge>
  );
};

const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, onClick }) => (
  <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`} onClick={onClick}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color} shadow-sm flex-shrink-0 ml-2`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-green-600" />
          <span className="text-xs font-medium text-green-600 truncate">{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function ClientDetail({
  initialClient,
  initialStats = {},
  initialContainers = [],
  initialActivity = [],
  userRole = "ADMIN",
  userId
}) {
  const router = useRouter();
  const [containers] = useState(initialContainers);
  const [activity] = useState(initialActivity);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBordereauDialogOpen, setIsBordereauDialogOpen] = useState(false);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);

  // Hook SWR pour les détails du client avec cache
  const { 
    client, 
    packages, 
    stats, 
    isLoading, 
    refresh 
  } = useClientDetails(initialClient?.id);

  // Hook pour les mutations
  const { 
    updateClient, 
    deleteClient, 
    isLoading: isMutating 
  } = useClientMutations();

  // Hook pour la création de packages
  const { createPackageBatch, isLoading: isCreating } = usePackageBatch();

  // Utiliser les données du cache ou fallback sur les données initiales
  const currentClient = client || initialClient;
  const currentStats = stats || initialStats;
  const currentPackages = packages.length > 0 ? packages : initialClient?.packages || [];

  const handleRefresh = useCallback(async () => {
    toast.promise(
      refresh(),
      {
        loading: "Actualisation en cours...",
        success: "Données actualisées avec succès",
        error: "Erreur lors de l'actualisation",
      }
    );
  }, [refresh]);

  const handleDeleteClient = useCallback(async () => {
    const result = await deleteClient(currentClient.id);
    if (result.success) {
      router.push("/admin/clients");
    }
  }, [deleteClient, currentClient.id, router]);

  const handleEditClient = useCallback(async (payload) => {
    const result = await updateClient(currentClient.id, payload);
    if (result.success) {
      setIsEditDialogOpen(false);
      await refresh(); // Rafraîchir le cache
    }
  }, [updateClient, currentClient.id, refresh]);

  const handleCreatePackage = useCallback(async (payload) => {
    const result = await createPackageBatch(payload);
    if (result.success) {
      setIsPackageDialogOpen(false);
      
      // Message informatif
      const isExisting = result.data?.isExistingShipment;
      const shipmentNum = result.data?.shipment?.shipmentNumber;
      const packagesCount = result.data?.packages?.length || 0;
      
      if (isExisting) {
        toast.success(
          `${packagesCount} colis ajouté(s) à l'expédition existante`,
          {
            description: `Expédition ${shipmentNum} - Un shipment existait déjà pour ce client dans ce conteneur`,
            duration: 5000,
          }
        );
      } else {
        toast.success(
          `Expédition créée avec succès`,
          {
            description: `${shipmentNum} avec ${packagesCount} colis`,
            duration: 4000,
          }
        );
      }
      
      // Rafraîchir les données du client
      await refresh();
    }
  }, [createPackageBatch, refresh]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const clientStats = useMemo(() => {
    return {
      totalSpent: currentStats.totalSpent || 0,
      totalShipmentsAmount: currentStats.totalShipmentsAmount || 0,
      packagesCount: currentStats.packagesCount || 0,
      shipmentsCount: currentStats.shipmentsCount || 0,
      avgOrderValue: currentStats.avgOrderValue || 0,
      lastOrderDate: currentStats.lastOrderDate,
      paymentPercentage: currentStats.paymentPercentage || 0,
      paymentStatus: currentStats.paymentStatus || {
        pending: 0,
        partial: 0,
        paid: 0,
        cancelled: 0,
        refunded: 0,
      }
    };
  }, [currentStats]);

  // Vérification des permissions pour les actions
  const canEdit = ["ADMIN", "STAFF"].includes(userRole);
  const canDelete = userRole === "ADMIN";
  const canCreatePackage = ["ADMIN", "STAFF", "AGENT"].includes(userRole);

  // Affichage du loading skeleton si pas de client
  if (!currentClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <Skeleton key={idx} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <Button 
                variant="secondary" 
                onClick={() => router.push("/admin/clients")}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm min-h-[44px] sm:min-h-[36px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Retour aux clients</span>
                <span className="sm:hidden">Retour</span>
              </Button>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Button 
                  variant="secondary" 
                  onClick={handleRefresh} 
                  disabled={isLoading}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm min-h-[44px] sm:min-h-[36px] flex-1 sm:flex-none"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm min-h-[44px] sm:min-h-[36px] w-12 sm:w-auto">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier le client
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setIsBordereauDialogOpen(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Créer un bordereau
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyToClipboard(currentClient.clientCode)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier le code client
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter les données
                    </DropdownMenuItem>
                    {canDelete && (
                      <>
                        <Separator className="my-1" />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer le client
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le client <strong>{currentClient.firstName} {currentClient.lastName}</strong> ? 
                                Cette action supprimera également tous ses colis associés et est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700" disabled={isMutating}>
                                Supprimer définitivement
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  {currentClient.firstName} {currentClient.lastName}
                </h1>
                <StatusBadge isActive={currentClient.isActive} isVip={currentClient.isVip} />
              </div>
              <p className="text-white/80 text-base sm:text-lg mb-2">
                Code client: {currentClient.clientCode}
              </p>
              <p className="text-white/70 text-sm sm:text-base">
                Client depuis le {formatDate(currentClient.createdAt)}
              </p>
              <div className="flex flex-col gap-3 mt-4">
                {/* Version mobile - empilée */}
                <div className="sm:hidden space-y-2">
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm min-h-[44px] min-w-0">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{currentClient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm min-h-[44px] min-w-0">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{currentClient.city}, {currentClient.country}</span>
                  </div>
                  {currentClient.company && (
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm min-h-[44px] min-w-0">
                      <Building className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{currentClient.company}</span>
                    </div>
                  )}
                </div>
                
                {/* Version desktop - horizontale */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm min-h-[36px] min-w-0 flex-1">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{currentClient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm min-h-[36px] min-w-0 flex-1">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{currentClient.city}, {currentClient.country}</span>
                  </div>
                  {currentClient.company && (
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm min-h-[36px] min-w-0 flex-1">
                      <Building className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{currentClient.company}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid gap-3 xs:gap-4 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            icon={Package}
            title="Expéditions"
            value={clientStats.shipmentsCount}
            subtitle={`${clientStats.packagesCount} colis`}
            color="from-blue-500 to-blue-600"
          />
          
          <StatCard
            icon={Euro}
            title="Total dépensé"
            value={currency(clientStats.totalSpent)}
            subtitle={`${clientStats.paymentPercentage.toFixed(1)}% payé`}
            color="from-green-500 to-green-600"
          />
          
          <StatCard
            icon={Target}
            title="Chiffre d'affaires"
            value={currency(clientStats.totalShipmentsAmount)}
            subtitle="Total expéditions"
            color="from-emerald-500 to-emerald-600"
          />
          
          <StatCard
            icon={TrendingUp}
            title="Panier moyen"
            value={currency(clientStats.avgOrderValue)}
            subtitle="Moyenne/expédition"
            color="from-purple-500 to-purple-600"
          />
          
          <StatCard
            icon={Calendar}
            title="Dernière commande"
            value={clientStats.lastOrderDate ? formatDate(clientStats.lastOrderDate) : "Aucune"}
            subtitle="Activité récente"
            color="from-orange-500 to-orange-600"
          />

          <StatCard
            icon={FileText}
            title="Bordereau"
            value="PDF"
            subtitle="Télécharger"
            color="from-red-500 to-red-600"
            onClick={() => setIsBordereauDialogOpen(true)}
          />
        </div>

        {/* Contenu principal avec onglets */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="overview" className="min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm">
              <span className="hidden sm:inline">Vue d'ensemble</span>
              <span className="sm:hidden">Vue</span>
            </TabsTrigger>
            <TabsTrigger value="packages" className="min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm">
              <span className="hidden sm:inline">Colis ({currentPackages.length || 0})</span>
              <span className="sm:hidden">Colis</span>
            </TabsTrigger>
            <TabsTrigger value="recipient" className="min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm">
              <span className="hidden sm:inline">Destinataire</span>
              <span className="sm:hidden">Dest.</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm">
              <span className="hidden sm:inline">Activité</span>
              <span className="sm:hidden">Act.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 xs:gap-6 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Informations personnelles */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 xs:gap-4 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Prénom</p>
                      <p className="font-semibold">{currentClient.firstName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Nom</p>
                      <p className="font-semibold">{currentClient.lastName}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                      <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="font-medium truncate">{currentClient.phone}</span>
                    </div>
                    {currentClient.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                        <Mail className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="font-medium truncate">{currentClient.email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                      <MapPin className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{currentClient.address}</p>
                        <p className="text-sm text-gray-600 truncate">{currentClient.city}, {currentClient.country}</p>
                        {currentClient.postalCode && (
                          <p className="text-sm text-gray-500 truncate">{currentClient.postalCode}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {currentClient.notes && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg min-w-0">
                      <p className="text-sm font-medium text-amber-800 mb-1">Notes internes</p>
                      <p className="text-sm text-amber-700 break-words">{currentClient.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informations de paiement */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-green-600" />
                    Informations de paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentPackages.length > 0 ? (
                    <>
                      {(() => {
                        // ⚠️ IMPORTANT: Regrouper les colis par shipment pour afficher les paiements au niveau shipment
                        const shipmentGroups = currentPackages.reduce((acc, pkg) => {
                          const shipmentId = pkg.shipment?.id || pkg.shipmentId || 'no-shipment';
                          if (!acc[shipmentId]) {
                            acc[shipmentId] = {
                              shipment: pkg.shipment,
                              packages: [],
                              totalAmount: 0,
                            };
                          }
                          acc[shipmentId].packages.push(pkg);
                          acc[shipmentId].totalAmount += (pkg.totalAmount || 0);
                          return acc;
                        }, {});

                        const shipments = Object.values(shipmentGroups).filter(g => g.shipment);
                        
                        // Calculer les totaux à partir des shipments
                        const totalAmount = shipments.reduce((sum, s) => sum + (s.shipment.totalAmount || 0), 0);
                        const totalPaid = shipments.reduce((sum, s) => sum + (s.shipment.paidAmount || 0), 0);
                        const remainingAmount = totalAmount - totalPaid;
                        const paidShipments = shipments.filter(s => s.shipment.paymentStatus === 'PAID');
                        const pendingShipments = shipments.filter(s => s.shipment.paymentStatus !== 'PAID');

                        return (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-800">Montant payé</span>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-green-900">{currency(totalPaid)}</p>
                                <p className="text-xs text-green-600">{paidShipments.length} expédition{paidShipments.length > 1 ? 's' : ''} payée{paidShipments.length > 1 ? 's' : ''}</p>
                              </div>
                              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="h-4 w-4 text-orange-600" />
                                  <span className="text-sm font-medium text-orange-800">Reste à payer</span>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-orange-900">{currency(remainingAmount)}</p>
                                <p className="text-xs text-orange-600">{pendingShipments.length} expédition{pendingShipments.length > 1 ? 's' : ''} en attente</p>
                              </div>
                            </div>
                            
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Euro className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Total général</span>
                              </div>
                              <p className="text-xl sm:text-2xl font-bold text-blue-900">{currency(totalAmount)}</p>
                              <p className="text-xs text-blue-600">{shipments.length} expédition{shipments.length > 1 ? 's' : ''} ({currentPackages.length} colis)</p>
                            </div>

                            {pendingShipments.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Expéditions avec solde restant :</p>
                                <div className="space-y-2">
                                  {pendingShipments.slice(0, 3).map((shipmentGroup) => {
                                    const shipment = shipmentGroup.shipment;
                                    const remaining = (shipment.totalAmount || 0) - (shipment.paidAmount || 0);
                                    return (
                                      <div key={shipment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                        <div>
                                          <span className="font-medium">{shipment.shipmentNumber}</span>
                                          <span className="text-xs text-gray-500 ml-2">({shipmentGroup.packages.length} colis)</span>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-orange-600 font-semibold">{currency(remaining)}</div>
                                          <PaymentBadge status={shipment.paymentStatus} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {pendingShipments.length > 3 && (
                                    <p className="text-xs text-gray-500 text-center">
                                      +{pendingShipments.length - 3} autre{pendingShipments.length - 3 > 1 ? 's' : ''} expédition{pendingShipments.length - 3 > 1 ? 's' : ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Euro className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucune transaction pour le moment</p>
                      <p className="text-sm text-gray-400">Les informations de paiement apparaîtront ici</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistiques de paiement par statut */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-600" />
                    Répartition des paiements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-gray-600">{clientStats.paymentStatus.pending}</div>
                      <div className="text-xs sm:text-sm text-gray-500">En attente</div>
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mx-auto mt-1 text-gray-400" />
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-yellow-600">{clientStats.paymentStatus.partial}</div>
                      <div className="text-xs sm:text-sm text-yellow-500">Partiel</div>
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mx-auto mt-1 text-yellow-400" />
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">{clientStats.paymentStatus.paid}</div>
                      <div className="text-xs sm:text-sm text-green-500">Payé</div>
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mx-auto mt-1 text-green-400" />
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-red-600">{clientStats.paymentStatus.cancelled}</div>
                      <div className="text-xs sm:text-sm text-red-500">Annulé</div>
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mx-auto mt-1 text-red-400" />
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">{clientStats.paymentStatus.refunded}</div>
                      <div className="text-xs sm:text-sm text-blue-500">Remboursé</div>
                      <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mx-auto mt-1 text-blue-400" />
                    </div>
                  </div>
                  
                  {/* Barre de progression du paiement */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progression du paiement</span>
                      <span className="text-sm text-gray-500">{clientStats.paymentPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(clientStats.paymentPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0€</span>
                      <span>{currency(clientStats.totalSpent)} / {currency(clientStats.totalShipmentsAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Destinataire */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    <span className="hidden sm:inline">Destinataire au Burkina Faso</span>
                    <span className="sm:hidden">Destinataire</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nom complet</p>
                    <p className="text-lg font-bold text-gray-900 truncate">{currentClient.recipientName}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                      <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="font-medium truncate">{currentClient.recipientPhone}</span>
                    </div>
                    {currentClient.recipientEmail && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                        <Mail className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="font-medium truncate">{currentClient.recipientEmail}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                      <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium break-words">{currentClient.recipientAddress}</p>
                        <p className="text-sm text-gray-600 truncate">{currentClient.recipientCity}</p>
                      </div>
                    </div>
                  </div>

                  {currentClient.recipientRelation && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Relation</p>
                      <p className="text-blue-700 truncate">{currentClient.recipientRelation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg sm:text-xl font-semibold">Historique des colis</h3>
              {canCreatePackage && (
                <Button 
                  onClick={() => setIsPackageDialogOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nouveau colis</span>
                  <span className="sm:hidden">Nouveau colis</span>
                </Button>
              )}
            </div>

            {isLoading && currentPackages.length === 0 ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, idx) => (
                  <Card key={idx} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-96" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : currentPackages.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun colis</h3>
                  <p className="text-gray-500 mb-6">Ce client n'a encore envoyé aucun colis</p>
                  {canCreatePackage && (
                    <Button onClick={() => setIsPackageDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le premier colis
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {currentPackages.map((pkg) => (
                  <Card key={pkg.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-4 sm:p-6">
                      {/* Version mobile */}
                      <div className="sm:hidden space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base truncate">{pkg.packageNumber}</h4>
                            <p className="text-sm text-gray-600 truncate">{pkg.description}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{formatDate(pkg.createdAt)}</span>
                            <span className="font-medium">{currency(pkg.totalAmount)}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{pkg.status}</Badge>
                            {pkg.paymentStatus && (
                              <PaymentBadge status={pkg.paymentStatus} />
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => router.push(`/admin/packages/${pkg.id}`)}
                          className="w-full min-h-[44px]"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </Button>
                      </div>
                      
                      {/* Version desktop */}
                      <div className="hidden sm:flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <Package className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{pkg.packageNumber}</h4>
                            <p className="text-gray-600">{pkg.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>{formatDate(pkg.createdAt)}</span>
                              <span>•</span>
                              <span>{currency(pkg.totalAmount)}</span>
                              <span>•</span>
                              <Badge variant="outline">{pkg.status}</Badge>
                              {pkg.paymentStatus && (
                                <>
                                  <span>•</span>
                                  <PaymentBadge status={pkg.paymentStatus} />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => router.push(`/admin/packages/${pkg.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recipient" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Informations détaillées du destinataire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Identité</h4>
                    <div className="space-y-3">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-600">Nom complet</p>
                        <p className="font-medium text-lg truncate">{currentClient.recipientName}</p>
                      </div>
                      {currentClient.recipientRelation && (
                        <div className="min-w-0">
                          <p className="text-sm text-gray-600">Relation avec l'expéditeur</p>
                          <p className="font-medium truncate">{currentClient.recipientRelation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Contact</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                        <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-600">Téléphone</p>
                          <p className="font-medium truncate">{currentClient.recipientPhone}</p>
                        </div>
                      </div>
                      {currentClient.recipientEmail && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                          <Mail className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium truncate">{currentClient.recipientEmail}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Adresse de livraison</h4>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg min-w-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-blue-900 break-words">{currentClient.recipientAddress}</p>
                        <p className="text-blue-700 mt-1 truncate">{currentClient.recipientCity}, Burkina Faso</p>
                      </div>
                    </div>
                  </div>
                </div>

                {currentStats.packagesCount > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Historique des livraisons</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-700">{currentStats.packagesCount}</p>
                        <p className="text-sm text-green-600">Colis reçus</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-700">
                          {currentStats.lastOrderDate ? formatDate(currentStats.lastOrderDate) : "—"}
                        </p>
                        <p className="text-sm text-blue-600">Dernière livraison</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-700">
                          {currency(currentStats.avgOrderValue)}
                        </p>
                        <p className="text-sm text-purple-600">Valeur moyenne</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Journal d'activité
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune activité récente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activity.map((log, index) => (
                      <div key={log.id || index} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900">
                              {log.action.replace(/_/g, ' ').toLowerCase()}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Par {log.user?.firstName} {log.user?.lastName}
                          </p>
                          {log.details && (
                            <p className="text-xs text-gray-500 mt-1">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog d'édition */}
      <ClientDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        client={currentClient}
        onSave={handleEditClient}
        loading={isMutating}
      />

      {/* Dialog du bordereau */}
      <BordereauDialog
        isOpen={isBordereauDialogOpen}
        onClose={() => setIsBordereauDialogOpen(false)}
        client={currentClient}
      />

      {/* Dialog de création de colis */}
      <PackageDialog
        isOpen={isPackageDialogOpen}
        onClose={() => setIsPackageDialogOpen(false)}
        clients={[currentClient]} // Passer le client actuel
        containers={containers}
        onSave={handleCreatePackage}
        loading={isCreating}
      />
    </div>
  );
}