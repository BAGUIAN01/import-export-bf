"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Minus, Trash2, ShoppingCart, Search, X,
  Sparkles, Heart, Wind, Pill, Package, Droplets, Sun, Star, Leaf,
} from "lucide-react";

import { PACKAGE_TYPES, PACKAGE_CATEGORIES } from "@/lib/data/packages";
import { useCaisse } from "@/contexts/caisse-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ── Utilitaires ─────────────────────────────────────────────── */
function formatPrice(amount) {
  return Math.round(amount || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

function getCategoryIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("soin") || n.includes("skin"))            return Heart;
  if (n.includes("parfum") || n.includes("fragrance"))     return Wind;
  if (n.includes("médicament") || n.includes("pharma"))    return Pill;
  if (n.includes("beauté") || n.includes("maquillage"))    return Sparkles;
  if (n.includes("solaire") || n.includes("sun"))          return Sun;
  if (n.includes("hygiène") || n.includes("hygiene"))      return Droplets;
  if (n.includes("naturel") || n.includes("bio"))          return Leaf;
  if (n.includes("premium") || n.includes("luxe"))         return Star;
  return Package;
}


/* ── Page ────────────────────────────────────────────────────── */
export default function CommandePage() {
  const router = useRouter();
  const {
    selectedClient, orderItems,
    addItem, updateItemQuantity, removeItem,
    orderSubtotal, orderTotal,
    orderOptions,
  } = useCaisse();

  const [selectedCategory, setSelectedCategory] = useState(PACKAGE_CATEGORIES[0]);
  const [categorySearch, setCategorySearch]     = useState("");
  const [productSearch, setProductSearch]       = useState("");

  /* ── Types de colis filtrés par catégorie sélectionnée ── */
  const products = PACKAGE_TYPES.filter((t) => t.category === selectedCategory?.key);

  /* ── Helpers ── */
  const getProductQty = (typeValue) =>
    orderItems.find((i) => i.productId === typeValue)?.quantity ?? 0;

  const getCategoryQty = (catKey) =>
    orderItems
      .filter((i) => i.categoryId === catKey)
      .reduce((sum, i) => sum + i.quantity, 0);

  const filteredCategories = PACKAGE_CATEGORIES.filter(
    (c) => !categorySearch || c.label.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredProducts = products.filter(
    (t) =>
      !productSearch ||
      t.label?.toLowerCase().includes(productSearch.toLowerCase()) ||
      t.desc?.toLowerCase().includes(productSearch.toLowerCase())
  );

  /* ── État : pas de client ── */
  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="shadow-none w-full max-w-sm">
          <CardContent className="p-8 text-center space-y-4">
            <ShoppingCart className="h-12 w-12 mx-auto text-zinc-400" />
            <div>
              <h3 className="font-semibold text-zinc-900">Aucun client sélectionné</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Sélectionnez d'abord un client pour commencer une commande.
              </p>
            </div>
            <Button
              onClick={() => router.push("/admin/caisse/client")}
              className="bg-orange-500 hover:bg-orange-600 text-white w-full"
            >
              Sélectionner un client
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen gap-2 sm:gap-3 p-2 sm:p-4 overflow-hidden">

      {/* ══ Panneau gauche : résumé commande (Desktop) ══════════════════════ */}
      <div className="hidden lg:flex w-72 shrink-0 bg-white rounded-xl border border-zinc-200 flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-100 shrink-0">
          <p className="font-semibold text-zinc-900">Commande</p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{selectedClient.name}</p>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {orderItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500">
              <ShoppingCart className="h-10 w-10" />
              <p className="text-xs">Aucun colis ajouté</p>
            </div>
          ) : (
            orderItems.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-50 border border-zinc-100 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-medium text-zinc-900 leading-tight line-clamp-2 flex-1">
                    {item.name}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-zinc-500 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateItemQuantity(item.id, -1)}
                      className="w-6 h-6 rounded border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(item.id, 1)}
                      className="w-6 h-6 rounded border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-orange-600">
                    {formatPrice(item.total)} €
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-100 shrink-0 space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Sous-total</span>
              <span className="text-zinc-900 font-medium">{formatPrice(orderSubtotal)} €</span>
            </div>
            {orderOptions.discount > 0 && (
              <div className="flex items-center justify-between text-green-600">
                <span>Remise</span>
                <span>-{formatPrice(orderOptions.discount)} €</span>
              </div>
            )}
            {orderOptions.additionalFees > 0 && (
              <div className="flex items-center justify-between text-zinc-600">
                <span>Frais supplémentaires</span>
                <span>+{formatPrice(orderOptions.additionalFees)} €</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
            <span className="text-sm font-semibold text-zinc-900">Total</span>
            <span className="text-lg font-bold text-orange-600">
              {formatPrice(orderTotal)} €
            </span>
          </div>

          <Button
            disabled={orderItems.length === 0}
            onClick={() => router.push("/admin/caisse/encaissement")}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white"
          >
            Valider la commande
          </Button>
        </div>
      </div>

      {/* ══ Centre : grille types de colis ═══════════════════════════════════ */}
      <div className="flex-1 bg-white rounded-xl border border-zinc-200 flex flex-col overflow-hidden min-w-0 order-2 md:order-1">
        {/* Barre top */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 border-b border-zinc-100 shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <p className="font-semibold text-zinc-900 shrink-0 truncate text-sm sm:text-base">
              {selectedCategory?.label ?? "Colis"}
            </p>
            {orderItems.length > 0 && (
              <Badge className="bg-orange-500 text-white shrink-0 text-xs">
                {orderItems.reduce((s, i) => s + i.quantity, 0)} colis
              </Badge>
            )}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un type de colis…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-sm rounded-lg border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
            {productSearch && (
              <button
                onClick={() => setProductSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Grille */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500">
              <Package className="h-10 w-10" />
              <p className="text-sm">
                {productSearch ? "Aucun type trouvé" : "Aucun type dans cette catégorie"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {filteredProducts.map((type) => {
                const qty  = getProductQty(type.value);
                const Icon = type.icon ?? Package;

                return (
                  <div
                    key={type.value}
                    onClick={() =>
                      addItem({
                        id:         type.value,
                        name:       type.label,
                        price:      type.price,
                        categoryId: selectedCategory?.key,
                      })
                    }
                    className={cn(
                      "relative bg-white border rounded-xl p-3 cursor-pointer transition-all select-none",
                      qty > 0
                        ? "border-orange-300 ring-1 ring-orange-200"
                        : "border-zinc-200 hover:border-orange-300 hover:shadow-md"
                    )}
                  >
                    {/* Badge quantité */}
                    {qty > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white h-5 min-w-5 rounded-full flex items-center justify-center p-0 text-[10px] font-bold shadow-lg">
                        {qty}
                      </Badge>
                    )}

                    {/* Icône */}
                    <div className="w-full aspect-square rounded-lg bg-zinc-50 mb-2 overflow-hidden flex items-center justify-center">
                      <Icon className="h-8 w-8 text-zinc-500" />
                    </div>

                    {/* Nom */}
                    <p className="text-xs font-medium text-zinc-800 leading-tight line-clamp-2 mb-1">
                      {type.label}
                    </p>

                    {/* Description */}
                    {type.desc && (
                      <p className="text-[10px] text-zinc-400 leading-tight line-clamp-1 mb-1">
                        {type.desc}
                      </p>
                    )}

                    {/* Prix */}
                    {type.isQuoteOnly ? (
                      <p className="text-xs font-bold text-zinc-400 text-center">Sur devis</p>
                    ) : (
                      <p className="text-sm font-semibold text-orange-600 text-center">
                        {formatPrice(type.price)} €
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ Droite : catégories (Desktop) ════════════════════════════════════ */}
      <div className="hidden lg:flex w-32 shrink-0 bg-gradient-to-b from-orange-500 to-orange-600 rounded-xl flex-col overflow-hidden border-2 border-orange-700 shadow-2xl order-3">

        {/* Header + recherche */}
        <div className="px-2 pt-3 pb-2 border-b-2 border-orange-700 bg-orange-600/50 backdrop-blur-sm shrink-0">
          <p className="text-[10px] font-bold text-white text-center mb-2 tracking-wide uppercase">
            Catégories
          </p>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/80 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 text-[10px] rounded-md bg-white/15 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/25 focus:border-white/50 transition-all"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredCategories.map((cat) => {
            const Icon   = getCategoryIcon(cat.label);
            const active = selectedCategory?.key === cat.key;
            const qty    = getCategoryQty(cat.key);

            return (
              <button
                key={cat.key}
                onClick={() => { setSelectedCategory(cat); setProductSearch(""); }}
                className={cn(
                  "relative w-full flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-lg transition-all duration-200 text-center",
                  active
                    ? "bg-white text-orange-600 font-bold shadow-lg"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/15 hover:border-white/30"
                )}
              >
                {/* Indicateur gauche actif */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />
                )}

                {/* Badge quantité catégorie */}
                {qty > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-orange-600 text-[9px] font-bold min-w-5 h-5 rounded-full flex items-center justify-center px-1 border-2 border-orange-500 shadow-xl pointer-events-none">
                    {qty}
                  </span>
                )}

                <Icon className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-orange-600" : "text-white/90"
                )} />
                <span className={cn(
                  "text-[9px] font-medium leading-tight line-clamp-2",
                  active ? "text-orange-600" : "text-white"
                )}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>


    </div>
  );
}
