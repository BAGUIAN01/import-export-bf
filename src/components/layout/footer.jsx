"use client";
import React, { useState } from 'react';
import {
  Phone,
  Mail,
  Facebook,
  Instagram,
  Clock,
  ArrowRight,
  Heart,
  Truck,
  CheckCircle,
  Send
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export  function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Simulate subscription
    setIsSubscribed(true);
    setTimeout(() => {
      setIsSubscribed(false);
      setEmail('');
    }, 3000);
  };

  const services = [
    { name: 'Envoi de Colis', href: '/#tarifs', price: '100€' },
    { name: 'Envoi Barrique', href: '/#tarifs', price: '100€' },
    { name: 'Ramassage Domicile', href: '/#tarifs', price: '20€' },
    { name: 'Suivi en Ligne', href: '/tracking', price: 'Gratuit' },
    { name: 'Assurance Colis', href: '/#tarifs', price: 'Incluse' }
  ];

  const quickLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'Tarifs', href: '/#tarifs' },
    { name: 'Médiathèque', href: '/#mediatheque' },
    { name: 'Suivi Colis', href: '/tracking' }
  ];

  const legalLinks = [
    { name: 'Mentions légales', href: '/#' },
    { name: 'Politique de confidentialité', href: '/#' },
    { name: 'Conditions générales', href: '/#' },
    { name: 'Cookies', href: '/#' }
  ];

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'WhatsApp', href: '#', icon: Phone },
    { name: 'Instagram', href: '#', icon: Instagram }
  ];

  return (
    <footer className="bg-gradient-to-br from-[#010066] via-[#010088] to-[#010066] text-white relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Newsletter Section */}
        <div className="py-12 lg:py-16 border-b border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-black mb-4">
              Restez informé de nos prochains chargements
            </h3>
            <p className="text-blue-200 mb-6 lg:mb-8 text-lg">
              Recevez les dates de chargement, promotions spéciales et conseils d'envoi vers le Burkina Faso
            </p>
            
            {!isSubscribed ? (
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  className="flex-1 px-4 py-3 rounded-2xl text-gray-800 bg-white border-0 focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                />
                <button 
                  onClick={handleNewsletterSubmit}
                  className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  S'abonner
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto bg-green-500/20 border border-green-400/30 rounded-2xl p-4">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-semibold">Merci ! Vous êtes inscrit.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Company Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  {/* <Package className="h-7 w-7 text-white" /> */}
                  <Image
                    src="/logo.png"
                    alt="IE BF Logo"
                    width={40}
                    height={40}
                    // className="absolute inset-0 object-cover rounded-full"
                    />
                </div>
                <div>
                  <div className="text-2xl font-black">Import Export</div>
                  <div className="text-sm text-blue-200 font-medium">
                    France ↔ Burkina Faso
                  </div>
                </div>
              </div>
              
              <p className="text-blue-200 leading-relaxed">
                Depuis 8 ans, nous sommes le pont entre la France et le Burkina Faso. 
                Chaque colis que nous transportons porte l'amour et l'espoir des familles.
              </p>

              {/* Social Links */}
              <div className="space-y-3">
                <h4 className="font-bold text-white">Suivez-nous</h4>
                <div className="flex space-x-3">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.name}
                        href={social.href}
                        className="w-10 h-10 bg-white/10 hover:bg-orange-500 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group backdrop-blur-sm border border-white/20"
                        aria-label={social.name}
                      >
                        <Icon className="h-5 w-5 group-hover:text-white transition-colors" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-6">
              <h3 className="text-xl font-black flex items-center">
                <Truck className="mr-3 h-5 w-5 text-orange-400" />
                Nos Services
              </h3>
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.name}>
                    <a 
                      href={service.href} 
                      className="text-blue-200 hover:text-orange-400 transition-colors duration-200 flex items-center justify-between group"
                    >
                      <div className="flex items-center">
                        <ArrowRight className="mr-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0" />
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                          {service.name}
                        </span>
                      </div>
                      <span className="text-orange-400 font-bold text-sm">
                        {service.price}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-white">Liens Rapides</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-blue-200 hover:text-orange-400 transition-colors duration-200 flex items-center group"
                    >
                      <ArrowRight className="mr-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0" />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.name}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-black flex items-center text-white">
                <Phone className="mr-3 h-5 w-5 text-orange-400" />
                Contact
              </h3>
              
              <div className="space-y-4">
                {/* France Phone */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white">France</div>
                    <div className="text-blue-200">+33 670 699 823</div>
                    <div className="text-xs text-blue-300">WhatsApp disponible</div>
                  </div>
                </div>
                
                {/* Burkina Phone */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Burkina Faso</div>
                    <div className="text-blue-200">+226 766 019 81</div>
                    <div className="text-xs text-blue-300">Livraison & support</div>
                  </div>
                </div>
                
                {/* Email */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Email</div>
                    <div className="text-blue-200">contact@ieBF.fr</div>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <h4 className="font-bold mb-3 flex items-center text-white">
                  <Clock className="mr-2 h-4 w-4 text-orange-400" />
                  Disponibilité
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-blue-200">
                    <span>Lundi - Vendredi</span>
                    <span className="font-medium text-white">8h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between text-blue-200">
                    <span>Samedi</span>
                    <span className="font-medium text-white">9h00 - 15h00</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-orange-400" />
                      <span className="text-orange-300 font-medium text-sm">Service familial 24h/7j</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-white/10 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            
            {/* Copyright */}
            <div className="text-center lg:text-left">
              <div className="text-blue-200">
                © 2024 Import Export BF. Tous droits réservés.
                <Link href="/legal" className="text-blue-300 hover:text-orange-400 transition-colors ml-1">
                ToemeXpertise
                </Link>
              </div>
              <div className="text-sm text-blue-300 mt-1">
                Connectons les cœurs entre la France et le Burkina Faso depuis 2016
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center lg:justify-end items-center gap-4 lg:gap-6 text-sm">
              {legalLinks.map((link, index) => (
                <React.Fragment key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-blue-200 hover:text-orange-400 transition-colors"
                  >
                    {link.name}
                  </a>
                  {index < legalLinks.length - 1 && (
                    <span className="text-blue-400">•</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}