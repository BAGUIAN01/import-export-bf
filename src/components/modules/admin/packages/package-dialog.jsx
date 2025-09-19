// PackageDialog.jsx — version complète avec tarification + paiement, calendrier shadcn, et conservation du pickupFee

import React, { useState, useEffect } from "react";
import {
  X,
  Package as PackageIcon,
  User,
  MapPin,
  Euro,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  Truck,
  Shield,
  AlertTriangle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import { PACKAGE_TYPES, PRIORITIES, PAYMENT_METHODS } from "@/lib/data/packages";

// shadcn ui
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ---------------- Helpers ----------------
function normalizeDateInput(value) {
  if (!value) return "";
  if (typeof value === "string") {
    return value.includes("T") ? value.split("T")[0] : value;
  }
  if (typeof value === "object" && typeof value.toDate === "function") {
    try {
      return value.toDate().toISOString().split("T")[0];
    } catch {
      return "";
    }
  }
  if (value && typeof value === "object" && "seconds" in value) {
    try {
      const ms = value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
      return new Date(ms).toISOString().split("T")[0];
    } catch {
      return "";
    }
  }
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  } catch {}
  return "";
}

const getTotal = (f) =>
  Math.max(
    0,
    Number(f.basePrice || 0) +
      Number(f.pickupFee || 0) +
      Number(f.insuranceFee || 0) +
      Number(f.customsFee || 0) -
      Number(f.discount || 0)
  );

const derivePaymentStatus = (totalAmount, paidAmount) => {
  const total = Number(totalAmount || 0);
  const paid = Number(paidAmount || 0);
  if (paid <= 0) return "PENDING";
  if (paid < total) return "PARTIAL";
  return "PAID";
};

