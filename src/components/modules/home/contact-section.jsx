import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mail, MapPin, Clock, Send, User, Package, MessageCircle, CheckCircle, ArrowRight, Calendar, Truck } from 'lucide-react';

export default function ContactSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [nextDeparture, setNextDeparture] = useState(null);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: '',
          phone: '',
          email: '',
          service: '',
          message: ''
        });
      }, 3000);
    }, 1000);
  };

  const contactMethods = [
    {
      icon: Phone,
      title: "Appelez-nous",
      details: [
        { label: "France", value: "+33 670 699 823", primary: true },
        { label: "Burkina Faso", value: "+226 766 019 81", primary: false }
      ],
      color: "from-green-500 to-green-600",
      description: "Réponse immédiate pour vos urgences"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      details: [
        { label: "Chat direct", value: "Disponible 24/7", primary: true }
      ],
      color: "from-emerald-500 to-emerald-600",
      description: "Le moyen le plus rapide pour nous joindre"
    },
    {
      icon: Mail,
      title: "Email",
      details: [
        { label: "Contact", value: "contact@ieBF.fr", primary: true }
      ],
      color: "from-blue-500 to-blue-600",
      description: "Pour vos demandes détaillées"
    },
    {
      icon: MapPin,
      title: "Ramassage",
      details: [
        { label: "Zone", value: "Toute la France", primary: true }
      ],
      color: "from-orange-500 to-orange-600",
      description: "Nous venons chercher vos colis"
    }
  ];

  const services = [
    { value: "colis-standard", label: "Envoi de colis standard" },
    { value: "barrique", label: "Envoi de barrique" },
    { value: "ramassage", label: "Demande de ramassage" },
    { value: "suivi", label: "Suivi de colis" },
    { value: "tarifs", label: "Information tarifs" },
    { value: "autre", label: "Autre demande" }
  ];

  const quickInfo = [
    {
      icon: Calendar,
      title: "Prochain chargement",
      value: nextDeparture?.hasNextDeparture 
        ? nextDeparture.departure.formatted.short 
        : "À déterminer",
      note: "Réservez votre place"
    },
    {
      icon: Package,
      title: "Tarifs",
      value: "100€",
      note: "Carton ou barrique"
    },
    {
      icon: Truck,
      title: "Ramassage",
      value: "20€",
      note: "Partout en Île de France"
    },
    {
      icon: Clock,
      title: "Délai moyen",
      value: "45 jours",
      note: "France → Burkina"
    }
  ];

  return (
    <section 
    id='contact'
      ref={sectionRef}
      className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-80 h-80 bg-blue-50/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-50/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className={`text-center mb-12 lg:mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 lg:px-6 py-2 lg:py-3 mb-6 shadow-sm">
            <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: '#010066' }} />
            <span className="font-semibold text-sm lg:text-base" style={{ color: '#010066' }}>Contactez-nous</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-6 leading-tight" style={{ color: '#010066' }}>
            Une question ?
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Nous sommes là pour vous
            </span>
          </h2>
          
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Notre équipe est disponible pour répondre à toutes vos questions sur l'envoi de colis 
            vers le Burkina Faso. Contactez-nous par le moyen qui vous convient le mieux.
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12 lg:mb-16 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {quickInfo.map((info, index) => (
            <div key={index} className="bg-white rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-[#010066] to-[#010088] rounded-xl flex items-center justify-center mx-auto mb-3">
                <info.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="text-lg lg:text-xl font-black mb-1" style={{ color: '#010066' }}>
                {info.value}
              </div>
              <div className="text-sm font-semibold text-gray-800 mb-1">
                {info.title}
              </div>
              <div className="text-xs text-gray-500">
                {info.note}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Left - Contact Methods */}
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <h3 className="text-2xl lg:text-3xl font-black mb-8" style={{ color: '#010066' }}>
              Comment nous joindre
            </h3>
            
            <div className="space-y-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-102">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${method.color} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <method.icon className="w-7 h-7 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-xl font-bold mb-2" style={{ color: '#010066' }}>
                        {method.title}
                      </h4>
                      
                      <div className="space-y-1 mb-3">
                        {method.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{detail.label}:</span>
                            <span className={`font-semibold ${detail.primary ? 'text-lg' : 'text-base'}`} style={{ color: detail.primary ? '#010066' : '#666' }}>
                              {detail.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-gray-600 text-sm">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Contact Form */}
          <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl border border-gray-100">
              <h3 className="text-2xl lg:text-3xl font-black mb-2" style={{ color: '#010066' }}>
                Envoyez-nous un message
              </h3>
              <p className="text-gray-600 mb-6 lg:mb-8">
                Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
              </p>

              {!isSubmitted ? (
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom complet *
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="Votre nom et prénom"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">
                      Téléphone *
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>

                  {/* Service */}
                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">
                      Type de demande *
                    </div>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="service"
                        value={formData.service}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors appearance-none bg-white"
                      >
                        <option value="">Sélectionnez un service</option>
                        {services.map((service) => (
                          <option key={service.value} value={service.value}>
                            {service.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">
                      Message *
                    </div>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                      placeholder="Décrivez votre demande en détail..."
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                  >
                    <Send className="w-5 h-5" />
                    <span>Envoyer le message</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-green-800 mb-2">
                    Message envoyé !
                  </h4>
                  <p className="text-green-600">
                    Nous vous répondrons dans les plus brefs délais.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className={`text-center mt-12 lg:mt-16 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-gradient-to-r from-[#010066] to-[#010088] rounded-3xl p-8 lg:p-10 text-white shadow-2xl">
            <h3 className="text-2xl lg:text-3xl font-black mb-4">
              Besoin d'une réponse immédiate ?
            </h3>
            <p className="text-blue-100 mb-6 lg:mb-8 text-lg">
              Appelez-nous directement, nous sommes disponibles 7j/7
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+33670699823"
                className="bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-3"
              >
                <Phone className="w-5 h-5" />
                Appeler maintenant
              </a>
              <a 
                href="#"
                className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}