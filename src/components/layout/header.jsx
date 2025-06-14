"use client";
import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, Globe, Phone, Mail, MapPin } from 'lucide-react';
import Image from 'next/image';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const pathname = '/'; // Simulé pour l'exemple

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Accueil', href: '/' },
    { 
      name: 'Services', 
      href: '/services',
      dropdown: [
        { name: 'Transport Maritime', href: '/services/maritime', icon: '🚢', desc: 'Fret maritime international' },
        { name: 'Transport Aérien', href: '/services/aerien', icon: '✈️', desc: 'Livraison express mondiale' },
        { name: 'Transport Routier', href: '/services/routier', icon: '🚛', desc: 'Distribution terrestre' },
        { name: 'Dédouanement', href: '/services/dedouanement', icon: '📋', desc: 'Procédures douanières' },
        { name: 'Entreposage', href: '/services/entreposage', icon: '🏪', desc: 'Stockage sécurisé' },
        { name: 'Assurance Transport', href: '/services/assurance', icon: '🛡️', desc: 'Protection complète' }
      ]
    },
    { name: 'À Propos', href: '/about' },
    { name: 'Témoignages', href: '/testimonials' },
    { name: 'Partenaires', href: '/partners' },
    { name: 'Contact', href: '/contact' }
  ];

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-[#010066] text-white py-2 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>contact@ieglobal.fr</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Paris, France</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Globe className="w-4 h-4" />
                <span>150+ pays desservis</span>
              </span>
              <div className="h-4 w-px bg-white/30"></div>
              <span className="text-orange-300 font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-xl border-b border-gray-100 py-2' 
          : 'bg-white/90 backdrop-blur-md py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              {/* <div className={`w-12 h-12  flex items-center justify-center transition-all duration-300 ${
                scrolled ? 'transform scale-90' : 'transform scale-100'
              } group-hover:scale-110 group-hover:rotate-3`}>
                <Image
                  src="/logo.jpg"
                  alt="IE Global Logo"
                  width={200}
                  height={48}
                  className="w-12 h-12 object-cover rounded-md"
                />
              </div>
              <div className={`transition-all duration-300 ${scrolled ? 'transform scale-95' : ''}`}>
                <div className="text-xl font-black text-blue-900">IE Global</div>
                <div className="text-xs text-orange-500 font-medium tracking-wide">Import • Export</div>
              </div> */}
              <Image
                  src="/logo.jpg"
                  alt="IE Global Logo"
                  width={60}
                  height={48}
                  className="object-cover rounded-md"
                />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <div 
                  key={link.name} 
                  className="relative group"
                  onMouseEnter={() => link.dropdown && setActiveDropdown(link.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center relative overflow-hidden ${
                      isActive(link.href)
                        ? 'text-white bg-[#010066] shadow-sm'
                        : 'text-gray-700 hover:text-[#010066] hover:bg-blue-50/70'
                    }`}
                  >
                    <span className="relative z-10">{link.name}</span>
                    {link.dropdown && (
                      <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-300 ${
                        activeDropdown === link.name ? 'rotate-180' : ''
                      }`} />
                    )}
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#010066] to-blue-900 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                  </button>
                  
                  {/* Enhanced Dropdown Menu */}
                  {link.dropdown && (
                    <div className={`absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 ${
                      activeDropdown === link.name 
                        ? 'opacity-100 visible transform translate-y-0' 
                        : 'opacity-0 invisible transform translate-y-2'
                    }`}>
                      <div className="p-2">
                        <div className="grid gap-1">
                          {link.dropdown.map((item) => (
                            <button
                              key={item.name}
                              className="flex items-start space-x-3 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group/item"
                            >
                              <span className="text-2xl group-hover/item:scale-110 transition-transform duration-200">{item.icon}</span>
                              <div className="text-left">
                                <div className="text-gray-800 font-semibold group-hover/item:text-[#010066] transition-colors">
                                  {item.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button className="w-full px-4 py-2 text-sm text-[#010066] font-semibold hover:bg-blue-50 rounded-xl transition-colors">
                            Voir tous les services →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA & Mobile Button */}
            <div className="flex items-center space-x-4">
              {/* CTA Button */}
              <button className={`hidden md:flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                scrolled
                  ? 'bg-gradient-to-r from-[#010066] to-blue-900 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  : 'bg-gradient-to-r from-[#010066] to-blue-900 text-white shadow-lg hover:shadow-xl hover:scale-105'
              }`}>
                <span>Demander un Devis</span>
                <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-white">→</span>
                </div>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {isOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-500 overflow-hidden ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-white/98 backdrop-blur-xl border-t border-gray-100 px-4 py-6">
            <div className="space-y-3">
              {navLinks.map((link) => (
                <div key={link.name} className="space-y-2">
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-colors ${
                      isActive(link.href)
                        ? 'text-white bg-[#010066]'
                        : 'text-gray-700 hover:text-[#010066] hover:bg-gray-50'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </button>
                  
                  {link.dropdown && (
                    <div className="ml-4 space-y-1">
                      {link.dropdown.map((item) => (
                        <button
                          key={item.name}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-600 hover:text-[#010066] hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <button 
                className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-[#010066] to-blue-900 text-white text-center rounded-xl font-bold shadow-lg"
                onClick={() => setIsOpen(false)}
              >
                Demander un Devis
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}