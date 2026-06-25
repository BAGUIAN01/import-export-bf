"use client";
import React from 'react';
import {
  Phone,
  Facebook,
  Instagram,
  ArrowRight,
  Truck
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export  function Footer() {
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
    <footer className="bg-gradient-to-br from-[#0E7A34] via-[#0B5C28] to-[#0E7A34] text-white relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Footer Content */}
        <div className="py-10 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
            
            {/* Company Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  {/* <Package className="h-7 w-7 text-white" /> */}
                  <Image
                    src="/logo.png"
                    alt="Naange Envoi Logo"
                    width={40}
                    height={40}
                    // className="absolute inset-0 object-cover rounded-full"
                    />
                </div>
                <div>
                  <div className="text-2xl font-black">Naange Envoi</div>
                  <div className="text-sm text-green-100 font-medium">
                    France ↔ Burkina Faso
                  </div>
                </div>
              </div>
              
              <p className="text-green-100 leading-relaxed">
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
                        className="w-10 h-10 bg-white/10 hover:bg-amber-500 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group backdrop-blur-sm border border-white/20"
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
                <Truck className="mr-3 h-5 w-5 text-amber-400" />
                Nos Services
              </h3>
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.name}>
                    <a 
                      href={service.href} 
                      className="text-green-100 hover:text-amber-400 transition-colors duration-200 flex items-center justify-between group"
                    >
                      <div className="flex items-center">
                        <ArrowRight className="mr-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0" />
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                          {service.name}
                        </span>
                      </div>
                      <span className="text-amber-400 font-bold text-sm">
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
                      className="text-green-100 hover:text-amber-400 transition-colors duration-200 flex items-center group"
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
                <Phone className="mr-3 h-5 w-5 text-amber-400" />
                Contact
              </h3>
              
              <div className="space-y-4">
                {/* France Phone */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white">France</div>
                    <div className="text-green-100">+33 670 699 823</div>
                    <div className="text-xs text-green-200">WhatsApp disponible</div>
                  </div>
                </div>
                
                {/* Burkina Phone */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Burkina Faso</div>
                    <div className="text-green-100">+226 766 019 81</div>
                    <div className="text-green-100">00226 46 10 00 09</div>
                    <div className="text-xs text-green-200">Livraison & support</div>
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
              <div className="text-green-100">
                © 2024 Naange Envoi. Tous droits réservés.
                <Link href="/legal" className="text-green-200 hover:text-amber-400 transition-colors ml-1">
                ToemeXpertise
                </Link>
              </div>
              <div className="text-sm text-green-200 mt-1">
                Connectons les cœurs entre la France et le Burkina Faso depuis 2016
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center lg:justify-end items-center gap-4 lg:gap-6 text-sm">
              {legalLinks.map((link, index) => (
                <React.Fragment key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-green-100 hover:text-amber-400 transition-colors"
                  >
                    {link.name}
                  </a>
                  {index < legalLinks.length - 1 && (
                    <span className="text-green-300">•</span>
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