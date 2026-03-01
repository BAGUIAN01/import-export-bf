"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, ShoppingCart, CreditCard, Printer, CheckCircle, Home, User, Phone, Mail, Menu, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCaisse } from "@/contexts/caisse-context";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const workflowItems = [
  { label: "Dashboard",    icon: LayoutDashboard, path: "/admin/caisse"              },
  { label: "Client",       icon: Users,           path: "/admin/caisse/client"       },
  { label: "Commande",     icon: ShoppingCart,    path: "/admin/caisse/commande"     },
  { label: "Encaissement", icon: CreditCard,      path: "/admin/caisse/encaissement" },
  { label: "Impression",   icon: Printer,         path: "/admin/caisse/impression"   },
  { label: "Terminer",     icon: CheckCircle,     path: "/admin/caisse/terminer"     },
];

export function CaisseSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { selectedClient, orderItems = [], orderTotal = 0 } = useCaisse();

  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) =>
    path === "/admin/caisse"
      ? pathname === path
      : pathname === path || pathname.startsWith(path + "/");

  const handleNavigation = (path) => {
    router.push(path);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex justify-center pt-5 pb-3 flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black ring-2 ring-white/30 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Import Export BF"
            width={56}
            height={56}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Séparateur */}
      <div className="mx-3 border-t border-white/20 mb-3" />

      {/* Étapes workflow */}
      <div className="flex-1 px-2.5 space-y-2 overflow-y-auto">
        {workflowItems.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => handleNavigation(path)}
              className={cn(
                "w-full h-[72px] rounded-xl flex flex-col items-center justify-center gap-2 transition-all",
                active
                  ? "bg-white text-zinc-900 shadow-md"
                  : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
              )}
            >
              <Icon className="h-6 w-6 shrink-0" />
              <span className="text-[11px] font-semibold leading-tight text-center px-1">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Informations client (si sélectionné) */}
      {selectedClient && (
        <div className="px-2.5 pt-2 pb-2 flex-shrink-0 border-t border-white/20">
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-3.5 w-3.5 text-white shrink-0" />
              <p className="text-[10px] font-bold text-white truncate leading-tight flex-1">
                {selectedClient.name}
              </p>
            </div>
            {selectedClient.phone && (
              <div className="flex items-center gap-1.5 mb-1">
                <Phone className="h-3 w-3 text-white/80 shrink-0" />
                <p className="text-[9px] text-white/90 truncate">
                  {selectedClient.phone}
                </p>
              </div>
            )}
            {selectedClient.email && selectedClient.email !== `client-${selectedClient.id}@importexport.local` && (
              <div className="flex items-center gap-1.5 mb-2">
                <Mail className="h-3 w-3 text-white/80 shrink-0" />
                <p className="text-[9px] text-white/90 truncate">
                  {selectedClient.email}
                </p>
              </div>
            )}
            <button
              onClick={() => {
                router.push("/admin/caisse/client");
                setMobileOpen(false);
              }}
              className="w-full mt-2 pt-2 border-t border-white/20 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-white hover:text-white/90 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Changer
            </button>
          </div>
        </div>
      )}

      {/* Bouton retour */}
      <div className="px-2.5 pb-4 pt-2 flex-shrink-0 border-t border-white/20">
        <button
          onClick={() => {
            router.push("/admin");
            setMobileOpen(false);
          }}
          title="Retour au hub"
          className="w-full h-11 rounded-xl flex items-center justify-center gap-2 bg-black/20 hover:bg-black/30 text-white transition-all"
        >
          <Home className="h-4 w-4" />
          <span className="text-[11px] font-semibold">Hub</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-28 bg-gradient-to-b from-orange-500 to-orange-600 z-40 flex-col shadow-2xl border-r border-orange-700 rounded-r-2xl">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile - Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-40 bg-gradient-to-b from-orange-500 to-orange-600 text-white hover:bg-orange-600 shadow-lg"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 bg-gradient-to-b from-orange-500 to-orange-600 border-orange-700" hideCloseButton>
          <SheetTitle className="sr-only">Menu Caisse</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h2 className="text-lg font-bold text-white">Menu Caisse</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

