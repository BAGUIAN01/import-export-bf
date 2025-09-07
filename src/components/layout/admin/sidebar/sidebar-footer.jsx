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

  const getRoleColor = () => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "TEACHER":
        return "bg-green-100 text-green-800";
      case "STUDENT":
        return "bg-blue-100 text-blue-800";
      case "PARENT":
        return "bg-purple-100 text-purple-800";
      case "STAFF":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
      <div className="border-t p-2 shrink-0">
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="w-full justify-center h-10 p-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.image}
                    alt={`Avatar de ${user.firstName}`}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={15}
              className="max-w-xs p-3"
            >
              <div className="flex flex-col gap-2">
                <div>
                  <p className="font-medium text-sm">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>

                <Badge className={`text-xs w-fit ${getRoleColor()}`}>
                  {getRoleLabel()}
                </Badge>

                <div className="pt-2 border-t space-y-2">
                  {/* Profil */}
                  <Link
                    href="/dashboard/settings?tab=profile"
                    className="flex items-center gap-2 text-xs hover:text-foreground"
                  >
                    <User className="h-3 w-3" />
                    <span>Profil</span>
                  </Link>

                  {/* Paramètres (ADMIN uniquement) */}
                  {role === "ADMIN" && (
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 text-xs hover:text-foreground"
                    >
                      <Settings className="h-3 w-3" />
                      <span>Paramètres</span>
                    </Link>
                  )}

                  {/* Logout */}
                  <LogoutButton
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 p-0 h-auto"
                    showIcon
                    showText
                    confirmLogout
                    iconClassName="h-3 w-3"
                    textClassName="text-xs"
                  />
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
    <div className="border-t p-3 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-2 hover:bg-accent min-h-[60px]"
          >
            <div className="flex items-center gap-3 w-full overflow-hidden">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                  src={user.image}
                  alt={`Avatar de ${user.firstName}`}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col text-left flex-1 min-w-0 overflow-hidden">
                <span className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user.email}
                </span>
                <Badge className={`text-xs mt-1 w-fit ${getRoleColor()}`}>
                  {getRoleLabel()}
                </Badge>
              </div>

              <ChevronDown className="h-4 w-4 shrink-0 ml-1" />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56" sideOffset={5}>
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <span>Mon compte</span>
              <span className="text-xs font-normal text-muted-foreground truncate">
                {user.firstName} {user.lastName}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Profil */}
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings?tab=profile" prefetch>
              <User className="mr-2 h-4 w-4" />
              <span>Mon profil</span>
            </Link>
          </DropdownMenuItem>

          {/* Paramètres (ADMIN seulement) */}
          {role === "ADMIN" && (
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" prefetch>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Logout */}
          <div className="p-1">
            <LogoutButton
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
