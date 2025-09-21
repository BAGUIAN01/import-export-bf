"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Users,
  UserCheck,
  UserPlus,
  Star,
  MapPin,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Package,
  Phone,
  Mail,
  Building,
  Calendar,
  Euro,
  Settings,
  RefreshCw,
} from "lucide-react";
import { ClientDialog } from "./client-dialog";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const formatCurrency = (amount) =>
  amount != null && amount !== "" ? `${Number(amount).toFixed(2)}€` : "-";

const StatusBadge = ({ isActive, isVip }) => {
  if (!isActive) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        Inactif
      </Badge>
    );
  }
  if (isVip) {
    return (
      <Badge variant="outline" className="bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200 shadow-sm">
        <Star className="h-3 w-3 mr-1" />
        VIP
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      Actif
    </Badge>
  );
};

const CountryBadge = ({ country }) => {
  const conf = {
    France: { label: "France", color: "bg-blue-50 text-blue-700 border-blue-200" },
    "Burkina Faso": { label: "Burkina Faso", color: "bg-red-50 text-red-700 border-red-200" },
    "Côte d'Ivoire": { label: "Côte d'Ivoire", color: "bg-orange-50 text-orange-700 border-orange-200" },
  }[country] || { label: country || "Non défini", color: "bg-gray-50 text-gray-700 border-gray-200" };

  return <Badge variant="outline" className={conf.color}>{conf.label}</Badge>;
};

const StatsCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function ClientsTable({ initialClients, initialStats }) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  
  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showStats, setShowStats] = useState(true);

  // Calcul des statistiques
  const stats = useMemo(() => {
    const activeCount = clients.filter((client) => client.isActive).length;
    const vipCount = clients.filter((client) => client.isVip).length;
    const withOrdersCount = clients.filter((client) => (client.packagesCount || 0) > 0).length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newThisMonth = clients.filter(
      (client) => new Date(client.createdAt) >= thirtyDaysAgo
    ).length;

    return {
      total: clients.length,
      active: activeCount,
      newThisMonth,
      withOrders: withOrdersCount,
      vip: vipCount,
    };
  }, [clients]);

  // Filtrage et tri des clients
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter((client) => {
      const matchesSearch = 
        !searchTerm ||
        `${client.firstName} ${client.lastName} ${client.clientCode} ${client.phone} ${client.email || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && client.isActive) ||
        (statusFilter === "inactive" && !client.isActive) ||
        (statusFilter === "vip" && client.isVip);

      const matchesCountry = 
        countryFilter === "all" || client.country === countryFilter;

      return matchesSearch && matchesStatus && matchesCountry;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "name") {
        aValue = `${a.firstName} ${a.lastName}`;
        bValue = `${b.firstName} ${b.lastName}`;
      }

      if (sortBy === "createdAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue instanceof Date) {
        return sortOrder === "asc" 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      return sortOrder === "asc" 
        ? (aValue || 0) - (bValue || 0)
        : (bValue || 0) - (aValue || 0);
    });

    return filtered;
  }, [clients, searchTerm, statusFilter, countryFilter, sortBy, sortOrder]);

  const handleAdd = () => {
    setEditingClient(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleView = (client) => {
    router.push(`/admin/clients/${client.id}`);
  };

  const handleDelete = async (client) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });

      if (response.ok) {
        setClients((prev) => prev.filter((c) => c.id !== client.id));
        toast.success("Client supprimé avec succès");
      } else {
        const error = await response.json();
        toast.error(error.message || "Erreur lors de la suppression");
      }
    } catch (err) {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    try {
      setLoading(true);
      let response;

      if (editingClient) {
        response = await fetch(`/api/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const data = await response.json();
          setClients((prev) =>
            prev.map((client) =>
              client.id === editingClient.id ? { ...client, ...data.client, ...form } : client
            )
          );
          toast.success("Client modifié avec succès");
          setIsDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.message || "Erreur lors de la modification");
        }
      } else {
        response = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
          setClients((prev) => [...prev, created]);
          toast.success("Client créé avec succès");
          setIsDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.message || "Erreur lors de la création");
        }
      }
    } catch (err) {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = (client) => {
    router.push(`/admin/packages/new?clientId=${client.id}`);
  };

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
          "Date création",
        ].join(","),
        ...filteredAndSortedClients.map((client) => {
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
      toast.error("Erreur lors de l'export");
    }
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            {/* <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
            <p className="text-gray-600 mt-1">
              Gérez votre base de clients et leurs destinataires
            </p> */}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowStats(!showStats)}>
              {showStats ? "Masquer Stats" : "Voir Stats"}
            </Button>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Client
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatsCard
              icon={Users}
              title="Total Clients"
              value={stats.total}
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              icon={UserCheck}
              title="Actifs"
              value={stats.active}
              subtitle={`${Math.round((stats.active / stats.total) * 100)}% du total`}
              color="from-green-500 to-green-600"
            />
            <StatsCard
              icon={UserPlus}
              title="Nouveaux (30j)"
              value={stats.newThisMonth}
              color="from-purple-500 to-purple-600"
            />
            <StatsCard
              icon={Package}
              title="Avec Commandes"
              value={stats.withOrders}
              color="from-orange-500 to-orange-600"
            />
            <StatsCard
              icon={Star}
              title="Clients VIP"
              value={stats.vip}
              color="from-yellow-500 to-yellow-600"
            />
          </div>
        )}

        {/* Filtres et recherche */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres et recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                  <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date de création</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="totalSpent">Total dépensé</SelectItem>
                  <SelectItem value="packagesCount">Nb colis</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des clients */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Clients ({filteredAndSortedClients.length})</span>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAndSortedClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? "Aucun client ne correspond à votre recherche" : "Commencez par ajouter votre premier client"}
                </p>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un client
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedClients.map((client) => (
                  <div
                    key={client.id}
                    className="group p-6 border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer"
                    onClick={() => handleView(client)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {client.firstName?.[0]}{client.lastName?.[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {client.firstName} {client.lastName}
                            </h3>
                            <StatusBadge isActive={client.isActive} isVip={client.isVip} />
                            <CountryBadge country={client.country} />
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              <span>{client.clientCode}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span>{client.phone}</span>
                            </div>
                            {client.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                <span>{client.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{client.city}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatePackage(client);
                          }}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Nouveau colis
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(client);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Éditer
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le client <strong>{client.firstName} {client.lastName}</strong> ? 
                                Cette action supprimera également tous ses colis associés et est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(client)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer définitivement
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Informations supplémentaires */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Destinataire</p>
                        <p className="font-medium">{client.recipientName}</p>
                        <p className="text-gray-500">{client.recipientCity}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Colis envoyés</p>
                        <p className="font-medium">{client.packagesCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total dépensé</p>
                        <p className="font-medium">{formatCurrency(client.totalSpent)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Client depuis</p>
                        <p className="font-medium">{formatDate(client.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog d'ajout/édition */}
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