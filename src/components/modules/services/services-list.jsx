"use client";
import React, { useState, useEffect } from 'react';
import { Package, Truck, Home, ArrowRight, CheckCircle, Clock, Shield, Euro, Star, Zap, Users, Globe } from 'lucide-react';
import Link from 'next/link';

export default function ServicesList() {
  const [visibleCards, setVisibleCards] = useState([]);
  const [activeService, setActiveService] = useState(0);

  const services = [
    {
      id: 'colis-standard',
      icon: Package,
      title: 'Colis Standard',
      price: '100€',
      originalPrice: null,
      popular: true,
      badge: 'Le plus populaire',
      description: 'Solution idéale pour vos envois quotidiens vers le Burkina Faso',
      details: 'Parfait pour vêtements, produits alimentaires, médicaments et objets personnels',
      features: [
        'Jusqu\'à 30kg maximum',
        'Dimensions: 80x60x60cm',
        'Livraison 20-45 jours',
        'Assurance incluse',
        'Suivi GPS temps réel',
        'Support client 24/7'
      ],
      includes: [
        'Collecte possible (+20€)',
        'Emballage sécurisé',
        'Dédouanement inclus',
        'Livraison à domicile'
      ],
      color: 'from-[#010066] to-blue-900',
      bgColor: 'bg-blue-50',
      textColor: 'text-[#010066]',
      stats: { satisfaction: '98%', livraisons: '1500+' }
    },
    {
      id: 'transport-barrique',
      icon: Truck,
      title: 'Transport Barrique',
      price: '100€',
      originalPrice: '120€',
      popular: false,
      badge: 'Spécialisé',
      description: 'Pour vos contenants lourds et volumineux vers le Burkina Faso',
      details: 'Idéal pour huile, miel, bidons et tous contenants de grande capacité',
      features: [
        'Fûts jusqu\'à 200L',
        'Bidons et contenants',
        'Transport sécurisé',
        'Manutention spécialisée',
        'Assurance renforcée',
        'Livraison 30-45 jours'
      ],
      includes: [
        'Collecte à domicile incluse',
        'Protection anti-choc',
        'Étiquetage professionnel',
        'Suivi personnalisé'
      ],
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      stats: { satisfaction: '95%', livraisons: '500+' }
    },
    {
      id: 'ramassage-domicile',
      icon: Home,
      title: 'Ramassage Domicile',
      price: '+20€',
      originalPrice: null,
      popular: false,
      badge: 'Service premium',
      description: 'Nous venons collecter vos colis directement chez vous',
      details: 'Service pratique disponible dans toute la France métropolitaine',
      features: [
        'Collecte à votre adresse',
        'Rendez-vous planifié',
        'Toute la France',
        'Emballage sur place',
        'Reçu immédiat',
        'Flexibilité horaire'
      ],
      includes: [
        'Déplacement inclus',
        'Vérification colis',
        'Paperasse administrative',
        'Confirmation SMS'
      ],
      color: 'from-[#010066] to-blue-900',
      bgColor: 'bg-blue-50',
      textColor: 'text-[#010066]',
      stats: { satisfaction: '99%', livraisons: '800+' }
    }
  ];

  const whyChooseUs = [
    {
      icon: Shield,
      title: 'Sécurité Garantie',
      desc: 'Assurance tous risques incluse sur chaque envoi',
      color: 'text-[#010066]'
    },
    {
      icon: Clock,
      title: 'Délais Respectés',
      desc: 'Livraison dans les temps, 98% de ponctualité',
      color: 'text-orange-500'
    },
    {
      icon: Users,
      title: 'Service Familial',
      desc: '8 ans d\'expérience, relation de confiance',
      color: 'text-[#010066]'
    },
    {
      icon: Globe,
      title: 'Réseau Établi',
      desc: 'Partenaires fiables en France et au Burkina',
      color: 'text-orange-500'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveService((prev) => (prev + 1) % services.length);
    }, 5000);

    // Animation d'apparition séquentielle
    services.forEach((_, index) => {
      setTimeout(() => {
        setVisibleCards(prev => [...prev, index]);
      }, index * 200);
    });

    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 120;
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="services-list" className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#010066]/10 to-orange-500/10 backdrop-blur-sm border border-[#010066]/20 rounded-full px-6 py-2 mb-6">
            <Star className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-700">Nos Services d'Envoi</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#010066] to-blue-900">
              Solutions sur mesure
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
              pour tous vos envois
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Depuis 8 ans, nous proposons des services adaptés à chaque besoin. 
            Du simple colis aux objets volumineux, nous avons la solution qui vous convient.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <div
              key={service.id}
              className={`relative transform transition-all duration-700 ${
                visibleCards.includes(index) 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-10'
              } ${
                index === activeService 
                  ? 'scale-105 shadow-2xl' 
                  : 'hover:scale-102 shadow-xl hover:shadow-2xl'
              }`}
              onMouseEnter={() => setActiveService(index)}
            >
              {/* Popular Badge */}
              {service.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {service.badge}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl p-8 border border-gray-100 h-full relative overflow-hidden group">
                
                {/* Background Gradient */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${service.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-300`}></div>

                {/* Header */}
                <div className="relative z-10 mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-black text-gray-900">{service.title}</h3>
                    <div className="text-right">
                      <div className={`text-3xl font-black bg-gradient-to-r ${service.color} bg-clip-text text-transparent`}>
                        {service.price}
                      </div>
                      {service.originalPrice && (
                        <div className="text-sm text-gray-400 line-through">
                          {service.originalPrice}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 font-medium mb-2">{service.description}</p>
                  <p className="text-sm text-gray-500">{service.details}</p>
                </div>

                {/* Features */}
                <div className="relative z-10 mb-6">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${service.textColor}`} />
                    Caractéristiques
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {service.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className={`w-1.5 h-1.5 ${service.bgColor} rounded-full`}></div>
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="relative z-10 mb-6">
                  <div className="flex gap-4">
                    <div className={`${service.bgColor} rounded-xl p-3 flex-1 text-center`}>
                      <div className={`text-lg font-black ${service.textColor}`}>
                        {service.stats.satisfaction}
                      </div>
                      <div className="text-xs text-gray-600">Satisfaction</div>
                    </div>
                    <div className={`${service.bgColor} rounded-xl p-3 flex-1 text-center`}>
                      <div className={`text-lg font-black ${service.textColor}`}>
                        {service.stats.livraisons}
                      </div>
                      <div className="text-xs text-gray-600">Livraisons</div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => scrollToSection(service.id)}
                  className={`relative z-10 w-full bg-gradient-to-r ${service.color} text-white font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 group/btn`}
                >
                  <span>En savoir plus</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Why Choose Us */}
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-100">
          <div className="text-center mb-10">
            <h3 className="text-2xl lg:text-3xl font-black text-gray-900 mb-4">
              Pourquoi choisir <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">IE BF</span> ?
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              8 années d'expérience au service de la communauté franco-burkinabè
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item, index) => (
              <div
                key={index}
                className="text-center group cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                <div className={`w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-gray-100 group-hover:to-gray-50 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                  <item.icon className={`w-8 h-8 ${item.color} group-hover:scale-110 transition-transform duration-300`} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-[#010066] to-blue-900 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-4 right-4 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-2xl lg:text-3xl font-black mb-4">
                Prêt à envoyer votre colis ?
              </h3>
              <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                Choisissez le service qui correspond à vos besoins et bénéficiez de notre expertise
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/#contact">
                  <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center gap-2 group">
                    <Zap className="w-5 h-5" />
                    <span>Demander un devis</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                  
                </Link>
                <div className="flex items-center gap-4 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>🇫🇷 +33 6 70 69 98 23</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>🇧🇫 +226 76 60 19 81</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}