const PackageDialog = ({
  isOpen,
  onClose,
  package: editingPackage,
  clients = [],
  containers = [],
  onSave,
  loading = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchClient, setSearchClient] = useState("");
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    clientId: "",
    type: "CARTON",
    description: "",
    quantity: 1,
    weight: 1,
    value: "",
    priority: "NORMAL",
    isFragile: false,
    isInsured: false, // toggle à l'étape Tarification
    pickupAddress: "",
    pickupDate: "", // yyyy-MM-dd
    pickupTime: "",
    deliveryAddress: "",
    specialInstructions: "",
    basePrice: 50,
    pickupFee: 20,
    insuranceFee: 0,
    customsFee: 0,
    discount: 0,
    paymentMethod: "",
    // paiement
    paidAmount: 0,
    paidAt: "",
    paymentStatus: "PENDING",
    // total
    totalAmount: 50,
  });

  // ---------- Validation par étape ----------
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!form.clientId) newErrors.clientId = "Client requis";
      if (!form.type) newErrors.type = "Type de colis requis";
    }
    if (step === 2) {
      if (!form.description.trim()) newErrors.description = "Description requise";
      if (form.quantity < 1) newErrors.quantity = "Quantité invalide";
    }
    if (step === 3) {
      if (!form.deliveryAddress.trim()) newErrors.deliveryAddress = "Adresse de livraison requise";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Calcul auto prix + statut paiement ----------
  useEffect(() => {
    const typePrice = PACKAGE_TYPES.find((t) => t.value === form.type)?.price || 50;
    const insuranceFee = form.isInsured ? Math.max(10, (Number(form.value) || 0) * 0.02) : 0;

    const nextLike = { ...form, basePrice: typePrice, insuranceFee };
    const total = getTotal(nextLike);

    setForm((prev) => ({
      ...prev,
      basePrice: typePrice,
      insuranceFee,
      totalAmount: total,
      paymentStatus: derivePaymentStatus(total, Number(prev.paidAmount || 0)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type, form.pickupFee, form.customsFee, form.discount, form.isInsured, form.value]);

  // ---------- Initialisation (création/édition) ----------
  useEffect(() => {
    if (editingPackage) {
      setForm({
        clientId: editingPackage.clientId || "",
        type: editingPackage.type || "CARTON",
        description: editingPackage.description || "",
        quantity: editingPackage.quantity ?? 1,
        weight: Number(editingPackage.weight ?? 1),
        value: Number(editingPackage.value ?? 0),
        priority: editingPackage.priority || "NORMAL",
        isFragile: !!editingPackage.isFragile,
        isInsured: !!editingPackage.isInsured,
        pickupAddress: editingPackage.pickupAddress || "",
        pickupDate: normalizeDateInput(editingPackage.pickupDate),
        pickupTime: editingPackage.pickupTime || "",
        deliveryAddress: editingPackage.deliveryAddress || "",
        specialInstructions: editingPackage.specialInstructions || "",
        basePrice: Number(editingPackage.basePrice ?? 50),
        pickupFee: Number(editingPackage.pickupFee ?? 0),
        insuranceFee: Number(editingPackage.insuranceFee ?? 0),
        customsFee: Number(editingPackage.customsFee ?? 0),
        discount: Number(editingPackage.discount ?? 0),
        paymentMethod: editingPackage.paymentMethod || "",
        // paiement
        paidAmount: Number(editingPackage.paidAmount ?? 0),
        paidAt: normalizeDateInput(editingPackage.paidAt),
        paymentStatus: editingPackage.paymentStatus || "PENDING",
        // total
        totalAmount: Number(editingPackage.totalAmount ?? 0),
      });
      setCurrentStep(1);
    } else {
      setForm({
        clientId: "",
        type: "CARTON",
        description: "",
        quantity: 1,
        weight: 1,
        value: "",
        priority: "NORMAL",
        isFragile: false,
        isInsured: false,
        pickupAddress: "",
        pickupDate: "",
        pickupTime: "",
        deliveryAddress: "",
        specialInstructions: "",
        basePrice: 50,
        pickupFee: 20,
        insuranceFee: 0,
        customsFee: 0,
        discount: 0,
        paymentMethod: "",
        paidAmount: 0,
        paidAt: "",
        paymentStatus: "PENDING",
        totalAmount: 50,
      });
      setCurrentStep(1);
      setSearchClient("");
    }
    setErrors({});
  }, [editingPackage, isOpen]);

  const handleSubmit = () => {
    if (!validateStep(4)) return;
    const total = getTotal(form);

    const payload = {
      ...form,
      basePrice: Number(form.basePrice || 0),
      pickupFee: Number(form.pickupFee || 0),
      insuranceFee: Number(form.insuranceFee || 0),
      customsFee: Number(form.customsFee || 0),
      discount: Number(form.discount || 0),
      totalAmount: total,
      paidAmount: Number(form.paidAmount || 0),
      paymentStatus: derivePaymentStatus(total, Number(form.paidAmount || 0)),
      paidAt: form.paidAt || null,
    };

    onSave(payload);
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) setCurrentStep((p) => Math.min(p + 1, 4));
  };
  const handlePrevStep = () => setCurrentStep((p) => Math.max(p - 1, 1));

  const filteredClients = clients.filter((client) =>
    `${client.firstName} ${client.lastName} ${client.phone} ${client.email || ""}`
      .toLowerCase()
      .includes(searchClient.toLowerCase())
  );
  const selectedClient = clients.find((c) => c.id === form.clientId);

  const steps = [
    { number: 1, title: "Client & Type", icon: User, desc: "Sélection du client et type de colis" },
    { number: 2, title: "Détails", icon: PackageIcon, desc: "Informations détaillées du colis" },
    { number: 3, title: "Adresses", icon: MapPin, desc: "Ramassage et livraison" },
    { number: 4, title: "Tarification", icon: Euro, desc: "Prix, paiement et mode de paiement" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-orange-50 to-blue-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPackage ? "Modifier le colis" : "Nouveau colis"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{steps[currentStep - 1]?.desc}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-6 border-b bg-gray-50">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
                      ${isCompleted ? "bg-green-500 text-white"
                        : isActive ? "bg-orange-600 text-white shadow-lg scale-110"
                        : "bg-gray-200 text-gray-500"}`}
                    >
                      {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <div className={`text-sm font-medium ${isActive ? "text-orange-600" : "text-gray-600"}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 hidden md:block">Étape {step.number}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 transition-colors duration-200
                      ${currentStep > step.number ? "bg-green-500" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <ScrollArea className="flex-1 h-[50vh] md:h-[60vh]">
          <div className="px-6 py-8">
            {/* Étape 1: Client & Type */}
            {currentStep === 1 && (
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* Sélection client */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="mr-2 text-orange-600" size={20} />
                    Sélectionner un client
                  </h3>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, téléphone, email..."
                      value={searchClient}
                      onChange={(e) => setSearchClient(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                        errors.clientId ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                  </div>

                  {searchClient && filteredClients.length > 0 && (
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg mb-4">
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, clientId: client.id }));
                            setSearchClient("");
                            setErrors((prev) => ({ ...prev, clientId: undefined }));
                          }}
                          className="w-full px-4 py-4 text-left hover:bg-orange-50 border-b last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {client.firstName} {client.lastName}
                                {client.isVip && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    VIP
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{client.phone} • {client.city}</div>
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedClient && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-blue-900 text-lg">
                            {selectedClient.firstName} {selectedClient.lastName}
                            {selectedClient.isVip && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-blue-700 mt-1">
                            {selectedClient.phone} • {selectedClient.email}
                          </div>
                          <div className="text-blue-600 mt-1">{selectedClient.city}, {selectedClient.country}</div>
                          <div className="bg-blue-100 rounded-lg p-3 mt-3">
                            <div className="text-sm font-medium text-blue-900">Destinataire au Burkina Faso :</div>
                            <div className="text-blue-800">{selectedClient.recipientName} • {selectedClient.recipientPhone}</div>
                            <div className="text-blue-700 text-sm">{selectedClient.recipientCity}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setForm((prev) => ({ ...prev, clientId: "" })); setSearchClient(""); }}
                          className="text-orange-600 hover:text-orange-800 font-medium text-sm"
                        >
                          Changer
                        </button>
                      </div>
                    </div>
                  )}

                  {errors.clientId && (
                    <p className="text-red-600 text-sm mt-2 flex items-center">
                      <AlertTriangle size={16} className="mr-1" />
                      {errors.clientId}
                    </p>
                  )}
                </div>

                {/* Type de colis */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <PackageIcon className="mr-2 text-orange-600" size={20} />
                    Type de colis
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PACKAGE_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, type: type.value }));
                            setErrors((prev) => ({ ...prev, type: undefined }));
                          }}
                          className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                            form.type === type.value ? "border-orange-500 bg-orange-50 shadow-md" : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center mb-2">
                            <Icon size={24} className={form.type === type.value ? "text-orange-600" : "text-gray-600"} />
                            <span className="ml-2 font-medium">{type.label}</span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{type.desc}</div>
                          <div className={`text-lg font-bold ${form.type === type.value ? "text-orange-600" : "text-gray-900"}`}>
                            {type.price}€
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {errors.type && (
                    <p className="text-red-600 text-sm mt-3 flex items-center">
                      <AlertTriangle size={16} className="mr-1" />
                      {errors.type}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Étape 2: Détails */}
            {currentStep === 2 && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description du contenu *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, description: e.target.value }));
                      setErrors((prev) => ({ ...prev, description: undefined }));
                    }}
                    placeholder="Décrivez précisément le contenu du colis..."
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                      errors.description ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertTriangle size={16} className="mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }));
                        setErrors((prev) => ({ ...prev, quantity: undefined }));
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.quantity ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Poids (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.weight}
                      onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                      placeholder="0.0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valeur déclarée (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.value}
                      onChange={(e) => setForm((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Priorité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Niveau de priorité</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PRIORITIES.map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, priority: priority.value }))}
                        className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                          form.priority === priority.value
                            ? priority.className
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.isFragile}
                      onChange={(e) => setForm((prev) => ({ ...prev, isFragile: e.target.checked }))}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 flex items-center">
                      <AlertTriangle size={16} className="mr-1 text-orange-500" />
                      Fragile
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Étape 3: Adresses */}
            {currentStep === 3 && (
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Ramassage */}
                <div className="rounded-xl p-6 border border-orange-200 bg-orange-50/60">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="mr-2 text-orange-600" size={20} />
                    Ramassage (optionnel)
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse de ramassage
                      </label>
                      <textarea
                        value={form.pickupAddress}
                        onChange={(e) => setForm((prev) => ({ ...prev, pickupAddress: e.target.value }))}
                        placeholder="Adresse complète de ramassage"
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date de ramassage</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="justify-start text-left font-normal border-gray-300 hover:bg-orange-50"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {form.pickupDate ? form.pickupDate : "Choisir une date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={form.pickupDate ? new Date(form.pickupDate) : undefined}
                              onSelect={(date) =>
                                setForm((prev) => ({
                                  ...prev,
                                  pickupDate: date ? format(date, "yyyy-MM-dd", { locale: fr }) : "",
                                }))
                              }
                              initialFocus
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Créneau horaire</label>
                        <select
                          value={form.pickupTime}
                          onChange={(e) => setForm((prev) => ({ ...prev, pickupTime: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner un créneau</option>
                          <option value="08:00-12:00">08:00 - 12:00</option>
                          <option value="14:00-18:00">14:00 - 18:00</option>
                          <option value="09:00-17:00">09:00 - 17:00</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Livraison */}
                <div className="rounded-xl p-6 border border-blue-200 bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Livraison au Burkina Faso *</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse de livraison *</label>
                    <textarea
                      value={form.deliveryAddress}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }));
                        setErrors((prev) => ({ ...prev, deliveryAddress: undefined }));
                      }}
                      placeholder={selectedClient?.recipientAddress || "Adresse complète de livraison"}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                        errors.deliveryAddress ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {selectedClient && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, deliveryAddress: selectedClient.recipientAddress }))}
                        className="mt-2 text-sm text-orange-600 hover:text-orange-800 font-medium"
                      >
                        Utiliser l'adresse du destinataire
                      </button>
                    )}
                    {errors.deliveryAddress && (
                      <p className="text-red-600 text-sm mt-2 flex items-center">
                        <AlertTriangle size={16} className="mr-1" />
                        {errors.deliveryAddress}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instructions spéciales</label>
                    <textarea
                      value={form.specialInstructions}
                      onChange={(e) => setForm((prev) => ({ ...prev, specialInstructions: e.target.value }))}
                      placeholder="Instructions particulières pour la livraison..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus-border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Étape 4: Tarification + Paiement */}
            {currentStep === 4 && (
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Résumé des coûts */}
                <div className="bg-gradient-to-br from-blue-50 to-orange-50 border border-orange-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Euro className="mr-2 text-orange-600" size={24} />
                    Détail des coûts
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">
                        Prix de base ({PACKAGE_TYPES.find((t) => t.value === form.type)?.label})
                      </span>
                      <span className="font-semibold text-gray-900">{Number(form.basePrice).toFixed(2)}€</span>
                    </div>

                    {Number(form.pickupFee) > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-700">Frais de ramassage</span>
                        <span className="font-semibold text-gray-900">{Number(form.pickupFee).toFixed(2)}€</span>
                      </div>
                    )}

                    {form.isInsured && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-700 flex items-center">
                          <Shield size={16} className="mr-1 text-green-600" />
                          Assurance
                        </span>
                        <span className="font-semibold text-gray-900">{Number(form.insuranceFee).toFixed(2)}€</span>
                      </div>
                    )}

                    {Number(form.customsFee) > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-700">Frais de douane</span>
                        <span className="font-semibold text-gray-900">{Number(form.customsFee).toFixed(2)}€</span>
                      </div>
                    )}

                    {Number(form.discount) > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-green-700">Remise</span>
                        <span className="font-semibold text-green-600">-{Number(form.discount).toFixed(2)}€</span>
                      </div>
                    )}

                    <hr className="border-gray-300" />

                    <div className="flex justify-between items-center py-3 bg-white rounded-lg px-4 border border-orange-300">
                      <span className="text-xl font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {getTotal(form).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ajustements des frais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frais de ramassage (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.pickupFee}
                      onChange={(e) => setForm((prev) => ({ ...prev, pickupFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">S’applique si une adresse de ramassage est renseignée.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frais de douane (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.customsFee}
                      onChange={(e) => setForm((prev) => ({ ...prev, customsFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remise (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.discount}
                      onChange={(e) => setForm((prev) => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center mt-6">
                    <input
                      id="insured"
                      type="checkbox"
                      checked={form.isInsured}
                      onChange={(e) => setForm((prev) => ({ ...prev, isInsured: e.target.checked }))}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="insured" className="ml-2 text-sm text-gray-700 flex items-center">
                      <Shield size={16} className="mr-1 text-green-600" />
                      Ajouter une assurance (+{Math.max(10, (Number(form.value) || 0) * 0.02).toFixed(2)}€)
                    </label>
                  </div>
                </div>

                {/* Paiement */}
                <div className="rounded-xl p-6 border border-gray-200 bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Paiement</h3>

                  {/* Statut dérivé */}
                  <div className="mb-4">
                    <span className="text-sm text-gray-600 mr-2">Statut:</span>
                    <span
                      className={
                        "inline-flex items-center px-2.5 py-1 rounded text-xs font-medium " +
                        (form.paymentStatus === "PAID"
                          ? "bg-green-100 text-green-800"
                          : form.paymentStatus === "PARTIAL"
                          ? "bg-orange-100 text-orange-800"
                          : form.paymentStatus === "PENDING"
                          ? "bg-gray-100 text-gray-800"
                          : form.paymentStatus === "REFUNDED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800")
                      }
                    >
                      {form.paymentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Montant payé (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.paidAmount}
                        onChange={(e) => {
                          const paid = parseFloat(e.target.value || "0");
                          const total = getTotal({ ...form });
                          setForm((prev) => ({
                            ...prev,
                            paidAmount: isNaN(paid) ? 0 : paid,
                            paymentStatus: derivePaymentStatus(total, isNaN(paid) ? 0 : paid),
                          }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Total: <b>{getTotal(form).toFixed(2)}€</b>
                      </p>
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de paiement</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal border-gray-300 hover:bg-orange-50">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.paidAt ? form.paidAt : "Choisir une date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.paidAt ? new Date(form.paidAt) : undefined}
                            onSelect={(date) =>
                              setForm((prev) => ({
                                ...prev,
                                paidAt: date ? format(date, "yyyy-MM-dd", { locale: fr }) : "",
                              }))
                            }
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Mode de paiement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Mode de paiement</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, paymentMethod: method.value }))}
                          className={`p-4 rounded-lg border-2 text-center transition-all duration-200 hover:shadow-md ${
                            form.paymentMethod === method.value ? "border-orange-500 bg-orange-50 shadow-md" : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Icon size={24} className={`mx-auto mb-2 ${form.paymentMethod === method.value ? "text-orange-600" : "text-gray-600"}`} />
                          <div className={`font-medium ${form.paymentMethod === method.value ? "text-orange-600" : "text-gray-900"}`}>
                            {method.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{method.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer navigation */}
          <div className="border-t bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Précédent
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={currentStep === 1 && !form.clientId}
                    className="inline-flex items-center px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Suivant
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      loading || !form.clientId || !form.description || !form.deliveryAddress
                    }
                    className="inline-flex items-center px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Check size={16} className="mr-2" />
                        {editingPackage ? "Modifier le colis" : "Créer le colis"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default PackageDialog;
