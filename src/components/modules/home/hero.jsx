import React, { useState, useEffect } from 'react';
import { Globe, Ship, Truck, Plane, ArrowRight, CheckCircle, TrendingUp, Play } from 'lucide-react';

export default function ImportExportHero() {
  const [currentStat, setCurrentStat] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const stats = [
    { number: "150+", label: "Pays desservis", icon: Globe },
    { number: "25K+", label: "Expéditions réalisées", icon: Ship },
    { number: "98%", label: "Satisfaction client", icon: CheckCircle },
    { number: "15+", label: "Années d'expérience", icon: TrendingUp }
  ];

  const services = [
    { icon: Ship, label: "Maritime" },
    { icon: Plane, label: "Aérien" },
    { icon: Truck, label: "Terrestre" }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-blue-900/5 rounded-full blur-3xl"></div>
      </div>

      {/* Minimal Grid Pattern */}
      {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div> */}

      <div className="relative z-10 container mx-auto px-6 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center min-h-[85vh] gap-16">
          
          {/* Left Content - LumApps Style */}
          <div className="flex-1 max-w-3xl">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              
              {/* Company Logo/Badge */}
              <div className="flex items-center gap-3 mb-12">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-orange-400 font-bold text-xl">IE Global</div>
                  <div className="text-gray-400 text-sm">Import • Export</div>
                </div>
              </div>

              {/* Large Bold Typography - LumApps Style */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-[0.9] tracking-tight">
                Une logistique plus
                <br />
                <span className="text-gray-300">intelligente, qui</span>
                <br />
                <span className="text-orange-400">s'adapte à votre</span>
                <br />
                <span className="text-white">façon d'exporter.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-gray-300 mb-12 max-w-2xl leading-relaxed font-medium">
                Optimisez vos flux internationaux avec notre plateforme intelligente 
                qui simplifie chaque étape de vos opérations d'import-export.
              </p>

              {/* Services Pills */}
              <div className="flex flex-wrap gap-3 mb-12">
                {services.map((service, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition-all duration-300"
                  >
                    <service.icon className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300 text-sm font-medium">{service.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons - LumApps Style */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="group bg-white text-black px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                  <span className="flex items-center gap-3">
                    Nous contactez
                    <div className="w-8 h-8 bg-orange-400 rounded-lg flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </span>
                </button>
                <button className="border-2 border-gray-600 hover:border-orange-400 text-gray-300 hover:text-orange-400 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-orange-400/5">
                  Découvrir nos solutions
                </button>
              </div>
            </div>
          </div>

          {/* Right Content - Modern Stats Card */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              
              {/* Stats Card - Cleaner Design */}
              <div className="relative">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 min-w-[300px] shadow-2xl">
                  
                  {/* Live Stats Indicator */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Données en temps réel</span>
                  </div>

                  {/* Main Stat Display */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      {React.createElement(stats[currentStat].icon, { className: "w-8 h-8 text-white" })}
                    </div>
                    <div className="text-4xl md:text-5xl font-black text-white mb-2">
                      {stats[currentStat].number}
                    </div>
                    <div className="text-gray-400 font-medium">
                      {stats[currentStat].label}
                    </div>
                  </div>

                  {/* Progress Dots */}
                  <div className="flex justify-center gap-2 mb-8">
                    {stats.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStat(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentStat 
                            ? 'bg-orange-400 w-6' 
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="text-lg font-black text-orange-400">24/7</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Support</div>
                    </div>
                    <div className="text-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="text-lg font-black text-orange-400">ISO</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Certifié</div>
                    </div>
                  </div>
                </div>

                {/* Floating Accent Elements */}
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-orange-500 rounded-full opacity-60"></div>
                <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-white/20 rounded-full opacity-40"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-5 h-8 border border-gray-600 rounded-full flex justify-center opacity-60">
            <div className="w-0.5 h-2 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}