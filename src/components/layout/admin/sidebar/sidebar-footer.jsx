"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRBAC } from "@/hooks/use-rbac";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/modules/auth/logout-btn";
import { useLayout } from "@/components/layout/admin/layout-provider";

export const SidebarFooter = () => {
  const { sidebarOpen } = useLayout();
  const { user, role } = useRBAC();
  const router = useRouter();

  useEffect(() => {
    // Préchargement des routes de compte
    router.prefetch("/dashboard/settings?tab=profile");
    if (role === "ADMIN") router.prefetch("/dashboard/settings");
  }, [router, role]);

  if (!user) return null;


  const getRoleLabel = () => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "TEACHER":
        return "Professeur";
      case "STUDENT":
        return "Étudiant";
      case "PARENT":
        return "Parent";
      case "STAFF":
        return "Personnel";
      default:
        return role;
    }
  };

  // --- Version compacte (sidebar fermée) ---
  if (!sidebarOpen) {
    return (
      <div className="border-t p-3 shrink-0">
        {/* Info utilisateur visible */}
        <div className="mb-3 p-3 bg-card border rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image} alt={user.name || 'Utilisateur'} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                {user.name?.[0] || user.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name || user.email || 'Utilisateur'}
              </p>
              <Badge variant="secondary" className="text-xs mt-0.5">
                {getRoleLabel()}
              </Badge>
            </div>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-center h-9">
                <div className="relative">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.image} alt={user.name || 'Utilisateur'} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.name?.[0] || user.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></div>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={15} className="w-64 p-2">
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {user.name || user.email || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.email || user.phone || 'Non renseigné'}
                  </p>
                </div>

                <Badge variant="outline" className="w-fit mx-auto">
                  {getRoleLabel()}
                </Badge>

                <div className="space-y-1 pt-2 border-t">
                  <Link
                    href="/dashboard/settings?tab=profile"
                    className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Mon profil</span>
                  </Link>

                  {role === "ADMIN" && (
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Paramètres</span>
                    </Link>
                  )}

                  <div className="pt-1 border-t">
                    <LogoutButton
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 p-2 h-auto"
                      showIcon
                      showText
                      confirmLogout
                      iconClassName="h-3.5 w-3.5"
                      textClassName="text-xs"
                    />
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // --- Version étendue (sidebar ouverte) ---
  return (
    <div className="border-t p-4 shrink-0">
      {/* Info utilisateur visible */}
      <div className="mb-4 p-4 bg-card border rounded-lg">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image} alt={user.name || 'Utilisateur'} />
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">
              {user.name?.[0] || user.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name || user.email || 'Utilisateur'}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {user.email || user.phone || 'Non renseigné'}
            </p>
            <Badge variant="secondary" className="text-xs mt-1">
              {getRoleLabel()}
            </Badge>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-center h-9">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Menu</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 p-2" sideOffset={5}>
          <DropdownMenuLabel className="px-3 py-2">
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-foreground">Mon compte</span>
              <span className="text-xs font-normal text-muted-foreground truncate">
                {user.name || user.email || 'Utilisateur'}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Profil */}
          <DropdownMenuItem asChild className="px-3 py-2">
            <Link href="/dashboard/settings?tab=profile" prefetch className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Mon profil</span>
            </Link>
          </DropdownMenuItem>

          {/* Paramètres (ADMIN seulement) */}
          {role === "ADMIN" && (
            <DropdownMenuItem asChild className="px-3 py-2">
              <Link href="/dashboard/settings" prefetch className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Paramètres</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Logout */}
          <div className="p-1">
            <LogoutButton
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 px-3 py-2"
              showIcon
              showText
              confirmLogout
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
