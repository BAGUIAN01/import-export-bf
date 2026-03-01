"use client";

import React, { useMemo, useState } from "react";
import { CustomDataTable } from "@/components/modules/data-table/data-table";
import { packagesColumns } from "@/components/modules/admin/packages/packages-columns";
import PackageDialog from "@/components/modules/admin/packages/package-dialog";
import { PackagesStats } from "@/components/modules/admin/packages/packages-stats";
import { toast } from "sonner";
import { PACKAGE_TYPES } from "@/lib/data/packages";
import { usePackages, usePackagesStats } from "@/hooks/use-packages";

/* ----------------------------- Helpers utils ----------------------------- */

function getTypesArray(pkg) {
  if (!pkg) return [];
  if (Array.isArray(pkg.selectedTypes)) return pkg.selectedTypes;
  if (typeof pkg.types === "string") {
    try { return JSON.parse(pkg.types); } catch { return []; }
  }
  if (Array.isArray(pkg.types)) return pkg.types;
  return [];
}

function labelForType(value) {
  const meta = PACKAGE_TYPES.find((t) => t.value === value);
  return meta?.label || value || "";
}

function buildTypesText(pkg) {
  const arr = getTypesArray(pkg);
  if (!arr.length) return "";
  return arr.map((t) => `${labelForType(t.type)}×${t.quantity ?? 1}`).join(", ");
}

function firstTypeValue(pkg) {
  const arr = getTypesArray(pkg);
  return arr[0]?.type || "";
}

function normalizePackage(pkg, clients, containers) {
  const client =
    pkg.client || (clients || []).find((c) => c.id === pkg.clientId) || null;
  const container =
    pkg.container ||
    (containers || []).find((c) => c.id === pkg.containerId) ||
    null;

  return {
    ...pkg,
    client,
    container,
    type: pkg.type ?? firstTypeValue(pkg),
    typesText: buildTypesText(pkg),
    destination: pkg.destination ?? client?.recipientCity ?? "",
    totalAmount: pkg.totalAmount ?? 0,
  };
}

/* --------------------------------- Options -------------------------------- */

const statusOptions = [
  { label: "Enregistré",   value: "REGISTERED" },
  { label: "Collecté",     value: "COLLECTED" },
  { label: "En conteneur", value: "IN_CONTAINER" },
  { label: "En transit",   value: "IN_TRANSIT" },
  { label: "Douanes",      value: "CUSTOMS" },
  { label: "Livré",        value: "DELIVERED" },
  { label: "Retourné",     value: "RETURNED" },
  { label: "Annulé",       value: "CANCELLED" },
];

const priorityOptions = [
  { label: "Faible",  value: "LOW" },
  { label: "Normal",  value: "NORMAL" },
  { label: "Élevé",   value: "HIGH" },
  { label: "Urgent",  value: "URGENT" },
];

const paymentStatusOptions = [
  { label: "En attente", value: "PENDING" },
  { label: "Partiel",    value: "PARTIAL" },
  { label: "Payé",       value: "PAID" },
  { label: "Annulé",     value: "CANCELLED" },
  { label: "Remboursé",  value: "REFUNDED" },
];

const packageTypeOptions = PACKAGE_TYPES.map((t) => ({
  label: t.label,
  value: t.value,
}));

/* ------------------------------- Composant -------------------------------- */

