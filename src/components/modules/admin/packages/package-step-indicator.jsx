import React from "react";
import { MapPin, Euro, Shield, CalendarIcon, AlertTriangle } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PACKAGE_TYPES, PRIORITIES, PAYMENT_METHODS } from "@/lib/data/packages";
import { getTotal } from "@/lib/utils/package-helpers";
import ClientAndTypeStep from "./steps/client-and-type-step";

const DetailsStep = ({ form, setForm, errors, setErrors }) => (
  <div className="space-y-6 max-w-3xl mx-auto">
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description du contenu *</label>
        <textarea
          value={form.description}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, description: e.target.value }));
            setErrors((prev) => ({ ...prev, description: undefined }));
          }}
          placeholder="Décrivez précisément le contenu du colis..."
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none
            ${errors.description ? "border-red-300" : "border-gray-300"}`}
        />
        {errors.description && (
          <p className="text-red-600 text-sm mt-1 flex items-center">
            <AlertTriangle size={16} className="mr-1" />
            {errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantité</label>
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={form.quantity}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }));
              setErrors((prev) => ({ ...prev, quantity: undefined }));
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent
              ${errors.quantity ? "border-red-300" : "border-gray-300"}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Poids (kg)</label>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={form.weight}
            onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
            placeholder="0.0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Valeur déclarée (€)</label>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={form.value}
            onChange={(e) => setForm((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Niveau de priorité</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRIORITIES.map((priority) => (
            <button
              key={priority.value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, priority: priority.value }))}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors min-h-[44px]
                ${form.priority === priority.value
                  ? priority.className
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
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
    </section>
  </div>
);

const AddressesStep = ({ form, setForm, errors, setErrors, selectedClient }) => (
  <div className="space-y-6 max-w-3xl mx-auto">
    <section className="rounded-xl p-4 sm:p-6 border border-orange-200 bg-orange-50/60 space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
        <MapPin className="mr-2 text-orange-600" size={18} />
        Ramassage (optionnel)
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse de ramassage</label>
        <textarea
          value={form.pickupAddress}
          onChange={(e) => setForm((prev) => ({ ...prev, pickupAddress: e.target.value }))}
          placeholder="Adresse complète de ramassage"
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de ramassage</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal border-gray-300 hover:bg-orange-50 min-h-[44px]"
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Créneau horaire</label>
          <select
            value={form.pickupTime}
            onChange={(e) => setForm((prev) => ({ ...prev, pickupTime: e.target.value }))}
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
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Livraison au Burkina Faso *</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse de livraison *</label>
        <textarea
          value={form.deliveryAddress}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }));
            setErrors((prev) => ({ ...prev, deliveryAddress: undefined }));
          }}
          placeholder={selectedClient?.recipientAddress || "Adresse complète de livraison"}
          rows={3}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none
            ${errors.deliveryAddress ? "border-red-300" : "border-gray-300"}`}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructions spéciales</label>
        <textarea
          value={form.specialInstructions}
          onChange={(e) => setForm((prev) => ({ ...prev, specialInstructions: e.target.value }))}
          placeholder="Instructions particulières pour la livraison..."
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus-border-transparent"
        />
      </div>
    </section>
  </div>
);

const PriceRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 text-sm">
    <span className="text-gray-700">{label}</span>
    <span className="font-semibold text-gray-900">{value}€</span>
  </div>
);

