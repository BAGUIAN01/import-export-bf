import React, { useState, useEffect, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, MapPin, Calendar, Package, Heart } from 'lucide-react';

export default function Testimonials() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const sectionRef = useRef(null);

  const testimonials = [
    {
      id: 1,
      name: "Aminata Traoré",
      location: "Paris → Ouagadougou",
      rating: 5,
      date: "Mars 2024",
      testimonial: "Service exceptionnel ! Mes colis arrivent toujours en parfait état et dans les délais annoncés. Ma famille au Burkina peut compter sur la régularité des envois. Je recommande vivement !",
      type: "Colis personnel",
      avatar: "AT",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 2,
      name: "Ibrahim Sawadogo",
      location: "Lyon → Bobo-Dioulasso",
      rating: 5,
      date: "Février 2024",
      testimonial: "8 ans que j'utilise leurs services et jamais déçu ! L'équipe est professionnelle, les prix sont honnêtes et le suivi est parfait. C'est devenu mon service de référence pour tous mes envois.",
      type: "Client fidèle",
      avatar: "IS",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 3,
      name: "Mariam Ouédraogo",
      location: "Marseille → Kaya",
      rating: 5,
      date: "Janvier 2024",
      testimonial: "Ramassage à domicile très pratique ! Plus besoin de me déplacer, ils viennent chercher mes barriques directement chez moi. Service client au top et livraison garantie. Parfait pour nous les mamans !",
      type: "Ramassage domicile",
      avatar: "MO",
      color: "from-green-500 to-green-600"
    },
    {
      id: 4,
      name: "Souleymane Compaoré",
      location: "Toulouse → Koudougou",
      rating: 5,
      date: "Décembre 2023",
      testimonial: "J'envoie des médicaments et des produits pour mon commerce. Tout arrive en sécurité et mes clients sont contents des délais. Relation de confiance établie depuis des années.",
      type: "Usage commercial",
      avatar: "SC",
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 5,
      name: "Fatou Kaboré",
      location: "Bordeaux → Fada N'Gourma",
      rating: 5,
      date: "Novembre 2023",
      testimonial: "Ma mère reçoit ses colis directement chez elle même dans une petite ville. C'est rassurant de savoir qu'ils livrent partout au Burkina. Service humain et professionnel.",
      type: "Livraison familiale",
      avatar: "FK",
      color: "from-pink-500 to-pink-600"
    },
    {
      id: 6,
      name: "Abdoul Kader Ouattara",
      location: "Nantes → Banfora",
      rating: 5,
      date: "Octobre 2023",
      testimonial: "Prix très compétitifs et service de qualité. J'ai comparé avec d'autres services et ils offrent le meilleur rapport qualité-prix. Suivi en ligne très pratique pour rassurer la famille.",
      type: "Bon rapport qualité-prix",
      avatar: "AO",
      color: "from-indigo-500 to-indigo-600"
    }
  ];

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

  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlay(false);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlay(false);
  };

  const goToTestimonial = (index) => {
    setCurrentTestimonial(index);
    setIsAutoPlay(false);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const current = testimonials[currentTestimonial];

  return (
    <section 
      ref={sectionRef}
      className="relative py-16 sm:py-20 lg:py-24 bg-white overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-80 h-80 bg-orange-50/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-50/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className={`text-center mb-12 lg:mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 bg-orange-50 backdrop-blur-sm border border-orange-200 rounded-full px-4 lg:px-6 py-2 lg:py-3 mb-6 shadow-sm">
            <Heart className="w-4 h-4 lg:w-5 lg:h-5 text-orange-600" />
            <span className="font-semibold text-sm lg:text-base text-orange-800">Témoignages Clients</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-6 leading-tight" style={{ color: '#010066' }}>
            Ils nous font
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              confiance depuis des années
            </span>
          </h2>
          
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Découvrez les retours de nos clients satisfaits qui nous recommandent 
            pour leurs envois vers le Burkina Faso.
          </p>
        </div>

        {/* Main Testimonial */}
        <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative max-w-4xl mx-auto">
            
            {/* Navigation Buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-300 z-10"
            >
              <ChevronLeft className="w-6 h-6" style={{ color: '#010066' }} />
            </button>

            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-300 z-10"
            >
              <ChevronRight className="w-6 h-6" style={{ color: '#010066' }} />
            </button>

            {/* Testimonial Card */}
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-2xl border border-gray-100 relative overflow-hidden">
              
              {/* Quote Icon */}
              <div className="absolute top-8 right-8 opacity-10">
                <Quote className="w-20 h-20" style={{ color: '#010066' }} />
              </div>

              {/* Client Info */}
              <div className="flex items-start gap-6 mb-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${current.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                  {current.avatar}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl lg:text-2xl font-bold" style={{ color: '#010066' }}>
                      {current.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {renderStars(current.rating)}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{current.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{current.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{current.type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial Text */}
              <blockquote className="text-lg lg:text-xl text-gray-700 leading-relaxed italic mb-8">
                "{current.testimonial}"
              </blockquote>

              {/* Rating Display */}
              <div className="flex items-center justify-center gap-2 bg-yellow-50 rounded-2xl py-4 px-6 border border-yellow-200">
                <div className="flex items-center gap-1">
                  {renderStars(5)}
                </div>
                <span className="text-yellow-800 font-semibold ml-2">5/5 étoiles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-3 mt-8 lg:mt-12">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentTestimonial 
                  ? 'bg-orange-500 w-8' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Summary Stats */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {[
            { number: "850+", label: "Clients satisfaits", icon: Heart },
            { number: "99%", label: "Recommandent", icon: Star },
            { number: "5/5", label: "Note moyenne", icon: Star },
            { number: "8 ans", label: "De confiance", icon: Package },
          ].map((stat, index) => (
            <div key={index} className="text-center bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#010066] to-[#010088] rounded-xl flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl lg:text-3xl font-black mb-1" style={{ color: '#010066' }}>
                {stat.number}
              </div>
              <div className="text-sm lg:text-base text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center mt-12 lg:mt-16 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 lg:p-10 text-white shadow-2xl max-w-4xl mx-auto">
            <h3 className="text-2xl lg:text-3xl font-black mb-4">
              Rejoignez nos clients satisfaits
            </h3>
            <p className="text-orange-100 mb-6 lg:mb-8 text-lg">
              Commencez dès aujourd'hui et découvrez pourquoi ils nous recommandent
            </p>
            <button className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg">
              Envoyer mon premier colis
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}