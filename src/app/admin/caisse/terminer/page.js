"use client";

import { useRouter } from "next/navigation";
import { useCaisse } from "@/contexts/caisse-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft, ShoppingCart } from "lucide-react";

/* ── Utilitaires ─────────────────────────────────────────────── */
function formatPrice(amount) {
  return Math.round(amount || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

/* ── Page ────────────────────────────────────────────────────── */
export default function TerminerPage() {
  const router = useRouter();
  const {
    selectedClient,
    orderItems,
    orderTotal,
    clearSession,
  } = useCaisse();

  const handleTerminer = () => {
    // Vider la commande et le client sélectionné
    clearSession();

    // Rediriger vers la page client pour commencer une nouvelle transaction
    setTimeout(() => {
      router.push("/admin/caisse/client");
    }, 1000);
  };

  if (!selectedClient && orderItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold mb-2">Aucune transaction en cours</h3>
            <p className="text-zinc-600 mb-4">
              Vous pouvez commencer une nouvelle transaction.
            </p>
            <Button onClick={() => router.push("/admin/caisse/client")}>
              Nouvelle transaction
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 h-full overflow-y-auto pb-8 p-3 sm:p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Terminer la transaction</h2>
        <p className="text-zinc-600">
          Finalisez la transaction en cours
        </p>
      </div>

      {/* Récapitulatif */}
      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif de la transaction</CardTitle>
          <CardDescription>
            Vérifiez les informations avant de finaliser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedClient && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Client</h3>
              <p className="text-sm">
                {selectedClient.name}
              </p>
              {selectedClient.email && (
                <p className="text-xs text-zinc-600">
                  {selectedClient.email}
                </p>
              )}
              {selectedClient.phone && (
                <p className="text-xs text-zinc-600">
                  {selectedClient.phone}
                </p>
              )}
            </div>
          )}

          {orderItems.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Items commandés</h3>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span className="font-medium">{formatPrice(item.total)} FCFA</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between font-bold">
                <span>Total</span>
                <span className="text-lam-orange">
                  {formatPrice(orderTotal)} FCFA
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/caisse/commande")}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Modifier la commande
            </Button>
            <Button
              onClick={handleTerminer}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Terminer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