const FieldNumber = ({ label, value, onChange, help, min = "0", step = "0.01" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <input
      type="number"
      step={step}
      inputMode="decimal"
      min={min}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    />
    {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
  </div>
);

const PricingStep = ({ form, setForm }) => (
  <div className="space-y-6 max-w-3xl mx-auto">
    <section className="bg-gradient-to-br from-blue-50 to-orange-50 border border-orange-200 rounded-xl p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <Euro className="mr-2 text-orange-600" size={22} />
        Détail des coûts
      </h3>

      <div className="space-y-2">
        <PriceRow 
          label={`Prix de base (${PACKAGE_TYPES.find((t) => t.value === form.type)?.label})`} 
          value={Number(form.basePrice).toFixed(2)} 
        />
        {Number(form.pickupFee) > 0 && <PriceRow label="Frais de ramassage" value={Number(form.pickupFee).toFixed(2)} />}
        {form.isInsured && <PriceRow label={<>Assurance <Shield size={14} className="inline ml-1 text-green-600" /></>} value={Number(form.insuranceFee).toFixed(2)} />}
        {Number(form.customsFee) > 0 && <PriceRow label="Frais de douane" value={Number(form.customsFee).toFixed(2)} />}
        {Number(form.discount) > 0 && <PriceRow label={<span className="text-green-700">Remise</span>} value={`-${Number(form.discount).toFixed(2)}`} />}

        <hr className="border-gray-300 my-2" />

        <div className="flex justify-between items-center py-3 bg-white rounded-lg px-4 border border-orange-300">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-xl sm:text-2xl font-bold text-orange-600">
            {getTotal(form).toFixed(2)}€
          </span>
        </div>
      </div>
    </section>

    {/* Ajustements des frais */}
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FieldNumber
        label="Frais de ramassage (€)"
        value={form.pickupFee}
        onChange={(v) => setForm((p) => ({ ...p, pickupFee: v }))}
        help="S'applique si une adresse de ramassage est renseignée."
      />
      <FieldNumber
        label="Frais de douane (€)"
        value={form.customsFee}
        onChange={(v) => setForm((p) => ({ ...p, customsFee: v }))}
      />
      <FieldNumber
        label="Remise (€)"
        value={form.discount}
        onChange={(v) => setForm((p) => ({ ...p, discount: v }))}
      />
      <div className="flex items-center mt-2 sm:mt-6">
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
    </section>

    {/* Paiement */}
    <section className="rounded-xl p-4 sm:p-6 border border-gray-200 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Paiement</h3>

      <div className="mb-3">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant payé (€)</label>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            min="0"
            value={form.paidAmount}
            onChange={(e) => {
              const paid = parseFloat(e.target.value || "0");
              const total = getTotal({ ...form });
              setForm((prev) => ({
                ...prev,
                paidAmount: isNaN(paid) ? 0 : paid,
                paymentStatus: paid <= 0 ? "PENDING" : paid < total ? "PARTIAL" : "PAID",
              }));
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Total: <b>{getTotal(form).toFixed(2)}€</b>
          </p>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de paiement</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal border-gray-300 hover:bg-orange-50 min-h-[44px]">
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
    </section>

    {/* Mode de paiement */}
    <section>
      <label className="block text-sm font-medium text-gray-700 mb-3">Mode de paiement</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, paymentMethod: method.value }))}
              className={`p-4 rounded-lg border-2 text-center transition-all active:scale-[0.98] min-h-[64px]
                ${form.paymentMethod === method.value ? "border-orange-500 bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`}
            >
              <Icon size={22} className={`mx-auto mb-1 ${form.paymentMethod === method.value ? "text-orange-600" : "text-gray-600"}`} />
              <div className={`text-sm font-medium ${form.paymentMethod === method.value ? "text-orange-600" : "text-gray-900"}`}>
                {method.label}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">{method.desc}</div>
            </button>
          );
        })}
      </div>
    </section>
  </div>
);

export const PackageSteps = ({ 
  currentStep, 
  form, 
  setForm, 
  errors, 
  setErrors = () => {}, // Valeur par défaut pour éviter l'erreur
  clients,
  searchClient,
  setSearchClient,
  selectedClient,
  filteredClients
}) => {
  const stepProps = { form, setForm, errors, setErrors };

  switch (currentStep) {
    case 1:
      return (
        <ClientAndTypeStep
          {...stepProps}
          clients={clients}
          searchClient={searchClient}
          setSearchClient={setSearchClient}
          selectedClient={selectedClient}
          filteredClients={filteredClients}
        />
      );
    case 2:
      return <DetailsStep {...stepProps} />;
    case 3:
      return <AddressesStep {...stepProps} selectedClient={selectedClient} />;
    case 4:
      return <PricingStep {...stepProps} />;
    default:
      return null;
  }
};