"use client";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  CreditCard, 
  AlertTriangle, 
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border-2 border-blue-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total expéditions</p>
              <p className="text-2xl font-bold">{formatNumber(total)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-orange-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En transit</p>
              <p className="text-2xl font-bold">{formatNumber(inTransit)}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Truck className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Livrées</p>
              <p className="text-2xl font-bold">{formatNumber(delivered)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-yellow-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">CA mensuel</p>
              <p className="text-2xl font-bold">{euro(monthlyRevenue)}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Wallet className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}