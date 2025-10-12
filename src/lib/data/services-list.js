import { Package, Truck, Home, Shield, Clock, Users, Globe, Zap, Euro, Star } from 'lucide-react';

export const services = [
  {
    id: 'colis-standard',
    icon: Package,
    title: 'Colis Standard',
    price: 'À partir de 100€',
    originalPrice: null,
    popular: true,
    badge: 'Le plus populaire',
    description: 'Solution idéale pour vos envois quotidiens vers le Burkina Faso',
    details: 'Parfait pour vêtements, produits alimentaires, médicaments et objets personnels',
    features: [
      'Jusqu\'à 30kg maximum',
      'Dimensions: 80x60x60cm',
      'Livraison 20-45 jours',
      'Assurance incluse',
      'Support client 24/7'
    ],
    includes: [
      'Collecte possible (+20€)',
      'Emballage sécurisé',
      'Dédouanement inclus',
      'Livraison à domicile'
    ],
    color: 'from-[#010066] to-blue-900',
    bgColor: 'bg-blue-50',
    textColor: 'text-[#010066]',
    stats: { satisfaction: '98%', livraisons: '1500+' },
    subServices: [
      {
        name: 'Frigo Standard',
        price: '100€',
        note: 'à partir de'
      },
      {
        name: 'Frigo Grand',
        price: '200€',
        note: 'à partir de'
      },
      {
        name: 'Frigo Américain',
        price: '300€',
        note: ''
      }
    ]
  },
  {
    id: 'transport-barrique',
    icon: Truck,
    title: 'Transport Barrique',
    price: '100€',
    originalPrice: null,
    popular: false,
    badge: 'Spécialisé',
    description: 'Pour vos contenants lourds et volumineux',
    details: 'Idéal pour huile, miel, bidons et tous contenants de grande capacité',
    features: [
      'Fûts jusqu\'à 200L',
      'Bidons et contenants',
      'Transport sécurisé',
      'Manutention spécialisée',
      'Assurance renforcée',
      'Livraison 20-45 jours'
    ],
    includes: [
      'Collecte à domicile incluse',
      'Protection anti-choc',
      'Étiquetage professionnel',
      'Suivi personnalisé'
    ],
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    stats: { satisfaction: '95%', livraisons: '500+' }
  },
  {
    id: 'ramassage-domicile',
    icon: Home,
    title: 'Ramassage Domicile',
    price: '+20€',
    originalPrice: null,
    popular: false,
    badge: 'Service premium',
    description: 'Nous venons collecter vos colis directement chez vous',
    details: 'Service pratique disponible dans toute la France métropolitaine',
    features: [
      'Collecte à votre adresse',
      'Rendez-vous planifié',
      'Toute la France',
      'Emballage sur place',
      'Reçu immédiat',
      'Flexibilité horaire'
    ],
    includes: [
      'Déplacement inclus',
      'Vérification colis',
      'Paperasse administrative',
      'Confirmation SMS'
    ],
    color: 'from-[#010066] to-blue-900',
    bgColor: 'bg-blue-50',
    textColor: 'text-[#010066]',
    stats: { satisfaction: '99%', livraisons: '800+' }
  }
];

export const whyChooseUs = [
  {
    icon: Shield,
    title: 'Sécurité Garantie',
    desc: 'Assurance tous risques incluse sur chaque envoi',
    color: 'text-[#010066]'
  },
  {
    icon: Clock,
    title: 'Délais Respectés',
    desc: 'Livraison dans les temps, 98% de ponctualité',
    color: 'text-orange-500'
  },
  {
    icon: Users,
    title: 'Service Familial',
    desc: '8 ans d\'expérience, relation de confiance',
    color: 'text-[#010066]'
  },
  {
    icon: Globe,
    title: 'Réseau Établi',
    desc: 'Partenaires fiables en France et au Burkina',
    color: 'text-orange-500'
  }
];

