"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mutate as globalMutate } from "swr";
import { CustomDataTable } from "@/components/modules/data-table/data-table";
import { shipmentsColumns } from "@/components/modules/admin/shipments/shipments-columns";
import PackageDialog from "@/components/modules/admin/packages/package-dialog";
import { ShipmentsStats } from "@/components/modules/admin/shipments/shipments-stats";
import { ShipmentEditDialog } from "@/components/modules/admin/shipments/shipment-edit-dialog";
import { useShipments, useShipmentMutations, usePackageBatch } from "@/hooks/use-shipments";
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

/* ----------------------------- Helpers ----------------------------- */

function compactName(client) {
  if (!client) return "";
  const fn = client.firstName || "";
  const ln = client.lastName || "";
  return `${fn} ${ln}`.trim();
}

function normalizeShipment(sh) {
  return {
    ...sh,
    packagesCount: sh.packagesCount ?? 0,
    totalQuantity: sh.totalQuantity ?? 0,
    totalAmount: sh.totalAmount ?? 0,
    paidAmount: sh.paidAmount ?? 0,
    paymentStatus: sh.paymentStatus || "PENDING",
    containerStatus: sh?.container?.status ?? null,
    containerLabel: sh?.container?.name || sh?.container?.containerNumber || "",
  };
}

// Reconstruit un objet shipment minimal depuis POST /api/packages
function buildShipmentFromResponse(data, sharedData) {
  const packages = Array.isArray(data?.packages) ? data.packages : [];

  const packagesCount = packages.length;
  const totalQuantity = packages.reduce((s, p) => s + (p.totalQuantity || 0), 0);
  const subtotal = packages.reduce((s, p) => s + (p.basePrice || 0), 0);
  const pickupFeeTotal = packages.reduce((s, p) => s + (p.pickupFee || 0), 0);
  const insuranceFeeTotal = packages.reduce((s, p) => s + (p.insuranceFee || 0), 0);
  const customsFeeTotal = packages.reduce((s, p) => s + (p.customsFee || 0), 0);
  const discountTotal = packages.reduce((s, p) => s + (p.discount || 0), 0);
  const totalAmount =
    subtotal + pickupFeeTotal + insuranceFeeTotal + customsFeeTotal - discountTotal;

  return normalizeShipment({
    id: data?.shipment?.id,
    shipmentNumber: data?.shipment?.shipmentNumber,
    client: packages[0]?.client ?? null,
    container: packages[0]?.container ?? null,
    user: packages[0]?.user ?? null,
    packagesCount,
    totalQuantity,
    subtotal,
    pickupFeeTotal,
    insuranceFeeTotal,
    customsFeeTotal,
    discountTotal,
    totalAmount,
    paymentStatus:
      Number(sharedData?.paidAmount || 0) > 0
        ? Number(sharedData?.paidAmount || 0) >= totalAmount
          ? "PAID"
          : "PARTIAL"
        : "PENDING",
    paymentMethod: sharedData?.paymentMethod || null,
    paidAmount: Number(sharedData?.paidAmount || 0),
    paidAt: sharedData?.paidAt ? new Date(sharedData.paidAt) : null,
    pickupAddress: sharedData?.pickupAddress || null,
    pickupDate: sharedData?.pickupDate ? new Date(sharedData.pickupDate) : null,
    pickupTime: sharedData?.pickupTime || null,
    deliveryAddress: packages[0]?.deliveryAddress || null,
    specialInstructions: sharedData?.specialInstructions || null,
    createdAt: new Date(),
  });
}

/* ---------------------------- Stats helpers ---------------------------- */

