"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Shield,
  Clock,
  Users,
  Package,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function About() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeValue, setActiveValue] = useState(0);
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

    // Auto-rotate values
    const interval = setInterval(() => {
      setActiveValue((prev) => (prev + 1) % 4);
    }, 3000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const values = [
    {
      icon: Heart,
      title: "Proximité",
      description: "Nous connaissons la communauté franco-burkinabé",
      color: "from-red-500 to-red-600",
    },
    {
      icon: Shield,
      title: "Fiabilité",
      description: "8 ans d'expérience sans faille",
      color: "from-[#010066] to-[#010088]",
    },
    {
      icon: Clock,
      title: "Ponctualité",
      description: "Chargements réguliers et délais respectés",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: Users,
      title: "Humanité",
      description: "Chaque colis porte une histoire",
      color: "from-green-500 to-green-600",
    },
  ];

  const highlights = [
    { number: "8", label: "Années d'expérience", icon: CheckCircle },
    { number: "2500+", label: "Colis envoyés", icon: Package },
    { number: "99%", label: "Satisfaction client", icon: Heart },
  ];

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-50/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-orange-50/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center mb-12 lg:mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 lg:px-6 py-2 lg:py-3 mb-6 shadow-sm">
            <Heart
              className="w-4 h-4 lg:w-5 lg:h-5"
              style={{ color: "#010066" }}
            />
            <span
              className="font-semibold text-sm lg:text-base"
              style={{ color: "#010066" }}
            >
              À Propos
            </span>
          </div>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-6 leading-tight"
            style={{ color: "#010066" }}
          >
            Un pont entre
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              la France et le Burkina Faso
            </span>
          </h2>

          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Depuis 8 ans, nous facilitons les liens familiaux en transportant
            vos colis avec soin, sécurité et ponctualité.
          </p>
        </div>

        {/* Main Content */}
        <div
          className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 transition-all duration-1000 delay-300 ${
            isVisible
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-10"
          }`}
        >
          {/* Left - Story */}
          <div>
            <h3
              className="text-2xl lg:text-3xl font-black mb-6"
              style={{ color: "#010066" }}
            >
              Notre Mission
            </h3>

            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                Nous avons créé un service{" "}
                <strong>simple, fiable et abordable</strong> pour répondre aux
                besoins des familles burkinabées installées en France.
              </p>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-800 mb-2">
                      Chaque colis compte
                    </h4>
                    <p className="text-orange-700">
                      Nous transportons bien plus que des objets : nous
                      acheminons l'amour, le soutien et les rêves de familles
                      séparées par la distance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Highlights */}
              <div className="grid grid-cols-3 gap-4">
                {highlights.map((item, index) => (
                  <div
                    key={index}
                    className="text-center bg-white rounded-xl p-4 shadow-md border border-gray-100"
                  >
                    <item.icon
                      className="w-6 h-6 mx-auto mb-2"
                      style={{ color: "#010066" }}
                    />
                    <div
                      className="text-xl font-black"
                      style={{ color: "#010066" }}
                    >
                      {item.number}
                    </div>
                    <div className="text-xs text-gray-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Values */}
          <div>
            <h3
              className="text-2xl lg:text-3xl font-black mb-8"
              style={{ color: "#010066" }}
            >
              Nos Valeurs
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {values.map((value, index) => (
                <div
                  key={index}
                  className={`group cursor-pointer transition-all duration-500 ${
                    activeValue === index ? "scale-105" : "hover:scale-102"
                  }`}
                  onClick={() => setActiveValue(index)}
                >
                  <div
                    className={`bg-white rounded-2xl p-5 shadow-lg border-2 transition-all duration-300 h-full ${
                      activeValue === index
                        ? "border-orange-200 shadow-xl"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center mb-3`}
                    >
                      <value.icon className="w-5 h-5 text-white" />
                    </div>

                    <h4
                      className="text-base font-bold mb-2"
                      style={{ color: "#010066" }}
                    >
                      {value.title}
                    </h4>

                    <p className="text-gray-600 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div
          className={`text-center transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="bg-gradient-to-r from-[#010066] to-[#010088] rounded-3xl p-8 lg:p-10 text-white shadow-2xl max-w-4xl mx-auto">
            <h3 className="text-2xl lg:text-3xl font-black mb-4">
              Faites-nous confiance pour vos envois
            </h3>

            <p className="text-blue-100 mb-6 lg:mb-8 text-lg">
              Rejoignez les centaines de familles satisfaites
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={"/#contact"}>
                <button className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-3">
                  <span>Envoyer un colis</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>

              <Link href={"/services#services-list"}>
                <button className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300">
                  Découvrir nos tarifs
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
