"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserPlus, CreditCard, Star, MapPin } from "lucide-react";

export function ClientsStats({ stats }) {
  const items = [
    { 
      title: "Total Clients", 
      value: stats?.total || 0, 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      title: "Actifs", 
      value: stats?.active || 0, 
      icon: UserCheck, 
      color: "text-green-600", 
      bg: "bg-green-50" 
    },
    { 
      title: "Nouveaux (30j)", 
      value: stats?.newThisMonth || 0, 
      icon: UserPlus, 
      color: "text-purple-600", 
      bg: "bg-purple-50" 
    },
    { 
      title: "Avec Commandes", 
      value: stats?.withOrders || 0, 
      icon: CreditCard, 
      color: "text-orange-600", 
      bg: "bg-orange-50" 
    },
    { 
      title: "Clients VIP", 
      value: stats?.vip || 0, 
      icon: Star, 
      color: "text-yellow-600", 
      bg: "bg-yellow-50" 
    },
    { 
      title: "Burkina Faso", 
      value: stats?.burkinaRecipients || 0, 
      icon: MapPin, 
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
              {stat.title !== "Total Clients" && stats?.total > 0 && (
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