import React, { useState, useEffect, useRef } from 'react';
import { Package, Truck, MapPin, Calendar, Phone, Shield, ArrowRight, Sparkles, Clock, Target } from 'lucide-react';
import Link from 'next/link';

export default function Services() {
  const [activeService, setActiveService] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    // Auto-rotate services
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % 6);
    }, 4000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      setMousePosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    }
  };

  const services = [
    {
      id: 0,
      icon: Package,
      title: "Envoi de Colis",
      subtitle: "France → Burkina Faso",
      description: "Envoyez vos colis en toute sécurité vers le Burkina Faso avec suivi complet",
      stats: "Carton • 100€",
      gradient: "from-[#010066] via-[#010088] to-[#0100aa]",
      accentColor: "primary",
      features: ["Carton 80x60x60cm", "Suivi en temps réel", "Livraison sécurisée"],
      price: "100€ par carton"
    },
    {
      id: 1,
      icon: Package,
      title: "Envoi Barrique",
      subtitle: "Volume important",
      description: "Solution parfaite pour l'envoi de gros volumes vers le Burkina Faso",
      stats: "Barrique • 100€",
      gradient: "from-orange-500 via-orange-600 to-orange-700",
      accentColor: "orange",
      features: ["Grande capacité", "Objets volumineux", "Transport sécurisé"],
      price: "100€ par barrique"
    },
    {
      id: 2,
      icon: Truck,
      title: "Ramassage France",
      subtitle: "Service à domicile",
      description: "Nous ramassons vos colis partout en France pour plus de commodité",
      stats: "Ramassage • 20€",
      gradient: "from-[#010066] via-[#010088] to-[#0100aa]",
      accentColor: "primary",
      features: ["Toute la France", "À votre domicile", "Prise en charge rapide"],
      price: "20€ de frais"
    },
    {
      id: 3,
      icon: MapPin,
      title: "Livraison Burkina",
      subtitle: "Partout au pays",
      description: "Livraison rapide et fiable dans tout le Burkina Faso",
      stats: "Livraison • Incluse",
      gradient: "from-[#010066] via-[#010088] to-[#0100aa]",
      accentColor: "primary",
      features: ["Tout le Burkina Faso", "Livraison à domicile", "Remise en main propre"],
      price: "Inclus dans le tarif"
    },
    {
      id: 4,
      icon: Calendar,
      title: "Chargements Réguliers",
      subtitle: "Départs programmés",
      description: "Chargements réguliers avec dates fixes pour planifier vos envois",
      stats: "Prochain • 8 Juillet",
      gradient: "from-[#010066] via-[#010088] to-[#0100aa]",
      accentColor: "primary",
      features: ["Départs réguliers", "Dates prévisibles", "Planning fixe"],
      price: "Prochain: 8 Juillet 2025"
    },
    {
      id: 5,
      icon: Shield,
      title: "Sécurité & Suivi",
      subtitle: "Tranquillité d'esprit",
      description: "Vos colis sont protégés et suivis tout au long du transport",
      stats: "Suivi • Temps réel",
      gradient: "from-orange-500 via-orange-600 to-orange-700",
      accentColor: "orange",
      features: ["Transport sécurisé", "Suivi en ligne", "Assurance incluse"],
      price: "Sécurité garantie"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative py-12 sm:py-16 md:py-20 lg:py-32 bg-white overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full bg-blue-50/60 blur-3xl transition-all duration-1000"
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        <div className="absolute top-20 right-20 w-96 h-96 bg-orange-50/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 bg-blue-50 backdrop-blur-sm border border-blue-200 rounded-full px-3 sm:px-4 lg:px-6 py-2 lg:py-3 mb-4 sm:mb-6 lg:mb-8">
            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 animate-pulse" style={{ color: '#010066' }} />
            <span className="font-semibold text-xs sm:text-sm lg:text-base" style={{ color: '#010066' }}>Nos Services</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black mb-4 sm:mb-6 lg:mb-8 leading-[0.9] tracking-tight px-4" style={{ color: '#010066' }}>
            Envoi de Colis
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              France - Burkina Faso
            </span>
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light px-4">
            Ramassage dans toute la France, livraison partout au Burkina Faso. 
            Service fiable et sécurisé pour vos envois.
          </p>
        </div>

        {/* Interactive Services Showcase */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          
          {/* Left - Service Cards Stack */}
          <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            
            {/* Mobile: Simple Cards */}
            <div className="block lg:hidden">
              <div className="space-y-4 px-4">
                {services.map((service, index) => (
                  <div
                    key={service.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      activeService === index 
                        ? 'ring-2 ring-orange-200' 
                        : ''
                    }`}
                    onClick={() => setActiveService(index)}
                  >
                    <div className={`bg-gradient-to-r ${service.gradient} rounded-3xl p-6 shadow-lg border border-gray-200`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/90 rounded-xl flex items-center justify-center shadow-md">
                            <service.icon className="w-6 h-6 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{service.title}</h3>
                            <p className="text-white/90 text-sm font-medium">{service.subtitle}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          service.accentColor === 'orange' 
                            ? 'bg-orange-100/90 text-orange-800 border border-orange-200' 
                            : 'bg-blue-100/90 border border-blue-200'
                        }`} style={service.accentColor === 'primary' ? { color: '#010066' } : {}}>
                          {service.stats}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: Stacked Cards with Animation */}
            <div className="hidden lg:block">
              <div className="space-y-6">
                {services.map((service, index) => (
                  <div
                    key={service.id}
                    className={`relative cursor-pointer transform transition-all duration-700 ${
                      activeService === index 
                        ? 'scale-105 z-20' 
                        : activeService === index - 1 || activeService === index + 1
                          ? 'scale-95 opacity-60 z-10'
                          : 'scale-90 opacity-30 z-0'
                    }`}
                    onClick={() => setActiveService(index)}
                    style={{
                      marginTop: activeService === index ? '0' : '-60px',
                    }}
                  >
                    <div className={`bg-gradient-to-r ${service.gradient} rounded-3xl p-8 shadow-xl border border-gray-200 backdrop-blur-xl`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white/90 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                            <service.icon className="w-8 h-8 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                            <p className="text-white/90 font-medium">{service.subtitle}</p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                          service.accentColor === 'orange' 
                            ? 'bg-orange-100/90 text-orange-800 border border-orange-200' 
                            : 'bg-blue-100/90 border border-blue-200'
                        }`} style={service.accentColor === 'primary' ? { color: '#010066' } : {}}>
                          {service.stats}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Active Service Details */}
          <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 xl:p-10 border border-gray-200 shadow-2xl mx-2 sm:mx-0">
              
              {/* Service Header */}
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${services[activeService].gradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl`}>
                  {React.createElement(services[activeService].icon, { className: "w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" })}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black" style={{ color: '#010066' }}>{services[activeService].title}</h3>
                  <p className="text-gray-600 text-sm sm:text-base lg:text-lg">{services[activeService].subtitle}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-4 sm:mb-6 lg:mb-8 leading-relaxed">
                {services[activeService].description}
              </p>

              {/* Features */}
              <div className="grid gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
                {services[activeService].features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      services[activeService].accentColor === 'orange' 
                        ? 'bg-orange-500' 
                        : ''
                    }`} style={services[activeService].accentColor === 'primary' ? { backgroundColor: '#010066' } : {}} />
                    <span className="text-gray-700 font-medium text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Price & CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-6 border-t border-gray-200 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">Tarif</div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: '#010066' }}>{services[activeService].price}</div>
                </div>
                <button className={`flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 hover:scale-105 text-white shadow-lg text-sm sm:text-base ${
                  services[activeService].accentColor === 'orange'
                    ? 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/25'
                    : 'hover:opacity-90'
                }`} style={services[activeService].accentColor === 'primary' ? { backgroundColor: '#010066' } : {}}>
                  <Link href={"/#contact"}>
                    <span>En savoir plus</span>
                  </Link>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* CTA Section */}
        <div className={`text-center transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-gradient-to-r from-blue-50 via-orange-50 to-blue-50 backdrop-blur-xl rounded-3xl p-8 lg:p-12 border border-gray-200 shadow-xl mx-4 lg:mx-0">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 lg:mb-6" style={{ color: '#010066' }}>
              Prêt à envoyer vos colis ?
            </h3>
            <p className="text-lg lg:text-xl text-gray-600 mb-6 lg:mb-8 max-w-2xl mx-auto">
              Contactez-nous dès maintenant pour organiser l'envoi de vos colis vers le Burkina Faso
            </p>
            
            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center mb-8">
              <div className="flex items-center justify-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-md">
                <Phone className="w-5 h-5" style={{ color: '#010066' }} />
                <div className="text-left">
                  <div className="text-sm text-gray-500">France</div>
                  <div className="font-bold" style={{ color: '#010066' }}>+33 670 699 823</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-md">
                <Phone className="w-5 h-5" style={{ color: '#010066' }} />
                <div className="text-left">
                  <div className="text-sm text-gray-500">Burkina</div>
                  <div className="font-bold" style={{ color: '#010066' }}>+226 766 019 81</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center">
                <Link href={"/#contact"}>
                  <button className="text-white px-8 lg:px-10 py-4 lg:py-5 rounded-2xl font-bold text-base lg:text-lg hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl" style={{ backgroundColor: '#010066' }}>
                      <span>Demander un ramassage</span>
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                    </div>
                  </button>
                </Link>
                <Link href={"/services#services-list"}>
                  <button className="border-2 px-8 lg:px-10 py-4 lg:py-5 rounded-2xl font-bold text-base lg:text-lg hover:bg-blue-50 transition-all duration-300 backdrop-blur-sm" style={{ borderColor: '#010066', color: '#010066' }}>
                    Voir les tarifs
                  </button>
                </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}