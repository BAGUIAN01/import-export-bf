"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Container, Truck, CheckCircle2, Package } from "lucide-react";

export function ContainersStats({ stats }) {
  const {
    total = 0,
    inTransit = 0,
    delivered = 0,
    totalPackages = 0,
  } = stats || {};

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
              <p className="text-sm text-muted-foreground">Total conteneurs</p>
              <p className="text-2xl font-bold">{formatNumber(total)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Container className="h-6 w-6 text-blue-600" />
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
              <p className="text-sm text-muted-foreground">Livrés</p>
              <p className="text-2xl font-bold">{formatNumber(delivered)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Colis totaux</p>
              <p className="text-2xl font-bold">{formatNumber(totalPackages)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
