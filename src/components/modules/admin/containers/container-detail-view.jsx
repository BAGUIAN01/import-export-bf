"use client";
import { useState } from "react";
import { 
  Package, 
  MapPin, 
  Clock, 
  Truck, 
  User, 
  Calendar,
  Eye,
  EyeOff,
  Save,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

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

export function ContainerDetailView({ container, currentUser }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [trackingUpdates, setTrackingUpdates] = useState(container.trackingUpdates || []);
  const [updateForm, setUpdateForm] = useState({
    location: '',
    description: '',
    status: container.status,
    isPublic: true
  });

  const handleInputChange = (field, value) => {
    setUpdateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitUpdate = async () => {
    if (!updateForm.location || !updateForm.description) {
      toast.error('Localisation et description obligatoires');
      return;
    }

    setIsUpdating(true);

    try {
      const trackingResponse = await fetch(`/api/containers/${container.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: updateForm.location,
          description: updateForm.description,
          isPublic: updateForm.isPublic,
        }),
      });

      if (!trackingResponse.ok) {
        const error = await trackingResponse.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }

      const trackingData = await trackingResponse.json();

      if (updateForm.status !== container.status) {
        const containerResponse = await fetch(`/api/containers/${container.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: updateForm.status,
            currentLocation: updateForm.location,
          }),
        });

        if (!containerResponse.ok) {
          const error = await containerResponse.json();
          throw new Error(error.message || 'Erreur lors de la mise à jour du statut');
        }

        container.status = updateForm.status;
        container.currentLocation = updateForm.location;
      }

      setTrackingUpdates(prev => [trackingData.trackingUpdate, ...prev]);

      setUpdateForm({
        location: '',
        description: '',
        status: container.status,
        isPublic: true
      });

      setShowUpdateForm(false);
      toast.success('Mise à jour enregistrée avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur de connexion');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusInfo = getStatusInfo(container.status);
  const loadPercentage = Math.min((container.currentLoad / container.capacity) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-semibold tracking-tight">{container.containerNumber}</h1>
                  <Badge 
                    variant={statusInfo.variant}
                    className={statusInfo.className}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{container.name}</p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              variant={showUpdateForm ? "outline" : "default"}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {showUpdateForm ? 'Annuler' : 'Nouvelle mise à jour'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
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
                    <p className="text-2xl font-bold">{container.currentLoad}/{container.capacity}</p>
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

        {/* Formulaire de mise à jour */}
        {showUpdateForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Nouvelle mise à jour
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

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowUpdateForm(false)}
                    disabled={isUpdating}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSubmitUpdate}
                    disabled={isUpdating || !updateForm.location || !updateForm.description}
                  >
                    {isUpdating && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>}
                    <Save className="h-4 w-4 mr-2" />
                    {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
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
                    {/* Ligne de connexion */}
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
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}