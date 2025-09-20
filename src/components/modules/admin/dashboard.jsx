"use client";
import React, { useState, useEffect } from "react";
import {
  Package,
  Container,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Calendar,
  Euro,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";



const statusConfig = {
  PREPARATION: { label: "Préparation", variant: "secondary" },
  LOADED: { label: "Chargé", variant: "default" },
  IN_TRANSIT: { label: "En transit", variant: "default" },
  CUSTOMS: { label: "Douane", variant: "destructive" },
  DELIVERED: {
    label: "Livré",
    variant: "default",
    className: "bg-green-100 text-green-800",
  },
  CANCELLED: { label: "Annulé", variant: "destructive" },
};

export default function Dashboard({ user, data }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const { stats, recentContainers } = data || { stats: {}, recentContainers: [] };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* En-tête de bienvenue */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
            Bonjour, {user?.firstName || user?.name || "Admin"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            <span className="hidden sm:inline">
              {currentTime.toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="sm:hidden">
              {currentTime.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {" • "}
            {currentTime.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button className="w-full sm:w-auto" asChild>
            <Link href="/admin/packages">
              <Package className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Nouveau colis</span>
              <span className="xs:hidden">Colis</span>
            </Link>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/admin/containers">
              <Container className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Nouveau conteneur</span>
              <span className="xs:hidden">Conteneur</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Colis total
                </p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalPackages || 0}</p>
                <p className="text-xs text-muted-foreground">
                  +{stats.packagesThisMonth || 0} ce mois
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-50 rounded-lg flex-shrink-0">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Conteneurs actifs
                </p>
                <p className="text-xl sm:text-2xl font-bold">{stats.activeContainers || 0}</p>
                <p className="text-xs text-muted-foreground">
                  En cours de transport
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-50 rounded-lg flex-shrink-0">
                <Container className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Clients
                </p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalClients || 0}</p>
                <p className="text-xs text-muted-foreground">
                  Base client active
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-50 rounded-lg flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  CA mensuel
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {(stats.monthlyRevenue || 0).toLocaleString()}€
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs mois dernier
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-50 rounded-lg flex-shrink-0">
                <Euro className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteneurs récents - Section élargie */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Container className="h-5 w-5" />
            Conteneurs récents
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/containers">
              <span className="hidden sm:inline">Voir tout</span>
              <span className="sm:hidden">Tout</span>
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {recentContainers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentContainers.slice(0, 6).map((container) => {
                const statusInfo = statusConfig[container.status];
                const loadPercentage = (container.currentLoad / container.capacity) * 100;

                return (
                  <Link
                    key={container.id}
                    href={`/admin/containers/${container.id}`}
                    className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h4 className="font-medium text-sm sm:text-base truncate">
                          {container.containerNumber}
                        </h4>
                        <Badge
                          variant={statusInfo.variant}
                          className={`text-xs ${statusInfo.className || ''}`}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground flex-shrink-0 ml-2">
                        {container.currentLoad}/{container.capacity}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{container.currentLocation || container.origin}</span>
                      </div>
                      <Progress value={loadPercentage} className="h-2" />
                    </div>

                    {container.name && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2 truncate">
                        {container.name}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Container className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun conteneur trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Button variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2" asChild>
              <Link href="/admin/packages">
                <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm text-center">
                  <span className="hidden sm:inline">Gestion colis</span>
                  <span className="sm:hidden">Colis</span>
                </span>
              </Link>
            </Button>

            <Button variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2" asChild>
              <Link href="/admin/containers">
                <Container className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm">Conteneurs</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2" asChild>
              <Link href="/admin/clients">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm">Clients</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2" asChild>
              <Link href="/admin/reports">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm">Rapports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}