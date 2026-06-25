"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  RefreshCw,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  Clock,
} from "lucide-react";
import PackageDialog from "@/components/modules/admin/packages/package-dialog";
import { ShipmentEditDialog } from "./shipment-edit-dialog";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const currency = (n) => (n != null ? `${Number(n).toFixed(2)}€` : "-");

const PaymentBadge = ({ status }) => {
  const cfg = {
    PENDING: { label: "En attente", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    PARTIAL: { label: "Partiel", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    PAID: { label: "Payé", cls: "bg-green-50 text-green-700 border-green-200" },
    CANCELLED: { label: "Annulé", cls: "bg-red-50 text-red-700 border-red-200" },
    REFUNDED: { label: "Remboursé", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  };
  const c = cfg[status] || cfg.PENDING;
  return <Badge variant="outline" className={c.cls}>{c.label}</Badge>;
};

const StatusBadge = ({ status }) => {
  const cfg = {
    PREPARATION: { label: "Préparation", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    LOADED: { label: "Chargé", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    IN_TRANSIT: { label: "En transit", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    CUSTOMS: { label: "Douanes", cls: "bg-red-50 text-red-700 border-red-200" },
    DELIVERED: { label: "Livré", cls: "bg-green-50 text-green-700 border-green-200" },
    CANCELLED: { label: "Annulé", cls: "bg-gray-50 text-gray-700 border-gray-200" },
  };
  const c = cfg[status] || { label: status || "-", cls: "bg-slate-50 text-slate-700 border-slate-200" };
  return <Badge variant="outline" className={c.cls}>{c.label}</Badge>;
};

export default function ShipmentDetail({
  initialShipment,
  initialContainers,
  initialClients,
}) {
  const router = useRouter();
  const [containers] = useState(initialContainers || []);
  const [clients] = useState(initialClients || []);

  const [isPkgDialogOpen, setPkgDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [addingMode, setAddingMode] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { shipment, packages, isLoading, refresh } = useShipmentDetails(initialShipment?.id);
  const { deleteShipment, isLoading: isMutating } = useShipmentMutations();

  const currentShipment = shipment || initialShipment;
  const currentPackages = packages.length > 0 ? packages : initialShipment?.packages || [];

  const handleRefresh = useCallback(async () => {
    toast.promise(refresh(), {
      loading: "Actualisation...",
      success: "Données actualisées",
      error: "Erreur",
    });
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
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await refresh();
        setTimeout(() => refresh(), 500);
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
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await refresh();
        setTimeout(() => refresh(), 500);
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
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await refresh();
      setTimeout(() => refresh(), 500);
    } catch {
      toast.error("Erreur de connexion");
    }
  }, [refresh]);

  const headerStats = useMemo(() => {
    const count = currentPackages.length || currentShipment?.packagesCount || 0;
    const qty =
      currentShipment?.totalQuantity ??
      currentPackages.reduce((s, p) => s + (p.totalQuantity || 0), 0) ??
      0;
    const weight = currentPackages.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0) ?? 0;
    return { count, qty, weight };
  }, [currentShipment, currentPackages]);

  const paymentProgress = useMemo(() => {
    const total = Number(currentShipment?.totalAmount || 0);
    const paid = Number(currentShipment?.paidAmount || 0);
    const percentage = total > 0 ? (paid / total) * 100 : 0;
    return { total, paid, percentage, remaining: total - paid };
  }, [currentShipment]);

  if (!currentShipment) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <Skeleton key={idx} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const client = currentShipment.client;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{currentShipment.shipmentNumber}</h1>
                <PaymentBadge status={currentShipment.paymentStatus} />
              </div>
              <p className="text-muted-foreground">
                Créée le {formatDate(currentShipment.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/admin/shipments")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="bg-[#0E7A34] hover:bg-[#0B5C28] text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Paiement
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {client?.firstName} {client?.lastName}
              </span>
            </div>
            {client?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.phone}</span>
              </div>
            )}
            {client?.recipientCity && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.recipientCity}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Colis</p>
                <p className="text-2xl font-bold">{headerStats.count}</p>
                <p className="text-xs text-muted-foreground">{headerStats.qty} articles</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Boxes className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Poids total</p>
                <p className="text-2xl font-bold">{headerStats.weight.toFixed(1)} kg</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant</p>
                <p className="text-2xl font-bold">{currency(paymentProgress.total)}</p>
                <p className="text-xs text-muted-foreground">
                  {paymentProgress.remaining > 0
                    ? `Reste ${currency(paymentProgress.remaining)}`
                    : "Soldé"}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payé</p>
                <p className="text-2xl font-bold">{currency(paymentProgress.paid)}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(paymentProgress.percentage)}%
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                {paymentProgress.remaining > 0 ? (
                  <Clock className="h-6 w-6 text-purple-600" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                )}
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
            {/* Client + destinataire */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client &amp; destinataire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-semibold">
                    {client?.firstName} {client?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{client?.clientCode}</p>
                </div>
                <div className="space-y-2">
                  {client?.phone && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client?.email && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Mail className="h-4 w-4" />
                      <span>{client.email}</span>
                    </div>
                  )}
                </div>
                {(client?.recipientName || client?.recipientPhone || client?.recipientAddress) && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Destinataire au Burkina Faso</p>
                    <p className="font-semibold">{client?.recipientName || "—"}</p>
                    {client?.recipientPhone && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded mt-2">
                        <Phone className="h-4 w-4" />
                        <span>{client.recipientPhone}</span>
                      </div>
                    )}
                    {client?.recipientAddress && (
                      <div className="flex items-start gap-2 p-2 bg-muted rounded mt-2">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <div>
                          <p>{client.recipientAddress}</p>
                          <p className="text-sm text-muted-foreground">{client.recipientCity}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transport */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Transport &amp; livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Conteneur assigné</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">
                      {currentShipment.container?.name ||
                        currentShipment.container?.containerNumber ||
                        "Non assigné"}
                    </p>
                    {currentShipment.container?.status && (
                      <StatusBadge status={currentShipment.container.status} />
                    )}
                  </div>
                </div>
                {currentShipment.container?.departureDate && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Départ le {formatDate(currentShipment.container.departureDate)}
                    </span>
                  </div>
                )}
                {currentShipment.pickupAddress && (
                  <div className="flex items-start gap-2 p-2 bg-muted rounded">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ramassage</p>
                      <p className="text-sm">{currentShipment.pickupAddress}</p>
                    </div>
                  </div>
                )}
                {currentShipment.specialInstructions && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                    <p className="text-sm text-amber-800">{currentShipment.specialInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddPackages}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter des colis
            </Button>
          </div>

          {isLoading && currentPackages.length === 0 ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, idx) => (
                <Skeleton key={idx} className="h-20 w-full" />
              ))}
            </div>
          ) : currentPackages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Aucun colis pour cette expédition</p>
              <Button variant="outline" onClick={openAddPackages}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter le premier colis
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {currentPackages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Package className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{pkg.packageNumber}</p>
                            {pkg.isFragile && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Fragile
                              </Badge>
                            )}
                          </div>
                          {pkg.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{pkg.description}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {pkg.totalQuantity ?? 1} article(s)
                            {pkg.weight ? ` • ${pkg.weight}kg` : ""} •{" "}
                            <span className="font-medium text-green-600">{currency(pkg.totalAmount)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openEditPackage(pkg)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le colis</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le colis{" "}
                                <strong>{pkg.packageNumber}</strong> ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePackage(pkg)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog ajout/édition colis */}
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
        prefilledSharedData={null}
        clients={clients}
        containers={containers}
        onSave={handleSavePackage}
        loading={isLoading || isMutating}
        isAddingToShipment={addingMode}
      />

      {/* Dialog paiement */}
      <ShipmentEditDialog
        shipment={currentShipment}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={async (data) => {
          try {
            const res = await fetch(`/api/shipments/${currentShipment.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (!res.ok) {
              const e = await res.json().catch(() => ({}));
              toast.error(e?.error || "Erreur modification paiement");
              return;
            }

            toast.success("Paiement mis à jour");
            setIsEditDialogOpen(false);
            await refresh();
          } catch {
            toast.error("Erreur de connexion");
          }
        }}
        loading={isLoading || isMutating}
      />

      {/* Confirmation suppression shipment */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'expédition</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'expédition{" "}
              <strong>{currentShipment.shipmentNumber}</strong> et tous ses colis ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShipment}
              className="bg-red-600 hover:bg-red-700"
              disabled={isMutating}
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
