"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Receipt,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingDown,
  TrendingUp,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function formatPrice(amount) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.round((amount || 0) * 100) / 100) + " €";
}


export default function CaissePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalItems: 0,
    averageTicket: 0,
    salesGrowth: 0,
    revenueGrowth: 0,
    ticketGrowth: 0,
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Écouter les événements de création de commande
    const handleOrderCreated = () => {
      fetchStats();
    };

    window.addEventListener("caisse-order-created", handleOrderCreated);

    return () => {
      window.removeEventListener("caisse-order-created", handleOrderCreated);
    };
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/caisse/stats");
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
        setPaymentMethods(data.paymentMethods || []);
        setOrdersByStatus(data.ordersByStatus || []);
        setTopProducts(data.topProducts || []);
        setRecentSales(data.recentSales || []);
      } else {
        toast.error(data.error || "Erreur lors du chargement des statistiques");
      }
    } catch (error) {
      console.error("Error fetching caisse stats:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case "DELIVERED":
        return CheckCircle2;
      case "CANCELLED":
        return XCircle;
      case "PENDING":
        return Clock;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DELIVERED":
        return "text-green-600";
      case "CANCELLED":
        return "text-red-600";
      case "PENDING":
        return "text-amber-600";
      default:
        return "text-zinc-600";
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 md:p-8">
        {/* En-tête */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Caisse
          </h1>
          <p className="text-zinc-600 mt-1 text-sm sm:text-base">
            Gestion des encaissements et paiements · {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ventes aujourd'hui */}
        <Card
          className="transition-all hover:shadow-md border group bg-white border-blue-200 cursor-pointer hover:scale-[1.02]"
          onClick={() => router.push("/admin/caisse")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Ventes aujourd&apos;hui
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 transition-all group-hover:scale-105">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalSales}
                </div>
                {stats.salesGrowth !== 0 && (
                  <div className="flex items-center gap-1 text-xs text-zinc-600 mt-1">
                    {stats.salesGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span
                      className={
                        stats.salesGrowth > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {Math.abs(stats.salesGrowth).toFixed(1)}%
                    </span>
                    <span className="text-zinc-600">vs hier</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Montant encaissé */}
        <Card
          className="transition-all hover:shadow-md border group bg-white border-green-200 cursor-pointer hover:scale-[1.02]"
          onClick={() => router.push("/admin/caisse")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Montant encaissé
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-50 transition-all group-hover:scale-105">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats.totalRevenue)}
                </div>
                {stats.revenueGrowth !== 0 && (
                  <div className="flex items-center gap-1 text-xs text-zinc-600 mt-1">
                    {stats.revenueGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span
                      className={
                        stats.revenueGrowth > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {Math.abs(stats.revenueGrowth).toFixed(1)}%
                    </span>
                    <span className="text-zinc-600">vs hier</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Ticket moyen */}
        <Card
          className="transition-all hover:shadow-md border group bg-white border-purple-200 cursor-pointer hover:scale-[1.02]"
          onClick={() => router.push("/admin/caisse")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Ticket moyen
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50 transition-all group-hover:scale-105">
              <Receipt className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats.averageTicket)}
                </div>
                {stats.ticketGrowth !== 0 && (
                  <div className="flex items-center gap-1 text-xs text-zinc-600 mt-1">
                    {stats.ticketGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span
                      className={
                        stats.ticketGrowth > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {Math.abs(stats.ticketGrowth).toFixed(1)}%
                    </span>
                    <span className="text-zinc-600">vs hier</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Colis vendus */}
        <Card
          className="transition-all hover:shadow-md border group bg-white border-orange-200 cursor-pointer hover:scale-[1.02]"
          onClick={() => router.push("/admin/caisse")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Colis vendus
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-50 transition-all group-hover:scale-105">
              <Package className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalItems}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Détails supplémentaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top produits vendus */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top produits vendus</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 text-sm font-bold text-zinc-600">
                      {index + 1}
                    </div>
                    {product.image && (
                      <div className="relative w-12 h-12 rounded-md overflow-hidden border border-zinc-200">
                        <Image
                          src={product.image}
                          alt={product.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-zinc-900 truncate">
                        {product.productName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {product.quantity} unités · {formatPrice(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-600 text-center py-8">
                Aucune vente aujourd&apos;hui
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dernières ventes */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Dernières ventes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map((sale) => {
                  const StatusIcon = getStatusIcon(sale.status);
                  return (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-zinc-100">
                          <Receipt className="h-4 w-4 text-zinc-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-zinc-900 truncate">
                            {sale.orderNumber}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getStatusColor(sale.status)}`}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {sale.status}
                            </Badge>
                            <span className="text-xs text-zinc-600">
                              {sale.itemCount} article{sale.itemCount > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-zinc-900">
                          {formatPrice(sale.total)}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {format(new Date(sale.createdAt), "HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-600 text-center py-8">
                Aucune vente aujourd&apos;hui
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Méthodes de paiement et statuts */}
      {(paymentMethods.length > 0 || ordersByStatus.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Méthodes de paiement */}
          {paymentMethods.length > 0 && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Méthodes de paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-zinc-900">
                          {method.method}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-zinc-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${method.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 w-12 text-right">
                          {method.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Commandes par statut */}
          {ordersByStatus.length > 0 && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Commandes par statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ordersByStatus.map((status) => {
                    const StatusIcon = getStatusIcon(status.status);
                    return (
                      <div key={status.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${getStatusColor(status.status)}`} />
                          <span className="text-sm font-medium text-zinc-900">
                            {status.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-zinc-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${status.percentage}%`,
                                backgroundColor:
                                  status.status === "DELIVERED"
                                    ? "#10b981"
                                    : status.status === "CANCELLED"
                                    ? "#ef4444"
                                    : "#f59e0b",
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-zinc-900 w-12 text-right">
                            {status.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