export function PackagesTable({ initialClients, initialContainers }) {
  const clients    = initialClients   || [];
  const containers = initialContainers || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // ── SWR ──────────────────────────────────────────────────────────────────
  const { packages: rawPackages, isLoading, mutate }     = usePackages({ limit: 500 });
  const { stats, mutate: mutateStats } = usePackagesStats();

  // Normalise les colis (ajoute typesText, type, destination…)
  const packages = useMemo(
    () => rawPackages.map((p) => normalizePackage(p, clients, containers)),
    [rawPackages, clients, containers]
  );

  // Invalide les deux caches SWR après toute mutation
  const invalidate = () => {
    mutate();
    mutateStats();
  };

  /* ── Handlers ──────────────────────────────────────────────────────────── */

  const handleAdd = () => {
    setEditingPackage(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setIsDialogOpen(true);
  };

  const handleSave = async (form) => {
    try {
      setLoading(true);
      let response;

      if (editingPackage) {
        response = await fetch(`/api/packages/${editingPackage.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          toast.success(data.message || "Colis modifié avec succès");
          setIsDialogOpen(false);
          invalidate();
        } else {
          const error = await response.json().catch(() => ({}));
          toast.error(error.message || "Erreur lors de la modification");
        }
      } else {
        response = await fetch("/api/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const data = await response.json();
          const count = Array.isArray(data.packages) ? data.packages.length : 1;
          toast.success(
            data.message || `${count} colis enregistré${count > 1 ? "s" : ""}`
          );
          setIsDialogOpen(false);
          invalidate();
        } else {
          const error = await response.json().catch(() => ({}));
          toast.error(error.message || "Erreur lors de la création");
        }
      }
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pkg) => {
    if (
      !window.confirm(
        `Supprimer le colis ${pkg.packageNumber} de ${pkg.client?.firstName} ${pkg.client?.lastName} ?`
      )
    )
      return;

    try {
      setLoading(true);
      const response = await fetch(`/api/packages/${pkg.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.success(data.message || "Colis supprimé avec succès");
        invalidate();
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.message || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (pkg) => {
    toast.info(
      `Colis ${pkg.packageNumber} — ${pkg.client?.firstName} ${pkg.client?.lastName} → ${pkg.client?.recipientCity}`
    );
  };

  const handleTrack = (pkg) => {
    toast.info(`Suivi du colis ${pkg.packageNumber}`);
  };

  /* ── Export CSV ────────────────────────────────────────────────────────── */

  const handleExport = () => {
    try {
      const csv = [
        [
          "N° Colis",
          "Client",
          "Description",
          "Types",
          "Statut",
          "Priorité",
          "Poids",
          "Montant",
          "Paiement",
          "Destination",
          "Date création",
        ].join(","),
        ...packages.map((pkg) => {
          const clientName = `${pkg.client?.firstName || ""} ${pkg.client?.lastName || ""}`.trim();
          const description = (pkg.description || "").replace(/"/g, '""');
          const destination = pkg.client?.recipientCity || "";
          const createdAt = pkg.createdAt
            ? new Date(pkg.createdAt).toLocaleDateString("fr-FR")
            : "";
          const typesText = buildTypesText(pkg);

          return [
            pkg.packageNumber,
            clientName,
            `"${description}"`,
            `"${typesText}"`,
            pkg.status,
            pkg.priority,
            pkg.weight || "",
            pkg.totalAmount || "",
            pkg.paymentStatus,
            destination,
            createdAt,
          ].join(",");
        }),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `colis_${new Date().toISOString().split("T")[0]}.csv`,
        style: "visibility:hidden",
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export réalisé avec succès");
    } catch (e) {
      console.error("Export colis:", e);
      toast.error("Erreur lors de l'export");
    }
  };

  /* ── Config table ──────────────────────────────────────────────────────── */

  const filters = [
    { key: "status",        title: "Statut",   options: statusOptions },
    { key: "priority",      title: "Priorité", options: priorityOptions },
    { key: "paymentStatus", title: "Paiement", options: paymentStatusOptions },
    { key: "type",          title: "Type",     options: packageTypeOptions },
  ];

  const columns = useMemo(
    () =>
      packagesColumns({
        onEdit:   handleEdit,
        onDelete: handleDelete,
        onView:   handleView,
        onTrack:  handleTrack,
      }),
    []
  );

  /* ── Rendu ─────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 p-6">
      {showStats && <PackagesStats stats={stats} />}

      <CustomDataTable
        data={packages}
        columns={columns}
        searchPlaceholder="Rechercher par numéro de colis, client..."
        searchKey="packageNumber"
        globalSearchKeys={[
          "packageNumber",
          "client.firstName",
          "client.lastName",
          "description",
          "typesText",
        ]}
        filters={filters}
        onAdd={handleAdd}
        onExport={handleExport}
        addButtonText="Nouvelle expédition"
        isLoading={isLoading}
        customActions={[
          {
            label: showStats ? "Masquer Stats" : "Voir Stats",
            onClick: () => setShowStats((v) => !v),
            icon: showStats ? "EyeOff" : "Eye",
            variant: "outline",
          },
        ]}
        initialHiddenColumns={[
          "description",
          "priority",
          "weight",
          "totalAmount",
          "paymentStatus",
          "destination",
          "estimatedDelivery",
        ]}
      />

      <PackageDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPackage(null);
        }}
        package={editingPackage}
        clients={clients}
        containers={containers}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  );
}
