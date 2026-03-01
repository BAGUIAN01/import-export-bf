"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { User, Users, UserCheck, UserPlus, Package, Euro, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CustomDataTable } from "@/components/modules/data-table/data-table";
import { DataTableColumnHeader } from "@/components/modules/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/modules/data-table/data-table-row-actions";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ClientForm from "./client-form-simple";

const columnHelper = createColumnHelper();

const formatCurrency = (amount) => {
  if (!amount) return "0€";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ClientsTable({ initialClients, initialStats }) {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [editClient, setEditClient] = useState(null);
  const [deleteClient, setDeleteClient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      const clientsRaw = Array.isArray(data) ? data : (data?.data || []);
      const clientsWithName = clientsRaw.map(client => ({
        ...client,
        name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.company || 'Sans nom',
      }));
      setClients(clientsWithName);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Impossible de charger les clients");
      setClients([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (initialClients) {
      const clientsWithName = initialClients.map(client => ({
        ...client,
        name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.company || 'Sans nom',
      }));
      setClients(clientsWithName);
      setLoadingList(false);
    } else {
      fetchClients();
    }
  }, [initialClients]);

  const selectClient = (client) => {
    router.push(`/admin/clients/${client.id}`);
  };

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Client créé avec succès");
      setEditClient(null);
      fetchClients();
    } catch (err) {
      toast.error(err.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    if (!editClient) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${editClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Client mis à jour");
      setEditClient(null);
      fetchClients();
    } catch (err) {
      toast.error(err.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteClient) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${deleteClient.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      toast.success("Client supprimé");
      setDeleteClient(null);
      fetchClients();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nom" />,
      cell: (info) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-lam-orange/10 flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-lam-orange" />
          </div>
          <span className="font-medium">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("email", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: (info) => <span className="text-zinc-500">{info.getValue() ?? "—"}</span>,
    }),
    columnHelper.accessor("phone", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Téléphone" />,
      cell: (info) => <span className="text-zinc-500">{info.getValue() ?? "—"}</span>,
    }),
    columnHelper.accessor("createdAt", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client depuis" />,
      cell: (info) => (
        <span className="text-zinc-400 text-sm">
          {format(new Date(info.getValue()), "dd/MM/yyyy")}
        </span>
      ),
    }),
    columnHelper.accessor("isActive", {
      header: "Statut",
      cell: () => (
        <Badge variant="outline" className="border-green-400 text-green-600">Actif</Badge>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          onView={(c) => selectClient(c)}
          onEdit={(c) => setEditClient(c)}
          onDelete={(c) => setDeleteClient(c)}
        />
      ),
    }),
  ], []);

  const stats = initialStats || {
    total: clients.length,
    active: clients.filter(c => c.isActive).length,
    newThisMonth: 0,
    withOrders: 0,
    vip: clients.filter(c => c.isVip).length,
    totalRevenue: 0,
    totalPaid: 0,
    totalShipments: 0,
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-2 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total clients</p>
                <p className="text-2xl font-bold">{stats.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients actifs</p>
                <p className="text-2xl font-bold">{stats.active || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% du total` : ""}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nouveaux (30j)</p>
                <p className="text-2xl font-bold">{stats.newThisMonth || 0}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <UserPlus className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CA total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalShipments || 0} expéditions
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Euro className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CustomDataTable
        data={clients}
        columns={columns}
        searchPlaceholder="Nom, email ou téléphone"
        searchKey="name"
        loading={loadingList}
        onAdd={() => setEditClient({})}
        addButtonText="Nouveau client"
        onRowClick={selectClient}
      />

      <Dialog open={!!editClient} onOpenChange={(o) => !o && setEditClient(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editClient?.id ? "Modifier le client" : "Nouveau client"}
            </DialogTitle>
          </DialogHeader>
          {editClient !== null && (
            <ClientForm
              initial={editClient}
              saving={saving}
              onSubmit={editClient.id ? handleUpdate : handleCreate}
              onCancel={() => setEditClient(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteClient} onOpenChange={(o) => !o && setDeleteClient(null)}>
        <AlertDialogContent className="w-[95vw] sm:max-w-md mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              <strong>{deleteClient?.name}</strong> sera définitivement supprimé.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={deleting} className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            >
              {deleting ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
