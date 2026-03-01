"use client";
import { useState, useMemo, useCallback } from "react";
import { CustomDataTable } from "@/components/modules/data-table/data-table";
import { containersColumns } from "@/components/modules/admin/containers/containers-columns";
import { ContainerDialog } from "@/components/modules/admin/containers/container-dialog";
import { toast } from "sonner";
import { ContainersStats } from "@/components/modules/admin/containers/containers-stats";
import { useContainers, useContainerMutations } from "@/hooks/use-containers";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [containerToDelete, setContainerToDelete] = useState(null);
  const [showStats, setShowStats] = useState(true);

  // Hook SWR pour les conteneurs avec cache
  const { 
    containers: serverContainers, 
    isLoading, 
    mutate 
  } = useContainers();

  // Hook pour les mutations
  const { 
    createContainer,
    updateContainer,
    deleteContainer,
    isLoading: isMutating 
  } = useContainerMutations();

  // Utiliser les données du cache ou fallback sur les données initiales
  const containers = useMemo(() => {
    return serverContainers.length > 0 
      ? serverContainers 
      : (initialContainers || []);
  }, [serverContainers, initialContainers]);

  // Calculer les stats en temps réel
  const stats = useMemo(() => {
    const statusCounts = containers.reduce((acc, container) => {
      acc[container.status] = (acc[container.status] || 0) + 1;
      return acc;
    }, {});

    const totalPackages = containers.reduce((sum, container) => sum + (container.currentLoad || 0), 0);
    const issuesCount = containers.filter(container => 
      container.status === 'CANCELLED'
    ).length;

    return {
      total: containers.length,
      inTransit: statusCounts.IN_TRANSIT || 0,
      delivered: statusCounts.DELIVERED || 0,
      preparation: statusCounts.PREPARATION || 0,
      totalPackages,
      issues: issuesCount,
    };
  }, [containers]);

  const handleAdd = useCallback(() => {
    setEditingContainer(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((container) => {
    setEditingContainer(container);
    setIsDialogOpen(true);
  }, []);

  const handleSave = useCallback(async (form) => {
    let result;
    
    if (editingContainer) {
      result = await updateContainer(editingContainer.id, form);
    } else {
      result = await createContainer(form);
    }

    if (result.success) {
      setIsDialogOpen(false);
      setEditingContainer(null);
      await mutate(); // Rafraîchir le cache
    }
  }, [editingContainer, createContainer, updateContainer, mutate]);

  const handleDelete = useCallback((container) => {
    setContainerToDelete(container);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!containerToDelete) return;

    const result = await deleteContainer(containerToDelete.id);
    if (result.success) {
      setContainerToDelete(null);
      await mutate(); // Rafraîchir le cache
    }
  }, [containerToDelete, deleteContainer, mutate]);

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

  const handleView = (container) => {
    toast.info(
      `Conteneur ${container.containerNumber} - ${container.currentLoad}/${container.capacity} colis - ${container.currentLocation || container.origin}`
    );
  };

  const handleTrack = (container) => {
    toast.info(`Suivi GPS du conteneur ${container.containerNumber}`);
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

  return (
    <div className="space-y-6 p-6">
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
        onRefresh={handleRefresh}
        addButtonText="Nouveau Conteneur"
        loading={isLoading}
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
        loading={isMutating}
      />

      {/* Confirmation de suppression */}
      <AlertDialog 
        open={!!containerToDelete} 
        onOpenChange={(open) => !open && setContainerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le conteneur{" "}
              <span className="font-bold text-foreground">
                {containerToDelete?.containerNumber}
              </span>
              ?
              <br />
              <br />
              Cette action supprimera également tous les{" "}
              <span className="font-bold text-red-600">
                {containerToDelete?.currentLoad || 0} colis
              </span>{" "}
              associés à ce conteneur.
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