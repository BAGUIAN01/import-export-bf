"use client";
import React, { useState, useEffect } from 'react';
import { Package, Truck, Home, ArrowRight, CheckCircle, Clock, Shield, Euro, Plane, MapPin, Star, Users } from 'lucide-react';

export default function Hero() {
  const [currentService, setCurrentService] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const services = [
    { 
      icon: Package, 
      title: "Colis Standard", 
      price: "20€",
      desc: "Jusqu'à 30kg - Dimensions: 80x60x60cm",
      details: "Idéal pour vêtements, produits alimentaires, médicaments",
      popular: true
    },
    { 
      icon: Truck, 
      title: "Transport Barrique", 
      price: "100€",
      desc: "Fûts, bidons, contenants lourds",
      details: "Huile, miel, produits liquides en grande quantité",
      popular: false
    },
    { 
      icon: Home, 
      title: "Ramassage Domicile", 
      price: "+15€",
      desc: "Collecte à votre adresse en France",
      details: "Service pratique, nous venons chez vous",
      popular: false
    }
  ];

  const features = [
    { icon: Clock, text: "Livraison 7-10 jours", color: "text-blue-400" },
    { icon: Shield, text: "Assurance incluse", color: "text-green-400" },
    { icon: MapPin, text: "Suivi GPS temps réel", color: "text-orange-400" },
    { icon: Users, text: "Service familial", color: "text-purple-400" }
  ];

  const stats = [
    { number: "8+", label: "Années d'expérience", icon: Star },
    { number: "2000+", label: "Colis livrés", icon: Package },
    { number: "100%", label: "Clients satisfaits", icon: CheckCircle },
    { number: "24/7", label: "Support client", icon: Clock }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentService((prev) => (prev + 1) % services.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#010066] via-blue-900 to-[#010066] overflow-hidden">
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
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <path d="M100,200 Q400,100 800,300" stroke="url(#grad)" strokeWidth="2" fill="none" opacity="0.3" />
          <path d="M200,500 Q600,400 1000,600" stroke="url(#grad)" strokeWidth="2" fill="none" opacity="0.3" />
          <defs>
            <linearGradient id="grad">
              <stop offset="0%" stopColor="#010066" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16 lg:py-24">
        
        {/* Breadcrumb */}
        <div className={`mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Accueil</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-orange-400 font-medium">Services</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center min-h-[80vh] gap-16">
          
          {/* Left Content */}
          <div className="flex-1 max-w-3xl">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              
              {/* Badge */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-orange-400 font-bold text-xl">Nos Services</div>
                  <div className="text-blue-300 text-sm font-medium">Solutions d'envoi vers le Burkina Faso</div>
                </div>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[0.95] tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                  Tous vos besoins
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                  d'envoi couverts
                </span>
                <br />
                <span className="text-blue-300">avec expertise</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Depuis 8 ans, nous proposons des solutions sur mesure pour tous vos envois vers le Burkina Faso. 
                Du simple colis aux objets volumineux, nous avons le service adapté.
              </p>

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {services.map((service, index) => (
                  <div 
                    key={index}
                    className={`relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      index === currentService 
                        ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20 border-orange-500/50 scale-105' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-orange-500/30'
                    }`}
                    onClick={() => setCurrentService(index)}
                  >
                    {service.popular && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Populaire
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        index === currentService 
                          ? 'bg-gradient-to-br from-orange-500 to-red-600' 
                          : 'bg-white/10'
                      }`}>
                        <service.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{service.title}</h3>
                        <div className="text-2xl font-black text-orange-400">{service.price}</div>
                      </div>
                    </div>
                    
                    <p className="text-white/80 font-medium mb-2">{service.desc}</p>
                    <p className="text-white/60 text-sm">{service.details}</p>
                  </div>
                ))}
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <feature.icon className={`w-4 h-4 ${feature.color}`} />
                    <span className="text-sm font-medium text-white/80">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="group bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                  <span className="flex items-center gap-3">
                    Demander un devis
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </span>
                </button>
                <button className="border-2 border-white/20 hover:border-orange-400 text-white/80 hover:text-orange-400 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-orange-400/5">
                  Voir la grille tarifaire
                </button>
              </div>

              {/* Contact Info */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 text-sm">
                <div className="flex items-center gap-2 text-white/70">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">🇫🇷 Conseils gratuits: +33 6 70 69 98 23</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">🇧🇫 Suivi colis: +226 76 60 19 81</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Stats & Info */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              
              <div className="space-y-6">
                {/* Stats Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 min-w-[320px] shadow-2xl">
                  <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-orange-400" />
                    Notre expertise
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-2xl font-black text-orange-400 mb-1">{stat.number}</div>
                        <div className="text-xs text-white/70">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Highlight */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      {React.createElement(services[currentService].icon, { className: "w-8 h-8 text-white" })}
                    </div>
                    
                    <h4 className="text-xl font-black text-white mb-2">{services[currentService].title}</h4>
                    <div className="text-3xl font-black text-orange-400 mb-3">{services[currentService].price}</div>
                    <p className="text-white/80 mb-4">{services[currentService].desc}</p>
                    
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-xl p-3 border border-orange-500/20">
                      <p className="text-sm text-orange-300">{services[currentService].details}</p>
                    </div>
                  </div>

                  {/* Service Indicators */}
                  <div className="flex justify-center gap-2 mt-4">
                    {services.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentService(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentService 
                            ? 'bg-orange-400 w-6' 
                            : 'bg-white/20 hover:bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Action */}
                <div className="bg-gradient-to-r from-orange-500/20 to-red-600/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-4 text-center">
                  <div className="text-orange-400 text-sm font-bold mb-1">Besoin d'aide pour choisir ?</div>
                  <div className="text-white text-lg font-black mb-2">Consultation Gratuite</div>
                  <button className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                    Nous contacter
                  </button>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-orange-500 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-blue-400/40 rounded-full animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>

        {/* Bottom Mobile CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/[0.05] backdrop-blur-xl border-t border-white/10 p-4 z-50 lg:hidden">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <div>
              <div className="text-orange-400 font-bold">Dès 20€</div>
              <div className="text-white/70 text-xs">Tous services</div>
            </div>
            <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold">
              Devis gratuit
            </button>
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