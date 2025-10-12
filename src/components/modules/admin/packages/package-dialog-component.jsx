import React, { useState } from "react";
import {
  User,
  Package as PackageIcon,
  MapPin,
  Euro,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Trash2,
  Search,
  ChevronRight as ChevronRightIcon,
  AlertTriangle,
  Truck,
  CalendarIcon,
  Filter,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  PACKAGE_TYPES,
  PACKAGE_CATEGORIES,
  getPackageTypesByCategory,
  getPriceByRegion,
  PRIORITIES,
  PAYMENT_METHODS,
} from "@/lib/data/packages";
import { getTotal } from "@/lib/utils/package-helpers";

/* ============================
   Item (colonne de gauche)
============================= */
export const PackageItem = ({
  package: pkg,
  index,
  isActive,
  onClick,
  onRemove,
  onDuplicate,
}) => {
  const getTypesDisplay = () => {
    if (!pkg.selectedTypes || pkg.selectedTypes.length === 0) {
      return "Aucun type sélectionné";
    }
    const totalQuantity = pkg.selectedTypes.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    const typeLabels = pkg.selectedTypes
      .map((item) => {
        const t = PACKAGE_TYPES.find((x) => x.value === item.type);
        return `${t?.label || item.type} (${item.quantity || 0})`;
      })
      .join(", ");
    return `${totalQuantity} articles: ${typeLabels}`;
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isActive
          ? "border-orange-500 bg-orange-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <PackageIcon
              size={16}
              className={isActive ? "text-orange-600" : "text-gray-600"}
            />
            <span className="ml-2 font-medium text-sm">Colis #{index + 1}</span>
          </div>
          <div className="text-xs text-gray-500 truncate">{getTypesDisplay()}</div>
          <div className="text-xs text-gray-500 truncate mt-1">
            {pkg.description || "Description manquante"}
          </div>
          <div className="text-sm font-semibold text-gray-900 mt-1">
            {getTotal(pkg).toFixed(2)}€
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Dupliquer"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================
   Sélection client
============================= */
export const ClientSelection = ({
  clients,
  searchClient,
  setSearchClient,
  selectedClientId,
  setSelectedClientId,
  filteredClients,
  selectedClient,
  isLocked = false, // <-- nouveau : bloque la sélection
}) => (
  <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center justify-between">
      <span className="flex items-center">
        <User className="mr-2 text-orange-600" size={18} />
        {isLocked ? "Client de l'expédition" : "Sélectionner un client"}
      </span>
      {isLocked && (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
          <Check size={12} />
          Pré-rempli
        </span>
      )}
    </h3>

    {!isLocked && (
      <div className="relative mb-3 sm:mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone, email..."
          value={searchClient}
          onChange={(e) => setSearchClient(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
        />
      </div>
    )}

    {!isLocked && searchClient && filteredClients.length > 0 && (
      <div className="max-h-64 overflow-y-auto -mx-1">
        {filteredClients.map((client) => (
          <button
            key={client.id}
            type="button"
            onClick={() => {
              setSelectedClientId(client.id);
              setSearchClient("");
            }}
            className="w-full text-left px-3 py-4 rounded-lg hover:bg-orange-50 border border-transparent hover:border-orange-200 mb-2"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {client.firstName} {client.lastName}
                  {client.isVip && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800">
                      VIP
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {client.phone} • {client.city}
                </div>
              </div>
              <ChevronRightIcon size={16} className="text-gray-400 shrink-0 ml-2" />
            </div>
          </button>
        ))}
      </div>
    )}

    {selectedClient && (
      <div className={`${isLocked ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3 sm:p-4`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className={`font-medium ${isLocked ? 'text-green-900' : 'text-blue-900'} text-sm sm:text-base truncate`}>
              {selectedClient.firstName} {selectedClient.lastName}
              {selectedClient.isVip && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800">
                  VIP
                </span>
              )}
            </div>
            <div className={`text-xs ${isLocked ? 'text-green-700' : 'text-blue-700'} truncate mt-0.5`}>
              {selectedClient.phone} {selectedClient.email && `• ${selectedClient.email}`}
            </div>
            <div className={`text-xs ${isLocked ? 'text-green-600' : 'text-blue-600'} mt-0.5 truncate`}>
              {selectedClient.city}, {selectedClient.country}
            </div>
            {isLocked && (
              <div className="mt-2 text-xs text-green-700 font-medium">
                ✓ Client automatiquement sélectionné de l'expédition
              </div>
            )}
          </div>
          {!isLocked && (
            <button
              type="button"
              onClick={() => {
                setSelectedClientId("");
                setSearchClient("");
              }}
              className="text-orange-600 hover:text-orange-800 text-xs font-medium shrink-0"
            >
              Changer
            </button>
          )}
        </div>
      </div>
    )}

    {!selectedClientId && (
      <p className="text-red-600 text-sm mt-2 flex items-center">
        <AlertTriangle size={16} className="mr-1" />
        Veuillez sélectionner un client
      </p>
    )}
  </section>
);

/* ============================
   Sélection des types (multi)
============================= */
export const PackageTypeSelection = ({ form, setForm, errors, setErrors }) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isParisRegion, setIsParisRegion] = useState(true);

  const categorizedTypes = getPackageTypesByCategory();
  const typesToDisplay = selectedCategory
    ? categorizedTypes.find((cat) => cat.key === selectedCategory)?.types || []
    : PACKAGE_TYPES;

  const handleTypeSelection = (typeValue, unitPrice, isQuoteOnly = false) => {
    const selectedTypes = form.selectedTypes || [];
    const existingIndex = selectedTypes.findIndex((i) => i.type === typeValue);

    if (existingIndex >= 0) {
      const updated = [...selectedTypes];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: (updated[existingIndex].quantity || 0) + 1,
      };
      setForm((prev) => ({ ...prev, selectedTypes: updated }));
    } else {
      const newType = {
        type: typeValue,
        quantity: 1,
        unitPrice: isQuoteOnly ? 0 : unitPrice,
        isQuoteOnly,
      };
      setForm((prev) => ({ ...prev, selectedTypes: [...selectedTypes, newType] }));
    }

    if (setErrors) setErrors((prev) => ({ ...prev, selectedTypes: undefined }));
  };

  const updateQuantity = (typeValue, newQuantity) => {
    const selectedTypes = form.selectedTypes || [];
    if (newQuantity <= 0) {
      setForm((prev) => ({
        ...prev,
        selectedTypes: selectedTypes.filter((i) => i.type !== typeValue),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        selectedTypes: selectedTypes.map((i) =>
          i.type === typeValue ? { ...i, quantity: newQuantity } : i
        ),
      }));
    }
  };

  const removeType = (typeValue) => {
    const selectedTypes = form.selectedTypes || [];
    setForm((prev) => ({
      ...prev,
      selectedTypes: selectedTypes.filter((i) => i.type !== typeValue),
    }));
  };

  const selectedTypes = form.selectedTypes || [];
  const getTypeQuantity = (typeValue) => {
    const found = selectedTypes.find((i) => i.type === typeValue);
    return found ? found.quantity || 0 : 0;
  };

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <PackageIcon className="mr-2 text-orange-600" size={18} />
        Types de colis
      </h3>

      {selectedTypes.length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-medium text-gray-900 mb-3">Types sélectionnés :</h4>
          <div className="space-y-2">
            {selectedTypes.map((item) => {
              const t = PACKAGE_TYPES.find((x) => x.value === item.type);
              const Icon = t?.icon || PackageIcon;
              return (
                <div
                  key={item.type}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border"
                >
                  <div className="flex items-center">
                    <Icon size={18} className="text-orange-600 mr-2" />
                    <div>
                      <span className="font-medium">{t?.label || item.type}</span>
                      <div className="text-sm text-gray-600">
                        {item.isQuoteOnly ? "Sur devis" : `${item.unitPrice}€/unité`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.type, (item.quantity || 0) - 1)}
                        className="px-2 py-1 hover:bg-gray-100 rounded-l-lg"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 border-x">{item.quantity || 0}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.type, (item.quantity || 0) + 1)}
                        className="px-2 py-1 hover:bg-gray-100 rounded-r-lg"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeType(item.type)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !selectedCategory
                ? "bg-orange-100 text-orange-800 border border-orange-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tous
          </button>
          {PACKAGE_CATEGORIES.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => setSelectedCategory(category.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                selectedCategory === category.key
                  ? category.color
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={isParisRegion}
              onChange={(e) => setIsParisRegion(e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mr-2"
            />
            Région Parisienne (prix différents pour certains articles)
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {typesToDisplay.map((type) => {
          const Icon = type.icon;
          const price = getPriceByRegion(type, isParisRegion);
          const displayPrice = type.isQuoteOnly ? "Sur devis" : `${price}€`;
          const currentQuantity = getTypeQuantity(type.value);

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => handleTypeSelection(type.value, price, type.isQuoteOnly)}
              className={`p-3 rounded-lg border-2 text-left transition-all active:scale-[0.98] min-h-[100px] flex flex-col relative ${
                currentQuantity > 0
                  ? "border-orange-500 bg-orange-50 shadow"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {currentQuantity > 0 && (
                <div className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {currentQuantity}
                </div>
              )}
              <div className="flex items-center mb-1.5">
                <Icon size={18} className={currentQuantity > 0 ? "text-orange-600" : "text-gray-600"} />
                <span className="ml-2 font-medium text-xs leading-tight">{type.label}</span>
              </div>
              <div className="text-xs text-gray-600 mb-1.5 flex-1 line-clamp-2">
                {type.desc}
              </div>
              <div
                className={`text-sm font-bold ${
                  currentQuantity > 0 ? "text-orange-600" : "text-gray-900"
                } ${type.isQuoteOnly ? "text-xs" : ""}`}
              >
                {displayPrice}
              </div>
            </button>
          );
        })}
      </div>

      {typesToDisplay.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Filter className="mx-auto mb-2" size={24} />
          <p>Aucun type de colis dans cette catégorie</p>
        </div>
      )}

      {errors?.selectedTypes && (
        <p className="text-red-600 text-sm mt-3 flex items-center">
          <AlertTriangle size={16} className="mr-1" />
          {errors.selectedTypes}
        </p>
      )}
    </section>
  );
};

/* ============================
   Détails colis (sans "Quantité")
============================= */
export const PackageDetails = ({ form, setForm, errors, setErrors }) => (
  <div className="space-y-6 max-w-3xl mx-auto">
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description du contenu *
        </label>
        <textarea
          value={form.description || ""}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, description: e.target.value }));
            if (setErrors) setErrors((prev) => ({ ...prev, description: undefined }));
          }}
          placeholder="Décrivez précisément le contenu du colis..."
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
            errors?.description ? "border-red-300" : "border-gray-300"
          }`}
        />
        {errors?.description && (
          <p className="text-red-600 text-sm mt-1 flex items-center">
            <AlertTriangle size={16} className="mr-1" />
            {errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Poids (kg)
          </label>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={form.weight || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
            placeholder="0.0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Valeur déclarée (€)
          </label>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={form.value || ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))
            }
            placeholder="0.00"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Niveau de priorité
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRIORITIES.map((priority) => (
            <button
              key={priority.value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, priority: priority.value }))}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
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

      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={form.isFragile || false}
            onChange={(e) => setForm((prev) => ({ ...prev, isFragile: e.target.checked }))}
            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
          />
          <span className="ml-2 text-sm text-gray-700 flex items-center">
            <AlertTriangle size={16} className="mr-1 text-orange-500" />
            Fragile
          </span>
        </label>
      </div>
    </section>
  </div>
);

/* ============================
   Adresses (ramassage + livraison)
============================= */
export const AddressStep = ({ selectedClient, sharedData, setSharedData, hasPrefilled = false }) => (
  <div className="space-y-6 max-w-3xl mx-auto">
    {hasPrefilled && sharedData.pickupAddress && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700">
          <Check size={18} />
          <span className="font-medium text-sm">
            Les informations de l'expédition ont été automatiquement pré-remplies
          </span>
        </div>
      </div>
    )}
    
    <section className="rounded-xl p-4 sm:p-6 border border-orange-200 bg-orange-50/60 space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
        <MapPin className="mr-2 text-orange-600" size={18} />
        Ramassage (optionnel)
      </h3>

      <div className="bg-white rounded-lg p-4 border border-orange-200">
        <p className="text-sm text-gray-600 mb-2">
          <strong>Note :</strong> Les informations de ramassage s'appliquent à
          tous les colis de cette expédition.
        </p>
        <p className="text-xs text-gray-500">
          Si vous avez besoin d'adresses de ramassage différentes, créez des
          expéditions séparées.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Adresse de ramassage
        </label>
        <textarea
          value={sharedData.pickupAddress || ""}
          onChange={(e) =>
            setSharedData((prev) => ({ ...prev, pickupAddress: e.target.value }))
          }
          placeholder="Adresse complète de ramassage (optionnel)"
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date de ramassage
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal border-gray-300 hover:bg-orange-50 min-h-[44px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {sharedData.pickupDate ? sharedData.pickupDate : "Choisir une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={sharedData.pickupDate ? new Date(sharedData.pickupDate) : undefined}
                onSelect={(date) =>
                  setSharedData((prev) => ({
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Créneau horaire
          </label>
          <select
            value={sharedData.pickupTime || ""}
            onChange={(e) => setSharedData((prev) => ({ ...prev, pickupTime: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[44px]"
          >
            <option value="">Sélectionner un créneau</option>
            <option value="08:00-12:00">08:00 - 12:00</option>
            <option value="14:00-18:00">14:00 - 18:00</option>
            <option value="09:00-17:00">09:00 - 17:00</option>
          </select>
        </div>
      </div>
    </section>

    <section className="rounded-xl p-4 sm:p-6 border border-blue-200 bg-blue-50 space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
        Livraison au Burkina Faso
      </h3>

      {selectedClient && (
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-gray-900 mb-2">
            Destinataire au Burkina Faso
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Nom :</strong> {selectedClient.recipientName}
            </p>
            <p>
              <strong>Téléphone :</strong> {selectedClient.recipientPhone}
            </p>
            <p>
              <strong>Adresse :</strong> {selectedClient.recipientAddress}
            </p>
            <p>
              <strong>Ville :</strong> {selectedClient.recipientCity}
            </p>
            {selectedClient.recipientRelation && (
              <p>
                <strong>Relation :</strong> {selectedClient.recipientRelation}
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Instructions spéciales
        </label>
        <textarea
          value={sharedData.specialInstructions || ""}
          onChange={(e) =>
            setSharedData((prev) => ({ ...prev, specialInstructions: e.target.value }))
          }
          placeholder="Instructions particulières pour la livraison..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Ces instructions s'appliquent à tous les colis de cette expédition
        </p>
      </div>
    </section>
  </div>
);

/* ============================
   Conteneur + récapitulatif
============================= */
export const ContainerAndSummaryStep = ({
  packages,
  containers,
  selectedContainerId,
  setSelectedContainerId,
  totalAmount,
  isContainerLocked = false, // <-- nouveau : bloque la sélection du conteneur
  sharedData,
  setSharedData,
}) => (
  <div className="space-y-6 max-w-4xl mx-auto">
    {/* Conteneur */}
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center justify-between">
        <span className="flex items-center">
          <Truck className="mr-2 text-orange-600" size={18} />
          {isContainerLocked ? "Conteneur de l'expédition" : "Conteneur de transport"}
        </span>
        {isContainerLocked && selectedContainerId && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
            <Check size={12} />
            Pré-rempli
          </span>
        )}
      </h3>

      {isContainerLocked && selectedContainerId ? (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          {(() => {
            const container = containers.find(c => c.id === selectedContainerId);
            if (!container) return <p className="text-sm text-gray-500">Conteneur non trouvé</p>;
            
            return (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900 text-base">
                    {container.name || container.containerNumber}
                  </span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Statut: {container.status === "PREPARATION" && "En préparation"}
                    {container.status === "LOADED" && "Chargé"}
                    {container.status === "IN_TRANSIT" && "En transit"}
                    {container.status === "CUSTOMS" && "En douane"}
                    {container.status === "DELIVERED" && "Livré"}</p>
                  <p>Charge: {container.currentLoad}/{container.capacity}</p>
                  {container.departureDate && (
                    <p>Départ prévu: {new Date(container.departureDate).toLocaleDateString("fr-FR")}</p>
                  )}
                </div>
                <div className="mt-3 text-xs text-green-700 font-medium">
                  ✓ Conteneur automatiquement assigné de l'expédition
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {containers.map((container) => (
              <button
                key={container.id}
                type="button"
                onClick={() => setSelectedContainerId(container.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedContainerId === container.id
                    ? "border-orange-500 bg-orange-50 shadow"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-sm mb-1">
                  {container.name || container.containerNumber}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {container.status === "PREPARATION" && "En préparation"}
                  {container.status === "LOADED" && "Chargé"}
                  {container.status === "IN_TRANSIT" && "En transit"}
                  {container.status === "CUSTOMS" && "En douane"}
                  {container.status === "DELIVERED" && "Livré"}
                </div>
                <div className="text-xs text-gray-500">
                  Charge: {container.currentLoad}/{container.capacity}
                </div>
                {container.departureDate && (
                  <div className="text-xs text-gray-500 mt-1">
                    Départ: {new Date(container.departureDate).toLocaleDateString("fr-FR")}
                  </div>
                )}
              </button>
            ))}
          </div>

          {containers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Truck size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Aucun conteneur disponible</p>
              <p className="text-xs mt-1">Les colis seront assignés plus tard</p>
            </div>
          )}
        </>
      )}
    </section>

    {/* Récap colis (multi-types) */}
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <PackageIcon className="mr-2 text-orange-600" size={18} />
        Récapitulatif des colis ({packages.length})
      </h3>

      <div className="space-y-3">
        {packages.map((pkg, index) => {
          const total = getTotal(pkg);
          const typeLines =
            (pkg.selectedTypes || []).length > 0
              ? (pkg.selectedTypes || []).map((item) => {
                  const t = PACKAGE_TYPES.find((x) => x.value === item.type);
                  return `${t?.label || item.type} × ${item.quantity || 0}`;
                })
              : ["Aucun type sélectionné"];

        return (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start">
                  <PackageIcon size={20} className="text-gray-600 mr-3 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Colis #{index + 1}</div>
                    <div className="text-xs text-gray-600">
                      {pkg.description || "Aucune description"}
                    </div>
                    <ul className="mt-1 text-xs text-gray-700 list-disc pl-4 space-y-0.5">
                      {typeLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                    <div className="text-xs text-gray-500 mt-1">
                      {pkg.weight ? `${pkg.weight} kg` : "Poids non spécifié"}
                      {pkg.isFragile && <span className="ml-2 text-orange-600">• Fragile</span>}
                      {pkg.isInsured && <span className="ml-2 text-green-600">• Assuré</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-gray-900">
                    {total.toFixed(2)}€
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>

    {/* Total général */}
    <section className="bg-gradient-to-br from-blue-50 to-orange-50 border border-orange-200 rounded-xl p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <Euro className="mr-2 text-orange-600" size={22} />
        Total de l'expédition
      </h3>

      <div className="space-y-2">
        {packages.map((pkg, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-700">Colis #{index + 1}</span>
            <span className="font-semibold text-gray-900">
              {getTotal(pkg).toFixed(2)}€
            </span>
          </div>
        ))}

        <hr className="border-gray-300 my-3" />

        <div className="flex justify-between items-center py-3 bg-white rounded-lg px-4 border border-orange-300">
          <span className="text-lg font-bold text-gray-900">Total général</span>
          <span className="text-xl sm:text-2xl font-bold text-orange-600">
            {totalAmount.toFixed(2)}€
          </span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note :</strong> Tous les colis seront liés au même conteneur et
          partageront les mêmes informations de ramassage et livraison.
        </p>
      </div>
    </section>

    {/* Paiement (niveau expédition) */}
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
        Paiement
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Montant payé (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max={totalAmount}
            value={sharedData.paidAmount || ""}
            onChange={(e) =>
              setSharedData((prev) => ({
                ...prev,
                paidAmount: parseFloat(e.target.value) || 0,
              }))
            }
            placeholder="0.00"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Total à payer: <strong>{totalAmount.toFixed(2)}€</strong>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Mode de paiement
          </label>
          <select
            value={sharedData.paymentMethod || ""}
            onChange={(e) =>
              setSharedData((prev) => ({ ...prev, paymentMethod: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Sélectionner un mode</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date de paiement
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal border-gray-300 hover:bg-orange-50 min-h-[44px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {sharedData.paidAt ? sharedData.paidAt : "Choisir une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={sharedData.paidAt ? new Date(sharedData.paidAt) : undefined}
                onSelect={(date) =>
                  setSharedData((prev) => ({
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
    </section>
  </div>
);

/* ============================
   Stepper + Footer
============================= */
export const StepIndicator = ({ steps, currentStep, onStepClick }) => (
  <div className="sticky top-[56px] sm:top-[68px] z-10 bg-gray-50 border-b">
    <div className="px-3 sm:px-6 py-3">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          return (
            <div key={step.number} className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => onStepClick(step.number)}
                className={[
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all",
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-orange-600 text-white shadow"
                    : "bg-gray-200 text-gray-600",
                ].join(" ")}
                aria-label={`Aller à l'étape ${step.number}`}
              >
                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
              </button>
              <div className="ml-2 hidden xs:block">
                <div
                  className={`text-xs sm:text-sm font-medium ${
                    isActive ? "text-orange-600" : "text-gray-600"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500">
                  Étape {step.number}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-3 ${
                    currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export const DialogFooter = ({
  currentStep,
  onPrevStep,
  onNextStep,
  onSubmit,
  onClose,
  packages,
  loading,
}) => (
  <div
    className="sticky bottom-0 z-10 border-t bg-white px-3 sm:px-6 py-3"
    style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
  >
    <div className="max-w-4xl mx-auto flex items-center justify-between">
      <div>
        {currentStep > 1 && (
          <button
            type="button"
            onClick={onPrevStep}
            className="inline-flex items-center px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]"
          >
            <ChevronLeft size={16} className="mr-1" />
            Précédent
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 sm:px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]"
        >
          Annuler
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={onNextStep}
            disabled={currentStep === 1 && packages.length === 0}
            className="inline-flex items-center px-5 sm:px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
          >
            Suivant
            <ChevronRight size={16} className="ml-1" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || packages.length === 0}
            className="inline-flex items-center px-6 sm:px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" />
                Créer {packages.length} colis
              </>
            )}
          </button>
        )}
      </div>
    </div>
  </div>
);
