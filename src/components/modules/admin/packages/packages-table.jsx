"use client";

import React, { useMemo, useState } from "react";
import { CustomDataTable } from "@/components/modules/data-table/data-table";
import { packagesColumns } from "@/components/modules/admin/packages/packages-columns";
import PackageDialog from "@/components/modules/admin/packages/package-dialog";
import { PackagesStats } from "@/components/modules/admin/packages/packages-stats";
import { toast } from "sonner";
import { PACKAGE_TYPES } from "@/lib/data/packages";

/* ----------------------------- Helpers utils ----------------------------- */

// Récupère le tableau des types à partir d'un package (supporte string JSON ou array)
function getTypesArray(pkg) {
  if (!pkg) return [];
  if (Array.isArray(pkg.selectedTypes)) return pkg.selectedTypes;
  if (typeof pkg.types === "string") {
    try {
      return JSON.parse(pkg.types);
    } catch {
      return [];
    }
  }
  if (Array.isArray(pkg.types)) return pkg.types;
  return [];
}

// Renvoie un libellé court pour un type
function labelForType(value) {
  const meta = PACKAGE_TYPES.find((t) => t.value === value);
  return meta?.label || value || "";
}

// Texte joint pour affichage/CSV/filtre
function buildTypesText(pkg) {
  const arr = getTypesArray(pkg);
  if (!arr.length) return "";
  return arr
    .map((t) => `${labelForType(t.type)}×${t.quantity ?? 1}`)
    .join(", ");
}

// Premier type (pour compat colonnes existantes qui lisent encore `type`)
function firstTypeValue(pkg) {
  const arr = getTypesArray(pkg);
  return arr[0]?.type || "";
}

// Normalise un package pour la table (ajoute champs calculés attendus par colonnes/filters)
function normalizePackage(pkg, clients, containers) {
  const client = pkg.client || (clients || []).find((c) => c.id === pkg.clientId) || null;
  const container =
    pkg.container || (containers || []).find((c) => c.id === pkg.containerId) || null;

  return {
    ...pkg,
    client,
    container,
    // champs utiles pour filtres / colonnes legacy
    type: pkg.type ?? firstTypeValue(pkg),
    typesText: buildTypesText(pkg),
    destination: pkg.destination ?? client?.recipientCity ?? "",
    totalAmount: pkg.totalAmount ?? 0,
  };
}

/* --------------------------------- Options -------------------------------- */

const statusOptions = [
  { label: "Enregistré", value: "REGISTERED" },
  { label: "Collecté", value: "COLLECTED" },
  { label: "En conteneur", value: "IN_CONTAINER" },
  { label: "En transit", value: "IN_TRANSIT" },
  { label: "Douanes", value: "CUSTOMS" },
  { label: "Livré", value: "DELIVERED" },
  { label: "Retourné", value: "RETURNED" },
  { label: "Annulé", value: "CANCELLED" },
];

const priorityOptions = [
  { label: "Faible", value: "LOW" },
  { label: "Normal", value: "NORMAL" },
  { label: "Élevé", value: "HIGH" },
  { label: "Urgent", value: "URGENT" },
];

const paymentStatusOptions = [
  { label: "En attente", value: "PENDING" },
  { label: "Partiel", value: "PARTIAL" },
  { label: "Payé", value: "PAID" },
  { label: "Annulé", value: "CANCELLED" },
  { label: "Remboursé", value: "REFUNDED" },
];

// Options de type basées sur le référentiel PACKAGE_TYPES
const packageTypeOptions = PACKAGE_TYPES.map((t) => ({
  label: t.label,
  value: t.value,
}));

/* ------------------------------- Composant -------------------------------- */

