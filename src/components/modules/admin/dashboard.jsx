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

const mockData = {
  stats: {
    totalPackages: 847,
    packagesThisMonth: 234,
    activeContainers: 12,
    totalClients: 156,
    monthlyRevenue: 45280,
    deliveredThisWeek: 89,
  },
  recentContainers: [
    {
      id: "1",
      containerNumber: "CNT202501001",
      name: "Conteneur Express Janvier",
      status: "IN_TRANSIT",
      currentLocation: "Port d'Abidjan",
      departureDate: "2025-01-15",
      currentLoad: 85,
      capacity: 100,
    },
    {
      id: "2",
      containerNumber: "CNT202501002",
      name: "Conteneur Standard Février",
      status: "PREPARATION",
      currentLocation: "Lyon, France",
      departureDate: "2025-02-01",
      currentLoad: 45,
      capacity: 100,
    },
    {
      id: "3",
      containerNumber: "CNT202412015",
      name: "Conteneur Décembre",
      status: "DELIVERED",
      currentLocation: "Ouagadougou",
      departureDate: "2024-12-20",
      currentLoad: 100,
      capacity: 100,
    },
  ],
  recentActivity: [
    {
      id: 1,
      type: "container_update",
      message: "CNT202501001 - Arrivée au port d'Abidjan",
      time: "Il y a 2h",
      status: "info",
    },
    {
      id: 2,
      type: "package_delivered",
      message: "PKG20250115789 livré avec succès",
      time: "Il y a 4h",
      status: "success",
    },
    {
      id: 3,
      type: "new_client",
      message: "Nouveau client enregistré: Marie Dupont",
      time: "Il y a 6h",
      status: "info",
    },
    {
      id: 4,
      type: "alert",
      message: "Retard signalé sur CNT202412020",
      time: "Il y a 1j",
      status: "warning",
    },
  ],
};

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

const getActivityIcon = (type, status) => {
  if (status === "success")
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "warning")
    return <AlertCircle className="h-4 w-4 text-orange-500" />;
  return <Activity className="h-4 w-4 text-blue-500" />;
};

export default function Dashboard({ user, data }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const { stats, recentContainers, recentActivity } = data;

  return (
    <div className="space-y-8">
      {/* En-tête de bienvenue */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour, {user?.firstName || user?.name || "Admin"}
          </h1>
          <p className="text-muted-foreground">
            {currentTime.toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            •{" "}
            {currentTime.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/admin/packages/new">
              <Package className="h-4 w-4 mr-2" />
              Nouveau colis
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/containers/new">
              <Container className="h-4 w-4 mr-2" />
              Nouveau conteneur
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Colis total
                </p>
                <p className="text-2xl font-bold">{stats.totalPackages}</p>
                <p className="text-xs text-muted-foreground">
                  +{stats.packagesThisMonth} ce mois
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Conteneurs actifs
                </p>
                <p className="text-2xl font-bold">{stats.activeContainers}</p>
                <p className="text-xs text-muted-foreground">
                  En cours de transport
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Container className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Clients
                </p>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
                <p className="text-xs text-muted-foreground">
                  Base client active
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  CA mensuel
                </p>
                <p className="text-2xl font-bold">
                  {stats.monthlyRevenue.toLocaleString()}€
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs mois dernier
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Euro className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Conteneurs récents */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Container className="h-5 w-5" />
                Conteneurs récents
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/containers">
                  Voir tout
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentContainers.length > 0 ? (
                (() => {
                  const container = recentContainers[0]; // Prendre seulement le premier (le plus récent)
                  const statusInfo = statusConfig[container.status];
                  const loadPercentage =
                    (container.currentLoad / container.capacity) * 100;

                  return (
                    <Link
                      href={`/admin/containers/${container.id}`}
                      className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">
                            {container.containerNumber}
                          </h4>
                          <Badge
                            variant={statusInfo.variant}
                            className={statusInfo.className}
                          >
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
                          {container.currentLocation || container.origin}
                        </div>
                        <Progress value={loadPercentage} className="h-2" />
                      </div>

                      {container.name && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {container.name}
                        </p>
                      )}
                    </Link>
                  );
                })()
              ) : (
                <div className="text-center py-8">
                  <Container className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucun conteneur trouvé
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activité récente */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-5">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/admin/packages">
                <Package className="h-6 w-6" />
                <span className="text-sm">Gestion colis</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/admin/containers">
                <Container className="h-6 w-6" />
                <span className="text-sm">Conteneurs</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/admin/clients">
                <Users className="h-6 w-6" />
                <span className="text-sm">Clients</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/admin/reports">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Rapports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