function computeShipmentsStats(list) {
  const total = list.length;

  const statusBreakdown = list.reduce((acc, sh) => {
    const k = sh.containerStatus || "UNKNOWN";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const paymentBreakdown = list.reduce((acc, sh) => {
    const k = sh.paymentStatus || "PENDING";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const inTransit = (statusBreakdown.LOADED || 0) + (statusBreakdown.IN_TRANSIT || 0);
  const delivered = statusBreakdown.DELIVERED || 0;
  const paymentPending =
    (paymentBreakdown.PENDING || 0) + (paymentBreakdown.PARTIAL || 0);
  const issues =
    (paymentBreakdown.CANCELLED || 0) + (paymentBreakdown.REFUNDED || 0);

  // Encaissements du mois en cours (somme de TOUS les paidAmount avec paiement ce mois)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = list.reduce((sum, sh) => {
    // Compter tous les paiements effectués ce mois (PAID, PARTIAL, etc.)
    const paid = Number(sh.paidAmount || 0);
    if (paid > 0 && sh.paidAt) {
      const dt = new Date(sh.paidAt);
      if (dt >= monthStart) return sum + paid;
    }
    return sum;
  }, 0);

  return {
    total,
    inTransit,
    delivered,
    paymentPending,
    issues,
    monthlyRevenue,
    statusBreakdown,
    paymentBreakdown,
  };
}

/* --------------------------------- UI --------------------------------- */

export function ShipmentsTable({
  initialShipments,
  initialClients = [],
  initialContainers = [],
}) {
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [shipmentToDelete, setShipmentToDelete] = useState(null);
  const [editingShipment, setEditingShipment] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Hook SWR pour les shipments avec cache
  const { 
    shipments: serverShipments, 
    isLoading, 
    mutate 
  } = useShipments();

  // Hook pour les mutations
  const { 
    updateShipment,
    deleteShipment, 
    isLoading: isMutating 
  } = useShipmentMutations();

  // Hook pour créer des packages en batch
  const { 
    createPackageBatch, 
    isLoading: isCreating 
  } = usePackageBatch();

  // Utiliser les données du cache ou fallback sur les données initiales
  const shipments = useMemo(() => {
    const data = serverShipments.length > 0 
      ? serverShipments 
      : (initialShipments || []);
    return data.map(normalizeShipment);
  }, [serverShipments, initialShipments]);

  const stats = useMemo(() => computeShipmentsStats(shipments), [shipments]);

  const handleCreate = useCallback(() => setIsDialogOpen(true), []);

  const handleRowOpen = useCallback((shipment) => {
    if (!shipment?.id) return;
    router.push(`/admin/shipments/${shipment.id}`);
  }, [router]);

  const handleDelete = useCallback((shipment) => {
    setShipmentToDelete(shipment);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!shipmentToDelete) return;
    
    const result = await deleteShipment(shipmentToDelete.id);
    if (result.success) {
      await mutate(); // Rafraîchir le cache
      setShipmentToDelete(null);
    }
  }, [shipmentToDelete, deleteShipment, mutate]);

  const handleRefresh = useCallback(async () => {
    toast.promise(
      mutate(),
      {
        loading: "Actualisation en cours...",
        success: "Données actualisées avec succès",
        error: "Erreur lors de l'actualisation",
      }
    );
  }, [mutate]);

  const handleExport = () => {
    try {
      const csv = [
        [
          "N° Expédition",
          "Client",
          "Conteneur",
          "Nb Colis",
          "Qté Totale",
          "Montant Total",
          "Statut Paiement",
          "Payé",
          "Date création",
        ].join(","),
        ...shipments.map((sh) => {
          const clientName = compactName(sh.client);
          const containerLabel = sh.containerLabel;
          const createdAt = sh.createdAt
            ? new Date(sh.createdAt).toLocaleDateString("fr-FR")
            : "";
          return [
            sh.shipmentNumber,
            clientName,
            `"${containerLabel}"`,
            sh.packagesCount || 0,
            sh.totalQuantity || 0,
            sh.totalAmount || 0,
            sh.paymentStatus || "",
            sh.paidAmount || 0,
            createdAt,
          ].join(",");
        }),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `expeditions_${new Date().toISOString().split("T")[0]}.csv`,
        style: "visibility:hidden",
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export réalisé avec succès");
    } catch (e) {
      console.error("Export shipments:", e);
      toast.error("Erreur lors de l'export");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) toast.info("Import Shipments en développement");
    };
    input.click();
  };

  // Création via PackageDialog (wizard)
  const handleSaveFromWizard = useCallback(async (payload) => {
    const result = await createPackageBatch(payload);
    if (result.success) {
      setIsDialogOpen(false);
      
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
      
      // Attendre que le serveur finisse les calculs d'agrégats
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Invalider TOUT le cache SWR pour les shipments et packages
      await globalMutate(
        key => typeof key === 'string' && (
          key.startsWith('/api/shipments') || 
          key.startsWith('/api/packages')
        ),
        undefined,
        { revalidate: true }
      );
      
      // Forcer aussi le rafraîchissement local
      await mutate(undefined, { revalidate: true });
      
      // Second rafraîchissement pour être sûr que les stats sont à jour
      setTimeout(() => {
        globalMutate(
          key => typeof key === 'string' && key.startsWith('/api/shipments'),
          undefined,
          { revalidate: true }
        );
      }, 1000);
      
      // Navigation vers le shipment créé/mis à jour si disponible
      const newShipment = result.data?.shipment;
      if (newShipment?.id && !isExisting) {
        // Ne naviguer que si c'est un nouveau shipment
        setTimeout(() => router.push(`/admin/shipments/${newShipment.id}`), 2000);
      }
    }
  }, [createPackageBatch, mutate, router]);

  /* ------------------------ Filtres & colonnes ------------------------ */

  const paymentStatusOptions = [
    { label: "En attente", value: "PENDING" },
    { label: "Partiel", value: "PARTIAL" },
    { label: "Payé", value: "PAID" },
    { label: "Annulé", value: "CANCELLED" },
    { label: "Remboursé", value: "REFUNDED" },
  ];

  const containerStatusOptions = [
    { label: "Préparation", value: "PREPARATION" },
    { label: "Chargé", value: "LOADED" },
    { label: "En transit", value: "IN_TRANSIT" },
    { label: "Douanes", value: "CUSTOMS" },
    { label: "Livré", value: "DELIVERED" },
  ];

  const filters = [
    { key: "paymentStatus", title: "Paiement", options: paymentStatusOptions },
    { key: "containerStatus", title: "Statut conteneur", options: containerStatusOptions },
  ];

  const handleEdit = useCallback((shipment) => {
    if (!shipment?.id) return;
    setEditingShipment(shipment);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async (data) => {
    if (!editingShipment) return;
    
    const result = await updateShipment(editingShipment.id, data);
    if (result.success) {
      setIsEditDialogOpen(false);
      setEditingShipment(null);
      await mutate(); // Rafraîchir le cache
    }
  }, [editingShipment, updateShipment, mutate]);

  const columns = useMemo(
    () =>
      shipmentsColumns({
        onOpen: handleRowOpen,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleRowOpen, handleEdit, handleDelete]
  );

  return (
    <div className="space-y-4 xs:space-y-6">
      {showStats && <ShipmentsStats stats={stats} />}

      <CustomDataTable
        data={shipments}
        columns={columns}
        searchPlaceholder="Rechercher par n° d'expédition, client..."
        searchKey="shipmentNumber"
        globalSearchKeys={[
          "shipmentNumber",
          "client.firstName",
          "client.lastName",
          "containerLabel",
          "container.containerNumber",
          "container.name",
        ]}
        filters={filters}
        onAdd={handleCreate}
        onExport={handleExport}
        onImport={handleImport}
        addButtonText="Nouvelle expédition"
        loading={isLoading}
        onRowClick={handleRowOpen} // Ajout du clic sur les lignes
        customActions={[
          {
            label: "Actualiser",
            onClick: handleRefresh,
            icon: "RefreshCw",
            variant: "outline",
          },
          {
            label: showStats ? "Masquer Stats" : "Voir Stats",
            onClick: () => setShowStats((v) => !v),
            icon: showStats ? "EyeOff" : "Eye",
            variant: "outline",
          },
        ]}
        initialHiddenColumns={[
          "paidAmount",
          "subtotal",
          "pickupFeeTotal",
          "insuranceFeeTotal",
          "customsFeeTotal",
          "discountTotal",
          "containerStatus", // technique (filtre) — on la cache
        ]}
      />

      {/* Dialog création d'expédition */}
      <PackageDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        clients={initialClients}        
        containers={initialContainers}
        onSave={handleSaveFromWizard}
        loading={isCreating || isMutating}
      />

      {/* Dialog modification d'expédition */}
      <ShipmentEditDialog
        shipment={editingShipment}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingShipment(null);
        }}
        onSave={handleSaveEdit}
        loading={isMutating}
      />

      {/* Confirmation de suppression */}
      <AlertDialog open={!!shipmentToDelete} onOpenChange={(open) => !open && setShipmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'expédition{" "}
              <span className="font-bold text-foreground">
                {shipmentToDelete?.shipmentNumber}
              </span>{" "}
              ?
              <br />
              <br />
              Cette action supprimera également tous les{" "}
              <span className="font-bold text-red-600">
                {shipmentToDelete?.packagesCount || 0} colis
              </span>{" "}
              associés à cette expédition.
              <br />
              <br />
              <span className="text-red-600 font-semibold">
                ⚠️ Cette action est irréversible.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isMutating}
            >
              {isMutating ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
