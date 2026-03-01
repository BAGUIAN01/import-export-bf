// src/components/layout/header.jsx

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Search, Menu, Heart, X, LogOut, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import CategoryMenu from "./category-menu";
import MiniCart from "@/components/modules/store/cart/mini-cart";
import { useCart } from "@/contexts/cart-context";
import { useFavorites } from "@/contexts/favorites-context";

export default function Header() {
  const { data: session } = useSession();
  const { totalQuantity } = useCart();
  const { count: favoritesCount } = useFavorites();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const cartItemsCount = totalQuantity || 0;

  // Prevent hydration mismatch by only rendering Sheet components after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des catégories:", error);
      }
    }
    fetchCategories();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      {/* Bandeau promotionnel */}


      {/* Header principal */}
      <div className="container">
        <div className="flex h-20 md:h-24 items-center gap-4 sm:gap-6 px-2 sm:px-4 lg:px-6">
          {/* Menu mobile */}
          {isMounted ? (
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="h-12 w-12 md:h-14 md:w-14 flex-shrink-0">
                  <Menu className="h-6 w-6 md:h-7 md:w-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px] flex flex-col">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-3 overflow-y-auto flex-1 pb-6">
                  <Link
                    href="/produits"
                    className="text-base sm:text-lg font-medium transition-colors hover:text-lam-orange py-1"
                  >
                    Produits
                  </Link>
                  <Link
                    href="/categories"
                    className="text-base sm:text-lg font-medium transition-colors hover:text-lam-orange py-1"
                  >
                    Toutes les catégories
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      className="text-base sm:text-lg font-medium transition-colors hover:text-lam-orange py-1 pl-4"
                    >
                      {category.name}
                    </Link>
                  ))}
                  <div className="border-t my-2" />
                  <Link
                    href="/promotions"
                    className="text-base sm:text-lg font-medium transition-colors hover:text-lam-orange py-1"
                  >
                    Promotions
                  </Link>
                  {session?.user && (
                    <>
                      <div className="border-t my-2" />
                      <Link
                        href="/mon-compte"
                        className="text-base sm:text-lg font-medium transition-colors hover:text-lam-orange py-1 flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Mon compte
                      </Link>
                      <Link
                        href="/mon-compte/commandes"
                        className="text-base sm:text-lg font-medium transition-colors hover:text-lam-orange py-1 flex items-center gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Mes commandes
                      </Link>
                      <Link
                        href="/favoris"
                        className="text-base sm:text-lg font-medium transition-colors hover:text-lam-orange py-1 flex items-center gap-2"
                      >
                        <Heart className="h-4 w-4" />
                        Mes favoris
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" className="h-12 w-12 md:h-14 md:w-14 flex-shrink-0 lg:hidden">
              <Menu className="h-6 w-6 md:h-7 md:w-7" />
            </Button>
          )}

          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center flex-shrink-0 z-10 relative hover:opacity-80 transition-opacity"
            aria-label="Retour à l'accueil"
          >
            <Image
              src="/images/LA-MAM.png"
              alt="LA-MAM Parapharmacie"
              width={180}
              height={60}
              priority
              className="h-9 w-auto sm:h-12 md:h-16 lg:h-20 transition-all cursor-pointer"
            />
          </Link>

          {/* Barre de recherche - Desktop */}
          <div className="hidden flex-1 lg:flex mx-4 lg:mx-6 xl:mx-8">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un produit de beauté, soin..."
                className="w-full pl-12 pr-4 h-12 md:h-14 text-base md:text-lg"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-5 lg:gap-8 flex-shrink-0">
            {/* Recherche mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="h-auto lg:hidden flex-shrink-0"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Rechercher"
            >
              <Search className="h-6 w-6" />
            </Button>

            {/* Favoris */}
            <Link
              href="/favoris"
              className="relative flex flex-col items-center justify-center gap-1 min-w-[44px] sm:min-w-[60px] group transition-all duration-200 hover:scale-105"
            >
              <div className="relative">
                <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-foreground group-hover:text-lam-rose transition-colors duration-200" strokeWidth={1.5} />
                {favoritesCount > 0 && (
                  <Badge className="absolute -right-1.5 -top-1.5 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 flex items-center justify-center bg-lam-rose text-white text-[10px] sm:text-xs font-semibold border-2 border-background group-hover:scale-110 transition-transform duration-200">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap group-hover:text-lam-rose transition-colors duration-200">
                Favoris
              </span>
            </Link>

            {/* Compte / Se connecter */}
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center justify-center gap-1 min-w-[44px] sm:min-w-[60px] group transition-all duration-200 hover:scale-105">
                    <User className="h-6 w-6 sm:h-7 sm:w-7 text-foreground group-hover:text-lam-orange transition-colors duration-200" strokeWidth={1.5} />
                    <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap group-hover:text-lam-orange transition-colors duration-200">
                      Mon compte
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name || "Utilisateur"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/mon-compte" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mon compte
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mon-compte/commandes" className="cursor-pointer">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Mes commandes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favoris" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      Mes favoris
                    </Link>
                  </DropdownMenuItem>
                  {session.user.role === "ADMIN" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link 
                          href="/dashboard" 
                          className="cursor-pointer flex items-center justify-between w-full group bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 hover:from-blue-100/70 hover:to-indigo-100/70 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/40 transition-all duration-200"
                        >
                          <div className="flex items-center">
                            <Shield className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
                            <span className="font-semibold text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors">
                              Administration
                            </span>
                          </div>
                          <Badge className="ml-2 bg-blue-600 dark:bg-blue-500 text-white text-[10px] px-1.5 py-0.5 font-bold shadow-sm">
                            ADMIN
                          </Badge>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center justify-center gap-1 min-w-[44px] sm:min-w-[60px] group transition-all duration-200 hover:scale-105"
              >
                <User className="h-6 w-6 sm:h-7 sm:w-7 text-foreground group-hover:text-lam-orange transition-colors duration-200" strokeWidth={1.5} />
                <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap group-hover:text-lam-orange transition-colors duration-200">
                  Se connecter
                </span>
              </Link>
            )}

            {/* Panier */}
            {isMounted ? (
              <Sheet>
                <SheetTrigger asChild>
                  <button className="relative flex flex-col items-center justify-center gap-1 min-w-[44px] sm:min-w-[60px] group transition-all duration-200 hover:scale-105">
                    <div className="relative">
                      <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-foreground group-hover:text-lam-orange transition-colors duration-200" strokeWidth={1.5} />
                      {cartItemsCount > 0 && (
                        <Badge className="absolute -right-1.5 -top-1.5 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 flex items-center justify-center bg-lam-orange text-white text-[10px] sm:text-xs font-semibold border-2 border-background group-hover:scale-110 transition-transform duration-200">
                          {cartItemsCount > 9 ? '9+' : cartItemsCount}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap group-hover:text-lam-orange transition-colors duration-200">
                      Panier
                    </span>
                  </button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 gap-0">
                  <SheetTitle className="sr-only">Panier</SheetTitle>
                  <MiniCart />
                </SheetContent>
              </Sheet>
            ) : (
              <button className="relative flex flex-col items-center justify-center gap-1 min-w-[44px] sm:min-w-[60px] group transition-all duration-200 hover:scale-105">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-foreground group-hover:text-lam-orange transition-colors duration-200" strokeWidth={1.5} />
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -right-1.5 -top-1.5 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 flex items-center justify-center bg-lam-orange text-white text-[10px] sm:text-xs font-semibold border-2 border-background group-hover:scale-110 transition-transform duration-200">
                      {cartItemsCount > 9 ? '9+' : cartItemsCount}
                    </Badge>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap group-hover:text-lam-orange transition-colors duration-200">
                  Panier
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Barre de recherche mobile */}
        {isSearchOpen && (
          <div className="pb-3 md:pb-4 px-2 sm:px-0 lg:hidden animate-in slide-in-from-top-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un produit de beauté..."
                className="w-full pl-10 pr-10 h-10"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Fermer la recherche"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Menu de navigation - Desktop */}
      <div className="hidden lg:block border-t">
        <div className="container">
          <CategoryMenu />
        </div>
      </div>
    </header>
  );
}
