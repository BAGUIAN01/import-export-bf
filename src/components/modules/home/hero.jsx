import React, { useState, useEffect } from "react";
import {
  Globe,
  Package,
  Truck,
  ArrowRight,
  CheckCircle,
  MapPin,
  Clock,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function Hero() {
  const [currentStat, setCurrentStat] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [currentService, setCurrentService] = useState(0);
  const [nextDeparture, setNextDeparture] = useState(null);

  const stats = [
    {
      number: "France",
      label: "Collecte partout",
      icon: MapPin,
      color: "text-blue-400",
    },
    {
      number: "Burkina",
      label: "Livraison sûre",
      icon: Globe,
      color: "text-green-400",
    },
    {
      number: "24/7",
      label: "Support client",
      icon: Clock,
      color: "text-orange-400",
    },
    {
      number: "100%",
      label: "Sécurisé",
      icon: Shield,
      color: "text-purple-400",
    },
  ];

  const services = [
    {
      icon: Package,
      label: "Enlèvement Colis",
      price: "20€",
      desc: "Collecte à domicile en Île de France",
    },
    {
      icon: Truck,
      label: "Transport Barrique",
      price: "100€",
      desc: "Fûts et contenants lourds",
    },
    {
      icon: Package,
      label: "Cartons 80x60x60",
      price: "100€",
      desc: "Dimensions standardisées",
    },
  ];

  useEffect(() => {
    setIsVisible(true);
    const statInterval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 4000);

    const serviceInterval = setInterval(() => {
      setCurrentService((prev) => (prev + 1) % services.length);
    }, 3000);

    return () => {
      clearInterval(statInterval);
      clearInterval(serviceInterval);
    };
  }, []);

  // Récupérer la date du prochain départ
  useEffect(() => {
    const fetchNextDeparture = async () => {
      try {
        const response = await fetch('/api/next-departure');
        const data = await response.json();
        setNextDeparture(data);
      } catch (error) {
        console.error('Erreur lors de la récupération du prochain départ:', error);
      }
    };

    fetchNextDeparture();
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#010066] via-blue-900 to-[#010066] overflow-hidden mt-16 lg:mt-0">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-[#010066]/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-60 h-60 bg-orange-500/8 rounded-full blur-3xl"></div>
      </div>

      {/* Network Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 1200 800">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Connection lines */}
          <path
            d="M100,200 Q400,100 800,300"
            stroke="url(#grad)"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
          <path
            d="M200,500 Q600,400 1000,600"
            stroke="url(#grad)"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
          <defs>
            <linearGradient id="grad">
              <stop offset="0%" stopColor="#010066" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center min-h-[85vh] gap-16">
          {/* Left Content */}
          <div className="flex-1 max-w-3xl">
            <div
              className={`transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              {/* Company Badge */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-orange-400 font-bold text-xl">IE BF</div>
                  <div className="text-blue-300 text-sm font-medium">
                    Transport France ↔ Burkina Faso
                  </div>
                </div>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[0.95] tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                  Envoi de vos colis de la France
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                  vers le Burkina Faso
                </span>
                <br />
                <span className="text-blue-300">en toute sécurité</span>
              </h1>

              {/* Value Proposition */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                <p className="text-lg text-white/80 mb-4 font-medium">
                  🇫🇷 Collecte dans toute la France • 🇧🇫 Livraison au Burkina
                  Faso
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {services.map((service, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        index === currentService
                          ? "bg-orange-500/20 border-orange-500/50"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <service.icon className="w-5 h-5 text-orange-400" />
                        <span className="text-white font-semibold text-sm">
                          {service.label}
                        </span>
                      </div>
                      <div className="text-2xl font-black text-orange-400 mb-1">
                        {service.price}
                      </div>
                      <div className="text-xs text-white/70">
                        {service.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Benefits */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Suivi temps réel</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Assurance incluse</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Support 24/7</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/#contact">
                  <button className="group bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                    <span className="flex items-center gap-3">
                      Envoyer maintenant
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </span>
                  </button>
                </Link>
                <Link href="/tracking">
                  <button className="border-2 border-[#010066]/50 hover:border-orange-400 text-white/80 hover:text-orange-400 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-orange-400/5">
                    Suivre mon colis
                  </button>
                </Link>
              </div>

              {/* Contact Info */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 text-sm">
                <div className="flex items-center gap-2 text-white/70">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    🇫🇷 France: +33 6 70 69 98 23
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    🇧🇫 Burkina: +226 76 60 19 81
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Enhanced Stats & Routes */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div
              className={`transition-all duration-1000 delay-500 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-10"
              }`}
            >
              <div className="space-y-6">
                {/* Live Stats Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 min-w-[320px] shadow-2xl">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
                      Service actif
                    </span>
                  </div>

                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      {React.createElement(stats[currentStat].icon, {
                        className: "w-8 h-8 text-white",
                      })}
                    </div>
                    <div
                      className={`text-3xl md:text-4xl font-black mb-2 ${stats[currentStat].color}`}
                    >
                      {stats[currentStat].number}
                    </div>
                    <div className="text-white/80 font-medium">
                      {stats[currentStat].label}
                    </div>
                  </div>

                  <div className="flex justify-center gap-2 mb-6">
                    {stats.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStat(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentStat
                            ? "bg-orange-400 w-6"
                            : "bg-[#010066] hover:bg-[#010066]/70"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="text-lg font-black text-orange-400">
                        45 Jours
                      </div>
                      <div className="text-xs text-white/60 uppercase tracking-wide">
                        Délai
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="text-lg font-black text-green-400">
                        Sûr
                      </div>
                      <div className="text-xs text-white/60 uppercase tracking-wide">
                        100%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Transport Specialist */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-orange-400" />
                    Spécialiste Véhicules
                  </h3>

                  {/* Vehicle Images Carousel */}
                  <div className="relative mb-4 overflow-hidden rounded-xl">
                    <div
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{
                        transform: `translateX(-${
                          (currentService % 3) * 100
                        }%)`,
                      }}
                    >
                      <div className="min-w-full h-32 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🚗</div>
                          <div className="text-white/70 text-xs">
                            Voitures particulières
                          </div>
                        </div>
                      </div>
                      <div className="min-w-full h-32 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🏍️</div>
                          <div className="text-white/70 text-xs">
                            Motos & Scooters
                          </div>
                        </div>
                      </div>
                      <div className="min-w-full h-32 bg-gradient-to-br from-green-500/20 to-teal-600/20 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🚚</div>
                          <div className="text-white/70 text-xs">
                            Utilitaires
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Carousel Indicators */}
                    <div className="flex justify-center gap-1 mt-3">
                      {[0, 1, 2].map((index) => (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            index === currentService % 3
                              ? "bg-orange-400 w-4"
                              : "bg-white/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-white/70">
                        Transport sécurisé par conteneur
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-white/70">
                        Préparation & documentation
                      </span>
                    </div>

                  </div>

                  <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center">
                    <div className="text-orange-400 text-xs font-bold">
                      Devis gratuit
                    </div>
                    <div className="text-white/80 text-xs">
                      Sur mesure selon véhicule
                    </div>
                  </div>
                </div>

                {/* Next Departure */}
                <div className="bg-gradient-to-r from-orange-500/10 to-red-600/10 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-4 text-center">
                  <div className="text-orange-400 text-sm font-bold mb-1">
                    Prochain chargement
                  </div>
                  <div className="text-white text-lg font-black">
                    {nextDeparture?.hasNextDeparture 
                      ? nextDeparture.departure.formatted.short 
                      : "À déterminer"
                    }
                  </div>
                  <div className="text-orange-300 text-xs">
                    Réservez votre place
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-orange-500 rounded-full opacity-60"></div>
              <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-blue-400/40 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden lg:block">
          <div className="w-5 h-8 border border-white/30 rounded-full flex justify-center opacity-60">
            <div className="w-0.5 h-2 bg-white/50 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
