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

const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
  <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-600">{trend}</span>
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const clientStats = useMemo(() => {
    return {
      totalSpent: currentStats.totalSpent || 0,
      packagesCount: currentStats.packagesCount || 0,
      avgOrderValue: currentStats.avgOrderValue || 0,
      lastOrderDate: currentStats.lastOrderDate
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
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="secondary" 
                onClick={() => router.push("/admin/clients")}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux clients
              </Button>

              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  onClick={handleRefresh} 
                  disabled={isLoading}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
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
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold">
                  {currentClient.firstName} {currentClient.lastName}
                </h1>
                <StatusBadge isActive={currentClient.isActive} isVip={currentClient.isVip} />
              </div>
              <p className="text-white/80 text-lg mb-2">
                Code client: {currentClient.clientCode}
              </p>
              <p className="text-white/70">
                Client depuis le {formatDate(currentClient.createdAt)}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">{currentClient.phone}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{currentClient.city}, {currentClient.country}</span>
                </div>
                {currentClient.company && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
                    <Building className="h-4 w-4" />
                    <span>{currentClient.company}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Package}
            title="Colis envoyés"
            value={clientStats.packagesCount}
            subtitle="Total des expéditions"
            color="from-blue-500 to-blue-600"
          />
          
          <StatCard
            icon={Euro}
            title="Total dépensé"
            value={currency(clientStats.totalSpent)}
            subtitle="Chiffre d'affaires généré"
            color="from-green-500 to-green-600"
            trend="+12% ce mois"
          />
          
          <StatCard
            icon={TrendingUp}
            title="Panier moyen"
            value={currency(clientStats.avgOrderValue)}
            subtitle="Valeur moyenne par colis"
            color="from-purple-500 to-purple-600"
          />
          
          <StatCard
            icon={Calendar}
            title="Dernière commande"
            value={clientStats.lastOrderDate ? formatDate(clientStats.lastOrderDate) : "Aucune"}
            subtitle="Activité récente"
            color="from-orange-500 to-orange-600"
          />
        </div>

        {/* Contenu principal avec onglets */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="packages">Colis ({currentPackages.length || 0})</TabsTrigger>
            <TabsTrigger value="recipient">Destinataire</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{currentClient.phone}</span>
                    </div>
                    {currentClient.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{currentClient.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium">{currentClient.address}</p>
                        <p className="text-sm text-gray-600">{currentClient.city}, {currentClient.country}</p>
                        {currentClient.postalCode && (
                          <p className="text-sm text-gray-500">{currentClient.postalCode}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {currentClient.notes && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-1">Notes internes</p>
                      <p className="text-sm text-amber-700">{currentClient.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Destinataire au Burkina Faso */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    Destinataire au Burkina Faso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nom complet</p>
                    <p className="text-lg font-bold text-gray-900">{currentClient.recipientName}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{currentClient.recipientPhone}</span>
                    </div>
                    {currentClient.recipientEmail && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{currentClient.recipientEmail}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{currentClient.recipientAddress}</p>
                        <p className="text-sm text-gray-600">{currentClient.recipientCity}</p>
                      </div>
                    </div>
                  </div>

                  {currentClient.recipientRelation && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Relation</p>
                      <p className="text-blue-700">{currentClient.recipientRelation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Historique des colis</h3>
              {canCreatePackage && (
                <Button onClick={() => router.push(`/admin/packages/new?clientId=${currentClient.id}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau colis
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
                    <Button onClick={() => router.push(`/admin/packages/new?clientId=${currentClient.id}`)}>
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
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
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
                      <div>
                        <p className="text-sm text-gray-600">Nom complet</p>
                        <p className="font-medium text-lg">{currentClient.recipientName}</p>
                      </div>
                      {currentClient.recipientRelation && (
                        <div>
                          <p className="text-sm text-gray-600">Relation avec l'expéditeur</p>
                          <p className="font-medium">{currentClient.recipientRelation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Contact</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">Téléphone</p>
                          <p className="font-medium">{currentClient.recipientPhone}</p>
                        </div>
                      </div>
                      {currentClient.recipientEmail && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Mail className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{currentClient.recipientEmail}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Adresse de livraison</h4>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">{currentClient.recipientAddress}</p>
                        <p className="text-blue-700 mt-1">{currentClient.recipientCity}, Burkina Faso</p>
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
    </div>
  );
}