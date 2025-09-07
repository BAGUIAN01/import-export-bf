"use client";
import React, { useState } from 'react';
import { 
  Users, Package, Container, CreditCard, TrendingUp, Clock, 
  MapPin, AlertCircle, CheckCircle, MoreHorizontal, Calendar,
  ArrowUpRight, ArrowDownRight, Eye, Search, Filter, Plus,
  Truck, Globe, DollarSign, Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Données simulées
const stats = {
  totalClients: 247,
  activePackages: 89,
  monthlyRevenue: 45230.50,
  containersInTransit: 3,
  pendingPayments: 12,
  deliveredThisMonth: 156
};

const recentPackages = [
  {
    id: "PKG202501045",
    client: "Sophie Martin",
    destination: "Ouagadougou",
    status: "IN_TRANSIT",
    amount: 125.00,
    date: "2024-12-15",
    priority: "NORMAL"
  },
  {
    id: "PKG202501046", 
    client: "Jean Dupont",
    destination: "Bobo-Dioulasso",
    status: "DELIVERED",
    amount: 180.50,
    date: "2024-12-14",
    priority: "HIGH"
  },
  {
    id: "PKG202501047",
    client: "Marie Kouadio",
    destination: "Koudougou",
    status: "CUSTOMS",
    amount: 95.00,
    date: "2024-12-13", 
    priority: "URGENT"
  },
  {
    id: "PKG202501048",
    client: "Pierre Lambert",
    destination: "Ouahigouya",
    status: "REGISTERED",
    amount: 75.00,
    date: "2024-12-12",
    priority: "NORMAL"
  }
];

const containers = [
  {
    id: "CNT202501003",
    name: "Conteneur Décembre 2024",
    status: "IN_TRANSIT",
    progress: 65,
    location: "En mer - Méditerranée",
    packages: 34,
    departureDate: "2024-12-05",
    estimatedArrival: "2024-12-20"
  },
  {
    id: "CNT202501004",
    name: "Conteneur Janvier 2025",
    status: "PREPARATION", 
    progress: 45,
    location: "Entrepôt Paris",
    packages: 28,
    departureDate: "2025-01-15",
    estimatedArrival: "2025-01-30"
  },
  {
    id: "CNT202501005",
    name: "Conteneur Février 2025",
    status: "PREPARATION",
    progress: 12,
    location: "En cours de chargement",
    packages: 8,
    departureDate: "2025-02-10", 
    estimatedArrival: "2025-02-25"
  }
];

const recentActivities = [
  {
    type: "package_delivered",
    message: "Colis PKG202501046 livré à Jean Dupont",
    time: "Il y a 2h",
    icon: CheckCircle,
    color: "text-green-600"
  },
  {
    type: "payment_received",
    message: "Paiement de 180.50€ reçu de Sophie Martin",
    time: "Il y a 3h", 
    icon: CreditCard,
    color: "text-blue-600"
  },
  {
    type: "container_departure",
    message: "Conteneur CNT202501003 en transit",
    time: "Il y a 5h",
    icon: Truck,
    color: "text-orange-600"
  },
  {
    type: "new_client",
    message: "Nouveau client inscrit: Marie Kouadio",
    time: "Il y a 1j",
    icon: Users,
    color: "text-purple-600"
  }
];

const statusConfig = {
  REGISTERED: { label: "Enregistré", color: "bg-blue-50 text-blue-700 border-blue-200" },
  IN_TRANSIT: { label: "En transit", color: "bg-orange-50 text-orange-700 border-orange-200" },
  DELIVERED: { label: "Livré", color: "bg-green-50 text-green-700 border-green-200" },
  CUSTOMS: { label: "Douanes", color: "bg-red-50 text-red-700 border-red-200" },
  PREPARATION: { label: "Préparation", color: "bg-gray-50 text-gray-700 border-gray-200" }
};

const priorityConfig = {
  LOW: { label: "Faible", color: "bg-gray-50 text-gray-600" },
  NORMAL: { label: "Normal", color: "bg-blue-50 text-blue-600" },
  HIGH: { label: "Élevé", color: "bg-orange-50 text-orange-600" },
  URGENT: { label: "Urgent", color: "bg-red-50 text-red-600" }
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const StatCard = ({ title, value, description, icon: Icon, trend, trendValue }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <div className="flex items-center pt-1">
            {trend && (
              <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {trendValue}
              </div>
            )}
            <p className="text-xs text-muted-foreground ml-2">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble de votre activité d'expédition</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Derniers 30 jours
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau colis
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={stats.totalClients.toLocaleString()}
          description="ce mois"
          icon={Users}
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Colis Actifs"
          value={stats.activePackages}
          description={`${stats.pendingPayments} en attente`}
          icon={Package}
          trend="up"
          trendValue="+5%"
        />
        <StatCard
          title="Chiffre d'Affaires"
          value={`${stats.monthlyRevenue.toLocaleString()}€`}
          description="ce mois"
          icon={DollarSign}
          trend="up"
          trendValue="+23%"
        />
        <StatCard
          title="Conteneurs"
          value={stats.containersInTransit}
          description="en transit"
          icon={Container}
          trend="down"
          trendValue="-1"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="packages">Colis</TabsTrigger>
          <TabsTrigger value="containers">Conteneurs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Graphique principal */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Évolution du chiffre d'affaires</CardTitle>
                <CardDescription>Revenus des 12 derniers mois</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-end justify-between px-4 space-x-2">
                  {[32, 45, 38, 52, 48, 61, 55, 67, 73, 69, 78, 85].map((height, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div 
                        className="bg-primary w-8 rounded-t transition-all hover:bg-primary/80"
                        style={{ height: `${height * 3}px` }}
                      ></div>
                      <span className="text-xs text-muted-foreground">
                        {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activité récente */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>Dernières actions sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`p-1 rounded-full ${activity.color}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Derniers colis */}
            <Card className="col-span-4">
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                  <CardTitle>Derniers colis</CardTitle>
                  <CardDescription>Colis récemment créés ou mis à jour</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto">
                  <Eye className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPackages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">{pkg.id}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${priorityConfig[pkg.priority].color}`}
                            >
                              {priorityConfig[pkg.priority].label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{pkg.client} → {pkg.destination}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant="outline" 
                          className={statusConfig[pkg.status].color}
                        >
                          {statusConfig[pkg.status].label}
                        </Badge>
                        <p className="text-sm font-medium">{pkg.amount.toFixed(2)}€</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Voir détails</DropdownMenuItem>
                            <DropdownMenuItem>Modifier</DropdownMenuItem>
                            <DropdownMenuItem>Suivi</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* État des conteneurs */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>État des conteneurs</CardTitle>
                <CardDescription>Suivi en temps réel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {containers.map((container) => (
                  <div key={container.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{container.name}</p>
                        <p className="text-xs text-muted-foreground">{container.packages} colis</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={statusConfig[container.status].color}
                      >
                        {statusConfig[container.status].label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Chargement</span>
                        <span>{container.progress}%</span>
                      </div>
                      <Progress value={container.progress} className="h-2" />
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {container.location}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestion des colis</CardTitle>
                  <CardDescription>Liste complète de tous vos colis</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher..." className="pl-8 w-[300px]" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau colis
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPackages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{pkg.id}</p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${priorityConfig[pkg.priority].color}`}
                          >
                            {priorityConfig[pkg.priority].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{pkg.client}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{pkg.destination}</p>
                        <p className="text-xs text-muted-foreground">{pkg.date}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={statusConfig[pkg.status].color}
                      >
                        {statusConfig[pkg.status].label}
                      </Badge>
                      <p className="font-medium w-20 text-right">{pkg.amount.toFixed(2)}€</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Voir détails</DropdownMenuItem>
                          <DropdownMenuItem>Modifier</DropdownMenuItem>
                          <DropdownMenuItem>Suivi</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="containers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {containers.map((container) => (
              <Card key={container.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{container.name}</CardTitle>
                    <Badge 
                      variant="outline" 
                      className={statusConfig[container.status].color}
                    >
                      {statusConfig[container.status].label}
                    </Badge>
                  </div>
                  <CardDescription>{container.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Chargement</span>
                      <span className="font-medium">{container.progress}%</span>
                    </div>
                    <Progress value={container.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{container.packages} colis chargés</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{container.location}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Arrivée: {container.estimatedArrival}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Suivi
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance mensuelle</CardTitle>
                <CardDescription>Évolution des indicateurs clés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Colis livrés</span>
                    <span className="font-medium">{stats.deliveredThisMonth}</span>
                  </div>
                  <Progress value={78} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taux de satisfaction</span>
                    <span className="font-medium">94.2%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Délai moyen</span>
                    <span className="font-medium">18 jours</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Destinations populaires</CardTitle>
                <CardDescription>Villes les plus desservies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { city: "Ouagadougou", count: 45, percentage: 65 },
                    { city: "Bobo-Dioulasso", count: 23, percentage: 35 },
                    { city: "Koudougou", count: 12, percentage: 20 },
                    { city: "Banfora", count: 8, percentage: 15 }
                  ].map((dest, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{dest.city}</span>
                        <span className="font-medium">{dest.count} colis</span>
                      </div>
                      <Progress value={dest.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}