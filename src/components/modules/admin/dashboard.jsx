"use client";
import React from "react";
import { Package, Container, Users, Euro, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const statusConfig = {
  PREPARATION: { label: "Préparation", variant: "secondary" },
  LOADED: { label: "Chargé", variant: "default" },
  IN_TRANSIT: { label: "En transit", variant: "default" },
  CUSTOMS: { label: "Douane", variant: "destructive" },
  DELIVERED: { label: "Livré", variant: "default", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Annulé", variant: "destructive" },
};

export default function Dashboard({ user, data }) {
  const { stats, recentContainers } = data || { stats: {}, recentContainers: [] };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Colis total</p>
                <p className="text-2xl font-bold">{stats.totalPackages || 0}</p>
                <p className="text-xs text-muted-foreground">
                  +{stats.packagesThisMonth || 0} ce mois
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conteneurs actifs</p>
                <p className="text-2xl font-bold">{stats.activeContainers || 0}</p>
                <p className="text-xs text-muted-foreground">En cours de transport</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Container className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">{stats.totalClients || 0}</p>
                <p className="text-xs text-muted-foreground">Base client active</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CA mensuel</p>
                <p className="text-2xl font-bold">
                  {(stats.monthlyRevenue || 0).toLocaleString()}€
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Euro className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Container className="h-5 w-5" />
            Conteneurs récents
          </CardTitle>
          <Link href="/admin/containers" className="text-sm text-muted-foreground hover:text-foreground">
            Voir tout
          </Link>
        </CardHeader>
        <CardContent>
          {recentContainers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentContainers.map((container) => {
                const statusInfo = statusConfig[container.status] || statusConfig.PREPARATION;
                const loadPercentage = container.capacity > 0 
                  ? (container.currentLoad / container.capacity) * 100 
                  : 0;

                return (
                  <Link
                    key={container.id}
                    href={`/admin/containers/${container.id}`}
                    className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h4 className="font-medium truncate">{container.containerNumber}</h4>
                        <Badge variant={statusInfo.variant} className={`text-xs ${statusInfo.className || ''}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {container.currentLoad}/{container.capacity}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{container.currentLocation || container.origin}</span>
                      </div>
                      <Progress value={loadPercentage} className="h-2" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Container className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun conteneur trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}