import React, { useState, useEffect, useRef } from 'react';
import { Package, Users, MapPin, Clock, TrendingUp, CheckCircle, Truck, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function Stats() {
  const [isVisible, setIsVisible] = useState(false);
  const [counters, setCounters] = useState({
    colis: 0,
    clients: 0,
    experience: 0,
    satisfaction: 0
  });
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Start counting animation
          startCounting();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  const startCounting = () => {
    const targets = {
      colis: 2500,
      clients: 850,
      experience: 8,
      satisfaction: 99
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setCounters({
        colis: Math.floor(targets.colis * progress),
        clients: Math.floor(targets.clients * progress),
        experience: Math.floor(targets.experience * progress),
        satisfaction: Math.floor(targets.satisfaction * progress)
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounters(targets);
      }
    }, interval);
  };

  const mainStats = [
    {
      icon: Package,
      number: `${counters.colis.toLocaleString()}+`,
      label: "Colis envoyés",
      description: "Depuis notre création",
      color: "primary",
      gradient: "from-[#010066] to-[#010088]"
    },
    {
      icon: Users,
      number: `${counters.clients}+`,
      label: "Clients satisfaits",
      description: "Font confiance à nos services",
      color: "orange",
      gradient: "from-orange-500 to-orange-600"
    },
    {
      icon: Clock,
      number: `${counters.experience}`,
      label: "Années d'expérience",
      description: "Sur la ligne France-Burkina",
      color: "primary",
      gradient: "from-[#010066] to-[#010088]"
    },
    {
      icon: CheckCircle,
      number: `${counters.satisfaction}%`,
      label: "Taux de satisfaction",
      description: "Clients recommandent nos services",
      color: "orange",
      gradient: "from-orange-500 to-orange-600"
    }
  ];

  const additionalStats = [
    {
      icon: MapPin,
      value: "2",
      label: "Pays couverts",
      detail: "France & Burkina Faso"
    },
    {
      icon: Truck,
      value: "15j",
      label: "Délai moyen",
      detail: "De la France au Burkina"
    },
    {
      icon: Calendar,
      value: "1x/mois",
      label: "Fréquence",
      detail: "Chargements réguliers"
    },
    {
      icon: Package,
      value: "100€",
      label: "Tarif fixe",
      detail: "Carton ou barrique"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Pattern Background */}
      {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23e2e8f0" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div> */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className={`text-center mb-12 lg:mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 lg:px-6 py-2 lg:py-3 mb-6 lg:mb-8 shadow-sm">
            <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: '#010066' }} />
            <span className="font-semibold text-sm lg:text-base" style={{ color: '#010066' }}>Nos Résultats</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-4 lg:mb-6 leading-tight" style={{ color: '#010066' }}>
            Des chiffres qui
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              parlent d'eux-mêmes
            </span>
          </h2>
          
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Plus de 8 ans d'expérience dans l'envoi de colis entre la France et le Burkina Faso. 
            Découvrez pourquoi nos clients nous font confiance.
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16 lg:mb-20 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {mainStats.map((stat, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-3xl p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-100 ${
                index % 2 === 0 ? 'lg:mt-0' : 'lg:mt-8'
              }`}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}></div>
              
              {/* Icon */}
              <div className={`w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mb-4 lg:mb-6 mx-auto shadow-lg`}>
                <stat.icon className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              
              {/* Number */}
              <div className="text-center mb-3 lg:mb-4">
                <div className="text-3xl lg:text-4xl xl:text-5xl font-black mb-2" style={{ color: '#010066' }}>
                  {stat.number}
                </div>
                <div className="text-base lg:text-lg font-bold text-gray-800">
                  {stat.label}
                </div>
              </div>
              
              {/* Description */}
              <div className="text-center">
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                  {stat.description}
                </p>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent to-gray-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>

        {/* Additional Stats Bar */}
        <div className={`bg-white rounded-3xl p-6 lg:p-8 shadow-xl border border-gray-100 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {additionalStats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 lg:mb-4 group-hover:bg-blue-100 transition-colors duration-300">
                  <stat.icon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: '#010066' }} />
                </div>
                <div className="text-xl lg:text-2xl font-black mb-1" style={{ color: '#010066' }}>
                  {stat.value}
                </div>
                <div className="text-sm lg:text-base font-semibold text-gray-800 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs lg:text-sm text-gray-500">
                  {stat.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className={`text-center mt-12 lg:mt-16 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-gradient-to-r from-[#010066] to-[#010088] rounded-3xl p-8 lg:p-12 text-white shadow-2xl">
            <h3 className="text-2xl lg:text-3xl font-black mb-4">
              Rejoignez nos clients satisfaits
            </h3>
            <p className="text-blue-100 mb-6 lg:mb-8 text-lg max-w-2xl mx-auto">
              Faites confiance à notre expertise pour l'envoi de vos colis vers le Burkina Faso
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={"/#contact"}>
                <button className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg">
                  Envoyer un colis
                </button>
              </Link>
              <Link href={"/services"}>
                <button className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300">
                  Nos tarifs
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}