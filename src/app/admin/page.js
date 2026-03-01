import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/modules/auth/logout-btn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Settings, Home } from "lucide-react";

export const metadata = { title: "Hub | Admin" };

const MODULES = [
  {
    id: "caisse",
    title: "Caisse",
    description: "Enregistrez des ventes en magasin, encaissez vos clients et éditez des reçus.",
    icon: Receipt,
    href: "/admin/caisse",
    requiredRoute: "/admin/caisse",
    borderColor: "border-green-500",
  },
  {
    id: "gestion",
    title: "Gestion",
    description: "Gérez vos clients, colis, conteneurs, expéditions et autres ressources.",
    icon: Settings,
    href: "/admin/dashboard",
    requiredRoute: "/admin/dashboard",
    borderColor: "border-purple-500",
  },
];

const ROLE_LABELS = {
  ADMIN: "Administrateur",
  STAFF: "Personnel",
  TRACKER: "Suiveur",
  AGENT: "Agent",
  CLIENT: "Client",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "ADMIN";
  const name = session?.user?.name ?? session?.user?.email ?? "";
  const firstName = name.split(" ")[0];
  const visibleModules = MODULES.filter((m) => canAccess(role, m.requiredRoute));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <h1 className="text-lg font-semibold">Hub</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Site
              </Button>
            </Link>
            
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm">{name}</span>
              <Badge variant="outline" className="text-xs">
                {ROLE_LABELS[role] ?? role}
              </Badge>
            </div>
            
            <LogoutButton variant="ghost" size="sm" showIcon showText={false} />
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Bonjour, {firstName}</h2>
          <p className="text-muted-foreground">Choisissez un outil pour commencer.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.id}
                href={mod.href}
                className={`group p-6 border-2 ${mod.borderColor} rounded-lg bg-card hover:bg-accent transition-colors`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{mod.title}</h3>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
