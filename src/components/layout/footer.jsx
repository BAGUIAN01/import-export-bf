// components/Layout/Footer.tsx
import React from 'react'
import Link from 'next/link'
import { 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Clock,
  ArrowRight,
  Shield,
  Award,
  Truck
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'

const services = [
  { name: 'Transport Maritime', href: '/services/maritime' },
  { name: 'Transport Aérien', href: '/services/aerien' },
  { name: 'Transport Routier', href: '/services/routier' },
  { name: 'Dédouanement', href: '/services/dedouanement' },
  { name: 'Entreposage', href: '/services/entreposage' },
  { name: 'Assurance Transport', href: '/services/assurance' }
]

const quickLinks = [
  { name: 'À propos', href: '/about' },
  { name: 'Témoignages', href: '/testimonials' },
  { name: 'Partenaires', href: '/partners' },
  { name: 'Contact', href: '/contact' },
  { name: 'Carrières', href: '/careers' },
  { name: 'Actualités', href: '/news' }
]

const legalLinks = [
  { name: 'Mentions légales', href: '/legal' },
  { name: 'Politique de confidentialité', href: '/privacy' },
  { name: 'Conditions générales', href: '/terms' },
  { name: 'Cookies', href: '/cookies' },
  { name: 'Plan du site', href: '/sitemap' }
]

const socialLinks = [
  { name: 'Facebook', href: '#', icon: Facebook },
  { name: 'LinkedIn', href: '#', icon: Linkedin },
  { name: 'Twitter', href: '#', icon: Twitter },
  { name: 'Instagram', href: '#', icon: Instagram }
]

const certifications = [
  { name: 'ISO 9001', description: 'Qualité' },
  { name: 'ISO 14001', description: 'Environnement' },
  { name: 'IATA', description: 'Transport Aérien' },
  { name: 'OEA', description: 'Opérateur Agréé' }
]

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Newsletter Section */}
        <div className="py-12 border-b border-primary-foreground/10">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Restez informé de nos actualités logistiques
            </h3>
            <p className="text-primary-foreground/80 mb-6 text-lg">
              Recevez nos conseils d'experts, les tendances du marché et nos dernières innovations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="flex-1 px-4 py-3 rounded-lg text-foreground bg-white border-0 focus:ring-2 focus:ring-secondary outline-none"
              />
              <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105">
                S'abonner
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Company Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-heading">Import Export</div>
                  <div className="text-sm text-primary-foreground/80 font-medium">
                    Solutions Logistiques
                  </div>
                </div>
              </div>
              
              <p className="text-primary-foreground/80 leading-relaxed">
                Depuis plus de 20 ans, nous sommes votre partenaire de confiance pour tous vos besoins 
                en commerce international, logistique et transport. Nous connectons votre entreprise au monde entier.
              </p>

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-primary-foreground/5 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">500+</div>
                  <div className="text-xs text-primary-foreground/80">Clients satisfaits</div>
                </div>
                <div className="text-center p-3 bg-primary-foreground/5 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">50+</div>
                  <div className="text-xs text-primary-foreground/80">Pays desservis</div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <h4 className="font-semibold">Suivez-nous</h4>
                <div className="flex space-x-3">
                  {socialLinks.map((social) => {
                    const Icon = social.icon
                    return (
                      <Link
                        key={social.name}
                        href={social.href}
                        className="w-10 h-10 bg-primary-foreground/10 hover:bg-secondary rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                        aria-label={social.name}
                      >
                        <Icon className="h-5 w-5 group-hover:text-white transition-colors" />
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-heading flex items-center">
                <Truck className="mr-3 h-5 w-5 text-secondary" />
                Nos Services
              </h3>
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.name}>
                    <Link 
                      href={service.href} 
                      className="text-primary-foreground/80 hover:text-secondary transition-colors duration-200 flex items-center group"
                    >
                      <ArrowRight className="mr-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0" />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {service.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              
              {/* Certifications */}
              <div className="pt-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Award className="mr-2 h-4 w-4 text-secondary" />
                  Certifications
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {certifications.map((cert) => (
                    <div key={cert.name} className="bg-primary-foreground/5 rounded-lg p-2 text-center">
                      <div className="text-sm font-semibold text-secondary">{cert.name}</div>
                      <div className="text-xs text-primary-foreground/70">{cert.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-heading">Liens Rapides</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-primary-foreground/80 hover:text-secondary transition-colors duration-200 flex items-center group"
                    >
                      <ArrowRight className="mr-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0" />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Quick Contact */}
              <div className="bg-primary-foreground/5 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-secondary" />
                  Contact Rapide
                </h4>
                <div className="space-y-2 text-sm">
                  <div>Urgences 24h/7j</div>
                  <div className="text-secondary font-semibold">+33 6 12 34 56 78</div>
                  <Button size="sm" variant="outline" className="w-full mt-2 border-secondary text-secondary hover:bg-secondary hover:text-white">
                    Appeler maintenant
                  </Button>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-heading flex items-center">
                <MapPin className="mr-3 h-5 w-5 text-secondary" />
                Contact
              </h3>
              
              <div className="space-y-4">
                {/* Address */}
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-secondary mt-1 flex-shrink-0" />
                  <div className="text-primary-foreground/80">
                    <div className="font-medium text-primary-foreground">Siège Social</div>
                    123 Avenue du Commerce<br />
                    75001 Paris, France
                  </div>
                </div>
                
                {/* Phone */}
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-secondary flex-shrink-0" />
                  <div>
                    <div className="font-medium text-primary-foreground">Téléphone</div>
                    <div className="text-primary-foreground/80">+33 1 23 45 67 89</div>
                  </div>
                </div>
                
                {/* Email */}
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-secondary flex-shrink-0" />
                  <div>
                    <div className="font-medium text-primary-foreground">Email</div>
                    <div className="text-primary-foreground/80">contact@import-export.com</div>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-primary-foreground/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-secondary" />
                  Horaires d'ouverture
                </h4>
                <div className="space-y-2 text-sm text-primary-foreground/80">
                  <div className="flex justify-between">
                    <span>Lundi - Vendredi</span>
                    <span className="font-medium">8h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Samedi</span>
                    <span className="font-medium">9h00 - 12h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimanche</span>
                    <span className="text-primary-foreground/60">Fermé</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-primary-foreground/10">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-secondary" />
                      <span className="text-secondary font-medium">Service d'urgence 24h/7j</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-primary-foreground/10 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            
            {/* Copyright */}
            <div className="text-center lg:text-left">
              <div className="text-primary-foreground/80">
                © 2024 Import Export. Tous droits réservés.
              </div>
              <div className="text-sm text-primary-foreground/60 mt-1">
                Société spécialisée en logistique internationale depuis 2004
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center lg:justify-end items-center gap-6 text-sm">
              {legalLinks.map((link, index) => (
                <React.Fragment key={link.name}>
                  <Link 
                    href={link.href} 
                    className="text-primary-foreground/80 hover:text-secondary transition-colors"
                  >
                    {link.name}
                  </Link>
                  {index < legalLinks.length - 1 && (
                    <span className="text-primary-foreground/40">•</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}