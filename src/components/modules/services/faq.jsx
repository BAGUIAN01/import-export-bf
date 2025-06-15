"use client";
import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, Package, Clock, Shield, Phone, Mail, MapPin, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function FAQ() {
  const [openItems, setOpenItems] = useState([0]); // Premier item ouvert par défaut
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const faqData = [
    {
      category: 'general',
      icon: Package,
      question: "Quels types de colis puis-je envoyer vers le Burkina Faso ?",
      answer: "Vous pouvez envoyer tous types d'objets légaux : vêtements, produits alimentaires non périssables, médicaments, matériel électronique, livres, bijoux, etc. Les produits interdits incluent : armes, drogues, produits chimiques dangereux, argent liquide en grande quantité.",
      popular: true
    },
    {
      category: 'pricing',
      icon: Package,
      question: "Combien coûte l'envoi d'un colis standard ?",
      answer: "Notre tarif fixe pour un colis standard (jusqu'à 30kg, dimensions 80x60x60cm) est de 20€. Le ramassage à domicile coûte 15€ supplémentaires. Pour les barriques et contenants lourds, le tarif est de 100€. Tous nos prix incluent l'assurance et le dédouanement.",
      popular: true
    },
    {
      category: 'shipping',
      icon: Clock,
      question: "Quel est le délai de livraison vers le Burkina Faso ?",
      answer: "Les délais de livraison sont de 7-10 jours pour les colis standards et le ramassage domicile, et de 8-12 jours pour les barriques. Ces délais incluent le transport, le dédouanement et la livraison finale. Nous vous tenons informé à chaque étape via SMS et WhatsApp.",
      popular: true
    },
    {
      category: 'tracking',
      icon: MapPin,
      question: "Comment puis-je suivre mon colis en temps réel ?",
      answer: "Dès l'expédition, vous recevez un numéro de suivi par SMS et email. Vous pouvez suivre votre colis via WhatsApp, notre site web ou en nous appelant. Nous envoyons des notifications automatiques à chaque étape : départ France, arrivée Burkina, dédouanement, livraison.",
      popular: false
    },
    {
      category: 'pickup',
      icon: Package,
      question: "Le ramassage à domicile est-il disponible partout en France ?",
      answer: "Oui, notre service de ramassage à domicile couvre toute la France métropolitaine pour 15€ supplémentaires. Nous planifions un rendez-vous selon vos disponibilités, emballons votre colis sur place et vous remettons immédiatement un reçu avec numéro de suivi.",
      popular: false
    },
    {
      category: 'insurance',
      icon: Shield,
      question: "Mes colis sont-ils assurés pendant le transport ?",
      answer: "Oui, tous nos envois incluent une assurance tous risques sans surcoût. En cas de perte, vol ou dommage, nous vous remboursons la valeur déclarée de votre colis (jusqu'à 500€ par colis standard). Pour des valeurs supérieures, une assurance complémentaire est disponible.",
      popular: true
    },
    {
      category: 'prohibited',
      icon: AlertCircle,
      question: "Quels objets sont interdits à l'envoi ?",
      answer: "Sont interdits : armes et munitions, drogues et stupéfiants, produits chimiques dangereux, matières explosives, aliments périssables, argent liquide supérieur à 1000€, médicaments sans ordonnance en grande quantité, produits contrefaits.",
      popular: false
    },
    {
      category: 'payment',
      icon: Package,
      question: "Quels sont les moyens de paiement acceptés ?",
      answer: "Nous acceptons les paiements en espèces lors de la collecte, virements bancaires, PayPal, et cartes bancaires. Le paiement se fait à la prise en charge du colis. Pour le ramassage domicile, vous pouvez payer directement au transporteur.",
      popular: false
    },
    {
      category: 'customs',
      icon: Info,
      question: "Dois-je m'occuper du dédouanement au Burkina Faso ?",
      answer: "Non, nous nous occupons de toutes les formalités douanières. Nos partenaires locaux gèrent le dédouanement inclus dans nos tarifs. Vous devez seulement fournir une liste détaillée du contenu et sa valeur. Le destinataire n'a aucune démarche à effectuer.",
      popular: true
    },
    {
      category: 'delivery',
      icon: MapPin,
      question: "Comment se passe la livraison au Burkina Faso ?",
      answer: "Nos partenaires livrent directement à l'adresse indiquée à Ouagadougou, Bobo-Dioulasso et principales villes. Pour les zones rurales, la livraison se fait au chef-lieu de province le plus proche. Le destinataire est prévenu par téléphone avant la livraison.",
      popular: false
    },
    {
      category: 'contact',
      icon: Phone,
      question: "Comment vous contacter en cas de problème ?",
      answer: "Notre support est disponible 24/7. En France : +33 6 70 69 98 23, au Burkina : +226 76 60 19 81. Vous pouvez aussi nous écrire par WhatsApp, email (contact@ieBF.fr) ou via notre site web. Nous répondons sous 2h maximum.",
      popular: false
    },
    {
      category: 'business',
      icon: Package,
      question: "Avez-vous des tarifs préférentiels pour les envois réguliers ?",
      answer: "Oui ! Pour les clients qui envoient plus de 10 colis par mois, nous proposons des tarifs dégressifs. Contactez-nous pour établir un devis personnalisé. Nous offrons aussi des facilités de paiement pour les professionnels et associations.",
      popular: false
    }
  ];

  const categories = [
    { id: 'all', name: 'Toutes', icon: HelpCircle },
    { id: 'general', name: 'Général', icon: Package },
    { id: 'pricing', name: 'Tarifs', icon: Package },
    { id: 'shipping', name: 'Délais', icon: Clock },
    { id: 'insurance', name: 'Assurance', icon: Shield },
    { id: 'contact', name: 'Contact', icon: Phone }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const toggleItem = (index) => {
    setOpenItems(prev => 
      prev.includes(index)
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  const filteredFAQ = faqData.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularFAQ = faqData.filter(item => item.popular);

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-white to-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#010066]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#010066]/10 to-orange-500/10 backdrop-blur-sm border border-[#010066]/20 rounded-full px-6 py-2 mb-6">
            <HelpCircle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-700">Questions Fréquentes</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#010066] to-blue-900">
              Tout savoir sur
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
              nos services
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Retrouvez les réponses à toutes vos questions sur l'envoi de colis vers le Burkina Faso
          </p>

          {/* Search Bar */}
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher une question..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#010066]/20 focus:border-[#010066] shadow-lg"
              />
              <HelpCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                activeCategory === category.id
                  ? 'bg-gradient-to-r from-[#010066] to-blue-900 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <category.icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main FAQ */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {filteredFAQ.map((item, index) => {
                const BFIndex = faqData.indexOf(item);
                return (
                  <div
                    key={BFIndex}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl"
                  >
                    <button
                      onClick={() => toggleItem(BFIndex)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between group hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.popular 
                            ? 'bg-gradient-to-br from-orange-500 to-red-600' 
                            : 'bg-gradient-to-br from-[#010066] to-blue-900'
                        }`}>
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#010066] transition-colors pr-4">
                            {item.question}
                          </h3>
                          {item.popular && (
                            <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full">
                              Question populaire
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-6 h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ${
                          openItems.includes(BFIndex) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    <div
                      className={`transition-all duration-300 overflow-hidden ${
                        openItems.includes(BFIndex) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-6 pb-6">
                        <div className="pl-14">
                          <p className="text-gray-600 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredFAQ.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-400 mb-2">Aucun résultat trouvé</h3>
                  <p className="text-gray-500">Essayez avec d'autres mots-clés ou contactez-nous directement</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Help */}
            <div className="bg-gradient-to-br from-[#010066] to-blue-900 rounded-2xl p-6 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Besoin d'aide immédiate ?</h3>
              <p className="text-white/80 mb-4 text-sm">
                Notre équipe est disponible 24/7 pour répondre à vos questions
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-orange-400" />
                  <div>
                    <div className="font-semibold">🇫🇷 France</div>
                    <div className="text-white/80">+33 6 70 69 98 23</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-orange-400" />
                  <div>
                    <div className="font-semibold">🇧🇫 Burkina Faso</div>
                    <div className="text-white/80">+226 76 60 19 81</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-orange-400" />
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-white/80">contact@ieBF.fr</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Questions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-orange-500" />
                Questions populaires
              </h3>
              <div className="space-y-3">
                {popularFAQ.slice(0, 4).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const BFIndex = faqData.indexOf(item);
                      setActiveCategory('all');
                      toggleItem(BFIndex);
                      document.getElementById('faq-main')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="text-sm font-semibold text-gray-700 group-hover:text-[#010066] transition-colors leading-tight">
                      {item.question}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-2xl p-6 border border-orange-500/20">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Pas trouvé votre réponse ?
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Contactez-nous directement pour une réponse personnalisée
              </p>
              <button className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg">
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}