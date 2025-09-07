"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container, Truck, CheckCircle2, Clock, AlertCircle, Package } from "lucide-react";

// Composant Statistiques
export  function ContainersStats({ stats }) {
  const items = [
    { 
      title: "Total Conteneurs", 
      value: stats?.total || 0, 
      icon: Container, 
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
      title: "En Préparation", 
      value: stats?.preparation || 0, 
      icon: Clock, 
      color: "text-yellow-600", 
      bg: "bg-yellow-50" 
    },
    { 
      title: "Colis Totaux", 
      value: stats?.totalPackages || 0, 
      icon: Package, 
      color: "text-purple-600", 
      bg: "bg-purple-50" 
    },
    { 
      title: "Problèmes", 
      value: stats?.issues || 0, 
      icon: AlertCircle, 
      color: "text-red-600", 
      bg: "bg-red-50" 
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
              {stat.title !== "Total Conteneurs" && stat.title !== "Colis Totaux" && stats?.total > 0 && (
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
