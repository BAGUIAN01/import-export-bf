import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Package as PackageIcon,
  MapPin,
  Euro,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
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

// Composant principal PackageDialog
const PackageDialog = ({
  isOpen,
  onClose,
  clients = [],
  containers = [],
  onSave,
  loading = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchClient, setSearchClient] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedContainerId, setSelectedContainerId] = useState("");
  const [packages, setPackages] = useState([]);
  const [activePackageIndex, setActivePackageIndex] = useState(-1);
  const [errors, setErrors] = useState({});

  // Données partagées entre tous les colis (niveau "expédition")
  const [sharedData, setSharedData] = useState({
    pickupAddress: "",
    pickupDate: "",
    pickupTime: "",
    specialInstructions: "",
    paidAmount: 0,
    paymentMethod: "",
    paidAt: "",
  });

  // Formulaire pour le colis actuel
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
  const [form, setForm] = useState(emptyForm);

  // Client sélectionné (utile pour l’étape 3/4 et le payload)
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  // Ajouter un nouveau colis
  const addNewPackage = () => {
    if (activePackageIndex >= 0) {
      // Sauvegarder le colis actuel
      const updatedPackages = [...packages];
      updatedPackages[activePackageIndex] = { ...form };
      setPackages(updatedPackages);
    }

    const newPackage = { ...emptyForm };
    setPackages([...packages, newPackage]);
    setActivePackageIndex(packages.length);
    setForm(newPackage);
  };

  // Supprimer un colis
  const removePackage = (index) => {
    const updatedPackages = packages.filter((_, i) => i !== index);
    setPackages(updatedPackages);

    if (activePackageIndex === index) {
      const newActiveIndex = Math.max(
        0,
        Math.min(activePackageIndex, updatedPackages.length - 1)
      );
      setActivePackageIndex(updatedPackages.length > 0 ? newActiveIndex : -1);
      if (updatedPackages.length > 0) {
        setForm(updatedPackages[newActiveIndex]);
      } else {
        setForm(emptyForm);
      }
    } else if (activePackageIndex > index) {
      setActivePackageIndex(activePackageIndex - 1);
    }
  };

  // Dupliquer un colis
  const duplicatePackage = (index) => {
    const packageToDuplicate = packages[index];
    const duplicated = {
      ...packageToDuplicate,
      description: (packageToDuplicate.description || "") + " (copie)",
    };

    const updatedPackages = [...packages];
    updatedPackages.splice(index + 1, 0, duplicated);
    setPackages(updatedPackages);
    setActivePackageIndex(index + 1);
    setForm(duplicated);
  };

  // Sélectionner un colis
  const selectPackage = (index) => {
    if (activePackageIndex >= 0) {
      // Sauvegarder le colis actuel
      const updatedPackages = [...packages];
      updatedPackages[activePackageIndex] = { ...form };
      setPackages(updatedPackages);
    }

    setActivePackageIndex(index);
    setForm(packages[index]);
  };

  // Sauvegarder le colis actuel dans la liste
  const saveCurrentPackage = () => {
    if (activePackageIndex >= 0) {
      const updatedPackages = [...packages];
      updatedPackages[activePackageIndex] = { ...form };
      setPackages(updatedPackages);
    }
  };

  const handleSubmit = async () => {
    saveCurrentPackage();

    // Valider tous les colis
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      if (!pkg.selectedTypes || pkg.selectedTypes.length === 0 || !pkg.description) {
        alert(`Le colis #${i + 1} est incomplet`);
        return;
      }
    }

    if (!selectedClientId) {
      alert("Veuillez sélectionner un client");
      return;
    }

    // Préparer les données pour l'API (niveau expédition + liste de colis)
    const packagesData = packages.map((pkg) => ({
      // ⚠️ On ne colle PAS d’infos de paiement ni de statut ici : ils vivent au niveau expédition
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
      // hint: l’adresse de livraison peut être résolue côté API à partir du client
    }));

    await onSave({
      clientId: selectedClientId,
      containerId: selectedContainerId || null,
      sharedData: {
        ...sharedData,
        // Si besoin : fournir la destination côté expédition
        deliveryAddress: selectedClient?.recipientAddress || "",
      },
      packages: packagesData,
    });
  };

  const handleNextStep = () => {
    saveCurrentPackage();

    // Validation par étape
    if (currentStep === 1 && (!selectedClientId || packages.length === 0)) {
      alert("Veuillez sélectionner un client et ajouter au moins un colis");
      return;
    }

    if (currentStep === 1) {
      // Vérifier que tous les colis ont au moins un type sélectionné
      for (let i = 0; i < packages.length; i++) {
        if (!packages[i].selectedTypes || packages[i].selectedTypes.length === 0) {
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
    {
      number: 1,
      title: "Client & Colis",
      icon: User,
      desc: "Sélection du client et ajout de colis",
    },
    {
      number: 2,
      title: "Détails",
      icon: PackageIcon,
      desc: "Informations détaillées des colis",
    },
    {
      number: 3,
      title: "Adresses",
      icon: MapPin,
      desc: "Ramassage et livraison",
    },
    {
      number: 4,
      title: "Conteneur & Total",
      icon: Euro,
      desc: "Conteneur et récapitulatif",
    },
  ];

  const totalAmount = packages.reduce((sum, pkg) => sum + getTotal(pkg), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-stretch justify-center p-0 sm:p-4">
      <div className="bg-white w-screen h-screen rounded-none shadow-none sm:w-full sm:max-w-7xl sm:h-[95vh] sm:rounded-xl sm:shadow-2xl overflow-hidden flex">
        {/* Sidebar - Liste des colis */}
        {currentStep <= 2 && (
          <div className="w-80 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Colis à expédier</h3>
                <span className="text-sm text-gray-500">{packages.length} colis</span>
              </div>
              <button
                type="button"
                onClick={addNewPackage}
                className="w-full flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                <Plus size={16} className="mr-1" />
                Ajouter un colis
              </button>
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
                    <p className="text-xs mt-1">
                      Cliquez sur "Ajouter un colis" pour commencer
                    </p>
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
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  Nouvelle expédition multi-colis
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  {steps[currentStep - 1]?.desc}
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

          {/* Steps Indicator */}
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />

          {/* Body */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="px-4 sm:px-6 py-6">
                {currentStep === 1 && (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {/* Sélection client */}
                    <ClientSelection
                      clients={clients}
                      searchClient={searchClient}
                      setSearchClient={setSearchClient}
                      selectedClientId={selectedClientId}
                      setSelectedClientId={setSelectedClientId}
                      filteredClients={filteredClients}
                      selectedClient={selectedClient}
                    />

                    {/* Sélection type pour le colis actuel */}
                    {activePackageIndex >= 0 && (
                      <PackageTypeSelection
                        form={form}
                        setForm={(newForm) => {
                          const nextForm =
                            typeof newForm === "function" ? newForm(form) : newForm;
                          setForm(nextForm);
                          // Met à jour automatiquement dans la liste
                          const updatedPackages = [...packages];
                          updatedPackages[activePackageIndex] = nextForm;
                          setPackages(updatedPackages);
                        }}
                        errors={errors}
                        setErrors={setErrors}
                      />
                    )}

                    {/* Message si aucun colis */}
                    {packages.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <PackageIcon size={64} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Aucun colis ajouté
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Ajoutez au moins un colis pour continuer
                        </p>
                        <button
                          type="button"
                          onClick={addNewPackage}
                          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <Plus size={16} className="mr-1" />
                          Ajouter votre premier colis
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 2 && activePackageIndex >= 0 && (
                  <PackageDetails
                    form={form}
                    setForm={(newForm) => {
                      const nextForm =
                        typeof newForm === "function" ? newForm(form) : newForm;
                      setForm(nextForm);
                      // Met à jour automatiquement dans la liste
                      const updatedPackages = [...packages];
                      updatedPackages[activePackageIndex] = nextForm;
                      setPackages(updatedPackages);
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
                  />
                )}

                {currentStep === 4 && (
                  <ContainerAndSummaryStep
                    packages={packages}
                    containers={containers}
                    selectedContainerId={selectedContainerId}
                    setSelectedContainerId={setSelectedContainerId}
                    totalAmount={totalAmount}
                    sharedData={sharedData}
                    setSharedData={setSharedData}
                  />
                )}
              </div>
              <div className="h-20 sm:h-0" />
            </ScrollArea>
          </div>

          {/* Footer */}
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
