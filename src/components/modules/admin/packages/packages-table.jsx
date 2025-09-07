"use client";

import React, { useState } from "react";
import { CustomDataTable } from "@/components/modules/data-table/data-table";
import { packagesColumns } from "@/components/modules/admin/packages/packages-columns";
import { PackageDialog } from "@/components/modules/admin/packages/package-dialog";
import { PackagesStats } from "@/components/modules/admin/packages/packages-stats";
import { toast } from "sonner";

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

const packageTypeOptions = [
  { label: "Carton", value: "CARTON" },
  { label: "Barrique", value: "BARRIQUE" },
  { label: "Véhicule", value: "VEHICLE" },
  { label: "Moto", value: "MOTORCYCLE" },
  { label: "Électronique", value: "ELECTRONICS" },
  { label: "Vêtements", value: "CLOTHING" },
  { label: "Alimentation", value: "FOOD" },
  { label: "Documents", value: "DOCUMENTS" },
  { label: "Autre", value: "OTHER" },
];

export function PackagesTable({
  initialPackages,
  initialStats,
  initialClients,
  initialContainers,
}) {
  const [packages, setPackages] = useState(initialPackages);
  const [stats, setStats] = useState(initialStats);
  const [clients] = useState(initialClients);
  const [containers] = useState(initialContainers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const refreshStats = (list = packages) => {
    const statusCounts = list.reduce((acc, pkg) => {
      acc[pkg.status] = (acc[pkg.status] || 0) + 1;
      return acc;
    }, {});

    const paymentPendingCount = list.filter(pkg => 
      pkg.paymentStatus === 'PENDING' || pkg.paymentStatus === 'PARTIAL'
    ).length;

    const issuesCount = list.filter(pkg => 
      pkg.status === 'RETURNED' || pkg.status === 'CANCELLED'
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
    setIsDialogOpen(true);
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setIsDialogOpen(true);
  };

  const withLinkedEntities = (pkg, form) => {
    const client = pkg.client ?? 
      clients.find((c) => c.id === form.clientId) ?? null;
    const container = pkg.container ?? 
      containers.find((c) => c.id === form.containerId) ?? null;
    return { ...pkg, client, container };
  };

  const handleSave = async (form) => {
    try {
      setLoading(true);
      let response;

      if (editingPackage) {
        // API PUT /api/packages/{id}
        response = await fetch(`/api/packages/${editingPackage.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const data = await response.json();
          setPackages((prev) => {
            const next = prev.map((pkg) =>
              pkg.id === editingPackage.id
                ? withLinkedEntities(data.package ?? { ...pkg, ...form }, form)
                : pkg
            );
            refreshStats(next);
            return next;
          });
          toast.success(data.message || 'Colis modifié avec succès');
          setIsDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.message || 'Erreur lors de la modification');
        }
      } else {
        // API POST /api/packages
        response = await fetch('/api/packages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const data = await response.json();
          const created = withLinkedEntities(
            data.package ?? { ...form, id: Date.now(), packageNumber: `PKG${Date.now()}` },
            form
          );
          setPackages((prev) => {
            const next = [...prev, created];
            refreshStats(next);
            return next;
          });
          toast.success(data.message || 'Colis créé avec succès');
          setIsDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.message || 'Erreur lors de la création');
        }
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pkg) => {
    if (!window.confirm(
      `Supprimer le colis ${pkg.packageNumber} de ${pkg.client?.firstName} ${pkg.client?.lastName} ?`
    )) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/packages/${pkg.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setPackages((prev) => {
          const next = prev.filter((p) => p.id !== pkg.id);
          refreshStats(next);
          return next;
        });
        toast.success(data.message || 'Colis supprimé avec succès');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.error('Erreur de connexion');
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
    // Redirection vers la page de suivi ou ouverture d'un modal de tracking
    toast.info(`Suivi du colis ${pkg.packageNumber}`);
    // router.push(`/admin/packages/${pkg.id}/tracking`);
  };

  const filters = [
    {
      key: "status",
      title: "Statut",
      options: statusOptions,
    },
    {
      key: "priority",
      title: "Priorité",
      options: priorityOptions,
    },
    {
      key: "paymentStatus",
      title: "Paiement",
      options: paymentStatusOptions,
    },
    {
      key: "type",
      title: "Type",
      options: packageTypeOptions,
    },
  ];

  const columns = packagesColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onView: handleView,
    onTrack: handleTrack,
  });

  const handleExport = () => {
    try {
      const csv = [
        [
          "N° Colis", 
          "Client", 
          "Description", 
          "Type", 
          "Statut", 
          "Priorité", 
          "Poids", 
          "Montant", 
          "Paiement", 
          "Destination", 
          "Date création"
        ].join(","),
        ...packages.map((pkg) => {
          const clientName = `${pkg.client?.firstName || ""} ${pkg.client?.lastName || ""}`.trim();
          const description = (pkg.description || "").replace(/"/g, '""');
          const destination = pkg.client?.recipientCity || "";
          const createdAt = pkg.createdAt 
            ? new Date(pkg.createdAt).toLocaleDateString("fr-FR") 
            : "";

          return [
            pkg.packageNumber,
            clientName,
            `"${description}"`,
            pkg.type,
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
      {/* Stats (affichables/masquables) */}
      {showStats && <PackagesStats stats={stats} />}

      <CustomDataTable
        data={packages}
        columns={columns}
        searchPlaceholder="Rechercher par numéro de colis, client..."
        searchKey="packageNumber"
        globalSearchKeys={["packageNumber", "client.firstName", "client.lastName", "description"]}
        filters={filters}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        addButtonText="Nouveau Colis"
        customActions={[
          {
            label: showStats ? "Masquer Stats" : "Voir Stats",
            onClick: () => setShowStats((v) => !v),
            icon: showStats ? "EyeOff" : "Eye",
            variant: "outline",
          },
        ]}
      />

      <PackageDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        package={editingPackage}
        clients={clients}
        containers={containers}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  );
}