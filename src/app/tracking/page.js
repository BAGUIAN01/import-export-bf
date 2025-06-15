"use client";
import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, Clock, CheckCircle, Truck, Plane, Home, Phone, Mail, AlertCircle, Info, Calendar, User, Globe, ArrowRight, Copy, ExternalLink } from 'lucide-react';

export default function TrackPackagePage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Données de démonstration
  const demoPackages = {
    'IEG2025001234': {
      id: 'IEG2025001234',
      status: 'delivered',
      currentStep: 5,
      sender: {
        name: 'Aminata Traoré',
        phone: '+33 6 12 34 56 78',
        address: 'Paris, France'
      },
      recipient: {
        name: 'Salif Traoré',
        phone: '+226 70 12 34 56',
        address: 'Secteur 15, Ouagadougou, Burkina Faso'
      },
      package: {
        type: 'Colis Standard',
        weight: '15kg',
        description: 'Vêtements et médicaments',
        value: '150€'
      },
      timeline: [
        {
          status: 'collected',
          title: 'Colis collecté',
          description: 'Colis récupéré à Paris',
          location: 'Paris, France',
          date: '2025-06-10',
          time: '14:30',
          icon: Package,
          completed: true
        },
        {
          status: 'processing',
          title: 'En préparation',
          description: 'Colis préparé pour expédition',
          location: 'Centre de tri, Paris',
          date: '2025-06-11',
          time: '09:15',
          icon: Package,
          completed: true
        },
        {
          status: 'shipped',
          title: 'Expédié',
          description: 'Colis parti vers le Burkina Faso',
          location: 'Aéroport Charles de Gaulle',
          date: '2025-06-12',
          time: '18:45',
          icon: Plane,
          completed: true
        },
        {
          status: 'transit',
          title: 'En transit',
          description: 'Arrivé à Ouagadougou',
          location: 'Aéroport de Ouagadougou',
          date: '2025-06-14',
          time: '11:20',
          icon: Globe,
          completed: true
        },
        {
          status: 'customs',
          title: 'Dédouanement',
          description: 'Dédouanement terminé',
          location: 'Douane Ouagadougou',
          date: '2025-06-15',
          time: '16:00',
          icon: CheckCircle,
          completed: true
        },
        {
          status: 'delivered',
          title: 'Livré',
          description: 'Colis livré au destinataire',
          location: 'Secteur 15, Ouagadougou',
          date: '2025-06-16',
          time: '10:30',
          icon: Home,
          completed: true
        }
      ],
      estimatedDelivery: '2025-06-16',
      actualDelivery: '2025-06-16'
    },
    'IEG2025005678': {
      id: 'IEG2025005678',
      status: 'transit',
      currentStep: 3,
      sender: {
        name: 'Jean-Baptiste Ouédraogo',
        phone: '+33 6 98 76 54 32',
        address: 'Lyon, France'
      },
      recipient: {
        name: 'Marie Ouédraogo',
        phone: '+226 76 98 76 54',
        address: 'Bobo-Dioulasso, Burkina Faso'
      },
      package: {
        type: 'Transport Barrique',
        weight: '50kg',
        description: 'Bidons d\'huile',
        value: '200€'
      },
      timeline: [
        {
          status: 'collected',
          title: 'Colis collecté',
          description: 'Barrique récupérée à Lyon',
          location: 'Lyon, France',
          date: '2025-06-13',
          time: '16:00',
          icon: Package,
          completed: true
        },
        {
          status: 'processing',
          title: 'En préparation',
          description: 'Préparation pour transport spécialisé',
          location: 'Centre de tri, Lyon',
          date: '2025-06-14',
          time: '10:30',
          icon: Truck,
          completed: true
        },
        {
          status: 'shipped',
          title: 'Expédié',
          description: 'Transport vers le Burkina Faso',
          location: 'Port de Marseille',
          date: '2025-06-15',
          time: '14:00',
          icon: Plane,
          completed: true
        },
        {
          status: 'transit',
          title: 'En transit',
          description: 'En cours de transport',
          location: 'En route vers Ouagadougou',
          date: '2025-06-16',
          time: 'En cours',
          icon: Globe,
          completed: false,
          current: true
        },
        {
          status: 'customs',
          title: 'Dédouanement',
          description: 'Procédures douanières',
          location: 'Douane Ouagadougou',
          date: 'Estimé: 2025-06-18',
          time: '',
          icon: CheckCircle,
          completed: false
        },
        {
          status: 'delivered',
          title: 'Livraison',
          description: 'Livraison au destinataire',
          location: 'Bobo-Dioulasso',
          date: 'Estimé: 2025-06-20',
          time: '',
          icon: Home,
          completed: false
        }
      ],
      estimatedDelivery: '2025-06-20',
      actualDelivery: null
    }
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSearch = () => {
    if (!trackingNumber.trim()) return;
    
    setIsLoading(true);
    
    // Simulation d'une recherche
    setTimeout(() => {
      const result = demoPackages[trackingNumber.toUpperCase()];
      setSearchResults(result || 'not_found');
      setIsLoading(false);
      if (result) {
        setCurrentStep(result.currentStep);
      }
    }, 1500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'transit': return 'text-blue-600 bg-blue-100';
      case 'customs': return 'text-orange-600 bg-orange-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'collected': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered': return 'Livré';
      case 'transit': return 'En transit';
      case 'customs': return 'Dédouanement';
      case 'shipped': return 'Expédié';
      case 'processing': return 'En préparation';
      case 'collected': return 'Collecté';
      default: return 'Inconnu';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Vous pouvez ajouter une notification ici
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-br from-[#010066] via-blue-900 to-[#010066] overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-20 w-80 h-80 bg-[#010066]/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-6">
              <Package className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-white/80">Suivi de Colis</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                Suivez votre colis
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                en temps réel
              </span>
            </h1>
            
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-8">
              Entrez votre numéro de suivi pour connaître la position exacte de votre colis
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Entrez votre numéro de suivi"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full px-6 py-4 bg-white/90 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-lg font-medium"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || !trackingNumber.trim()}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    <span>Rechercher</span>
                  </button>
                </div>
              </div>

              {/* Demo Numbers */}
              <div className="mt-6 text-center">
                <p className="text-white/60 text-sm mb-3">Numéros de démonstration :</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.keys(demoPackages).map((number) => (
                    <button
                      key={number}
                      onClick={() => setTrackingNumber(number)}
                      className="text-orange-400 hover:text-orange-300 text-sm font-medium underline transition-colors"
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {searchResults && (
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            
            {searchResults === 'not_found' ? (
              /* Not Found */
              <div className="max-w-2xl mx-auto text-center">
                <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
                  <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">Colis non trouvé</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Aucun colis ne correspond au numéro <strong>{trackingNumber}</strong>. 
                    Vérifiez le numéro ou contactez notre service client.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => {setSearchResults(null); setTrackingNumber('');}}
                      className="bg-gradient-to-r from-[#010066] to-blue-900 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      Nouvelle recherche
                    </button>
                    <button className="border-2 border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-600 font-bold px-6 py-3 rounded-xl transition-all duration-300">
                      Nous contacter
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Package Found */
              <div className="max-w-6xl mx-auto">
                
                {/* Package Header */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mb-8">
                  <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Package Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#010066] to-blue-900 rounded-2xl flex items-center justify-center">
                          <Package className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-gray-900 mb-1">
                            Colis {searchResults.id}
                          </h2>
                          <div className="flex items-center gap-2">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(searchResults.status)}`}>
                              {getStatusText(searchResults.status)}
                            </span>
                            <button 
                              onClick={() => copyToClipboard(searchResults.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                              title="Copier le numéro"
                            >
                              <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <User className="w-4 h-4 text-[#010066]" />
                            Expéditeur
                          </h4>
                          <p className="text-gray-700 font-medium">{searchResults.sender.name}</p>
                          <p className="text-gray-500 text-sm">{searchResults.sender.address}</p>
                          <p className="text-gray-500 text-sm">{searchResults.sender.phone}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            Destinataire
                          </h4>
                          <p className="text-gray-700 font-medium">{searchResults.recipient.name}</p>
                          <p className="text-gray-500 text-sm">{searchResults.recipient.address}</p>
                          <p className="text-gray-500 text-sm">{searchResults.recipient.phone}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-600" />
                            Détails du colis
                          </h4>
                          <p className="text-gray-700 font-medium">{searchResults.package.type}</p>
                          <p className="text-gray-500 text-sm">{searchResults.package.weight} • {searchResults.package.value}</p>
                          <p className="text-gray-500 text-sm">{searchResults.package.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="lg:w-80">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-orange-500" />
                          Informations de livraison
                        </h4>
                        
                        {searchResults.status === 'delivered' ? (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="font-bold text-green-600">Livré</span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">
                              Livré le {new Date(searchResults.actualDelivery).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-5 h-5 text-blue-500" />
                              <span className="font-bold text-blue-600">Livraison estimée</span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">
                              {new Date(searchResults.estimatedDelivery).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-2">Progression</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-[#010066] to-blue-900 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(searchResults.currentStep / searchResults.timeline.length) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-[#010066]">
                              {searchResults.currentStep}/{searchResults.timeline.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-orange-500" />
                    Historique de livraison
                  </h3>

                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    <div className="space-y-8">
                      {searchResults.timeline.map((step, index) => (
                        <div key={index} className="relative flex items-start gap-6">
                          
                          {/* Icon */}
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center z-10 shadow-lg transition-all duration-300 ${
                            step.completed 
                              ? 'bg-gradient-to-br from-[#010066] to-blue-900' 
                              : step.current
                                ? 'bg-gradient-to-br from-orange-500 to-red-600 animate-pulse'
                                : 'bg-gray-200'
                          }`}>
                            <step.icon className={`w-8 h-8 ${
                              step.completed || step.current ? 'text-white' : 'text-gray-400'
                            }`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <h4 className={`text-xl font-bold ${
                                step.completed || step.current ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {step.title}
                              </h4>
                              {step.current && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                  En cours
                                </span>
                              )}
                            </div>
                            
                            <p className={`mb-3 ${
                              step.completed || step.current ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                              {step.description}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className={`w-4 h-4 ${
                                  step.completed || step.current ? 'text-[#010066]' : 'text-gray-300'
                                }`} />
                                <span className={step.completed || step.current ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                                  {step.location}
                                </span>
                              </div>
                              
                              {step.date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className={`w-4 h-4 ${
                                    step.completed || step.current ? 'text-orange-500' : 'text-gray-300'
                                  }`} />
                                  <span className={step.completed || step.current ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                                    {step.date} {step.time && `• ${step.time}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                  <button 
                    onClick={() => {setSearchResults(null); setTrackingNumber('');}}
                    className="bg-gradient-to-r from-[#010066] to-blue-900 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center gap-2 justify-center"
                  >
                    <Search className="w-5 h-5" />
                    Nouvelle recherche
                  </button>
                  
                  <button className="border-2 border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-600 font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:bg-orange-50 flex items-center gap-2 justify-center">
                    <ExternalLink className="w-5 h-5" />
                    Partager le suivi
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Help Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-[#010066] to-blue-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-6">
            Besoin d'aide avec votre colis ?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Notre équipe est disponible 24/7 pour vous aider avec le suivi de votre envoi
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <a href="tel:+33670699823" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105 group">
              <Phone className="w-8 h-8 text-orange-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-bold mb-1">France</div>
              <div className="text-white/80">+33 6 70 69 98 23</div>
            </a>
            
            <a href="tel:+22676601981" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105 group">
              <Phone className="w-8 h-8 text-orange-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-bold mb-1">Burkina Faso</div>
              <div className="text-white/80">+226 76 60 19 81</div>
            </a>
          </div>
          
          <div className="mt-8">
            <a href="mailto:contact@ieglobal.fr" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors">
              <Mail className="w-5 h-5" />
              contact@ieglobal.fr
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}