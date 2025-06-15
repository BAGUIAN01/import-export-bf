"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Menu,
  X,
  Globe,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentPath, setCurrentPath] = useState("/");
  const dropdownTimeoutRef = useRef(null);

  const pathname = usePathname();
  console.log("Pathname:", pathname);
  const router = useRouter();

  useEffect(() => {
    const updateCurrentPath = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const fullPath = pathname + hash;
        console.log("Full path:", fullPath, "Hash:", hash, "Pathname:", pathname);
        setCurrentPath(fullPath);
      }
    };

    // Initial load
    updateCurrentPath();

    // Écouter les changements de hash
    const handleHashChange = () => {
      updateCurrentPath();
    };

    // Écouter les changements de pathname
    const handlePathnameChange = () => {
      updateCurrentPath();
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePathnameChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePathnameChange);
    };
  }, [pathname]);

  // Gestion du scroll avec hide/show du header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Détermine si on scroll vers le haut ou le bas
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(true); // Cache le header en scrollant vers le bas
      } else {
        setIsVisible(true); // Affiche le header en scrollant vers le haut
      }

      setScrolled(currentScrollY > 20);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Ferme les dropdowns en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    if (activeDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeDropdown]);

  // Gestion des dropdowns avec délai
  const handleDropdownEnter = (linkName) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(linkName);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const navLinks = [
    { name: "Accueil", href: "/" },
    {
      name: "Services",
      href: "/services",
      // dropdown: [
      //   {
      //     name: "Transport Maritime",
      //     href: "/services#maritime",
      //     icon: "🚢",
      //     desc: "Fret maritime international",
      //     color: "bg-blue-50 text-blue-600",
      //   },
      //   {
      //     name: "Transport Aérien",
      //     href: "/services/aerien",
      //     icon: "✈️",
      //     desc: "Livraison express mondiale",
      //     color: "bg-sky-50 text-sky-600",
      //   },
      //   {
      //     name: "Transport Routier",
      //     href: "/services/routier",
      //     icon: "🚛",
      //     desc: "Distribution terrestre",
      //     color: "bg-green-50 text-green-600",
      //   },
      //   {
      //     name: "Dédouanement",
      //     href: "/services/dedouanement",
      //     icon: "📋",
      //     desc: "Procédures douanières",
      //     color: "bg-orange-50 text-orange-600",
      //   },
      //   {
      //     name: "Entreposage",
      //     href: "/services/entreposage",
      //     icon: "🏪",
      //     desc: "Stockage sécurisé",
      //     color: "bg-purple-50 text-purple-600",
      //   },
      //   {
      //     name: "Assurance Transport",
      //     href: "/services/assurance",
      //     icon: "🛡️",
      //     desc: "Protection complète",
      //     color: "bg-red-50 text-red-600",
      //   },
      // ],
    },
    { name: "À Propos", href: "/#about" },
    { name: "Contact", href: "/#contact" },
  ];

  const isActive = (href) => {
  if (typeof window === 'undefined') {
    // Côté serveur, on compare seulement le pathname
    return pathname === href;
  }
  
  if (href.includes('#')) {
    // Côté client, on peut utiliser window.location.hash
    return pathname + window.location.hash === href;
  } else {
    return pathname === href && !window.location.hash;
  }
};

  return (
    <>
      {/* Top Bar avec animation */}
      <div
        className={`bg-gradient-to-r from-blue-900 to-[#010066] text-white transition-all duration-300 ${
          scrolled ? "py-1" : "py-2"
        } hidden lg:block`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 hover:text-orange-300 transition-colors cursor-pointer">
                <Phone className="w-4 h-4" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center space-x-2 hover:text-orange-300 transition-colors cursor-pointer">
                <Mail className="w-4 h-4" />
                <span>contact@ieBF.fr</span>
              </div>
              <div className="flex items-center space-x-2 hover:text-orange-300 transition-colors">
                <MapPin className="w-4 h-4" />
                <span>Paris, France</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1 animate-pulse">
                <Globe className="w-4 h-4" />
                <span>150+ pays desservis</span>
              </span>
              <div className="h-4 w-px bg-white/30"></div>
              <span className="flex items-center space-x-1 text-orange-300 font-medium">
                <Clock className="w-4 h-4" />
                <span>24/7 Support</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation avec animation de slide */}
      <nav
        className={`fixed w-full z-50 transition-all duration-500 transform ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        } ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-2xl border-b border-gray-100 py-2"
            : "bg-white/90 backdrop-blur-md py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo avec animation */}
            <Link href={"/"}>
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="relative overflow-hidden rounded-md">
                  <Image
                    src="/logo.jpg"
                    alt="IE BF Logo"
                    width={60}
                    height={48}
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#010066]/0 via-white/20 to-[#010066]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full"></div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-xl font-bold bg-gradient-to-r from-[#010066] to-blue-900 bg-clip-text text-transparent">
                    IE BF
                  </div>
                  <div className="text-xs text-gray-500 -mt-1">
                    Transport & Logistique
                  </div>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <div
                  key={link.name}
                  className="relative group"
                  onMouseEnter={() =>
                    link.dropdown && handleDropdownEnter(link.name)
                  }
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link href={link.href}>
                    <button
                      className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center relative overflow-hidden group/btn ${
                        isActive(link.href)
                          ? "text-white bg-gradient-to-r from-[#010066] to-blue-900 shadow-lg"
                          : "text-gray-700 hover:text-[#010066] hover:bg-blue-50/70"
                      }`}
                    >
                      <span className="relative z-10">{link.name}</span>
                      {link.dropdown && (
                        <ChevronDown
                          className={`ml-1 w-4 h-4 transition-transform duration-300 ${
                            activeDropdown === link.name ? "rotate-180" : ""
                          }`}
                        />
                      )}
                      {/* Effet de survol animé */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#010066] to-blue-900 opacity-0 group-hover/btn:opacity-10 transition-all duration-300 rounded-xl"></div>
                      {/* Indicateur actif */}
                      {isActive(link.href) && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full"></div>
                      )}
                    </button>
                  </Link>

                  {/* Dropdown Menu amélioré */}
                  {link.dropdown && (
                    <div
                      className={`absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 ${
                        activeDropdown === link.name
                          ? "opacity-100 visible transform translate-y-0"
                          : "opacity-0 invisible transform translate-y-4"
                      }`}
                    >
                      <div className="p-3">
                        <div className="grid gap-1">
                          {link.dropdown.map((item, index) => (
                            <Link href={item.href} key={item.name}>
                              <button
                                key={item.name}
                                className="flex items-start space-x-3 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group/item"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <div
                                  className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center group-hover/item:scale-110 transition-transform duration-200`}
                                >
                                  <span className="text-lg">{item.icon}</span>
                                </div>
                                <div className="text-left flex-1">
                                  <div className="text-gray-800 font-semibold group-hover/item:text-[#010066] transition-colors">
                                    {item.name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {item.desc}
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover/item:text-[#010066] group-hover/item:translate-x-1 transition-all duration-200" />
                              </button>
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-gray-100 mt-3 pt-3">
                          <button className="w-full px-4 py-2 text-sm text-[#010066] font-semibold hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 group/all">
                            <span className="flex items-center justify-center">
                              Voir tous les services
                              <ArrowRight className="w-4 h-4 ml-1 group-hover/all:translate-x-1 transition-transform duration-200" />
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA & Mobile Button */}
            <div className="flex items-center space-x-4">
              {/* CTA Button amélioré */}
              <Link href="/tracking">
                <button className="hidden md:flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-[#010066] to-blue-900 text-white shadow-lg hover:shadow-xl hover:scale-105 group relative overflow-hidden">
                  <span className="relative z-10">Suivre un colis</span>
                  <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                  {/* Effet de brillance */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full"></div>
                </button>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:scale-105"
                aria-label="Menu mobile"
              >
                <div className="relative w-6 h-6">
                  <Menu
                    className={`w-6 h-6 text-gray-700 absolute transition-all duration-300 ${
                      isOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
                    }`}
                  />
                  <X
                    className={`w-6 h-6 text-gray-700 absolute transition-all duration-300 ${
                      isOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu amélioré */}
        <div
          className={`lg:hidden transition-all duration-500 overflow-hidden ${
            isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white/98 backdrop-blur-xl border-t border-gray-100 px-4 py-6">
            <div className="space-y-3">
              {navLinks.map((link, index) => (
                <div
                  key={link.name}
                  className="space-y-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Link href={link.href}>
                    <button
                      className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-between group ${
                        isActive(link.href)
                          ? "text-white bg-gradient-to-r from-[#010066] to-blue-900 shadow-lg"
                          : "text-gray-700 hover:text-[#010066] hover:bg-gray-50"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>{link.name}</span>
                      {link.dropdown && (
                        <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                      )}
                    </button>
                  </Link>

                  {link.dropdown && (
                    <div className="ml-4 space-y-1">
                      {link.dropdown.map((item) => (
                        <button
                          key={item.name}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-600 hover:text-[#010066] hover:bg-blue-50 rounded-xl transition-all duration-200 group/mobile"
                          onClick={() => setIsOpen(false)}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center group-hover/mobile:scale-110 transition-transform duration-200`}
                          >
                            <span className="text-sm">{item.icon}</span>
                          </div>
                          <span className="flex-1 text-left">{item.name}</span>
                          <ArrowRight className="w-4 h-4 group-hover/mobile:translate-x-1 transition-transform duration-200" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Link href="/tracking" >

                <button
                  className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-[#010066] to-blue-900 text-white text-center rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 group"
                  onClick={() => setIsOpen(false)}
                >
                  <span>Suivre un colis</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
