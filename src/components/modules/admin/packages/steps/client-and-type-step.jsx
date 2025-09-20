import React, { useState } from "react";
import { User, Search, ChevronRight, AlertTriangle, Package as PackageIcon, Filter } from "lucide-react";
import { PACKAGE_TYPES, PACKAGE_CATEGORIES, getPackageTypesByCategory, getPriceByRegion } from "@/lib/data/packages";

const ClientAndTypeStep = ({ 
  form, 
  setForm, 
  errors, 
  setErrors,
  clients,
  searchClient,
  setSearchClient,
  selectedClient,
  filteredClients
}) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isParisRegion, setIsParisRegion] = useState(true);
  
  const categorizedTypes = getPackageTypesByCategory();
  const typesToDisplay = selectedCategory 
    ? categorizedTypes.find(cat => cat.key === selectedCategory)?.types || []
    : PACKAGE_TYPES;

  return (
  <div className="space-y-6 max-w-4xl mx-auto">
    {/* Sélection client */}
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <User className="mr-2 text-orange-600" size={18} />
        Sélectionner un client
      </h3>

      <div className="relative mb-3 sm:mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone, email..."
          value={searchClient}
          onChange={(e) => setSearchClient(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors
            ${errors.clientId ? "border-red-300" : "border-gray-300"}`}
        />
      </div>

      {searchClient && filteredClients.length > 0 && (
        <div className="max-h-64 overflow-y-auto -mx-1">
          {filteredClients.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => {
                setForm((prev) => ({ ...prev, clientId: client.id }));
                setSearchClient("");
                if (setErrors) {
                  setErrors((prev) => ({ ...prev, clientId: undefined }));
                }
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
                  <div className="text-xs text-gray-500 truncate">{client.phone} • {client.city}</div>
                </div>
                <ChevronRight size={16} className="text-gray-400 shrink-0 ml-2" />
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedClient && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-blue-900 text-sm sm:text-base truncate">
                {selectedClient.firstName} {selectedClient.lastName}
                {selectedClient.isVip && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800">
                    VIP
                  </span>
                )}
              </div>
              <div className="text-xs text-blue-700 truncate mt-0.5">
                {selectedClient.phone} • {selectedClient.email}
              </div>
              <div className="text-xs text-blue-600 mt-0.5 truncate">
                {selectedClient.city}, {selectedClient.country}
              </div>
            </div>
            <button
              type="button"
              onClick={() => { 
              setForm((prev) => ({ ...prev, clientId: "" })); 
              setSearchClient(""); 
            }}
              className="text-orange-600 hover:text-orange-800 text-xs font-medium shrink-0"
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
    </section>

    {/* Type de colis */}
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <PackageIcon className="mr-2 text-orange-600" size={18} />
        Type de colis
      </h3>

      {/* Filtres */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${!selectedCategory ? "bg-orange-100 text-orange-800 border border-orange-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Tous
          </button>
          {PACKAGE_CATEGORIES.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => setSelectedCategory(category.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                ${selectedCategory === category.key ? category.color : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200"}`}
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
          
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => {
                setForm((prev) => ({ 
                  ...prev, 
                  type: type.value,
                  basePrice: type.isQuoteOnly ? 0 : price
                }));
                if (setErrors) {
                  setErrors((prev) => ({ ...prev, type: undefined }));
                }
              }}
              className={`p-3 rounded-lg border-2 text-left transition-all active:scale-[0.98] min-h-[100px] flex flex-col
                ${form.type === type.value ? "border-orange-500 bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`}
            >
              <div className="flex items-center mb-1.5">
                <Icon size={18} className={form.type === type.value ? "text-orange-600" : "text-gray-600"} />
                <span className="ml-2 font-medium text-xs leading-tight">{type.label}</span>
              </div>
              <div className="text-xs text-gray-600 mb-1.5 flex-1 line-clamp-2">{type.desc}</div>
              <div className={`text-sm font-bold ${form.type === type.value ? "text-orange-600" : "text-gray-900"} ${type.isQuoteOnly ? "text-xs" : ""}`}>
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

      {errors.type && (
        <p className="text-red-600 text-sm mt-3 flex items-center">
          <AlertTriangle size={16} className="mr-1" />
          {errors.type}
        </p>
      )}
    </section>
  </div>
);}

export default ClientAndTypeStep;