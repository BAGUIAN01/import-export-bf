"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import {
  ArrowRight,
  Clock,
  Container as IconeConteneur,
  CornerDownLeft,
  LayoutDashboard,
  Loader2,
  Package,
  PackageCheck,
  Receipt,
  ScanLine,
  Search,
  Send,
  Settings,
  ShoppingCart,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";
import { Etat } from "@/components/epure";
import { Scanneur } from "@/components/recherche/scanneur";
import { actionsResultat, analyserRecherche, pagesAccessibles, pagesCorrespondantes, rechercheUtile } from "@/lib/recherche";
import { geist, geistMono } from "@/lib/polices";
import { cn } from "@/lib/utils";

const ICONES_TYPE = { client: User, envoi: Send, colis: Package, conteneur: IconeConteneur };
const ICONES_PAGE = { caisse: ShoppingCart, recu: Receipt, conteneur: IconeConteneur, retrait: PackageCheck, colis: Package, client: Users, tarif: Tag, tableau: LayoutDashboard, reglage: Settings };
const TEINTES = {
  client: "bg-[rgba(59,130,246,.10)] text-[#1D4ED8]",
  envoi: "bg-brand-soft text-brand-strong",
  colis: "bg-[rgba(249,115,22,.10)] text-[#C2410C]",
  conteneur: "bg-[#EEE8F6] text-[#5B3E8C]",
  page: "bg-surface-muted text-ink-muted",
  recent: "bg-surface-muted text-ink-muted",
};
const CLE_RECENTS = "recherche:recents";

function lireRecents() {
  try {
    return JSON.parse(window.localStorage.getItem(CLE_RECENTS) || "[]");
  } catch {
    return [];
  }
}
function memoriser(r) {
  try {
    const q = r.numero || r.titre;
    const liste = [{ q, titre: r.titre, sousTitre: r.sousTitre, type: r.type }, ...lireRecents().filter((x) => x.q !== q)].slice(0, 6);
    window.localStorage.setItem(CLE_RECENTS, JSON.stringify(liste));
  } catch {
    /* stockage indisponible */
  }
}

// Une ligne « récente » relance la recherche ; les autres suivent le profil
const actionsLigne = (l, role) => (l.type === "recent" ? { principale: { libelle: "Chercher" } } : actionsResultat(l, role));

const estEditable = (el) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/**
 * Recherche générale : bouton (barres des modules) ou grand champ (accueil),
 * palette Ctrl+K ou « / », scanneur par la caméra, douchette (lecteur de
 * codes-barres qui tape le code puis Entrée, n'importe où dans l'application).
 */
export function RechercheGlobale({ apparence = "barre", prefere = null }) {
  const [ouvert, setOuvert] = useState(false);
  const [depart, setDepart] = useState({ saisie: "", scanner: false, auto: false });
  const [raccourci, setRaccourci] = useState("Ctrl K");
  const declencheur = useRef(null);

  const ouvrir = useCallback((options = {}) => {
    setDepart({ saisie: options.saisie || "", scanner: !!options.scanner, auto: !!options.auto });
    setOuvert(true);
  }, []);

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setRaccourci("⌘ K");
  }, []);

  // Raccourcis et douchette
  useEffect(() => {
    const tampon = { texte: "", t: 0 };
    function surTouche(e) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ouvrir();
        return;
      }
      if (ouvert || e.ctrlKey || e.metaKey || e.altKey || estEditable(e.target)) return;
      const maintenant = performance.now();
      const rapide = maintenant - tampon.t < 60;
      if (e.key === "Enter") {
        // Une douchette tape vite et finit par Entrée
        if (rapide && tampon.texte.length >= 5) {
          e.preventDefault();
          e.stopPropagation();
          ouvrir({ saisie: tampon.texte, auto: true });
        }
        tampon.texte = "";
        return;
      }
      if (e.key === "/" && !rapide && !tampon.texte) {
        e.preventDefault();
        ouvrir();
        return;
      }
      if (e.key.length === 1) {
        tampon.texte = rapide ? tampon.texte + e.key : e.key;
        tampon.t = maintenant;
      }
    }
    window.addEventListener("keydown", surTouche, true);
    return () => window.removeEventListener("keydown", surTouche, true);
  }, [ouvert, ouvrir]);

  const fermer = useCallback(() => {
    setOuvert(false);
    declencheur.current?.focus();
  }, []);

  return (
    <>
      {apparence === "grand" ? (
        <div className="flex h-14 w-full items-center gap-2 rounded-2xl border border-line-strong bg-white pr-2 pl-4 shadow-[0_1px_2px_rgba(15,23,20,.04)] focus-within:border-brand">
          <button ref={declencheur} type="button" onClick={() => ouvrir()} className="flex h-full min-w-0 flex-1 items-center gap-3 text-left text-ink-muted">
            <Search className="size-5 shrink-0" aria-hidden="true" />
            <span className="truncate">Rechercher un envoi, un client, un colis, un téléphone…</span>
          </button>
          <kbd className="hidden rounded-md border border-line bg-surface-page px-1.5 py-0.5 font-caisse text-xs text-ink-muted lg:block">{raccourci}</kbd>
          <button type="button" onClick={() => ouvrir({ scanner: true })} className="flex h-11 items-center gap-2 rounded-xl bg-ink px-3.5 text-sm font-semibold text-white">
            <ScanLine className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">Scanner</span>
          </button>
        </div>
      ) : (
        <button
          ref={declencheur}
          type="button"
          onClick={() => ouvrir()}
          aria-label="Rechercher"
          className="flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-line-strong bg-surface-page px-3 text-ink-muted hover:text-ink min-[1400px]:w-[230px]"
        >
          <Search className="size-5 shrink-0" aria-hidden="true" />
          <span className="hidden flex-1 text-left text-[15px] min-[1400px]:block">Rechercher…</span>
          <kbd className="hidden rounded-md border border-line bg-white px-1.5 py-0.5 font-caisse text-xs min-[1400px]:block">{raccourci}</kbd>
        </button>
      )}
      {ouvert && <Palette depart={depart} prefere={prefere} onFermer={fermer} />}
    </>
  );
}

