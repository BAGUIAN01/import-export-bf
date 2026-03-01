"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ArrowLeft,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  Package,
  Euro,
  CheckCircle,
  Clock,
} from "lucide-react";
import ClientForm from "./client-form-simple";
import PackageDialog from "@/components/modules/admin/packages/package-dialog";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const currency = (n) => (n != null ? `${Number(n).toFixed(2)}€` : "-");

const StatusBadge = ({ isActive, isVip }) => {
  if (!isActive) {
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactif</Badge>;
  }
  if (isVip) {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">VIP</Badge>;
  }
  return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Actif</Badge>;
};

export default function ClientDetail({
  initialClient,
  initialStats = {},
  initialContainers = [],
  userRole = "ADMIN",
}) {
  const router = useRouter();
  const [containers] = useState(initialContainers);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [deleteClient, setDeleteClient] = useState(null);

  const { client, packages, stats, isLoading, refresh } = useClientDetails(initialClient?.id);
  const { updateClient, deleteClient: deleteClientFn, isLoading: isMutating } = useClientMutations();
  const { createPackageBatch, isLoading: isCreating } = usePackageBatch();

  const currentClient = client || initialClient;
  const currentStats = stats || initialStats;
  const currentPackages = packages.length > 0 ? packages : initialClient?.packages || [];

  const handleRefresh = useCallback(async () => {
    toast.promise(refresh(), {
      loading: "Actualisation...",
      success: "Données actualisées",
      error: "Erreur",
    });
  }, [refresh]);

  const handleDeleteClient = useCallback(async () => {
    const result = await deleteClientFn(currentClient.id);
    if (result.success) {
      router.push("/admin/clients");
    }
  }, [deleteClientFn, currentClient.id, router]);

  const handleEditClient = useCallback(async (payload) => {
    const result = await updateClient(currentClient.id, payload);
    if (result.success) {
      setIsEditDialogOpen(false);
      await refresh();
    }
  }, [updateClient, currentClient.id, refresh]);

  const handleCreatePackage = useCallback(async (payload) => {
    const result = await createPackageBatch(payload);
    if (result.success) {
      setIsPackageDialogOpen(false);
      toast.success("Expédition créée avec succès");
      await refresh();
    }
  }, [createPackageBatch, refresh]);

  const clientStats = useMemo(() => {
    return {
      totalSpent: currentStats.totalSpent || 0,
      totalShipmentsAmount: currentStats.totalShipmentsAmount || 0,
      packagesCount: currentStats.packagesCount || 0,
      shipmentsCount: currentStats.shipmentsCount || 0,
    };
  }, [currentStats]);

  const canEdit = ["ADMIN", "STAFF"].includes(userRole);
  const canDelete = userRole === "ADMIN";
  const canCreatePackage = ["ADMIN", "STAFF", "AGENT"].includes(userRole);

  if (!currentClient) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <Skeleton key={idx} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const shipments = currentPackages.reduce((acc, pkg) => {
    const shipmentId = pkg.shipment?.id || pkg.shipmentId || 'no-shipment';
    if (!acc[shipmentId] && pkg.shipment) {
      acc[shipmentId] = pkg.shipment;
    }
    return acc;
  }, {});

  const shipmentList = Object.values(shipments);
  const totalAmount = shipmentList.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalPaid = shipmentList.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const remainingAmount = totalAmount - totalPaid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {currentClient.firstName} {currentClient.lastName}
                </h1>
                <StatusBadge isActive={currentClient.isActive} isVip={currentClient.isVip} />
              </div>
              <p className="text-muted-foreground">Code: {currentClient.clientCode}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/admin/clients")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
              {canDelete && (
                <Button variant="outline" size="sm" onClick={() => setDeleteClient(currentClient)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{currentClient.phone}</span>
            </div>
            {currentClient.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{currentClient.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{currentClient.city}, {currentClient.country}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expéditions</p>
                <p className="text-2xl font-bold">{clientStats.shipmentsCount || 0}</p>
                <p className="text-xs text-muted-foreground">{clientStats.packagesCount || 0} colis</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total payé</p>
                <p className="text-2xl font-bold">{currency(totalPaid)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reste à payer</p>
                <p className="text-2xl font-bold">{currency(remainingAmount)}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total général</p>
                <p className="text-2xl font-bold">{currency(totalAmount)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Euro className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="packages">Colis ({currentPackages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Prénom</p>
                    <p className="font-semibold">{currentClient.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-semibold">{currentClient.lastName}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Phone className="h-4 w-4" />
                    <span>{currentClient.phone}</span>
                  </div>
                  {currentClient.email && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Mail className="h-4 w-4" />
                      <span>{currentClient.email}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 p-2 bg-muted rounded">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      <p>{currentClient.address}</p>
                      <p className="text-sm text-muted-foreground">{currentClient.city}, {currentClient.country}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Destinataire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-semibold">{currentClient.recipientName || "—"}</p>
                </div>
                {currentClient.recipientPhone && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Phone className="h-4 w-4" />
                    <span>{currentClient.recipientPhone}</span>
                  </div>
                )}
                {currentClient.recipientAddress && (
                  <div className="flex items-start gap-2 p-2 bg-muted rounded">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      <p>{currentClient.recipientAddress}</p>
                      <p className="text-sm text-muted-foreground">{currentClient.recipientCity}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          {canCreatePackage && (
            <div className="flex justify-end">
              <Button onClick={() => setIsPackageDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau colis
              </Button>
            </div>
          )}

          {currentPackages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun colis</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentPackages.map((pkg) => (
                <Card key={pkg.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/packages/${pkg.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{pkg.packageNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(pkg.createdAt)} • {currency(pkg.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={(o) => !o && setIsEditDialogOpen(false)}>
        <DialogContent className="w-[95vw] sm:max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Modifier le client
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            initial={currentClient}
            saving={isMutating}
            onSubmit={handleEditClient}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <PackageDialog
        isOpen={isPackageDialogOpen}
        onClose={() => setIsPackageDialogOpen(false)}
        clients={[currentClient]}
        containers={containers}
        onSave={handleCreatePackage}
        loading={isCreating}
      />

      <AlertDialog open={!!deleteClient} onOpenChange={(o) => !o && setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deleteClient?.firstName} {deleteClient?.lastName}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700" disabled={isMutating}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
