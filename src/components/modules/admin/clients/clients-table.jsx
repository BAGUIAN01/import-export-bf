"use client";

import React, { useState } from "react";
import { CustomDataTable } from "@/components/modules/data-table/data-table";
import { clientsColumns } from "@/components/modules/admin/clients/clients-columns";
import { ClientDialog } from "@/components/modules/admin/clients/client-dialog";
import { ClientsStats } from "@/components/modules/admin/clients/clients-stats";
import { toast } from "sonner";

const statusOptions = [
  { label: "Actifs", value: "active" },
  { label: "Inactifs", value: "inactive" },
  { label: "VIP", value: "vip" },
];

const countryOptions = [
  { label: "France", value: "France" },
  { label: "Burkina Faso", value: "Burkina Faso" },
  { label: "Côte d'Ivoire", value: "Côte d'Ivoire" },
  { label: "Mali", value: "Mali" },
  { label: "Niger", value: "Niger" },
];

export function ClientsTable({
  initialClients,
  initialStats,
}) {
  const [clients, setClients] = useState(initialClients);
  const [stats, setStats] = useState(initialStats);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const refreshStats = (list = clients) => {
    const activeCount = list.filter(client => client.isActive).length;
    const vipCount = list.filter(client => client.isVip).length;
    const withOrdersCount = list.filter(client => (client.packagesCount || 0) > 0).length;
    const burkinaRecipientsCount = list.filter(client => 
      client.recipientCity && client.recipientCity.trim() !== ""
    ).length;

    // Calcul des nouveaux clients du mois
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newThisMonth = list.filter(client => 
      new Date(client.createdAt) >= thirtyDaysAgo
    ).length;

    setStats({
      total: list.length,
      active: activeCount,
      newThisMonth,
      withOrders: withOrdersCount,
      vip: vipCount,
      burkinaRecipients: burkinaRecipientsCount,
    });
  };

  const handleAdd = () => {
    setEditingClient(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleSave = async (form) => {
    try {
      setLoading(true);
      let response;

      if (editingClient) {
        // API PUT /api/clients/{id}
        response = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const data = await response.json();
          setClients((prev) => {
            const next = prev.map((client) =>
              client.id === editingClient.id
                ? { ...client, ...data.client, ...form }
                : client
            );
            refreshStats(next);
            return next;
          });
          toast.success(data.message || 'Client modifié avec succès');
          setIsDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.message || 'Erreur lors de la modification');
        }
      } else {
        // API POST /api/clients
        response = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const data = await response.json();
          const created = {
            ...data.client,
            ...form,
            id: data.client?.id || Date.now(),
            clientCode: data.client?.clientCode || `CLI${Date.now()}`,
            packagesCount: 0,
            createdAt: new Date().toISOString(),
          };
          setClients((prev) => {
            const next = [...prev, created];
            refreshStats(next);
            return next;
          });
          toast.success(data.message || 'Client créé avec succès');
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

  const handleDelete = async (client) => {
    if (!window.confirm(
      `Supprimer le client ${client.firstName} ${client.lastName} (${client.clientCode}) ?\n\nAttention: Cette action supprimera également tous les colis associés.`
    )) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setClients((prev) => {
          const next = prev.filter((c) => c.id !== client.id);
          refreshStats(next);
          return next;
        });
        toast.success(data.message || 'Client supprimé avec succès');
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

  const handleView = (client) => {
    toast.info(
      `Client ${client.firstName} ${client.lastName} - ${client.phone} → ${client.recipientName} (${client.recipientCity})`
    );
  };

  const handleCreatePackage = (client) => {
    // Redirection vers la création de colis avec le client pré-sélectionné
    toast.info(`Créer un nouveau colis pour ${client.firstName} ${client.lastName}`);
    // Ici on pourrait rediriger vers la page des colis avec le client pré-rempli
    // router.push(`/admin/packages/new?clientId=${client.id}`);
  };

  const filters = [
    {
      key: "status",
      title: "Statut",
      options: statusOptions,
    },
    {
      key: "country",
      title: "Pays",
      options: countryOptions,
    },
  ];

  const columns = clientsColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onView: handleView,
    onCreatePackage: handleCreatePackage,
  });

  const handleExport = () => {
    try {
      const csv = [
        [
          "Code Client",
          "Prénom",
          "Nom",
          "Téléphone",
          "Email",
          "Ville",
          "Pays",
          "Entreprise",
          "Destinataire",
          "Ville Destinataire",
          "Téléphone Destinataire",
          "Statut",
          "VIP",
          "Total Dépensé",
          "Nb Colis",
          "Date création"
        ].join(","),
        ...clients.map((client) => {
          const createdAt = client.createdAt 
            ? new Date(client.createdAt).toLocaleDateString("fr-FR") 
            : "";

          return [
            client.clientCode,
            client.firstName,
            client.lastName,
            client.phone,
            client.email || "",
            client.city,
            client.country,
            client.company || "",
            client.recipientName,
            client.recipientCity,
            client.recipientPhone,
            client.isActive ? "Actif" : "Inactif",
            client.isVip ? "Oui" : "Non",
            client.totalSpent || "0",
            client.packagesCount || "0",
            createdAt,
          ].join(",");
        }),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `clients_${new Date().toISOString().split("T")[0]}.csv`,
        style: "visibility:hidden",
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export réalisé avec succès");
    } catch (e) {
      console.error("Export clients:", e);
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
      {showStats && <ClientsStats stats={stats} />}

      <CustomDataTable
        data={clients}
        columns={columns}
        searchPlaceholder="Rechercher par nom, code client, téléphone..."
        searchKey="clientCode"
        globalSearchKeys={["clientCode", "firstName", "lastName", "phone", "email", "company"]}
        filters={filters}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        addButtonText="Nouveau Client"
        customActions={[
          {
            label: showStats ? "Masquer Stats" : "Voir Stats",
            onClick: () => setShowStats((v) => !v),
            icon: showStats ? "EyeOff" : "Eye",
            variant: "outline",
          },
        ]}
      />

      <ClientDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        client={editingClient}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  );
}