/** Pour l'accueil (page serveur, sans fournisseur de session). */
export function RechercheAccueil() {
  return (
    <SessionProvider>
      <RechercheGlobale apparence="grand" />
    </SessionProvider>
  );
}

function Palette({ depart, prefere, onFermer }) {
  const router = useRouter();
  const { data } = useSession();
  const role = data?.user?.role;
  const id = useId();
  const champ = useRef(null);
  const liste = useRef(null);
  const [saisie, setSaisie] = useState(depart.saisie);
  const [scanner, setScanner] = useState(depart.scanner);
  const [auto, setAuto] = useState(depart.auto); // ouvrir tout seul un numéro exact (scan, douchette)
  const [reponse, setReponse] = useState(null); // { q, exact, groupes }
  const [chargement, setChargement] = useState(false);
  const [actif, setActif] = useState(0);
  const [recents, setRecents] = useState([]);

  useEffect(() => setRecents(lireRecents()), []);

  // Défilement de la page bloqué, focus dans le champ
  useEffect(() => {
    const precedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!depart.scanner) champ.current?.focus();
    return () => {
      document.body.style.overflow = precedent;
    };
  }, [depart.scanner]);

  const analyse = useMemo(() => analyserRecherche(saisie), [saisie]);
  const utile = rechercheUtile(analyse);

  // Recherche (petite attente pendant la frappe, immédiate après un scan)
  useEffect(() => {
    if (!utile) {
      setReponse(null);
      setChargement(false);
      return;
    }
    const controle = new AbortController();
    setChargement(true);
    const minuteur = setTimeout(
      () => {
        fetch(`/api/recherche?q=${encodeURIComponent(saisie)}`, { signal: controle.signal })
          .then((r) => r.json())
          .then((d) => {
            if (d.error) throw new Error(d.error);
            setReponse({ q: saisie, exact: d.exact, groupes: d.groupes || [] });
          })
          .catch((e) => {
            if (e.name !== "AbortError") setReponse({ q: saisie, exact: null, groupes: [], erreur: e.message });
          })
          .finally(() => {
            if (!controle.signal.aborted) setChargement(false);
          });
      },
      auto ? 0 : 220
    );
    return () => {
      clearTimeout(minuteur);
      controle.abort();
    };
  }, [saisie, utile, auto]);

  const executer = useCallback(
    (action, r) => {
      if (!action) return;
      if (r && r.type !== "page") memoriser(r);
      if (action.depot) {
        try {
          window.sessionStorage.setItem(action.depot.cle, JSON.stringify(action.depot.valeur));
        } catch {
          /* stockage indisponible */
        }
        window.dispatchEvent(new CustomEvent("recherche:depot", { detail: action.depot.cle }));
      }
      onFermer();
      router.push(action.href);
    },
    [onFermer, router]
  );

  // Un numéro exact scanné ou tapé à la douchette : on l'ouvre directement
  useEffect(() => {
    if (!auto || !reponse || reponse.q !== saisie) return;
    setAuto(false);
    const r = reponse.exact;
    const a = r && actionsResultat(r, role).principale;
    if (a) executer(a, r);
  }, [auto, reponse, saisie, role, executer]);

  // Lignes affichées, dans l'ordre du clavier
  const pages = useMemo(() => pagesCorrespondantes(analyse, role), [analyse, role]);
  const sections = useMemo(() => {
    if (!utile) {
      return [
        recents.length && { titre: "Récents", lignes: recents.map((x) => ({ type: "recent", cle: `r-${x.q}`, ...x })) },
        { titre: "Aller à", lignes: pagesAccessibles(role).slice(0, 6).map((p) => ({ type: "page", cle: `p-${p.id}`, titre: p.libelle, href: p.href, icone: p.icone })) },
      ].filter(Boolean);
    }
    // Les résultats précédents restent affichés pendant la recherche suivante.
    // Le module courant passe devant (envois aux retraits, clients à la caisse),
    // sauf si un autre groupe a le numéro exact.
    const exactAilleurs = (g) => g.type !== prefere && g.resultats[0]?.score >= 100;
    const tries = [...(reponse?.groupes || [])];
    if (prefere && !tries.some(exactAilleurs)) tries.sort((a, b) => (b.type === prefere) - (a.type === prefere));
    const groupes = tries.map((g) => ({
      titre: g.titre,
      lignes: g.resultats.map((r) => ({ ...r, cle: `${r.type}-${r.id}` })),
    }));
    if (pages.length) groupes.push({ titre: "Pages", lignes: pages.map((p) => ({ type: "page", cle: `p-${p.id}`, titre: p.libelle, href: p.href, icone: p.icone })) });
    return groupes;
  }, [utile, recents, role, reponse, pages, prefere]);
  const lignes = sections.flatMap((s) => s.lignes);
  const actionsDe = (l) => actionsLigne(l, role);

  // Surlignée d'abord : la première ligne qu'on peut ouvrir (un envoi encore en
  // chargement ne s'ouvre pas aux retraits, par exemple)
  const premiere = useMemo(() => {
    const i = sections.flatMap((s) => s.lignes).findIndex((l) => actionsLigne(l, role).principale);
    return Math.max(0, i);
  }, [sections, role]);
  useEffect(() => setActif(premiere), [reponse, utile, premiere]);

  function activer(l, secondaire = false) {
    if (l.type === "recent") {
      setSaisie(l.q);
      setAuto(true);
      champ.current?.focus();
      return;
    }
    const a = actionsDe(l);
    executer(secondaire ? a.secondaire : a.principale, l);
  }

  function surTouche(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (scanner) setScanner(false);
      else onFermer();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActif((i) => Math.min(lignes.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActif((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Résultats pas encore arrivés (douchette, saisie rapide) : on ouvrira le numéro exact
      if (chargement || reponse?.q !== saisie) setAuto(true);
      else if (lignes[actif]) activer(lignes[actif]);
    }
  }

  useEffect(() => {
    liste.current?.querySelector(`[data-index="${actif}"]`)?.scrollIntoView({ block: "nearest" });
  }, [actif]);

  const lu = useCallback((texte) => {
    setScanner(false);
    setSaisie(texte);
    setAuto(true);
  }, []);

  const vide = utile && !chargement && reponse?.q === saisie && lignes.length === 0;
  let index = -1;

  return createPortal(
    <div className={`caisse ${geist.variable} ${geistMono.variable} fixed inset-0 z-[60] flex justify-center font-caisse text-[15px] text-ink lg:items-start lg:pt-[9vh]`} onKeyDown={surTouche}>
      <div aria-hidden="true" className="absolute inset-0 bg-ink/45" onClick={onFermer} />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Recherche"
        className="relative flex h-[100dvh] w-full flex-col bg-white shadow-2xl lg:h-auto lg:max-h-[78vh] lg:max-w-2xl lg:rounded-[22px]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center gap-2 border-b border-line px-3 py-3 sm:px-4">
          <label className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl bg-surface-page px-4 focus-within:ring-2 focus-within:ring-brand/25">
            {chargement ? <Loader2 className="size-5 shrink-0 animate-spin text-ink-muted" aria-hidden="true" /> : <Search className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />}
            <span className="sr-only">Rechercher</span>
            <input
              ref={champ}
              value={saisie}
              onChange={(e) => {
                setSaisie(e.target.value);
                setAuto(false);
              }}
              onFocus={() => setScanner(false)}
              placeholder="N° de suivi, colis, conteneur, nom, téléphone…"
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-liste`}
              aria-activedescendant={lignes[actif] ? `${id}-${actif}` : undefined}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              className="h-full min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-ink-subtle"
            />
            {saisie && (
              <button type="button" onClick={() => {
                  setSaisie("");
                  champ.current?.focus();
                }} aria-label="Effacer" className="-mr-2 grid size-10 place-items-center rounded-xl text-ink-muted hover:bg-white">
                <X className="size-5" aria-hidden="true" />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => setScanner((s) => !s)}
            aria-pressed={scanner}
            className={cn("flex h-14 items-center gap-2 rounded-2xl px-4 font-semibold", scanner ? "bg-brand text-white" : "bg-ink text-white")}
          >
            <ScanLine className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">Scanner</span>
          </button>
          <button type="button" onClick={onFermer} className="h-14 rounded-2xl px-3 font-semibold text-ink-muted hover:text-ink lg:hidden">
            Fermer
          </button>
        </div>

        <div ref={liste} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {scanner ? (
            <Scanneur onLu={lu} />
          ) : (
            <>
              {!utile && (
                <p className="px-5 pt-4 text-sm text-ink-muted">
                  Tapez ou scannez un n° de suivi (SHP…), de colis (PKG…), de conteneur (CNT…), un code client, un nom ou un téléphone.
                </p>
              )}
              {reponse?.erreur && <p className="px-5 pt-4 text-sm text-danger">{reponse.erreur}</p>}
              <ul id={`${id}-liste`} role="listbox" aria-label="Résultats" className="flex flex-col pb-3">
                {sections.map((s) => (
                  <li key={s.titre} role="presentation">
                    <div className="px-5 pt-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">{s.titre}</div>
                    <ul role="presentation" className="flex flex-col px-2">
                      {s.lignes.map((l) => {
                        index += 1;
                        const i = index;
                        const a = actionsDe(l);
                        const Icone = l.type === "page" ? ICONES_PAGE[l.icone] || ArrowRight : l.type === "recent" ? Clock : ICONES_TYPE[l.type] || Search;
                        return (
                          <li
                            key={l.cle}
                            id={`${id}-${i}`}
                            data-index={i}
                            role="option"
                            aria-selected={i === actif}
                            aria-disabled={!a.principale}
                            onMouseMove={() => i !== actif && setActif(i)}
                            onClick={() => a.principale && activer(l)}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                              i === actif && "bg-surface-page",
                              a.principale ? "cursor-pointer" : "cursor-default opacity-70"
                            )}
                          >
                            <span aria-hidden="true" className={cn("grid size-11 shrink-0 place-items-center rounded-xl", TEINTES[l.type])}>
                              <Icone className="size-5" />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className={cn("truncate font-semibold", (l.type === "envoi" || l.type === "colis" || l.type === "conteneur") && "chiffres")}>{l.titre}</span>
                              {l.sousTitre && <span className="truncate text-[13px] text-ink-muted">{l.sousTitre}</span>}
                              {l.details && <span className="truncate text-xs text-ink-subtle">{l.details}</span>}
                            </span>
                            {l.etat && (
                              <span className="hidden shrink-0 sm:block">
                                <Etat ton={l.etat.ton}>{l.etat.texte}</Etat>
                              </span>
                            )}
                            {a.secondaire && (
                              <button
                                type="button"
                                tabIndex={-1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  activer(l, true);
                                }}
                                className="h-10 shrink-0 rounded-xl border border-line-strong bg-white px-3 text-sm font-semibold hover:border-brand hover:text-brand-strong"
                              >
                                {a.secondaire.libelle}
                              </button>
                            )}
                            {i === actif && a.principale && <CornerDownLeft className="hidden size-4 shrink-0 text-ink-subtle lg:block" aria-hidden="true" />}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
              {vide && (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-ink-muted">
                  <Search className="size-8 text-line-strong" aria-hidden="true" />
                  <p>Rien trouvé pour « {analyse.texte} ».</p>
                  <p className="text-sm">Vérifiez le numéro, ou cherchez par nom ou téléphone.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-line px-5 py-2.5 text-xs text-ink-muted lg:flex">
          <span>↑ ↓ choisir</span>
          <span>Entrée ouvrir</span>
          <span>Échap fermer</span>
          <span className="ml-auto">Douchette : scannez n&apos;importe où</span>
        </div>
      </section>
    </div>,
    document.body
  );
}