export function PackagesTable({
  initialPackages,
  initialStats,
  initialClients,
  initialContainers,
}) {
  const [packages, setPackages] = useState(
    (initialPackages || []).map((p) =>
      normalizePackage(p, initialClients, initialContainers)
    )
  );
  const [stats, setStats] = useState(initialStats);
  const [clients] = useState(initialClients);
  const [containers] = useState(initialContainers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null); // édition simple éventuellement plus tard
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const refreshStats = (list = packages) => {
    const statusCounts = list.reduce((acc, pkg) => {
      acc[pkg.status] = (acc[pkg.status] || 0) + 1;
      return acc;
    }, {});
    const paymentPendingCount = list.filter(
      (pkg) => pkg.paymentStatus === "PENDING" || pkg.paymentStatus === "PARTIAL"
    ).length;
    const issuesCount = list.filter(
      (pkg) => pkg.status === "RETURNED" || pkg.status === "CANCELLED"
    ).length;

    setStats({
      total: list.length,
      inTransit: statusCounts.IN_TRANSIT || 0,
      delivered: statusCounts.DELIVERED || 0,
      pending: statusCounts.REGISTERED || 0,
      paymentPending: paymentPendingCount,
      issues: issuesCount,
    });
  };

  const handleAdd = () => {
    setEditingPackage(null);
    setIsDialogOpen(true); // Ouvre le dialog multi-colis / expédition
  };

  const handleEdit = (pkg) => {
    // Option : ouvrir un autre dialog dédié à l’édition 1 colis
    setEditingPackage(pkg);
    toast.info("Édition d’un colis existant (mode simple).");
    setIsDialogOpen(true);
  };

  const withLinkedEntities = (pkg) => normalizePackage(pkg, clients, containers);

  // Création expédition multi-colis (POST /api/packages => { shipment, packages })
  const handleSave = async (form) => {
    try {
      setLoading(true);
      let response;

      // Si editingPackage est défini, on pourrait appeler PUT ici — laissé tel quel pour compat
      if (editingPackage) {
        response = await fetch(`/api/packages/${editingPackage.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const data = await response.json();
          setPackages((prev) => {
            const next = prev.map((pkg) =>
              pkg.id === editingPackage.id
                ? withLinkedEntities(data.package ?? { ...pkg, ...form })
                : pkg
            );
            refreshStats(next);
            return next;
          });
          toast.success(data.message || "Colis modifié avec succès");
          setIsDialogOpen(false);
        } else {
          const error = await response.json().catch(() => ({}));
          toast.error(error.message || "Erreur lors de la modification");
        }
      } else {
        // CREATION multi-colis
        response = await fetch("/api/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form), // { clientId, containerId, sharedData, packages:[...] }
        });

        if (response.ok) {
          const data = await response.json();
          const createdList = Array.isArray(data.packages) ? data.packages : [];
          const normalized = createdList.map(withLinkedEntities);

          setPackages((prev) => {
            const next = [...prev, ...normalized];
            refreshStats(next);
            return next;
          });

          toast.success(
            data.message ||
              `Expédition créée: ${createdList.length} colis enregistrés`
          );
          setIsDialogOpen(false);
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
        setPackages((prev) => {
          const next = prev.filter((p) => p.id !== pkg.id);
          refreshStats(next);
          return next;
        });
        toast.success(data.message || "Colis supprimé avec succès");
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
      `Colis ${pkg.packageNumber} - ${pkg.client?.firstName} ${pkg.client?.lastName} → ${pkg.client?.recipientCity}`
    );
  };

  const handleTrack = (pkg) => {
    toast.info(`Suivi du colis ${pkg.packageNumber}`);
  };

  // Filtres : on conserve "type" mais il pointera vers un champ calculé `typesText` via mapping data
  const filters = [
    { key: "status", title: "Statut", options: statusOptions },
    { key: "priority", title: "Priorité", options: priorityOptions },
    { key: "paymentStatus", title: "Paiement", options: paymentStatusOptions },
    // on s'appuie sur la colonne `type` (qui se base sur un champ normalisé)
    { key: "type", title: "Type", options: packageTypeOptions },
  ];

  const columns = useMemo(
    () =>
      packagesColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onView: handleView,
        onTrack: handleTrack,
      }),
    []
  );

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

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) toast.info("Fonctionnalité d'import en développement");
    };
    input.click();
  };

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