export const additionalServices = {
  transportation: {
    title: 'Nos Transports',
    icon: Truck,
    color: 'from-blue-500 to-blue-700',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    items: [
      { name: 'Petite Voiture Étranger 15kg', price: '100€', details: 'Livré dans les 25 jours' },
      { name: '4x4 Grand 4 portes', price: '2 000€', details: 'Transport sécurisé' },
      { name: 'Autres Voitures sur demande', price: 'Sur devis', details: '' }
    ]
  },
  fridges: {
    title: 'Tarifs Frigos',
    icon: Package,
    color: 'from-[#010066] to-blue-900',
    bgColor: 'bg-blue-50',
    textColor: 'text-[#010066]',
    items: [
      { name: 'Frigo Standard', price: '100€', note: 'à partir de' },
      { name: 'Frigo Grand', price: '200€', note: 'à partir de' },
      { name: 'Frigo Américain (Congélateur charge)', price: '300€', note: '' }
    ]
  },
  electronics: {
    title: 'Électroménager',
    icon: Zap,
    color: 'from-orange-500 to-orange-700',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    items: [
      { name: 'Gazinière', price: '120€' },
      { name: 'Vélo', price: '30€', note: 'à partir de' },
      { name: 'Lave-linge', price: '120€' },
      { name: 'Fauteuil', price: '120€' },
      { name: 'Canapé 100€ l\'unité', price: 'groupe électrogène à partir de 280€' },
      { name: 'Matelas 60€ par place', price: '' },
      { name: 'Micro-ondes', price: '30€' }
    ]
  },
  furniture: {
    title: 'Matériel Industriel',
    icon: Home,
    color: 'from-gray-500 to-gray-700',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    items: [
      { name: 'Chaise empilable', price: '10€' },
      { name: 'Chaise non empilable', price: '30€' },
      { name: 'Chaise bureau', price: '40€' }
    ]
  },
  tv: {
    title: 'Téléviseurs',
    icon: Package,
    color: 'from-purple-500 to-purple-700',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    items: [
      { name: 'Écran 32" (80cm)', price: '80€' },
      { name: 'Écran 40" (100cm)', price: '130€' },
      { name: 'Écran 43" (123cm)', price: '150€' },
      { name: 'Écran 55" (140cm)', price: '180€' },
      { name: 'Écran 65" (165cm)', price: '200€' },
      { name: 'Écran 75" (183cm)', price: '270€' },
      { name: 'Écran 90" (203cm)', price: '300€' }
    ]
  },
  wine: {
    title: 'Vins et Champagnes',
    icon: Package,
    color: 'from-red-500 to-red-700',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    items: [
      { name: 'Carton de 6 bouteilles de vin', price: '10€' },
      { name: 'Carton de 6 bouteilles de champagne', price: '28€' },
      { name: 'Carton de 12 bouteilles de vin', price: '18€' },
      { name: 'Carton de 12 bouteilles champagne', price: '32€' }
    ]
  },
  fuel: {
    title: 'Bouteilles de Gaz',
    icon: Package,
    color: 'from-green-500 to-green-700',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    items: [
      { name: 'Petit bleu 220 Litres', price: '120€ région Parisienne / 160€ Province' },
      { name: 'Petit mon 216 Litres', price: '120€ région Parisienne / 170€ Province' }
    ]
  },
  boxes: {
    title: 'Cartons',
    icon: Package,
    color: 'from-amber-500 to-amber-700',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    items: [
      { name: 'Carton 80/60/60', price: '100€ (8 à 10)€ Parisienne / 110€ Province' },
      { name: 'Carton 80/50/50', price: '80€ région Parisienne / 110€ Province' },
      { name: 'Carton standard', price: '10/10/35 = 10€' }
    ]
  },
  containers: {
    title: 'Cantines',
    icon: Package,
    color: 'from-indigo-500 to-indigo-700',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    items: [
      { name: 'Cantine très grande', price: '120€' },
      { name: 'Cantine grande', price: '100€' },
      { name: 'Cantine moyenne', price: '70€' },
      { name: 'Cantine petite', price: '70€' }
    ]
  },
  bags: {
    title: 'Sacs',
    icon: Package,
    color: 'from-teal-500 to-teal-700',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    items: [
      { name: 'Très grand sac', price: '100€' },
      { name: 'Grand sac courrier Lakal', price: '70€' },
      { name: 'Sac Moyen', price: '60€' }
    ]
  },
  suitcases: {
    title: 'Valises',
    icon: Package,
    color: 'from-pink-500 to-pink-700',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    items: [
      { name: 'Petite valise', price: '30€' },
      { name: 'Valise Moyenne', price: '50€' },
      { name: 'Grande valise', price: '70€' },
      { name: 'Très grande valise', price: '100€' }
    ]
  },
  chairs: {
    title: 'Chaises',
    icon: Home,
    color: 'from-cyan-500 to-cyan-700',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    items: [
      { name: 'Chaise empilable', price: '10€' },
      { name: 'Chaise non empilable', price: '30€' },
      { name: 'Chaise bureau', price: '40€' }
    ]
  }
};