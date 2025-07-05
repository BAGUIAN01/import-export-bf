"use client";
import React, { useState, useEffect } from 'react';
import { Car, Ship, Shield, ArrowRight, CheckCircle, Phone, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';


export default function CarShippingCard() {
  const [isHovered, setIsHovered] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isClient, setIsClient] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Assurance a votre charge",
      description: "Pour quelques billets de plus"
    },
    {
      icon: Ship,
      title: "Transport sécurisé",
      description: "Conteneur maritime professionnel"
    },
    {
      icon: Clock,
      title: "Délai garanti",
      description: "4 à 6 semaines de livraison"
    },
    {
      icon: MapPin,
      title: "Service complet",
      description: "Collecte France → Livraison Burkina"
    }
  ];

  const vehicles = [
    {
      id: 1,
      name: "Berline familiale",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=250&fit=crop",
      price: "À partir de 800€",
      type: "Voiture particulière"
    },
    {
      id: 2,
      name: "SUV compact",
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=250&fit=crop",
      price: "À partir de 900€",
      type: "SUV"
    },
    {
      id: 3,
      name: "Véhicule utilitaire",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=250&fit=crop",
      price: "À partir de 1200€",
      type: "Utilitaire"
    },
    {
      id: 5,
      name: "Pick-up",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=250&fit=crop",
      price: "À partir de 1100€",
      type: "Pick-up"
    }
  ];

  // Auto-play carousel
  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % vehicles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [vehicles.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % vehicles.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + vehicles.length) % vehicles.length);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-6">
        
        {/* Tag de section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#010066]/10 to-orange-500/10 backdrop-blur-sm border border-[#010066]/20 rounded-full px-6 py-2 mb-6">
            <Ship className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-700">Especialiste en expedition de voiture</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#010066] to-blue-900">
              Expédition de véhicules
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
              vers le Burkina Faso
            </span>
          </h2>
        </div>

        <div 
          className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Colonne gauche - Carousel de véhicules */}
            <div className="relative bg-gradient-to-br from-[#010066] to-blue-900 p-6">
              {/* Badge assurance */}
              <div className="absolute top-6 right-6 z-10">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                  <Shield className="w-4 h-4" />
                  Assurance non incluse
                </div>
              </div>

              {/* Carousel */}
              <div className="relative h-full">
                <div className="overflow-hidden rounded-2xl shadow-xl h-80">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out h-full"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="min-w-full relative h-full">
                        <img 
                          src={vehicle.image} 
                          alt={vehicle.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <div className="bg-orange-500/80 backdrop-blur-sm rounded-lg px-3 py-1 text-xs font-semibold mb-2 inline-block">
                            {vehicle.type}
                          </div>
                          <h4 className="text-2xl font-bold mb-1">{vehicle.name}</h4>
                          <p className="text-orange-300 font-semibold text-lg">{vehicle.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation arrows */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-3 transition-all duration-300 z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-3 transition-all duration-300 z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Dots indicator */}
                <div className="flex justify-center mt-6 gap-2">
                  {vehicles.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-orange-500 scale-125' 
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>

                {/* Parcours en bas */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/30 backdrop-blur-sm rounded-full px-6 py-2">
                  <div className="text-center">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg mb-1">
                      <span className="text-sm">🇫🇷</span>
                    </div>
                    <span className="text-xs text-white font-medium">France</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-6 h-0.5 bg-orange-400 rounded"></div>
                    <Ship className="w-5 h-5 text-orange-400 mx-2" />
                    <div className="w-6 h-0.5 bg-orange-400 rounded"></div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg mb-1">
                      <span className="text-sm">🇧🇫</span>
                    </div>
                    <span className="text-xs text-white font-medium">Burkina</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite - Informations */}
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-gray-900 mb-3 flex items-center gap-2">
                  <Car className="w-6 h-6 text-[#010066]" />
                  Service professionnel
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Confiez-nous l'expédition de votre véhicule en toute sérénité. 
                  Transport sécurisé par conteneur maritime.
                </p>
              </div>

              {/* Caractéristiques */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#010066] to-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{feature.title}</h4>
                      <p className="text-xs text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Services inclus */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Services inclus
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Collecte à domicile en France",
                    "Mise en conteneur sécurisée",
                    "Transport maritime",
                    "Dédouanement inclus",
                    "Livraison finale au Burkina Faso",
                    "Suivi GPS en temps réel"
                  ].map((service, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0"></div>
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlight tarif */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-orange-800 mb-1">Tarif exceptionnel</h4>
                    <p className="text-sm text-orange-700">À partir de 800€ selon le véhicule</p>
                  </div>
                  <div className="text-2xl font-black text-orange-600">
                    Devis gratuit
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/#contact" className='w-full sm:w-auto '>
                    <button className={`cursor-pointer group bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${isHovered ? 'scale-105 shadow-lg' : ''}`}>
                    <span>Demander un devis</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                </Link>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-green-500" />
                  <span className="font-medium">+33 6 70 69 98 23</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}