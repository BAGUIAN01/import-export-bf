"use client";
import React, { useState, useEffect } from "react";
import { 
  Search,
  Plus,
  Package,
  User,
  MapPin,
  Euro,
  Scale,
  Camera,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  Building,
  Calendar,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const PACKAGE_TYPES = [
  { value: 'CARTON', label: 'Carton' },
  { value: 'BARRIQUE', label: 'Barrique' },
  { value: 'VEHICLE', label: 'Véhicule' },
  { value: 'MOTORCYCLE', label: 'Moto' },
  { value: 'ELECTRONICS', label: 'Électronique' },
  { value: 'CLOTHING', label: 'Vêtements' },
  { value: 'FOOD', label: 'Nourriture' },
  { value: 'DOCUMENTS', label: 'Documents' },
  { value: 'OTHER', label: 'Autre' }
];

const PRIORITY_LEVELS = [
  { value: 'LOW', label: 'Basse', color: 'bg-gray-100 text-gray-800' },
  { value: 'NORMAL', label: 'Normale', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'Haute', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Urgente', color: 'bg-red-100 text-red-800' }
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'CARD', label: 'Carte bancaire' },
  { value: 'TRANSFER', label: 'Virement' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CHEQUE', label: 'Chèque' }
];

export default function PackageRegistrationForm({ containers = [], currentUser }) {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  const [packageData, setPackageData] = useState({
    // Client
    clientId: '',
    
    // Détails du colis
    type: 'CARTON',
    description: '',
    quantity: 1,
    weight: '',
    dimensions: '',
    value: '',
    priority: 'NORMAL',
    isFragile: false,
    isInsured: false,
    
    // Conteneur
    containerId: '',
    
    // Adresses
    pickupAddress: '',
    pickupDate: '',
    pickupTime: '',
    deliveryAddress: '',
    deliveryTime: '',
    
    // Tarification
    basePrice: '',
    pickupFee: 20,
    insuranceFee: 0,
    customsFee: 0,
    otherFees: 0,
    discount: 0,
    totalAmount: 0,
    
    // Paiement
    paymentMethod: '',
    
    // Métadonnées
    specialInstructions: '',
    notes: ''
  });

  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    company: '',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    recipientAddress: '',
    recipientCity: '',
    recipientRelation: ''
  });

  // Recherche de clients
  const searchClients = async (term) => {
    if (term.length < 2) return;
    try {
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Erreur recherche clients:', error);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        searchClients(searchTerm);
      }
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Calcul automatique du prix total
  useEffect(() => {
    const base = parseFloat(packageData.basePrice) || 0;
    const pickup = parseFloat(packageData.pickupFee) || 0;
    const insurance = parseFloat(packageData.insuranceFee) || 0;
    const customs = parseFloat(packageData.customsFee) || 0;
    const other = parseFloat(packageData.otherFees) || 0;
    const discount = parseFloat(packageData.discount) || 0;
    
    const total = base + pickup + insurance + customs + other - discount;
    setPackageData(prev => ({ ...prev, totalAmount: Math.max(0, total) }));
  }, [packageData.basePrice, packageData.pickupFee, packageData.insuranceFee, 
      packageData.customsFee, packageData.otherFees, packageData.discount]);

  // Calcul automatique des frais d'assurance
  useEffect(() => {
    if (packageData.isInsured && packageData.value) {
      const insuranceFee = (parseFloat(packageData.value) * 0.02); // 2% de la valeur
      setPackageData(prev => ({ ...prev, insuranceFee: insuranceFee.toFixed(2) }));
    } else if (!packageData.isInsured) {
      setPackageData(prev => ({ ...prev, insuranceFee: 0 }));
    }
  }, [packageData.isInsured, packageData.value]);

  const handleInputChange = (field, value) => {
    setPackageData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientChange = (field, value) => {
    setNewClient(prev => ({ ...prev, [field]: value }));
  };

  const selectClient = (client) => {
    setSelectedClient(client);
    setPackageData(prev => ({ ...prev, clientId: client.id }));
    setSearchTerm(`${client.firstName} ${client.lastName} - ${client.phone}`);
    setClients([]);
  };

  const createNewClient = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });

      if (response.ok) {
        const data = await response.json();
        selectClient(data.client);
        setShowNewClientForm(false);
        setNewClient({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          company: '',
          recipientName: '',
          recipientPhone: '',
          recipientEmail: '',
          recipientAddress: '',
          recipientCity: '',
          recipientRelation: ''
        });
        toast.success('Client créé avec succès');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la création du client');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const submitPackage = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...packageData,
          userId: currentUser.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Colis enregistré avec succès');
        // Redirection ou reset du formulaire
        window.location.href = '/admin/packages';
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceedStep1 = selectedClient;
  const canProceedStep2 = packageData.type && packageData.description && packageData.basePrice;
  const canProceedStep3 = packageData.deliveryAddress;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Stepper */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNumber ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-20 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Client</span>
            <span>Colis</span>
            <span>Livraison</span>
            <span>Paiement</span>
          </div>
        </CardContent>
      </Card>

      {/* Étape 1: Sélection du client */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Sélectionner le client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Rechercher un client existant</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nom, téléphone ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {clients.length > 0 && (
                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => selectClient(client)}
                      className="p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="font-medium">{client.firstName} {client.lastName}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </span>
                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Client sélectionné</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</p>
                  <p className="text-gray-600">{selectedClient.phone}</p>
                  <p className="text-gray-600">{selectedClient.address}, {selectedClient.city}</p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Ou créer un nouveau client</span>
                <Button
                  variant="outline"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau client
                </Button>
              </div>

              {showNewClientForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>Prénom *</Label>
                    <Input
                      value={newClient.firstName}
                      onChange={(e) => handleClientChange('firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Nom *</Label>
                    <Input
                      value={newClient.lastName}
                      onChange={(e) => handleClientChange('lastName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Téléphone *</Label>
                    <Input
                      value={newClient.phone}
                      onChange={(e) => handleClientChange('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => handleClientChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Adresse *</Label>
                    <Input
                      value={newClient.address}
                      onChange={(e) => handleClientChange('address', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Ville *</Label>
                    <Input
                      value={newClient.city}
                      onChange={(e) => handleClientChange('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Entreprise</Label>
                    <Input
                      value={newClient.company}
                      onChange={(e) => handleClientChange('company', e.target.value)}
                    />
                  </div>
                  
                  <Separator className="col-span-2" />
                  
                  <div className="col-span-2">
                    <h4 className="font-medium mb-3">Destinataire au Burkina Faso</h4>
                  </div>
                  
                  <div>
                    <Label>Nom du destinataire *</Label>
                    <Input
                      value={newClient.recipientName}
                      onChange={(e) => handleClientChange('recipientName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Téléphone destinataire *</Label>
                    <Input
                      value={newClient.recipientPhone}
                      onChange={(e) => handleClientChange('recipientPhone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Email destinataire</Label>
                    <Input
                      type="email"
                      value={newClient.recipientEmail}
                      onChange={(e) => handleClientChange('recipientEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Adresse de livraison *</Label>
                    <Input
                      value={newClient.recipientAddress}
                      onChange={(e) => handleClientChange('recipientAddress', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Ville de livraison *</Label>
                    <Input
                      value={newClient.recipientCity}
                      onChange={(e) => handleClientChange('recipientCity', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Relation avec destinataire</Label>
                    <Input
                      placeholder="Ex: Famille, Ami, Collègue..."
                      value={newClient.recipientRelation}
                      onChange={(e) => handleClientChange('recipientRelation', e.target.value)}
                    />
                  </div>
                  
                  <div className="col-span-2 flex gap-2">
                    <Button onClick={createNewClient} disabled={isLoading}>
                      Créer le client
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowNewClientForm(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Détails du colis */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Détails du colis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Type de colis *</Label>
                <Select value={packageData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Quantité</Label>
                <Input
                  type="number"
                  min="1"
                  value={packageData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Poids (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={packageData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Dimensions (LxlxH cm)</Label>
                <Input
                  placeholder="Ex: 50x30x20"
                  value={packageData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Valeur déclarée (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={packageData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Priorité</Label>
                <Select value={packageData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description du contenu *</Label>
              <Textarea
                placeholder="Décrivez le contenu du colis..."
                value={packageData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={packageData.isFragile}
                  onCheckedChange={(checked) => handleInputChange('isFragile', checked)}
                />
                <Label>Fragile</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={packageData.isInsured}
                  onCheckedChange={(checked) => handleInputChange('isInsured', checked)}
                />
                <Label>Assurance</Label>
              </div>
            </div>

            <div>
              <Label>Conteneur de destination</Label>
              <Select value={packageData.containerId} onValueChange={(value) => handleInputChange('containerId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un conteneur (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {containers.map(container => (
                    <SelectItem key={container.id} value={container.id}>
                      {container.containerNumber} - {container.name}
                      <span className="text-xs text-gray-500 ml-2">
                        ({container.currentLoad}/{container.capacity})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Instructions spéciales</Label>
              <Textarea
                placeholder="Instructions particulières pour la manutention ou la livraison..."
                value={packageData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3: Adresses et livraison */}
      {step === 3 && selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresses et livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Ramassage (optionnel)</h4>
                <div>
                  <Label>Adresse de ramassage</Label>
                  <Textarea
                    placeholder="Adresse complète..."
                    value={packageData.pickupAddress}
                    onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Date de ramassage</Label>
                    <Input
                      type="date"
                      value={packageData.pickupDate}
                      onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Créneau horaire</Label>
                    <Input
                      placeholder="Ex: 14h-16h"
                      value={packageData.pickupTime}
                      onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Livraison</h4>
                <div>
                  <Label>Adresse de livraison *</Label>
                  <Textarea
                    placeholder={selectedClient.recipientAddress || "Adresse complète au Burkina Faso..."}
                    value={packageData.deliveryAddress || selectedClient.recipientAddress}
                    onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Destinataire</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{selectedClient.recipientName}</p>
                    <p className="text-sm text-gray-600">{selectedClient.recipientPhone}</p>
                    {selectedClient.recipientEmail && (
                      <p className="text-sm text-gray-600">{selectedClient.recipientEmail}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Créneau de livraison souhaité</Label>
                  <Input
                    placeholder="Ex: Matin, Après-midi, Soir"
                    value={packageData.deliveryTime}
                    onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 4: Tarification et paiement */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Tarification et paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Détail des coûts</h4>
                
                <div>
                  <Label>Prix de base *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={packageData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Frais de ramassage</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={packageData.pickupFee}
                    onChange={(e) => handleInputChange('pickupFee', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Frais d'assurance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={packageData.insuranceFee}
                    onChange={(e) => handleInputChange('insuranceFee', e.target.value)}
                    disabled={packageData.isInsured}
                  />
                  {packageData.isInsured && (
                    <p className="text-xs text-gray-500 mt-1">
                      Calculé automatiquement (2% de la valeur déclarée)
                    </p>
                  )}
                </div>
                
                <div>
                  <Label>Frais de douane</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={packageData.customsFee}
                    onChange={(e) => handleInputChange('customsFee', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Autres frais</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={packageData.otherFees}
                    onChange={(e) => handleInputChange('otherFees', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Remise</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={packageData.discount}
                    onChange={(e) => handleInputChange('discount', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Récapitulatif</h4>
                
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Prix de base:</span>
                    <span>{(parseFloat(packageData.basePrice) || 0).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Frais de ramassage:</span>
                    <span>{(parseFloat(packageData.pickupFee) || 0).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Frais d'assurance:</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Frais de douane:</span>
                    <span>{(parseFloat(packageData.customsFee) || 0).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Autres frais:</span>
                    <span>{(parseFloat(packageData.otherFees) || 0).toFixed(2)}€</span>
                  </div>
                  {packageData.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Remise:</span>
                      <span>-{(parseFloat(packageData.discount) || 0).toFixed(2)}€</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{(packageData.totalAmount || 0).toFixed(2)}€</span>
                  </div>
                </div>

                <div>
                  <Label>Méthode de paiement</Label>
                  <Select value={packageData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une méthode" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes internes</Label>
                  <Textarea
                    placeholder="Notes pour l'équipe..."
                    value={packageData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Récapitulatif final */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-3">Récapitulatif de l'enregistrement</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Client:</span> {selectedClient?.firstName} {selectedClient?.lastName}</p>
                  <p><span className="font-medium">Téléphone:</span> {selectedClient?.phone}</p>
                  <p><span className="font-medium">Type de colis:</span> {PACKAGE_TYPES.find(t => t.value === packageData.type)?.label}</p>
                  <p><span className="font-medium">Description:</span> {packageData.description}</p>
                </div>
                <div>
                  <p><span className="font-medium">Destinataire:</span> {selectedClient?.recipientName}</p>
                  <p><span className="font-medium">Téléphone destinataire:</span> {selectedClient?.recipientPhone}</p>
                  <p><span className="font-medium">Priorité:</span> {PRIORITY_LEVELS.find(p => p.value === packageData.priority)?.label}</p>
                  <p><span className="font-medium">Montant total:</span> {(packageData.totalAmount || 0).toFixed(2)}€</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boutons de navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
        >
          Précédent
        </Button>

        <div className="flex gap-2">
          {step < 4 ? (
            <Button
              onClick={nextStep}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={submitPackage}
              disabled={isLoading || !packageData.paymentMethod}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Enregistrement...' : 'Enregistrer le colis'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}