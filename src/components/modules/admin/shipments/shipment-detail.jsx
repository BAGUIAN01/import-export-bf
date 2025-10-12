"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useShipmentDetails, useShipmentMutations } from "@/hooks/use-shipments";
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
  Package,
  Boxes,
  User,
  Truck,
  MapPin,
  Euro,
  Calendar,
  Pencil,
  Plus,
  Trash2,
  ArrowLeft,
  MoreVertical,
  RefreshCw,
  Phone,
  Mail,
  MapPinIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  FileText,
  Download,
  Eye,
  Copy,
  Building,
  Target,
  Gauge,
  TrendingUp,
} from "lucide-react";
import PackageDialog from "@/components/modules/admin/packages/package-dialog";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const formatDateTime = (d) => (d ? new Date(d).toLocaleString("fr-FR") : "-");
const currency = (n) => (n != null ? `${Number(n).toFixed(2)}€` : "-");

const PaymentBadge = ({ status }) => {
  const cfg = {
    PENDING: { 
      label: "En attente", 
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200 shadow-sm",
      icon: Clock
    },
    PARTIAL: { 
      label: "Partiel", 
      cls: "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm",
      icon: Gauge
    },
    PAID: { 
      label: "Payé", 
      cls: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-sm",
      icon: CheckCircle2
    },
    CANCELLED: { 
      label: "Annulé", 
      cls: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200 shadow-sm",
      icon: AlertTriangle
    },
    REFUNDED: { 
      label: "Remboursé", 
      cls: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-200 shadow-sm",
      icon: AlertTriangle
    },
  };
  const c = cfg[status] || cfg.PENDING;
  const Icon = c.icon;
  
  return (
    <Badge variant="outline" className={`${c.cls} font-medium px-3 py-1`}>
      <Icon className="h-3 w-3 mr-1.5" />
      {c.label}
    </Badge>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = {
    REGISTERED: { label: "Enregistré", cls: "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-200" },
    COLLECTED: { label: "Collecté", cls: "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border-indigo-200" },
    IN_CONTAINER: { label: "En conteneur", cls: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-200" },
    IN_TRANSIT: { label: "En transit", cls: "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200" },
    CUSTOMS: { label: "Douanes", cls: "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200" },
    DELIVERED: { label: "Livré", cls: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200" },
    RETURNED: { label: "Retourné", cls: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200" },
    CANCELLED: { label: "Annulé", cls: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200" },
  };
  const c = cfg[status] || cfg.REGISTERED;
  
  return (
    <Badge variant="outline" className={`${c.cls} font-medium px-3 py-1 shadow-sm`}>
      {c.label}
    </Badge>
  );
};

const StatCard = ({ icon: Icon, title, value, subtitle, color, progress }) => (
  <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
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
      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-gradient-to-r ${color.replace('to-', 'from-').replace('from-', 'to-')}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function ShipmentDetail({
  initialShipment,
  initialContainers,
  initialClients,
}) {
  const router = useRouter();
  const [containers] = useState(initialContainers || []);
  const [clients] = useState(initialClients || []);

  // Dialogs
  const [isPkgDialogOpen, setPkgDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [addingMode, setAddingMode] = useState(false);

  // Hook SWR pour les détails du shipment avec cache
  const { 
    shipment, 
    packages, 
    isLoading, 
    refresh 
  } = useShipmentDetails(initialShipment?.id);

  // Hook pour les mutations
  const { 
    deleteShipment, 
    isLoading: isMutating 
  } = useShipmentMutations();

  // Utiliser les données du cache ou fallback sur les données initiales
  const currentShipment = shipment || initialShipment;
  const currentPackages = packages.length > 0 ? packages : initialShipment?.packages || [];

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

  const handleDeleteShipment = useCallback(async () => {
    const result = await deleteShipment(currentShipment.id);
    if (result.success) {
      router.push("/admin/shipments");
    }
  }, [deleteShipment, currentShipment.id, router]);

  const openAddPackages = useCallback(() => {
    setAddingMode(true);
    setEditingPackage(null);
    setPkgDialogOpen(true);
  }, []);

  const openEditPackage = useCallback((pkg) => {
    setAddingMode(false);
    setEditingPackage(pkg);
    setPkgDialogOpen(true);
  }, []);

  const handleSavePackage = useCallback(async (payload) => {
    try {
      if (addingMode) {
        const arrayBody = (payload.packages || []).map((p) => ({
          ...p,
          clientId: currentShipment.client.id,
          containerId: payload.containerId || currentShipment.containerId || null,
          pickupAddress: payload.sharedData?.pickupAddress || currentShipment.pickupAddress || null,
          pickupDate: payload.sharedData?.pickupDate || currentShipment.pickupDate || null,
          pickupTime: payload.sharedData?.pickupTime || currentShipment.pickupTime || null,
          deliveryAddress: payload.sharedData?.deliveryAddress || currentShipment.deliveryAddress || null,
          specialInstructions:
            payload.sharedData?.specialInstructions || currentShipment.specialInstructions || null,
          paidAmount: Number(payload.sharedData?.paidAmount || 0),
          paymentMethod: payload.sharedData?.paymentMethod || null,
          paidAt: payload.sharedData?.paidAt || null,
          shipmentId: currentShipment.id,
        }));

        const res = await fetch("/api/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(arrayBody),
        });

        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          toast.error(e?.error || "Erreur création colis");
          return;
        }
        
        toast.success("Colis ajouté(s) à l'expédition");
        setPkgDialogOpen(false);
        
        // Attendre un peu pour que le serveur termine le recalcul
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Forcer le rafraîchissement COMPLET du cache (pas de cache, force refetch)
        await refresh();
      } else if (editingPackage) {
        const res = await fetch(`/api/packages/${editingPackage.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          toast.error(e?.error || "Erreur modification colis");
          return;
        }
        
        toast.success("Colis modifié");
        setPkgDialogOpen(false);
        setEditingPackage(null);
        
        // Attendre un peu pour que le serveur termine le recalcul
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Rafraîchir le cache
        await refresh();
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  }, [addingMode, editingPackage, currentShipment, refresh]);

  const handleDeletePackage = useCallback(async (pkg) => {
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, { method: "DELETE" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast.error(e?.error || "Erreur suppression colis");
        return;
      }
      
      toast.success("Colis supprimé");
      
      // Attendre un peu pour que le serveur termine le recalcul
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Rafraîchir le cache
      await refresh();
    } catch {
      toast.error("Erreur de connexion");
    }
  }, [refresh]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const headerStats = useMemo(() => {
    const count = currentPackages.length || currentShipment.packagesCount || 0;
    const qty =
      currentShipment.totalQuantity ??
      currentPackages.reduce((s, p) => s + (p.totalQuantity || 0), 0) ??
      0;
    const weight = currentPackages.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0) ?? 0;
    return { count, qty, weight };
  }, [currentShipment, currentPackages]);

  const paymentProgress = useMemo(() => {
    const total = Number(currentShipment.totalAmount || 0);
    const paid = Number(currentShipment.paidAmount || 0);
    const percentage = total > 0 ? (paid / total) * 100 : 0;
    return { total, paid, percentage, remaining: total - paid };
  }, [currentShipment.totalAmount, currentShipment.paidAmount]);

  // Affichage du loading skeleton si pas de shipment
  if (!currentShipment) {
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
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="secondary" 
                onClick={() => router.push("/admin/shipments")}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux expéditions
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
                    <DropdownMenuItem onClick={() => copyToClipboard(currentShipment.shipmentNumber)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier le numéro
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="h-4 w-4 mr-2" />
                      Générer facture
                    </DropdownMenuItem>
                    <Separator className="my-1" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer l'expédition
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer l'expédition</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer l'expédition <strong>{currentShipment.shipmentNumber}</strong> et tous ses colis ? Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteShipment} className="bg-red-600 hover:bg-red-700" disabled={isMutating}>
                            Supprimer définitivement
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">{currentShipment.shipmentNumber}</h1>
              <p className="text-white/80 text-lg">
                Créée le {formatDateTime(currentShipment.createdAt)}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {currentShipment.client?.firstName} {currentShipment.client?.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
                  <Target className="h-4 w-4" />
                  <span>{currentShipment.client?.recipientCity || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Boxes}
            title="Colis"
            value={headerStats.count}
            subtitle={`${headerStats.qty} articles`}
            color="from-blue-500 to-blue-600"
          />
          
          <StatCard
            icon={Package}
            title="Poids total"
            value={`${headerStats.weight.toFixed(1)} kg`}
            subtitle="Poids cumulé"
            color="from-orange-500 to-orange-600"
          />
          
          <StatCard
            icon={Euro}
            title="Montant"
            value={currency(currentShipment.totalAmount)}
            subtitle={paymentProgress.remaining > 0 ? `Reste ${currency(paymentProgress.remaining)}` : 'Soldé'}
            color="from-green-500 to-green-600"
          />
          
          <StatCard
            icon={CreditCard}
            title="Paiement"
            value={`${Math.round(paymentProgress.percentage)}%`}
            subtitle={<PaymentBadge status={currentShipment.paymentStatus} />}
            color="from-purple-500 to-purple-600"
            progress={paymentProgress.percentage}
          />
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations client */}
          <Card className="lg:col-span-1 border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                  <User className="h-5 w-5" />
                </div>
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Client</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currentShipment.client?.firstName} {currentShipment.client?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{currentShipment.client?.clientCode}</p>
                </div>

                <div className="flex flex-col space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{currentShipment.client?.phone}</span>
                  </div>
                  {currentShipment.client?.email && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                      <Mail className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">{currentShipment.client.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Destinataire au Burkina Faso
                </p>
                <div className="space-y-3">
                  <p className="font-semibold text-gray-900">{currentShipment.client?.recipientName}</p>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{currentShipment.client?.recipientPhone}</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <MapPinIcon className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">{currentShipment.client?.recipientAddress}</p>
                      <p className="text-gray-600">{currentShipment.client?.recipientCity}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contenu de droite - Transport et Colis */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informations transport */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
                    <Truck className="h-5 w-5" />
                  </div>
                  Transport et livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Conteneur assigné</p>
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {currentShipment.container?.name || currentShipment.container?.containerNumber || "Non assigné"}
                          </p>
                          {currentShipment.container?.status && (
                            <div className="mt-2">
                              <StatusBadge status={currentShipment.container.status} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {currentShipment.container?.departureDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Date de départ</p>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                          <Calendar className="h-4 w-4 text-indigo-500" />
                          <span className="font-medium">{formatDate(currentShipment.container.departureDate)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {currentShipment.pickupAddress && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Ramassage</p>
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                          <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                          <span className="text-sm font-medium">{currentShipment.pickupAddress}</span>
                        </div>
                      </div>
                    )}

                    {currentShipment.specialInstructions && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Instructions</p>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">{currentShipment.specialInstructions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liste des colis */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white">
                      <Package className="h-5 w-5" />
                    </div>
                    Colis de l'expédition
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 font-semibold">
                      {headerStats.count}
                    </Badge>
                  </CardTitle>
                  <Button onClick={openAddPackages} className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter des colis
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading && currentPackages.length === 0 ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="p-6 bg-white border rounded-xl">
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-12 h-12 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-96" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : currentPackages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4 text-lg">Aucun colis pour cette expédition</p>
                    <Button onClick={openAddPackages} variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter le premier colis
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentPackages.map((pkg, index) => (
                      <div key={pkg.id} className="group p-6 bg-white border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-200 hover:border-indigo-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white shadow-lg">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg font-bold text-gray-900">{pkg.packageNumber}</span>
                              </div>
                              <p className="text-gray-600 mb-2 line-clamp-2">
                                {pkg.description || "—"}
                              </p>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-1">
                                  <Boxes className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{pkg.totalQuantity ?? 1} article(s)</span>
                                </div>
                                {pkg.weight && (
                                  <div className="flex items-center gap-1">
                                    <Package className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">{pkg.weight}kg</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Euro className="h-4 w-4 text-gray-400" />
                                  <span className="font-bold text-green-600">{currency(pkg.totalAmount)}</span>
                                </div>
                                {pkg.isFragile && (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Fragile
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="sm" onClick={() => openEditPackage(pkg)} className="hover:bg-indigo-50 hover:border-indigo-300">
                              <Pencil className="h-4 w-4 mr-1" />
                              Éditer
                            </Button>
                            <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300">
                              <Eye className="h-4 w-4 mr-1" />
                              Voir
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer le colis</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir supprimer le colis <strong>{pkg.packageNumber}</strong> ? Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePackage(pkg)} className="bg-red-600 hover:bg-red-700">
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Indicateurs de performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-emerald-900">Progression financière</h3>
                <div className="flex items-center gap-2 text-emerald-700">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm font-bold">{Math.round(paymentProgress.percentage)}%</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800 font-medium">Montant payé</span>
                  <span className="font-bold text-emerald-900 text-lg">
                    {currency(paymentProgress.paid)} / {currency(paymentProgress.total)}
                  </span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min(paymentProgress.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-sm text-emerald-700">
                  {paymentProgress.remaining > 0 
                    ? `Reste à encaisser: ${currency(paymentProgress.remaining)}` 
                    : 'Paiement complet ✓'
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-900">Résumé expédition</h3>
                <div className="flex items-center gap-2 text-blue-700">
                  <Gauge className="h-5 w-5" />
                  <span className="text-sm font-bold">
                    {Math.round((headerStats.count / Math.max(headerStats.count, 5)) * 100)}%
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-800 font-medium">Volume total</span>
                  <span className="font-bold text-blue-900">
                    {headerStats.count} colis • {headerStats.qty} articles
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-800 font-medium">Poids total</span>
                  <span className="font-bold text-blue-900">{headerStats.weight.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-800 font-medium">Statut conteneur</span>
                  <StatusBadge status={currentShipment.container?.status || 'REGISTERED'} />
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    📦 Expédition prête pour {currentShipment.container?.status === 'PREPARATION' ? 'chargement' : 'transport'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog pour ajout/édition de colis */}
      <PackageDialog
        isOpen={isPkgDialogOpen}
        onClose={() => {
          setPkgDialogOpen(false);
          setEditingPackage(null);
          setAddingMode(false);
        }}
        package={editingPackage}
        prefilledClient={addingMode ? currentShipment.client : null}
        prefilledContainer={addingMode ? currentShipment.container : null}
        prefilledSharedData={addingMode ? {
          pickupAddress: currentShipment.pickupAddress || currentShipment.client?.address,
          pickupDate: currentShipment.pickupDate,
          pickupTime: currentShipment.pickupTime,
          deliveryAddress: currentShipment.deliveryAddress || currentShipment.client?.recipientAddress,
          specialInstructions: currentShipment.specialInstructions,
          paymentMethod: currentShipment.paymentMethod,
        } : null}
        clients={clients}
        containers={containers}
        onSave={handleSavePackage}
        loading={isLoading || isMutating}
        isAddingToShipment={addingMode}
      />
    </div>
  );
}