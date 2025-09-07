"use client";
import { useState } from "react";
import { CustomDataTable } from "@/components/modules/data-table/data-table";
import { containersColumns } from "@/components/modules/admin/containers/containers-columns";
import { ContainerDialog } from "@/components/modules/admin/containers/container-dialog";
import { toast } from "sonner";
import { ContainersStats } from "@/components/modules/admin/containers/containers-stats";

const statusOptions = [
  { label: "Préparation", value: "PREPARATION" },
  { label: "Chargé", value: "LOADED" },
  { label: "En transit", value: "IN_TRANSIT" },
  { label: "Douanes", value: "CUSTOMS" },
  { label: "Livré", value: "DELIVERED" },
  { label: "Annulé", value: "CANCELLED" },
];

export function ContainersTable({
  initialContainers,
  initialStats,
}) {
  const [containers, setContainers] = useState(initialContainers);
  const [stats, setStats] = useState(initialStats);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const refreshStats = (list = containers) => {
    const statusCounts = list.reduce((acc, container) => {
      acc[container.status] = (acc[container.status] || 0) + 1;
      return acc;
    }, {});

    const totalPackages = list.reduce((sum, container) => sum + (container.currentLoad || 0), 0);
    const issuesCount = list.filter(container => 
      container.status === 'CANCELLED'
    ).length;

    setStats({
      total: list.length,
      inTransit: statusCounts.IN_TRANSIT || 0,
      delivered: statusCounts.DELIVERED || 0,
      preparation: statusCounts.PREPARATION || 0,
      totalPackages,
      issues: issuesCount,
    });
  };

  const handleAdd = () => {
    setEditingContainer(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (container) => {
    setEditingContainer(container);
    setIsDialogOpen(true);
  };

  const handleSave = async (form) => {
    try {
      setLoading(true);
      let response;

      if (editingContainer) {
        // API PUT /api/containers/{id}
        response = await fetch(`/api/containers/${editingContainer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const data = await response.json();
          setContainers((prev) => {
            const next = prev.map((container) =>
              container.id === editingContainer.id
                ? (data.container ?? { ...container, ...form })
                : container
            );
            refreshStats(next);
            return next;
          });
          toast.success(data.message || 'Conteneur modifié avec succès');
          setIsDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.message || 'Erreur lors de la modification');
        }
      } else {
        // API POST /api/containers
        response = await fetch('/api/containers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const data = await response.json();
          const created = data.container ?? { 
            ...form, 
            id: Date.now(), 
            containerNumber: `CNT${Date.now()}`,
            currentLoad: 0,
            currentWeight: 0
          };
          setContainers((prev) => {
            const next = [...prev, created];
            refreshStats(next);
            return next;
          });
          toast.success(data.message || 'Conteneur créé avec succès');
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

  const handleDelete = async (container) => {
    if (!window.confirm(
      `Supprimer le conteneur ${container.containerNumber} ? Cette action supprimera aussi tous les colis associés.`
    )) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/containers/${container.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setContainers((prev) => {
          const next = prev.filter((c) => c.id !== container.id);
          refreshStats(next);
          return next;
        });
        toast.success(data.message || 'Conteneur supprimé avec succès');
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

  const handleView = (container) => {
    toast.info(
      `Conteneur ${container.containerNumber} - ${container.currentLoad}/${container.capacity} colis - ${container.currentLocation || container.origin}`
    );
  };

  const handleTrack = (container) => {
    // Redirection vers la page de suivi GPS ou ouverture d'un modal de tracking
    toast.info(`Suivi GPS du conteneur ${container.containerNumber}`);
    // router.push(`/admin/containers/${container.id}/tracking`);
  };

  const filters = [
    {
      key: "status",
      title: "Statut",
      options: statusOptions,
    },
  ];

  const columns = containersColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onView: handleView,
    onTrack: handleTrack,
  });

  const handleExport = () => {
    try {
      const csv = [
        [
          "N° Conteneur", 
          "Nom", 
          "Statut", 
          "Capacité", 
          "Charge actuelle", 
          "Localisation", 
          "Date départ", 
          "Date arrivée", 
          "Transporteur",
          "Coût total"
        ].join(","),
        ...containers.map((container) => {
          const departureDate = container.departureDate 
            ? new Date(container.departureDate).toLocaleDateString("fr-FR") 
            : "";
          const arrivalDate = container.arrivalDate 
            ? new Date(container.arrivalDate).toLocaleDateString("fr-FR") 
            : "";
          const totalCost = container.totalCost || 
            ((container.transportCost || 0) + (container.customsCost || 0));

          return [
            container.containerNumber,
            `"${container.name || ""}"`,
            container.status,
            container.capacity,
            container.currentLoad || 0,
            `"${container.currentLocation || container.origin || ""}"`,
            departureDate,
            arrivalDate,
            `"${container.transportCompany || ""}"`,
            totalCost.toFixed(2),
          ].join(",");
        }),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `conteneurs_${new Date().toISOString().split("T")[0]}.csv`,
        style: "visibility:hidden",
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export réalisé avec succès");
    } catch (e) {
      console.error("Export conteneurs:", e);
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
      {showStats && <ContainersStats stats={stats} />}

      <CustomDataTable
        data={containers}
        columns={columns}
        searchPlaceholder="Rechercher par numéro de conteneur, nom..."
        searchKey="containerNumber"
        globalSearchKeys={["containerNumber", "name", "currentLocation", "transportCompany"]}
        filters={filters}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        addButtonText="Nouveau Conteneur"
        customActions={[
          {
            label: showStats ? "Masquer Stats" : "Voir Stats",
            onClick: () => setShowStats((v) => !v),
            icon: showStats ? "EyeOff" : "Eye",
            variant: "outline",
          },
        ]}
      />

      <ContainerDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        container={editingContainer}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  );
}