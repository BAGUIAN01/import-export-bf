// components/modules/admin/packages/package-dialog.jsx
import React, { useState, useEffect } from "react";
import {
  X, User, Package as PackageIcon, MapPin, Euro, Check,
  ChevronLeft, ChevronRight, Plus, AlertTriangle, CheckCircle2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ClientSelection,
  PackageTypeSelection,
  PackageDetails,
  AddressStep,
  ContainerAndSummaryStep,
  PackageItem,
  StepIndicator,
  DialogFooter,
} from "./package-dialog-component";
import { getTotal } from "@/lib/utils/package-helpers";

// ⚠️ NOTE: on récupère la prop "package" mais on la renomme pour éviter les confusions
const PackageDialog = ({
  isOpen,
  onClose,
  clients = [],
  containers = [],
  onSave,
  loading = false,
  package: editingPackage, // <-- support édition
  prefilledClient = null, // <-- pré-remplissage client
  prefilledContainer = null, // <-- pré-remplissage conteneur
  prefilledSharedData = null, // <-- pré-remplissage données partagées
  isAddingToShipment = false, // <-- indique si on ajoute à un shipment existant
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchClient, setSearchClient] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedContainerId, setSelectedContainerId] = useState("");
  const [packages, setPackages] = useState([]);
  const [activePackageIndex, setActivePackageIndex] = useState(-1);
  const [errors, setErrors] = useState({});

  const emptyForm = {
    selectedTypes: [],
    description: "",
    weight: "",
    value: "",
    priority: "NORMAL",
    isFragile: false,
    isInsured: false,
    pickupFee: 0,
    insuranceFee: 0,
    customsFee: 0,
    discount: 0,
  };

  const [sharedData, setSharedData] = useState({
    pickupAddress: "",
    pickupDate: "",
    pickupTime: "",
    specialInstructions: "",
    paidAmount: 0,
    paymentMethod: "",
    paidAt: "",
  });

  const [form, setForm] = useState(emptyForm);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // ---------- RESET / PREFILL ----------
  useEffect(() => {
    if (!isOpen) return;

    // MODE ÉDITION : préremplir à partir du colis reçu
    if (editingPackage && !isAddingToShipment) {
      let parsedTypes = [];
      if (Array.isArray(editingPackage.selectedTypes)) {
        parsedTypes = editingPackage.selectedTypes;
      } else if (typeof editingPackage.types === "string") {
        try { parsedTypes = JSON.parse(editingPackage.types) } catch { parsedTypes = [] }
      } else if (Array.isArray(editingPackage.types)) {
        parsedTypes = editingPackage.types;
      }

      const prefilled = {
        ...emptyForm,
        selectedTypes: parsedTypes,
        description: editingPackage.description || "",
        weight: editingPackage.weight ?? "",
        value: editingPackage.value ?? "",
        priority: editingPackage.priority || "NORMAL",
        isFragile: !!editingPackage.isFragile,
        isInsured: !!editingPackage.isInsured,
        pickupFee: editingPackage.pickupFee ?? 0,
        insuranceFee: editingPackage.insuranceFee ?? 0,
        customsFee: editingPackage.customsFee ?? 0,
        discount: editingPackage.discount ?? 0,
      };

      setCurrentStep(1);
      setSearchClient("");
      setSelectedClientId(editingPackage.client?.id || editingPackage.clientId || "");
      setSelectedContainerId(editingPackage.container?.id || editingPackage.containerId || "");
      setPackages([prefilled]);
      setActivePackageIndex(0);
      setErrors({});
      setSharedData({
        pickupAddress: editingPackage.pickupAddress || "",
        pickupDate: editingPackage.pickupDate ? new Date(editingPackage.pickupDate).toISOString().slice(0,10) : "",
        pickupTime: editingPackage.pickupTime || "",
        specialInstructions: editingPackage.specialInstructions || "",
        paidAmount: editingPackage.paidAmount ?? 0,
        paymentMethod: editingPackage.paymentMethod || "",
        paidAt: editingPackage.paidAt ? new Date(editingPackage.paidAt).toISOString().slice(0,10) : "",
      });
      setForm(prefilled);
      return;
    }

    // MODE AJOUT À UN SHIPMENT : pré-remplir avec les données du shipment
    if (isAddingToShipment && prefilledClient) {
      setCurrentStep(1);
      setSearchClient("");
      setSelectedClientId(prefilledClient.id || "");
      setSelectedContainerId(prefilledContainer?.id || "");
      setPackages([]);
      setActivePackageIndex(-1);
      setErrors({});
      
      // Pré-remplir les données partagées du shipment
      setSharedData({
        pickupAddress: prefilledSharedData?.pickupAddress || prefilledClient.address || "",
        pickupDate: prefilledSharedData?.pickupDate 
          ? (typeof prefilledSharedData.pickupDate === 'string' 
              ? prefilledSharedData.pickupDate.slice(0,10) 
              : new Date(prefilledSharedData.pickupDate).toISOString().slice(0,10))
          : "",
        pickupTime: prefilledSharedData?.pickupTime || "",
        specialInstructions: prefilledSharedData?.specialInstructions || "",
        paidAmount: prefilledSharedData?.paidAmount ?? 0,
        paymentMethod: prefilledSharedData?.paymentMethod || "",
        paidAt: prefilledSharedData?.paidAt 
          ? (typeof prefilledSharedData.paidAt === 'string' 
              ? prefilledSharedData.paidAt.slice(0,10) 
              : new Date(prefilledSharedData.paidAt).toISOString().slice(0,10))
          : "",
      });
      setForm(emptyForm);
      return;
    }

    // MODE CRÉATION (wizard)
    setCurrentStep(1);
    setSearchClient("");
    setSelectedClientId("");
    setSelectedContainerId("");
    setPackages([]);
    setActivePackageIndex(-1);
    setErrors({});
    setSharedData({
      pickupAddress: "",
      pickupDate: "",
      pickupTime: "",
      specialInstructions: "",
      paidAmount: 0,
      paymentMethod: "",
      paidAt: "",
    });
    setForm(emptyForm);
  }, [isOpen, editingPackage, isAddingToShipment, prefilledClient, prefilledContainer, prefilledSharedData]);

  // ---------- LISTE COLIS (sidebar) ----------
  const addNewPackage = () => {
    if (activePackageIndex >= 0) {
      const updated = [...packages];
      updated[activePackageIndex] = { ...form };
      setPackages(updated);
    }
    const newPkg = { ...emptyForm };
    setPackages((prev) => [...prev, newPkg]);
    setActivePackageIndex(packages.length);
    setForm(newPkg);
  };

  const removePackage = (index) => {
    const updated = packages.filter((_, i) => i !== index);
    setPackages(updated);

    if (activePackageIndex === index) {
      const newActive = Math.max(0, Math.min(activePackageIndex, updated.length - 1));
      setActivePackageIndex(updated.length > 0 ? newActive : -1);
      setForm(updated.length > 0 ? updated[newActive] : emptyForm);
    } else if (activePackageIndex > index) {
      setActivePackageIndex(activePackageIndex - 1);
    }
  };

  const duplicatePackage = (index) => {
    const src = packages[index];
    const dup = { ...src, description: (src.description || "") + " (copie)" };
    const updated = [...packages];
    updated.splice(index + 1, 0, dup);
    setPackages(updated);
    setActivePackageIndex(index + 1);
    setForm(dup);
  };

  const selectPackage = (index) => {
    if (activePackageIndex >= 0) {
      const updated = [...packages];
      updated[activePackageIndex] = { ...form };
      setPackages(updated);
    }
    setActivePackageIndex(index);
    setForm(packages[index]);
  };

  const saveCurrentPackage = () => {
    if (activePackageIndex >= 0) {
      const updated = [...packages];
      updated[activePackageIndex] = { ...form };
      setPackages(updated);
    }
  };

  // ---------- VALID/SUBMIT ----------
  const handleSubmit = async () => {
    saveCurrentPackage();

    if (!selectedClientId) {
      alert("Veuillez sélectionner un client.");
      setCurrentStep(1);
      return;
    }
    if (!selectedContainerId) {
      alert("Veuillez sélectionner un conteneur (obligatoire).");
      setCurrentStep(4);
      return;
    }

    // Valider tous les colis
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      if (!pkg.selectedTypes?.length || !pkg.description) {
        alert(`Le colis #${i + 1} est incomplet (types + description)`);
        setCurrentStep(1);
        return;
      }
    }

    // ----- MODE ÉDITION → envoi d’un seul objet -----
    if (editingPackage) {
      const singlePayload = {
        clientId: selectedClientId,
        containerId: selectedContainerId,
        selectedTypes: form.selectedTypes,
        description: form.description,
        weight: form.weight,
        value: form.value,
        priority: form.priority,
        isFragile: form.isFragile,
        isInsured: form.isInsured,
        pickupFee: form.pickupFee,
        insuranceFee: form.insuranceFee,
        customsFee: form.customsFee,
        discount: form.discount,

        // champs partagés (si tu veux autoriser la MAJ à l’édition)
        pickupAddress: sharedData.pickupAddress || null,
        pickupDate: sharedData.pickupDate || null,
        pickupTime: sharedData.pickupTime || null,
        deliveryAddress: selectedClient?.recipientAddress || null,
        specialInstructions: sharedData.specialInstructions || null,

        // paiement (facultatif pour la PUT)
        paidAmount: sharedData.paidAmount || 0,
        paymentMethod: sharedData.paymentMethod || null,
        paidAt: sharedData.paidAt || null,
      };

      await onSave(singlePayload);
      return;
    }

    // ----- MODE CRÉATION (wizard batch) -----
    if (packages.length === 0) {
      alert("Ajoutez au moins un colis.");
      setCurrentStep(1);
      return;
    }

    const packagesData = packages.map((pkg) => ({
      selectedTypes: pkg.selectedTypes,
      description: pkg.description,
      weight: pkg.weight,
      value: pkg.value,
      priority: pkg.priority,
      isFragile: pkg.isFragile,
      isInsured: pkg.isInsured,
      pickupFee: pkg.pickupFee,
      insuranceFee: pkg.insuranceFee,
      customsFee: pkg.customsFee,
      discount: pkg.discount,
    }));

    await onSave({
      clientId: selectedClientId,
      containerId: selectedContainerId, // <-- OBLIGATOIRE
      sharedData: {
        ...sharedData,
        deliveryAddress: selectedClient?.recipientAddress || "",
      },
      packages: packagesData,
    });
  };

  const handleNextStep = () => {
    saveCurrentPackage();

    if (currentStep === 1) {
      if (!selectedClientId) {
        alert("Veuillez sélectionner un client.");
        return;
      }
      if (packages.length === 0) {
        alert("Ajoutez au moins un colis.");
        return;
      }
      for (let i = 0; i < packages.length; i++) {
        if (!packages[i].selectedTypes?.length) {
          alert(`Le colis #${i + 1} doit avoir au moins un type sélectionné`);
          return;
        }
      }
    }
    setCurrentStep((p) => Math.min(p + 1, 4));
  };

  const handlePrevStep = () => {
    saveCurrentPackage();
    setCurrentStep((p) => Math.max(p - 1, 1));
  };

  const filteredClients = clients.filter((client) =>
    `${client.firstName} ${client.lastName} ${client.phone} ${client.email || ""}`
      .toLowerCase()
      .includes(searchClient.toLowerCase())
  );

  const steps = [
    { number: 1, title: "Client & Colis", icon: User, desc: "Sélection du client et ajout de colis" },
    { number: 2, title: "Détails", icon: PackageIcon, desc: "Informations détaillées des colis" },
    { number: 3, title: "Adresses", icon: MapPin, desc: "Ramassage et livraison" },
    { number: 4, title: "Conteneur & Total", icon: Euro, desc: "Conteneur et récapitulatif" },
  ];

  const totalAmount = packages.reduce((sum, pkg) => sum + getTotal(pkg), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-stretch justify-center p-0 sm:p-4">
      <div className="bg-white w-screen h-screen rounded-none shadow-none sm:w-full sm:max-w-7xl sm:h-[95vh] sm:rounded-xl sm:shadow-2xl overflow-hidden flex">
        {/* Sidebar */}
        {currentStep <= 2 && (
          <div className="w-80 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-white">
              {isAddingToShipment && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 text-xs">
                    <Check size={14} />
                    <span className="font-medium">Ajout à l'expédition</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">
                  {editingPackage && !isAddingToShipment
                    ? "Modifier le colis" 
                    : isAddingToShipment
                      ? "Nouveaux colis"
                      : "Colis à expédier"}
                </h3>
                {!editingPackage && (
                  <span className="text-sm text-gray-500">{packages.length} colis</span>
                )}
              </div>

              {!editingPackage && (
                <button
                  type="button"
                  onClick={addNewPackage}
                  className="w-full flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} className="mr-1" />
                  Ajouter un colis
                </button>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {packages.map((pkg, index) => (
                  <PackageItem
                    key={index}
                    package={pkg}
                    index={index}
                    isActive={activePackageIndex === index}
                    onClick={() => selectPackage(index)}
                    onRemove={() => removePackage(index)}
                    onDuplicate={() => duplicatePackage(index)}
                  />
                ))}

                {packages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <PackageIcon size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Aucun colis ajouté</p>
                    {!editingPackage && (
                      <p className="text-xs mt-1">Cliquez sur "Ajouter un colis" pour commencer</p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {totalAmount > 0 && (
              <div className="p-4 border-t bg-white">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="text-xl font-bold text-orange-600">
                    {totalAmount.toFixed(2)}€
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b bg-gradient-to-r from-orange-50 to-blue-50 px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {editingPackage && !isAddingToShipment 
                      ? "Modifier un colis" 
                      : isAddingToShipment 
                        ? "Ajouter des colis à l'expédition"
                        : "Nouvelle expédition multi-colis"}
                  </h2>
                  {isAddingToShipment && prefilledClient && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg border border-blue-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {prefilledClient.firstName} {prefilledClient.lastName}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  {isAddingToShipment 
                    ? "Client et conteneur déjà sélectionnés - Ajoutez simplement vos colis"
                    : steps[currentStep - 1]?.desc}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 sm:mr-0 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white/60 active:scale-95"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <StepIndicator steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

          {/* Body */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="px-4 sm:px-6 py-6">
                {currentStep === 1 && (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    <ClientSelection
                      clients={clients}
                      searchClient={searchClient}
                      setSearchClient={setSearchClient}
                      selectedClientId={selectedClientId}
                      setSelectedClientId={setSelectedClientId}
                      filteredClients={filteredClients}
                      selectedClient={selectedClient}
                      isLocked={isAddingToShipment}
                    />

                    {activePackageIndex >= 0 && (
                      <PackageTypeSelection
                        form={form}
                        setForm={(next) => {
                          const n = typeof next === "function" ? next(form) : next;
                          setForm(n);
                          const updated = [...packages];
                          updated[activePackageIndex] = n;
                          setPackages(updated);
                        }}
                        errors={errors}
                        setErrors={setErrors}
                      />
                    )}
                  </div>
                )}

                {currentStep === 2 && activePackageIndex >= 0 && (
                  <PackageDetails
                    form={form}
                    setForm={(next) => {
                      const n = typeof next === "function" ? next(form) : next;
                      setForm(n);
                      const updated = [...packages];
                      updated[activePackageIndex] = n;
                      setPackages(updated);
                    }}
                    errors={errors}
                    setErrors={setErrors}
                  />
                )}

                {currentStep === 3 && (
                  <AddressStep
                    selectedClient={selectedClient}
                    sharedData={sharedData}
                    setSharedData={setSharedData}
                    hasPrefilled={isAddingToShipment}
                  />
                )}

                {currentStep === 4 && (
                  <div className="space-y-2">
                    <ContainerAndSummaryStep
                      packages={packages}
                      containers={containers}
                      selectedContainerId={selectedContainerId}
                      setSelectedContainerId={setSelectedContainerId}
                      totalAmount={totalAmount}
                      sharedData={sharedData}
                      setSharedData={setSharedData}
                      isContainerLocked={isAddingToShipment}
                    />

                    {!selectedContainerId && (
                      <p className="text-red-600 text-sm flex items-center mt-1 px-1">
                        <AlertTriangle size={16} className="mr-1" />
                        Le conteneur est obligatoire pour créer/enregistrer ce(s) colis.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="h-20 sm:h-0" />
            </ScrollArea>
          </div>

          <DialogFooter
            currentStep={currentStep}
            onPrevStep={handlePrevStep}
            onNextStep={handleNextStep}
            onSubmit={handleSubmit}
            onClose={onClose}
            packages={packages}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default PackageDialog;
