"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Search, Plus, X, CheckCircle2, User, Package, UserCircle } from "lucide-react";

import { useCaisse } from "@/contexts/caisse-context";
import { CustomDataTable } from "@/components/modules/data-table/data-table";
import { DataTableColumnHeader } from "@/components/modules/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/modules/data-table/data-table-row-actions";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelTextarea } from "@/components/ui/floating-label-textarea";
import { FloatingCombobox } from "@/components/ui/floating-combobox";
import PhoneInput from "@/components/modules/admin/clients/phone-input";

const columnHelper = createColumnHelper();

const burkinaCities = [
  "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", 
  "Pouytenga", "Dédougou", "Fada N'gourma", "Kaya", "Tenkodogo"
];

const frenchCities = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", 
  "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", 
  "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"
];

const getCitiesForCountry = (country) => {
  if (country === "France") return frenchCities;
  if (country === "Burkina Faso") return burkinaCities;
  return [];
};

/* ── Formulaire client (création + édition) ───────────────────── */
function ClientForm({ initial = {}, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    phone: initial.phone ?? "",
    email: initial.email ?? "",
    address: initial.address ?? "",
    city: initial.city ?? "",
    country: initial.country ?? "France",
    postalCode: initial.postalCode ?? "",
    recipientFirstName: initial.recipientFirstName ?? "",
    recipientLastName: initial.recipientLastName ?? "",
    recipientPhone: initial.recipientPhone ?? "",
    recipientEmail: initial.recipientEmail ?? "",
    recipientAddress: initial.recipientAddress ?? "",
    recipientCity: initial.recipientCity ?? "",
    recipientCountry: initial.recipientCountry ?? "Burkina Faso",
    recipientRelation: initial.recipientRelation ?? "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const newErrors = { ...e };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.firstName?.trim()) newErrors.firstName = "Le prénom est requis";
    if (!form.lastName?.trim()) newErrors.lastName = "Le nom est requis";
    if (!form.phone?.trim()) newErrors.phone = "Le téléphone est requis";
    if (!form.address?.trim()) newErrors.address = "L'adresse est requise";
    if (!form.city?.trim()) newErrors.city = "La ville est requise";
    if (!form.country?.trim()) newErrors.country = "Le pays est requis";
    // Tous les champs destinataire sont maintenant optionnels
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email invalide";
    }
    if (form.recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipientEmail)) {
      newErrors.recipientEmail = "Email invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Transformer les données pour correspondre à l'API
      const apiData = {
        ...form,
        recipientName: `${form.recipientFirstName} ${form.recipientLastName}`.trim(),
      };
      onSubmit(apiData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <Tabs defaultValue="expediteur" className="w-full">
        <TabsList className="inline-flex h-10 bg-zinc-100 rounded-md p-1 border border-zinc-200 w-fit">
          <TabsTrigger 
            value="expediteur"
            className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm data-[state=inactive]:text-zinc-600 hover:text-zinc-900 transition-all duration-200 font-medium rounded text-xs sm:text-sm flex items-center justify-center gap-1.5 px-3 sm:px-4"
          >
            <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Expéditeur</span>
          </TabsTrigger>
          <TabsTrigger 
            value="destinataire"
            className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm data-[state=inactive]:text-zinc-600 hover:text-zinc-900 transition-all duration-200 font-medium rounded text-xs sm:text-sm flex items-center justify-center gap-1.5 px-3 sm:px-4"
          >
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Destinataire</span>
          </TabsTrigger>
        </TabsList>

        {/* Onglet Expéditeur */}
        <TabsContent value="expediteur" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingLabelInput
              id="firstName"
              label="Prénom *"
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              error={errors.firstName}
              disabled={saving}
            />
            <FloatingLabelInput
              id="lastName"
              label="Nom *"
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              error={errors.lastName}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <PhoneInput
                id="phone"
                value={form.phone}
                onChange={(value) => handleChange("phone", value)}
                countryIso2={form.country === "France" ? "FR" : "BF"}
                error={errors.phone}
                disabled={saving}
              />
            </div>
            <FloatingLabelInput
              id="email"
              type="email"
              label="Email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingCombobox
              id="country"
              label="Pays *"
              value={form.country}
              onValueChange={(v) => {
                handleChange("country", v);
                handleChange("city", "");
              }}
              error={errors.country}
              disabled={saving}
              placeholder="Sélectionnez le pays"
              options={[
                { value: "France", label: "France" },
                { value: "Burkina Faso", label: "Burkina Faso" },
              ]}
            />
            <FloatingCombobox
              id="city"
              label="Ville *"
              value={form.city}
              onValueChange={(v) => handleChange("city", v)}
              error={errors.city}
              disabled={!form.country || saving}
              placeholder={form.country ? "Sélectionnez la ville" : "Sélectionnez d'abord le pays"}
              options={getCitiesForCountry(form.country).map((city) => ({
                value: city,
                label: city,
              }))}
            />
          </div>

          <FloatingLabelTextarea
            id="address"
            label="Adresse *"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            error={errors.address}
            rows={2}
            disabled={saving}
          />
        </TabsContent>

        {/* Onglet Destinataire */}
        <TabsContent value="destinataire" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingLabelInput
              id="recipientFirstName"
              label="Prénom"
              value={form.recipientFirstName}
              onChange={(e) => handleChange("recipientFirstName", e.target.value)}
              error={errors.recipientFirstName}
              disabled={saving}
            />
            <FloatingLabelInput
              id="recipientLastName"
              label="Nom"
              value={form.recipientLastName}
              onChange={(e) => handleChange("recipientLastName", e.target.value)}
              error={errors.recipientLastName}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <PhoneInput
                id="recipientPhone"
                value={form.recipientPhone}
                onChange={(value) => handleChange("recipientPhone", value)}
                countryIso2={form.recipientCountry === "France" ? "FR" : "BF"}
                error={errors.recipientPhone}
                disabled={saving}
              />
            </div>
            <FloatingLabelInput
              id="recipientEmail"
              type="email"
              label="Email"
              value={form.recipientEmail}
              onChange={(e) => handleChange("recipientEmail", e.target.value)}
              error={errors.recipientEmail}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingCombobox
              id="recipientCountry"
              label="Pays"
              value={form.recipientCountry}
              onValueChange={(v) => {
                handleChange("recipientCountry", v);
                handleChange("recipientCity", "");
              }}
              error={errors.recipientCountry}
              disabled={saving}
              placeholder="Sélectionnez le pays"
              options={[
                { value: "Burkina Faso", label: "Burkina Faso" },
                { value: "France", label: "France" },
              ]}
            />
            <FloatingCombobox
              id="recipientCity"
              label="Ville"
              value={form.recipientCity}
              onValueChange={(v) => handleChange("recipientCity", v)}
              error={errors.recipientCity}
              disabled={!form.recipientCountry || saving}
              placeholder={form.recipientCountry ? "Sélectionnez la ville" : "Sélectionnez d'abord le pays"}
              options={getCitiesForCountry(form.recipientCountry).map((city) => ({
                value: city,
                label: city,
              }))}
            />
          </div>

          <FloatingLabelTextarea
            id="recipientAddress"
            label="Adresse"
            value={form.recipientAddress}
            onChange={(e) => handleChange("recipientAddress", e.target.value)}
            error={errors.recipientAddress}
            rows={2}
            disabled={saving}
          />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button 
          type="submit" 
          disabled={saving} 
          className="bg-orange-500 hover:bg-orange-600 text-white flex-1 sm:flex-initial"
        >
          {saving ? "Enregistrement…" : initial.id ? "Mettre à jour" : "Créer"}
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel} 
          disabled={saving}
          className="flex-1 sm:flex-initial text-zinc-600 hover:text-zinc-900"
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

/* ── Carte client trouvé (onglet Recherche) ───────────────────── */
function ClientCard({ client, onSelect }) {
  return (
    <Card className="border-green-400 shadow-none cursor-pointer hover:border-green-500 transition-colors" onClick={onSelect}>
      <CardContent className="pt-4 sm:pt-5 pb-3 sm:pb-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-lam-orange/10 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-lam-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm sm:text-base text-zinc-900 truncate">{client.name}</p>
              <Badge variant="outline" className="border-green-400 text-green-600 shrink-0 text-[10px] sm:text-xs">Actif</Badge>
            </div>
            {client.email && <p className="text-xs sm:text-sm text-zinc-500 truncate mt-1">{client.email}</p>}
            {client.phone && <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">{client.phone}</p>}
            {client.createdAt && !isNaN(new Date(client.createdAt).getTime()) && (
              <p className="text-[10px] sm:text-xs text-zinc-400 mt-1.5 sm:mt-1">
                Client depuis le {format(new Date(client.createdAt), "dd MMMM yyyy", { locale: fr })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4 pt-3 border-t border-zinc-100 text-xs sm:text-sm text-zinc-400">
          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
          <span className="text-center">Cliquez pour sélectionner ce client</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Page principale ──────────────────────────────────────────── */
export default function ClientPage() {
  const router                = useRouter();
  const { setSelectedClient } = useCaisse();

  const [clients, setClients]       = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Onglet Recherche
  const [search, setSearch]             = useState("");
  const [searching, setSearching]       = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchDone, setSearchDone]     = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(false);

  // Dialogs
  const [editClient, setEditClient]         = useState(null);  // client en cours d'édition
  const [deleteClient, setDeleteClient]     = useState(null);  // client à supprimer
  const [saving, setSaving]                 = useState(false);
  const [deleting, setDeleting]             = useState(false);

  /* ── Fetch ── */
  const fetchClients = async () => {
    setLoadingList(true);
    try {
      const res  = await fetch("/api/clients");
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      // L'API retourne un objet avec { data, pagination, stats }
      const clientsRaw = Array.isArray(data) ? data : (data?.data || []);
      // Transformer les clients pour ajouter un champ "name" calculé
      const clients = clientsRaw.map(client => ({
        ...client,
        name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.company || 'Sans nom',
      }));
      setClients(clients);
      if (clients.length === 0) {
        console.log("Aucun client trouvé dans la base de données");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Impossible de charger les clients");
      setClients([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResult(null); setSearchDone(false); }
  }, [search]);

  /* ── Recherche ── */
  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true); setSearchDone(false);
    try {
      const searchQuery = search.trim();
      const res = await fetch(`/api/clients?search=${encodeURIComponent(searchQuery)}&limit=10`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${res.status}`);
      }
      const data = await res.json();
      // L'API retourne un objet avec { data, pagination, stats }
      const clientsRaw = Array.isArray(data) ? data : (data?.data || []);
      
      if (clientsRaw.length === 0) {
        setSearchResult(null);
        setSearchDone(true);
        return;
      }
      
      // Transformer le client pour ajouter un champ "name" calculé
      const result = {
        ...clientsRaw[0],
        name: `${clientsRaw[0].firstName || ''} ${clientsRaw[0].lastName || ''}`.trim() || clientsRaw[0].company || 'Sans nom',
      };
      setSearchResult(result);
      setSearchDone(true);
    } catch (error) {
      console.error("Error searching clients:", error);
      toast.error(error.message || "Erreur lors de la recherche");
      setSearchResult(null);
      setSearchDone(true);
    } finally {
      setSearching(false);
    }
  };

  /* ── Sélectionner ── */
  const selectClient = (client) => {
    setSelectedClient(client);
    toast.success(`Client sélectionné : ${client.name}`);
    router.push("/admin/caisse/commande");
  };

  /* ── Créer ── */
  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const res  = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Client créé avec succès");
      setShowInlineForm(false);
      fetchClients();
      const clientWithName = {
        ...data,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.company || 'Sans nom',
      };
      setSearch(data.phone || data.email || clientWithName.name || "");
      setSearchResult(clientWithName);
      setSearchDone(true);
    } catch (err) {
      toast.error(err.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  /* ── Modifier ── */
  const handleUpdate = async (form) => {
    if (!editClient) return;
    setSaving(true);
    try {
      const res  = await fetch(`/api/clients/${editClient.id}`, {
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

  /* ── Supprimer ── */
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

  /* ── Colonnes ── */
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
  ], [selectClient]);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-zinc-900">Sélection du client</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Recherchez un client existant ou créez-en un nouveau
        </p>
      </div>

      <Tabs defaultValue="recherche" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-auto p-1.5 bg-zinc-100 rounded-xl border border-zinc-200">
          <TabsTrigger 
            value="recherche" 
            className="text-xs sm:text-sm font-medium px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-lam-orange data-[state=active]:shadow-sm data-[state=inactive]:text-zinc-600 hover:text-zinc-900"
          >
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Recherche
          </TabsTrigger>
          <TabsTrigger 
            value="liste" 
            className="text-xs sm:text-sm font-medium px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-zinc-600 hover:text-zinc-900 relative"
          >
            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Liste des clients</span>
            <span className="sm:hidden">Liste</span>
            {clients.length > 0 && (
              <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs font-semibold bg-orange-500/10 text-orange-600 rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {clients.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Onglet Recherche ─────────────────────────── */}
        <TabsContent value="recherche" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6 transition-opacity duration-300">
          <Card className="shadow-none">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-sm sm:text-base">Trouver un client</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Recherchez par nom, email ou téléphone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1">
                  <FloatingLabelInput
                    id="search"
                    label="Nom, email ou téléphone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Button 
                    onClick={handleSearch} 
                    disabled={searching || !search.trim()} 
                    className="h-14 flex-1 sm:flex-initial sm:px-4 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                  >
                    <Search className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{searching ? "Recherche…" : "Rechercher"}</span>
                  </Button>
                  <Button
                    onClick={() => setShowInlineForm((v) => !v)}
                    className="h-14 bg-orange-500 hover:bg-orange-600 text-white flex-1 sm:flex-initial sm:px-4"
                  >
                    {showInlineForm
                      ? <><X className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Annuler</span></>
                      : <><Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Nouveau</span></>
                    }
                  </Button>
                </div>
              </div>

              {searchDone && !searchResult && (
                <p className="text-xs sm:text-sm text-zinc-500 text-center py-3">
                  Aucun client trouvé pour « {search} »
                </p>
              )}
              {searchResult && (
                <ClientCard client={searchResult} onSelect={() => selectClient(searchResult)} />
              )}
            </CardContent>
          </Card>

          {showInlineForm && (
            <Card className="shadow-none border-lam-orange/30">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-sm sm:text-base">Nouveau client</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <ClientForm
                  saving={saving}
                  onSubmit={handleCreate}
                  onCancel={() => setShowInlineForm(false)}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Onglet Liste ─────────────────────────────── */}
        <TabsContent value="liste" className="mt-4 sm:mt-6 transition-opacity duration-300">
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
        </TabsContent>
      </Tabs>

      {/* ── Dialog édition / création ─────────────────── */}
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

      {/* ── Dialog suppression ────────────────────────── */}
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
    </div>
  );
}
