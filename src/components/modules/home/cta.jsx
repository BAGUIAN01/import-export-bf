import React, { useState, useEffect, useRef } from 'react';
import { Package, Phone, MapPin, Calendar, ArrowRight, Clock, Shield, Heart, Truck, CheckCircle } from 'lucide-react';

export default function CTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 12,
    hours: 8,
    minutes: 45,
    seconds: 30
  });
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

    return () => observer.disconnect();
  }, []);

  // Countdown timer simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const benefits = [
    {
      icon: Truck,
      title: "Ramassage gratuit",
      description: "À partir de 3 colis"
    },
    {
      icon: Shield,
      title: "Transport sécurisé",
      description: "Assurance incluse"
    },
    {
      icon: Clock,
      title: "Délai garanti",
      description: "15 jours maximum"
    },
    {
      icon: Heart,
      title: "Service humain",
      description: "Équipe à votre écoute"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-[#010066] via-[#010088] to-[#010066] overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Pattern Overlay */}
      {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div> */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main CTA Content */}
        <div className={`text-center mb-12 lg:mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Urgency Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-500 rounded-full px-4 lg:px-6 py-2 lg:py-3 mb-6 lg:mb-8 shadow-lg">
            <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-white animate-pulse" />
            <span className="font-bold text-sm lg:text-base text-white">Prochain chargement : 18 Juin 2025</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-6 lg:mb-8 leading-tight text-white">
            Votre colis doit partir ?
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Réservez maintenant !
            </span>
          </h2>
          
          <p className="text-lg lg:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed mb-8 lg:mb-12">
            Places limitées pour le prochain chargement vers le Burkina Faso. 
            Garantissez l'envoi de vos colis avec nos tarifs préférentiels.
          </p>

          {/* Countdown Timer */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 lg:p-8 border border-white/20 max-w-lg mx-auto mb-8 lg:mb-12">
            <h3 className="text-white font-bold mb-4 lg:mb-6">Temps restant pour réserver :</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { value: timeLeft.days, label: 'Jours' },
                { value: timeLeft.hours, label: 'Heures' },
                { value: timeLeft.minutes, label: 'Minutes' },
                { value: timeLeft.seconds, label: 'Secondes' }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="bg-orange-500 rounded-xl p-3 lg:p-4 mb-2 shadow-lg">
                    <div className="text-xl lg:text-2xl xl:text-3xl font-black text-white">
                      {item.value.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="text-xs lg:text-sm text-blue-200 font-medium">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center mb-12">
            <button className="group bg-orange-500 hover:bg-orange-400 text-white px-8 lg:px-12 py-4 lg:py-5 rounded-2xl font-black text-lg lg:text-xl transition-all duration-300 hover:scale-105 shadow-2xl flex items-center justify-center gap-3">
              <Package className="w-6 h-6 lg:w-7 lg:h-7" />
              <span>Réserver ma place</span>
              <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="border-2 border-white/50 hover:border-white text-white hover:bg-white/10 px-8 lg:px-12 py-4 lg:py-5 rounded-2xl font-bold text-lg lg:text-xl transition-all duration-300 backdrop-blur-sm">
              Calculer le prix
            </button>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12 lg:mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                <benefit.icon className="w-8 h-8 lg:w-10 lg:h-10 text-orange-400" />
              </div>
              <h4 className="text-white font-bold text-base lg:text-lg mb-2">
                {benefit.title}
              </h4>
              <p className="text-blue-200 text-sm lg:text-base">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className={`bg-white/10 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-white/20 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-center">
            
            {/* Contact Info */}
            <div className="md:col-span-2 lg:col-span-2">
              <h3 className="text-xl lg:text-2xl font-black text-white mb-4 lg:mb-6">
                Besoin d'aide ? Contactez-nous directement
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-blue-200 text-sm">France</div>
                    <div className="text-white font-bold">+33 670 699 823</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-blue-200 text-sm">Burkina Faso</div>
                    <div className="text-white font-bold">+226 766 019 81</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="text-center lg:text-right">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-xl">
                <CheckCircle className="w-8 h-8 text-white mx-auto lg:ml-auto lg:mr-0 mb-3" />
                <div className="text-white font-bold text-lg mb-2">Disponible 24/7</div>
                <div className="text-orange-100 text-sm">Réponse immédiate par WhatsApp</div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Urgency Message */}
        <div className={`text-center mt-8 lg:mt-12 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-orange-500/20 border border-orange-400/30 rounded-2xl p-4 lg:p-6 max-w-2xl mx-auto">
            <p className="text-orange-200 font-semibold text-sm lg:text-base">
              ⚡ Places limitées • Plus que <span className="text-orange-300 font-black">15 places</span> disponibles pour ce chargement
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}