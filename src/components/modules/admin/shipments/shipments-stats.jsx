"use client";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  CreditCard, 
  AlertTriangle, 
  Wallet,
  TrendingUp,
  TrendingDown
} from "lucide-react";

function StatTile({ 
  icon: Icon, 
  label, 
  value, 
  sub, 
  trend,
  color = "slate",
  size = "normal"
}) {
  const colorClasses = {
    slate: {
      bg: "bg-slate-50",
      icon: "text-slate-700",
      value: "text-slate-900",
      trend: "text-slate-600"
    },
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-700",
      value: "text-blue-900",
      trend: "text-blue-600"
    },
    green: {
      bg: "bg-green-50",
      icon: "text-green-700",
      value: "text-green-900",
      trend: "text-green-600"
    },
    orange: {
      bg: "bg-orange-50",
      icon: "text-orange-700",
      value: "text-orange-900",
      trend: "text-orange-600"
    },
    red: {
      bg: "bg-red-50",
      icon: "text-red-700",
      value: "text-red-900",
      trend: "text-red-600"
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-700",
      value: "text-purple-900",
      trend: "text-purple-600"
    }
  };

  const colors = colorClasses[color] || colorClasses.slate;
  const isLarge = size === "large";

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-3 xs:p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 ${isLarge ? 'lg:col-span-2' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 xs:gap-3 flex-1 min-w-0">
          <div className={`p-2 xs:p-2.5 rounded-xl ${colors.bg} ring-1 ring-black/5 flex-shrink-0`}>
            <Icon className={`h-4 w-4 xs:h-5 xs:w-5 ${colors.icon}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs xs:text-sm font-medium text-gray-600 mb-1 truncate">{label}</div>
            <div className={`text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold ${colors.value} leading-tight`}>
              {value}
            </div>
            {sub && (
              <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                {sub}
              </div>
            )}
          </div>
        </div>
        
        {trend && (
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3 xs:h-4 xs:w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 xs:h-4 xs:w-4 text-red-600" />
            )}
            <span className={`text-xs font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ShipmentsStats({ stats }) {
  const {
    total = 0,
    inTransit = 0,
    delivered = 0,
    paymentPending = 0,
    issues = 0,
    monthlyRevenue = 0,
    statusBreakdown = {},
    paymentBreakdown = {},
    trends = {}
  } = stats || {};

  const euro = (n) => {
    const num = Number(n || 0);
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: num >= 1000 ? 0 : 2,
    }).format(num);
  };

  const formatNumber = (n) => {
    const num = Number(n || 0);
    if (num >= 1000) {
      return new Intl.NumberFormat('fr-FR', {
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(num);
    }
    return num.toString();
  };

  return (
    <div className="space-y-4 xs:space-y-6">
      {/* Titre de section */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0">
        <h2 className="text-base xs:text-lg font-semibold text-gray-900">
          Tableau de bord des expéditions
        </h2>
        <div className="text-xs xs:text-sm text-gray-500">
          Données en temps réel
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 xs:gap-4 sm:gap-4 md:gap-6">
        <StatTile 
          icon={Package} 
          label="Total expéditions" 
          value={formatNumber(total)}
          color="blue"
          trend={trends.total}
        />
        
        <StatTile
          icon={Truck}
          label="En transit"
          value={formatNumber(inTransit)}
          sub={
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span>Préparation:</span>
                <span className="font-medium">{statusBreakdown.PREPARATION || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Douanes:</span>
                <span className="font-medium">{statusBreakdown.CUSTOMS || 0}</span>
              </div>
            </div>
          }
          color="orange"
          trend={trends.inTransit}
        />
        
        <StatTile
          icon={CheckCircle2}
          label="Livrées"
          value={formatNumber(delivered)}
          sub={
            <div className="flex justify-between">
              <span>Chargées:</span>
              <span className="font-medium">{statusBreakdown.LOADED || 0}</span>
            </div>
          }
          color="green"
          trend={trends.delivered}
        />
        
        <StatTile
          icon={CreditCard}
          label="Paiements en attente"
          value={formatNumber(paymentPending)}
          sub={
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span>Partiels:</span>
                <span className="font-medium">{paymentBreakdown.PARTIAL || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>En attente:</span>
                <span className="font-medium">{paymentBreakdown.PENDING || 0}</span>
              </div>
            </div>
          }
          color="purple"
          trend={trends.paymentPending}
        />
        
        <StatTile
          icon={AlertTriangle}
          label="Incidents"
          value={formatNumber(issues)}
          sub={
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span>Annulées:</span>
                <span className="font-medium">{paymentBreakdown.CANCELLED || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Remboursées:</span>
                <span className="font-medium">{paymentBreakdown.REFUNDED || 0}</span>
              </div>
            </div>
          }
          color="red"
          trend={trends.issues}
        />
        
        <StatTile
          icon={Wallet}
          label="Encaissements ce mois"
          value={euro(monthlyRevenue)}
          color="green"
          trend={trends.revenue}
        />
      </div>

      {/* Indicateurs de performance supplémentaires */}
      {(trends.revenue || trends.total) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 xs:p-6 border border-blue-100">
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-3 xs:mb-4 gap-2 xs:gap-0">
              <h3 className="text-sm xs:text-base font-semibold text-blue-900">Performance mensuelle</h3>
              <div className="flex items-center gap-1 text-blue-700">
                <TrendingUp className="h-3 w-3 xs:h-4 xs:w-4" />
                <span className="text-xs xs:text-sm font-medium">+12%</span>
              </div>
            </div>
            <div className="space-y-2 xs:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs xs:text-sm text-blue-700">Taux de livraison</span>
                <span className="text-sm xs:text-base font-semibold text-blue-900">
                  {total > 0 ? Math.round((delivered / total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5 xs:h-2">
                <div 
                  className="bg-blue-600 h-1.5 xs:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (delivered / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 xs:p-6 border border-green-100">
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-3 xs:mb-4 gap-2 xs:gap-0">
              <h3 className="text-sm xs:text-base font-semibold text-green-900">Santé financière</h3>
              <div className="flex items-center gap-1 text-green-700">
                <TrendingUp className="h-3 w-3 xs:h-4 xs:w-4" />
                <span className="text-xs xs:text-sm font-medium">+8%</span>
              </div>
            </div>
            <div className="space-y-2 xs:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs xs:text-sm text-green-700">Taux de paiement</span>
                <span className="text-sm xs:text-base font-semibold text-green-900">
                  {total > 0 ? Math.round(((total - paymentPending) / total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-1.5 xs:h-2">
                <div 
                  className="bg-green-600 h-1.5 xs:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? ((total - paymentPending) / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}