"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package, MapPin, Clock, CheckCircle, Truck, Ship, Home, Phone, Mail, AlertCircle, Calendar, User, Copy, ExternalLink, Loader2 } from 'lucide-react';

export default function TrackPackagePage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!trackingNumber.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tracking/${trackingNumber.toUpperCase()}`);
      const data = await response.json();
      
      if (!response.ok) {
        setSearchResults('not_found');
        setError(data.error);
      } else {
        let formattedData;

        if (data.type === 'shipment') {
          formattedData = {
            id: data.shipment.shipmentNumber,
            status: data.container?.status.toLowerCase() || 'registered',
            currentStep: data.timeline.length,
            isShipment: true,
            
            sender: {
              name: data.sender.name,
              phone: data.sender.phone,
              address: `${data.sender.city}, ${data.sender.country}`,
            },
            
            recipient: {
              name: data.recipient.name,
              phone: data.recipient.phone,
              address: `${data.recipient.address}, ${data.recipient.city}`,
            },
            
            package: {
              type: `Envoi groupé - ${data.shipment.packagesCount} colis`,
              weight: `${data.packages.reduce((sum, p) => sum + (p.weight || 0), 0)}kg`,
              description: data.packages.map(p => p.description).join(' • '),
              value: `${data.shipment.totalAmount}€`,
            },
            
            packagesList: data.packages,
            
            timeline: data.timeline.map((update, index) => ({
              status: index === 0 ? 'current' : 'completed',
              title: update.location,
              description: update.description,
              location: update.location,
              date: new Date(update.timestamp).toLocaleDateString('fr-FR'),
              time: new Date(update.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              icon: Ship,
              completed: true,
              current: index === 0 && data.container?.status !== 'DELIVERED',
            })),
            
            estimatedDelivery: data.container?.arrivalDate,
            actualDelivery: data.container?.actualArrival,
            container: data.container,
          };
        } else {
          formattedData = {
            id: data.package.packageNumber,
            status: data.container?.status.toLowerCase() || data.package.status.toLowerCase(),
            currentStep: data.timeline.length,
            
            sender: {
              name: data.sender.name,
              phone: data.sender.phone,
              address: `${data.sender.city}, ${data.sender.country}`,
            },
            
            recipient: {
              name: data.recipient.name,
              phone: data.recipient.phone,
              address: `${data.recipient.address}, ${data.recipient.city}`,
            },
            
            package: {
              type: data.package.types.map(t => `${t.type} (x${t.quantity})`).join(', '),
              weight: `${data.package.weight}kg`,
              description: data.package.description,
              value: `${data.package.totalAmount}€`,
            },
            
            timeline: data.timeline.map((update, index) => ({
              status: index === 0 ? 'current' : 'completed',
              title: update.location,
              description: update.description,
              location: update.location,
              date: new Date(update.timestamp).toLocaleDateString('fr-FR'),
              time: new Date(update.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              icon: Ship,
              completed: true,
              current: index === 0 && data.container?.status !== 'DELIVERED',
            })),
            
            estimatedDelivery: data.container?.arrivalDate || data.package.estimatedDelivery,
            actualDelivery: data.container?.actualArrival,
            container: data.container,
            shipment: data.shipment,
          };
        }
        
        if (data.container?.status !== 'DELIVERED') {
          // Ajouter "Livraison prévue" au DÉBUT (plus récent) de la timeline
          formattedData.timeline.unshift({
            status: 'pending',
            title: 'Livraison prévue',
            description: `Livraison à ${data.recipient.city}`,
            location: data.recipient.city,
            date: data.container?.arrivalDate ? 
              new Date(data.container.arrivalDate).toLocaleDateString('fr-FR') : 
              'À déterminer',
            time: '',
            icon: Home,
            completed: false,
          });
          
          // Le premier élément réel (index 1) reste "current" - c'est la vraie dernière mise à jour
          // "Livraison prévue" (index 0) reste "pending"
          // Les autres éléments (index > 1) restent "completed"
        }
        
        setSearchResults(formattedData);
        setCurrentStep(formattedData.timeline.filter(t => t.completed).length);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setSearchResults('not_found');
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [trackingNumber]);

  useEffect(() => {
    setIsVisible(true);
    
    // Vérifier s'il y a un paramètre de recherche dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    if (queryParam) {
      setTrackingNumber(queryParam);
      // Lancer la recherche automatiquement après un court délai
      setTimeout(() => {
        handleSearch();
      }, 500);
    }
  }, [handleSearch]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      // Fallback pour les navigateurs plus anciens
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Erreur fallback:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };


  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    const colors = {
      'delivered': 'text-green-600 bg-green-100',
      'in_transit': 'text-blue-600 bg-blue-100',
      'customs': 'text-orange-600 bg-orange-100',
      'loaded': 'text-purple-600 bg-purple-100',
      'preparation': 'text-yellow-600 bg-yellow-100',
      'registered': 'text-gray-600 bg-gray-100',
    };
    return colors[statusLower] || 'text-gray-600 bg-gray-100';
  };

  const getStatusText = (status) => {
    const statusLower = status?.toLowerCase();
    const texts = {
      'delivered': 'Livré',
      'in_transit': 'En transit',
      'customs': 'Dédouanement',
      'loaded': 'Chargé',
      'preparation': 'En préparation',
      'registered': 'Enregistré',
    };
    return texts[statusLower] || status;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white mt-16">
      
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-br from-[#010066] via-blue-900 to-[#010066] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-20 w-80 h-80 bg-[#010066]/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
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
                <div className="flex gap-2 flex-col lg:flex-row">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Ex: PKG202501001 ou SHP202500030"
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
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    <span>Rechercher</span>
                  </button>
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
              <div className="max-w-2xl mx-auto text-center">
                <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
                  <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">Colis non trouvé</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {error || `Aucun colis ne correspond au numéro ${trackingNumber}`}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => {setSearchResults(null); setTrackingNumber(''); setError(null);}}
                      className="bg-gradient-to-r from-[#010066] to-blue-900 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      Nouvelle recherche
                    </button>
                    <a href="tel:+33670699823" className="border-2 border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-600 font-bold px-6 py-3 rounded-xl transition-all duration-300">
                      Nous contacter
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto">
                
                {/* Package Header */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mb-8">
                  <div className="flex flex-col lg:flex-row gap-8">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#010066] to-blue-900 rounded-2xl flex items-center justify-center">
                          <Package className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-gray-900 mb-1">
                            {searchResults.isShipment ? 'Envoi' : 'Colis'} {searchResults.id}
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
                            Détails
                          </h4>
                          <p className="text-gray-700 font-medium">{searchResults.package.type}</p>
                          <p className="text-gray-500 text-sm">{searchResults.package.weight} • {searchResults.package.value}</p>
                          <p className="text-gray-500 text-sm truncate">{searchResults.package.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-80">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-orange-500" />
                          Livraison
                        </h4>
                        
                        {searchResults.status === 'delivered' || searchResults.actualDelivery ? (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="font-bold text-green-600">Livré</span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">
                              {searchResults.actualDelivery && new Date(searchResults.actualDelivery).toLocaleDateString('fr-FR', {
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
                              <span className="font-bold text-blue-600">Estimée</span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">
                              {searchResults.estimatedDelivery ? new Date(searchResults.estimatedDelivery).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              }) : 'À déterminer'}
                            </p>
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-2">Progression</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-[#010066] to-blue-900 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(currentStep / searchResults.timeline.length) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-[#010066]">
                              {currentStep}/{searchResults.timeline.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des colis pour un Shipment */}
                {searchResults.isShipment && searchResults.packagesList && (
                  <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mb-8">
                    <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                      <Package className="w-6 h-6 text-orange-500" />
                      Colis dans cet envoi ({searchResults.packagesList.length})
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.packagesList.map((pkg, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-bold text-gray-900">{pkg.packageNumber}</div>
                              <div className="text-sm text-gray-500">{pkg.description}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(pkg.status)}`}>
                              {getStatusText(pkg.status)}
                            </span>
                          </div>
                          
                          <div className="flex gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">{pkg.totalQuantity} article(s)</span>
                            </div>
                            <div>
                              <span className="font-medium">{pkg.weight}kg</span>
                            </div>
                            <div>
                              <span className="font-medium">{pkg.totalAmount}€</span>
                            </div>
                          </div>
                          
                          {pkg.types && pkg.types.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-xs text-gray-500 mb-1">Types:</div>
                              <div className="flex flex-wrap gap-1">
                                {pkg.types.map((type, i) => (
                                  <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {type.type} (x{type.quantity})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-orange-500" />
                    Historique de livraison
                  </h3>

                  <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    <div className="space-y-8">
                      {searchResults.timeline.map((step, index) => (
                        <div key={index} className="relative flex items-start gap-6">
                          
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

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <h4 className={`text-xl font-bold ${
                                step.completed || step.current ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {step.title}
                              </h4>
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
                    onClick={() => {setSearchResults(null); setTrackingNumber(''); setError(null);}}
                    className="bg-gradient-to-r from-[#010066] to-blue-900 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center gap-2 justify-center"
                  >
                    <Search className="w-5 h-5" />
                    Nouvelle recherche
                  </button>
                  
                  <button 
                    onClick={() => copyToClipboard(`${window.location.origin}/tracking?q=${searchResults.id}`)}
                    className={`border-2 font-bold px-8 py-4 rounded-2xl transition-all duration-300 flex items-center gap-2 justify-center ${
                      copied 
                        ? 'border-green-500 text-green-600 bg-green-50' 
                        : 'border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Lien copié !
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5" />
                        Partager le suivi
                      </>
                    )}
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
            Besoin d&apos;aide avec votre colis ?
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
            <a href="mailto:contact@ieBF.fr" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors">
              <Mail className="w-5 h-5" />
              contact@ieBF.fr
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}