"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CustomDataTable } from "@/components/modules/data-table/data-table";
import { shipmentsColumns } from "@/components/modules/admin/shipments/shipments-columns";
import PackageDialog from "@/components/modules/admin/packages/package-dialog";
import { ShipmentsStats } from "@/components/modules/admin/shipments/shipments-stats";

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

  // Encaissements du mois en cours (somme paidAmount pour shipments payées et payées ce mois)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = list.reduce((sum, sh) => {
    if (sh.paymentStatus === "PAID" && sh.paidAt) {
      const dt = new Date(sh.paidAt);
      if (dt >= monthStart) return sum + Number(sh.paidAmount || 0);
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

  const [shipments, setShipments] = useState(
    (initialShipments || []).map(normalizeShipment)
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const stats = useMemo(() => computeShipmentsStats(shipments), [shipments]);

  const handleCreate = () => setIsDialogOpen(true);

  const handleRowOpen = (shipment) => {
    if (!shipment?.id) return;
    router.push(`/admin/shipments/${shipment.id}`);
  };

  const handleDelete = async (shipment) => {
    if (!window.confirm(`Supprimer l'expédition ${shipment.shipmentNumber} ?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/shipments/${shipment.id}`, { method: "DELETE" });
      if (res.ok) {
        setShipments((prev) => prev.filter((s) => s.id !== shipment.id));
        toast.success("Expédition supprimée");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "Erreur lors de la suppression");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

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
  const handleSaveFromWizard = async (payload) => {
    try {
      setLoading(true);
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "Erreur lors de la création");
        return;
      }

      const data = await res.json();
      const newShipment = buildShipmentFromResponse(data, payload.sharedData);

      setShipments((prev) => [newShipment, ...prev]);
      toast.success(
        data?.message ||
          `Expédition ${newShipment.shipmentNumber} créée (${newShipment.packagesCount} colis)`
      );

      if (newShipment?.id) {
        setIsDialogOpen(false);
        setTimeout(() => handleRowOpen(newShipment), 100);
      } else {
        setIsDialogOpen(false);
      }
    } catch (e) {
      console.error("Création shipment:", e);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

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

  const columns = useMemo(
    () =>
      shipmentsColumns({
        onOpen: handleRowOpen,
        onDelete: handleDelete,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-6 p-6">
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
        customActions={[
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

      <PackageDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        clients={initialClients}        
        containers={initialContainers}  
        onSave={handleSaveFromWizard}
        loading={loading}
      />
    </div>
  );
}
