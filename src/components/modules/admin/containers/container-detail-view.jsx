"use client";
// Container detail view component
import { useState, useCallback, useEffect } from "react";
import { 
  Package, 
  MapPin, 
  Clock, 
  Truck, 
  User, 
  Calendar,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Save,
  Plus,
  CheckCircle2,
  Activity,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Euro,
  Weight,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { useContainerDetails, useContainerMutations } from "@/hooks/use-containers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const statusOptions = [
  { value: 'PREPARATION', label: 'En préparation', variant: 'secondary' },
  { value: 'LOADED', label: 'Chargé', variant: 'default' },
  { value: 'IN_TRANSIT', label: 'En transit', variant: 'default' },
  { value: 'CUSTOMS', label: 'En douane', variant: 'destructive' },
  { value: 'DELIVERED', label: 'Livré', variant: 'default', className: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Annulé', variant: 'destructive' }
];

const getStatusInfo = (status) => {
  return statusOptions.find(opt => opt.value === status) || 
    { value: status, label: status, variant: 'secondary' };
};

export function ContainerDetailView({ container: initialContainer, currentUser }) {
  // Hook SWR pour le cache et le rafraîchissement
  const { 
    container: serverContainer, 
    packages: serverPackages,
    stats: serverStats,
    isLoading, 
    refresh 
  } = useContainerDetails(initialContainer?.id);
  
  // Hook pour les mutations
  const { 
    updateContainer,
    isLoading: isMutating 
  } = useContainerMutations();
  
  // Utiliser les données du serveur ou fallback sur les données initiales
  const container = serverContainer || initialContainer;
  const packages = serverPackages || initialContainer?.packages || [];
  const stats = serverStats || null;
  
  // Calculer le nombre réel de colis
  const actualPackagesCount = packages.length;
  
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [trackingUpdates, setTrackingUpdates] = useState(container?.trackingUpdates || []);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    location: '',
    description: '',
    status: container?.status || 'PREPARATION',
    isPublic: true,
    notifyClients: false
  });

  // Synchroniser les tracking updates avec les données du serveur
  useEffect(() => {
    if (container?.trackingUpdates) {
      setTrackingUpdates(container.trackingUpdates);
    }
  }, [container?.trackingUpdates]);

  const handleInputChange = (field, value) => {
    setUpdateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditUpdate = (update) => {
    setEditingUpdate(update.id);
    setUpdateForm({
      location: update.location,
      description: update.description,
      status: container?.status || 'PREPARATION',
      isPublic: update.isPublic,
      notifyClients: false
    });
    setShowUpdateForm(true);
  };

  const handleCancelEdit = () => {
    setEditingUpdate(null);
    setUpdateForm({
      location: '',
      description: '',
      status: container?.status || 'PREPARATION',
      isPublic: true,
      notifyClients: false
    });
    setShowUpdateForm(false);
  };

  const handleDeleteUpdate = async (updateId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette mise à jour ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tracking/update/${updateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setTrackingUpdates(prev => prev.filter(u => u.id !== updateId));
      toast.success('Mise à jour supprimée');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSubmitUpdate = useCallback(async () => {
    if (!updateForm.location || !updateForm.description) {
      toast.error('Localisation et description obligatoires');
      return;
    }

    if (!container?.id) {
      toast.error('Conteneur introuvable');
      return;
    }

    try {
      // Modification d'une mise à jour existante
      if (editingUpdate) {
        const response = await fetch(`/api/tracking/update/${editingUpdate}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location: updateForm.location,
            description: updateForm.description,
            isPublic: updateForm.isPublic,
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la modification');
        }

        const updatedTracking = await response.json();

        setTrackingUpdates(prev => 
          prev.map(u => u.id === editingUpdate ? updatedTracking.trackingUpdate : u)
        );

        toast.success('Mise à jour modifiée');
      } 
      // Création d'une nouvelle mise à jour
      else {
        const trackingResponse = await fetch(`/api/containers/${container.id}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location: updateForm.location,
            description: updateForm.description,
            isPublic: updateForm.isPublic,
            notifyClients: updateForm.notifyClients,
          }),
        });

        if (!trackingResponse.ok) {
          const error = await trackingResponse.json();
          throw new Error(error.message || 'Erreur lors de la mise à jour');
        }

        const trackingData = await trackingResponse.json();

        // Mise à jour du statut du conteneur si changé
        if (updateForm.status !== container.status) {
          const result = await updateContainer(container.id, {
            status: updateForm.status,
            currentLocation: updateForm.location,
          });

          if (!result.success) {
            throw new Error('Erreur lors de la mise à jour du statut');
          }
        }

        setTrackingUpdates(prev => [trackingData.trackingUpdate, ...prev]);
        
        // Message de confirmation avec information sur les notifications
        if (updateForm.notifyClients && trackingData.notificationResult) {
          const { success, errors, invalidPhones, total } = trackingData.notificationResult;
          
          if (success === total) {
            toast.success(`Mise à jour enregistrée - ${success} SMS envoyés avec succès`);
          } else if (success > 0) {
            toast.warning(`Mise à jour enregistrée - ${success}/${total} SMS envoyés (${errors} erreurs, ${invalidPhones} numéros invalides)`);
          } else {
            toast.error(`Mise à jour enregistrée - Aucun SMS envoyé (${errors} erreurs, ${invalidPhones} numéros invalides)`);
          }
        } else if (updateForm.notifyClients) {
          toast.success('Mise à jour enregistrée et clients notifiés');
        } else {
          toast.success('Mise à jour enregistrée');
        }
        
        // Rafraîchir les données du conteneur
        await refresh();
      }

      handleCancelEdit();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur de connexion');
    }
  }, [updateForm, editingUpdate, container?.id, updateContainer, refresh]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!container) {
    return (
      <div className="flex items-center justify-center py-12">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const statusInfo = getStatusInfo(container.status);
  const loadPercentage = container.capacity 
    ? Math.min((actualPackagesCount / container.capacity) * 100, 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge 
            variant={statusInfo.variant}
            className={statusInfo.className}
          >
            {statusInfo.label}
          </Badge>
          {container.name && (
            <span className="text-sm text-muted-foreground">{container.name}</span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.promise(
                refresh(),
                {
                  loading: "Actualisation en cours...",
                  success: "Données actualisées",
                  error: "Erreur lors de l'actualisation",
                }
              );
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button
            onClick={() => {
              if (showUpdateForm && !editingUpdate) {
                handleCancelEdit();
              } else {
                setShowUpdateForm(!showUpdateForm);
              }
            }}
            variant={showUpdateForm ? "outline" : "default"}
            className="gap-2"
          >
            {showUpdateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showUpdateForm ? 'Annuler' : 'Nouvelle mise à jour'}
          </Button>
        </div>
      </div>
        {/* Cartes d'informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Charge</p>
                    <p className="text-2xl font-bold">{actualPackagesCount}/{container.capacity}</p>
                  </div>
                  <Progress value={loadPercentage} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">{loadPercentage.toFixed(1)}% de capacité</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Localisation</p>
                  <p className="font-medium">{container.currentLocation || container.origin}</p>
                  {container.transportCompany && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      {container.transportCompany}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Planning</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Départ:</span>
                      <span className="font-medium">
                        {container.departureDate ? 
                          new Date(container.departureDate).toLocaleDateString('fr-FR') : 
                          'À définir'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Arrivée:</span>
                      <span className="font-medium">
                        {container.arrivalDate ? 
                          new Date(container.arrivalDate).toLocaleDateString('fr-FR') : 
                          'À définir'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats supplémentaires */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <Euro className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Valeur totale</p>
                    <p className="text-2xl font-bold">{stats.totalAmount?.toFixed(2) || 0}€</p>
                    {stats.avgPackageValue > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Moy: {stats.avgPackageValue.toFixed(2)}€/colis
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <Weight className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Poids total</p>
                    <p className="text-2xl font-bold">{stats.totalWeight?.toFixed(1) || 0} kg</p>
                    {actualPackagesCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Moy: {(stats.totalWeight / actualPackagesCount).toFixed(1)}kg/colis
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Clients</p>
                    <p className="text-2xl font-bold">{stats.clientsCount || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {actualPackagesCount} colis au total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-cyan-50 rounded-lg">
                    <Activity className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Dernière MAJ</p>
                    <p className="text-sm font-bold">
                      {stats.lastUpdate ? formatDate(stats.lastUpdate) : 'Aucune'}
                    </p>
                    {stats.statusBreakdown && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {Object.keys(stats.statusBreakdown).length} statuts
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Formulaire de mise à jour */}
        {showUpdateForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingUpdate ? <Edit2 className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                {editingUpdate ? 'Modifier la mise à jour' : 'Nouvelle mise à jour'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Localisation *</Label>
                  <Input
                    id="location"
                    value={updateForm.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Port d'Abidjan, Côte d'Ivoire"
                  />
                </div>
                
                {!editingUpdate && (
                  <div className="space-y-2">
                    <Label>Nouveau statut</Label>
                    <Select
                      value={updateForm.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={updateForm.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Décrivez l'étape actuelle du transport..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPublic"
                      checked={updateForm.isPublic}
                      onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                    />
                    <Label htmlFor="isPublic" className="flex items-center gap-2 text-sm">
                      Visible par les clients
                      {updateForm.isPublic ? (
                        <Eye className="h-3 w-3 text-green-500" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Label>
                  </div>
                  
                  {!editingUpdate && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notifyClients"
                          checked={updateForm.notifyClients}
                          onCheckedChange={(checked) => handleInputChange('notifyClients', checked)}
                        />
                        <Label htmlFor="notifyClients" className="flex items-center gap-2 text-sm">
                          Notifier tous les clients
                          {updateForm.notifyClients ? (
                            <Bell className="h-3 w-3 text-blue-500" />
                          ) : (
                            <BellOff className="h-3 w-3 text-muted-foreground" />
                          )}
                        </Label>
                      </div>
                      {updateForm.notifyClients && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
                          📱 Les clients recevront un SMS avec la position et un lien de tracking
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isMutating}
                  >
                    Annuler
                  </Button>
                  <Button
                  onClick={handleSubmitUpdate}
                  disabled={isMutating || !updateForm.location || !updateForm.description}
                  >
                    {isMutating && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>}
                    <Save className="h-4 w-4 mr-2" />
                    {isMutating ? 'Enregistrement...' : editingUpdate ? 'Modifier' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historique de suivi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historique de suivi
              <Badge variant="secondary" className="ml-2">
                {trackingUpdates.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trackingUpdates.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Aucune mise à jour de suivi</p>
              </div>
            ) : (
              <div className="space-y-6">
                {trackingUpdates.map((update, index) => (
                  <div key={update.id} className="relative">
                    {index < trackingUpdates.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-16 bg-border"></div>
                    )}
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 pb-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{update.location}</h4>
                              {update.isPublic ? (
                                <Eye className="h-3 w-3 text-green-500" />
                              ) : (
                                <EyeOff className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{update.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatDate(update.timestamp)}</span>
                              {update.user && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{update.user.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUpdate(update)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUpdate(update.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des colis du conteneur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Colis dans le conteneur
              <Badge variant="secondary" className="ml-2">
                {actualPackagesCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, idx) => (
                  <Skeleton key={idx} className="h-20 w-full" />
                ))}
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Aucun colis dans ce conteneur</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">N° Colis</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Montant</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Poids</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packages.map((pkg) => {
                        const types = Array.isArray(pkg.types) ? pkg.types : (typeof pkg.types === 'string' ? JSON.parse(pkg.types || '[]') : []);
                        const typeLabel = types.length > 0 ? types.map(t => `${t.type} (${t.quantity})`).join(', ') : pkg.description;
                        
                        return (
                          <tr key={pkg.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">{pkg.packageNumber}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {pkg.client ? (
                                <div>
                                  <div className="font-medium">
                                    {pkg.client.firstName} {pkg.client.lastName}
                                  </div>
                                  {pkg.client.clientCode && (
                                    <div className="text-xs text-muted-foreground">
                                      {pkg.client.clientCode}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="max-w-xs truncate" title={pkg.description}>
                                {typeLabel}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge 
                                variant="outline"
                                className={
                                  pkg.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-200' :
                                  pkg.status === 'IN_TRANSIT' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  pkg.status === 'CUSTOMS' ? 'bg-red-50 text-red-700 border-red-200' :
                                  pkg.status === 'REGISTERED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-gray-50 text-gray-700 border-gray-200'
                                }
                              >
                                {pkg.status === 'REGISTERED' ? 'Enregistré' :
                                 pkg.status === 'COLLECTED' ? 'Collecté' :
                                 pkg.status === 'IN_CONTAINER' ? 'En conteneur' :
                                 pkg.status === 'IN_TRANSIT' ? 'En transit' :
                                 pkg.status === 'CUSTOMS' ? 'Douanes' :
                                 pkg.status === 'DELIVERED' ? 'Livré' :
                                 pkg.status === 'RETURNED' ? 'Retourné' :
                                 pkg.status === 'CANCELLED' ? 'Annulé' :
                                 pkg.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-medium">
                                {pkg.totalAmount ? `${Number(pkg.totalAmount).toFixed(2)}€` : '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-muted-foreground">
                                {pkg.weight ? `${Number(pkg.weight).toFixed(1)} kg` : '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}