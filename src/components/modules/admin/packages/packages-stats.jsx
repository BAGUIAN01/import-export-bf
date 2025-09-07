"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, CheckCircle2, CreditCard, AlertCircle, Clock } from "lucide-react";

export function PackagesStats({ stats }) {
  const items = [
    { 
      title: "Total Colis", 
      value: stats?.total || 0, 
      icon: Package, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      title: "En Transit", 
      value: stats?.inTransit || 0, 
      icon: Truck, 
      color: "text-orange-600", 
      bg: "bg-orange-50" 
    },
    { 
      title: "Livrés", 
      value: stats?.delivered || 0, 
      icon: CheckCircle2, 
      color: "text-green-600", 
      bg: "bg-green-50" 
    },
    { 
      title: "En Attente", 
      value: stats?.pending || 0, 
      icon: Clock, 
      color: "text-yellow-600", 
      bg: "bg-yellow-50" 
    },
    { 
      title: "Paiement Pending", 
      value: stats?.paymentPending || 0, 
      icon: CreditCard, 
      color: "text-red-600", 
      bg: "bg-red-50" 
    },
    { 
      title: "Problèmes", 
      value: stats?.issues || 0, 
      icon: AlertCircle, 
      color: "text-purple-600", 
      bg: "bg-purple-50" 
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.title !== "Total Colis" && stats?.total > 0 && (
                <p className="text-xs text-muted-foreground">
                  {Math.round(((stat.value || 0) / stats.total) * 100)}% du total
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}