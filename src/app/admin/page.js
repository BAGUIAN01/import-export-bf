import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { ArrowUpRight, Container as IconeConteneur } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { geist, geistMono } from "@/lib/polices";
import { libelleRole } from "@/lib/roles";
import { CarteUtilisateur } from "@/components/accueil/carte-utilisateur";
import { RechercheAccueil } from "@/components/recherche/recherche-globale";

export const metadata = { title: "Accueil | Admin" };
export const dynamic = "force-dynamic";

/** Tuiles de l'accueil, rangées par famille. Couleurs et images comme l'accueil de dogtorso. */
const FAMILLES = [
  {
    nom: "Caisse et clients",
    modules: [
      { titre: "Caisse", href: "/admin/caisse", image: "caisse", de: "#E5F5EA", a: "#BCE2C7", angle: 5 },
      { titre: "Retraits à l'arrivée", href: "/admin/retraits", image: "retraits", de: "#FFF1DB", a: "#F8D7A2", angle: -6 },
      { titre: "Clients", href: "/admin/clients", image: "clients", de: "#E2F5F1", a: "#AFDED3", angle: 5 },
    ],
  },
  {
    nom: "Conteneurs et colis",
    modules: [
      { titre: "Conteneurs", href: "/admin/containers", image: "conteneurs", de: "#E4F1FB", a: "#B7D8F1", angle: 4 },
      { titre: "Colis", href: "/admin/packages", image: "colis", de: "#FDF0E7", a: "#F4CDB3", angle: -5 },
      { titre: "Tarifs", href: "/admin/tarifs", image: "tarifs", de: "#FFF2DF", a: "#F5D09C", angle: -5 },
    ],
  },
  {
    nom: "Pilotage",
    modules: [
      { titre: "Encaissements", href: "/admin/shipments", image: "encaissements", de: "#F3EBFB", a: "#D6C2F0", angle: -4 },
      { titre: "Tableau de bord", href: "/admin/dashboard", image: "tableau-de-bord", de: "#E5F2FA", a: "#B8DAEF", angle: -4 },
      { titre: "Paramétrage", href: "/admin/parametrage", image: "parametrage", de: "#EFF1F3", a: "#D0D6DE", angle: 8 },
    ],
  },
];

/** Conteneur qui reçoit les colis (en préparation ou chargé), le plus proche du départ. */
async function conteneurEnCours() {
  try {
    return await prisma.container.findFirst({
      where: { status: "PREPARATION" },
      orderBy: [{ departureDate: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        containerNumber: true,
        status: true,
        departureDate: true,
        capacity: true,
        _count: { select: { packages: true } },
      },
    });
  } catch {
    return null;
  }
}

function joursAvant(date) {
  if (!date) return null;
  const jour = 24 * 60 * 60 * 1000;
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - aujourdhui) / jour);
}

export default async function AccueilModules() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "ADMIN";
  const nom = session?.user?.name || session?.user?.email || "Utilisateur";
  const conteneur = await conteneurEnCours();
  const jours = joursAvant(conteneur?.departureDate);

  const familles = FAMILLES.map((f) => ({ ...f, modules: f.modules.filter((m) => canAccess(role, m.href)) })).filter(
    (f) => f.modules.length > 0
  );

  const date = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className={`caisse ${geist.variable} ${geistMono.variable} min-h-[100dvh] bg-surface-page font-caisse text-[15px] text-ink antialiased`}>
      <header className="border-b border-line bg-white" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-3 sm:px-8">
          <Image src="/logo.jpeg" alt="" width={40} height={40} className="size-10 rounded-[11px] object-cover" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-semibold">Naange Envoi</span>
            <span className="text-xs text-ink-muted">Import-Export · France – Burkina Faso</span>
          </span>
          <CarteUtilisateur nom={nom} role={libelleRole(role)} />
        </div>
      </header>

      <main className="mx-auto flex max-w-[1200px] flex-col gap-7 px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] font-semibold tracking-tight">Bonjour, {nom.split(" ")[0]}</h1>
          <p className="text-base text-ink-muted first-letter:uppercase">{date}</p>
        </div>

        <RechercheAccueil />

        {conteneur && (
          <Link
            href="/admin/containers"
            className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-line bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,20,.04)]"
          >
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-[rgba(249,115,22,.10)] text-[#C2410C]">
              <IconeConteneur className="size-6" strokeWidth={1.8} />
            </span>
            <span className="flex min-w-[220px] flex-1 flex-col leading-snug">
              <span className="font-semibold">
                <span className="chiffres">{conteneur.containerNumber}</span>{" "}
                en chargement ·{" "}
                <span className="chiffres">{conteneur._count.packages}</span> colis
                {conteneur.capacity ? ` sur ${conteneur.capacity}` : ""}
              </span>
              <span className="text-[13px] text-ink-muted">
                {conteneur.departureDate
                  ? `Départ prévu le ${new Date(conteneur.departureDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
                  : "Date de départ à fixer"}
              </span>
            </span>
            {jours !== null && jours >= 0 && (
              <span className="rounded-full bg-alerte-soft px-2.5 py-0.5 text-[13px] font-medium text-alerte">
                {jours === 0 ? "départ aujourd'hui" : `départ dans ${jours} jour${jours > 1 ? "s" : ""}`}
              </span>
            )}
          </Link>
        )}

        {familles.map((f) => (
          <section key={f.nom} aria-label={f.nom} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="whitespace-nowrap text-[13px] font-semibold uppercase tracking-[.06em] text-ink-muted">{f.nom}</h2>
              <span className="chiffres rounded-full bg-surface-muted px-2 py-0.5 text-xs text-ink-muted">{f.modules.length}</span>
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(184px,1fr))] sm:gap-3.5">
              {f.modules.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="group relative block h-[168px] overflow-hidden rounded-[22px] sm:h-[226px] sm:rounded-[26px] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_1px_2px_rgba(15,23,20,.05)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_14px_28px_-10px_rgba(15,23,20,.25)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-brand active:scale-[.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  style={{ backgroundImage: `linear-gradient(150deg, ${m.de} 0%, ${m.a} 100%)` }}
                >
                  <span className="absolute top-4 right-4 left-4 text-[17px] font-semibold leading-tight tracking-[-.015em] sm:top-[18px] sm:right-[60px] sm:left-[19px] sm:text-xl">{m.titre}</span>
                  <span
                    aria-hidden="true"
                    className="absolute top-4 right-4 grid size-[34px] scale-90 place-items-center rounded-full bg-ink text-white opacity-0 transition-[opacity,transform] duration-200 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
                  >
                    <ArrowUpRight className="size-4" strokeWidth={2.2} />
                  </span>
                  <Image
                    src={`/images/modules/${m.image}.png`}
                    alt=""
                    width={158}
                    height={158}
                    draggable={false}
                    className="pointer-events-none absolute -right-2.5 -bottom-3 size-[112px] select-none transition-[scale] duration-200 group-hover:scale-105 sm:-right-3.5 sm:-bottom-[17px] sm:size-[158px]"
                    style={{ rotate: `${m.angle}deg` }}
                  />
                </Link>
              ))}
            </div>
          </section>
        ))}

        <p className="text-[13px] text-ink-muted">Chaque profil ne voit que ses modules (Paramétrage › Profils et droits).</p>
      </main>
    </div>
  );
}
