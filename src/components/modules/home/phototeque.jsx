"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';

export default function Phototheque() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const autoplayRef = useRef();
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  // Photos d'exemple - remplacez par vos vraies photos
  const photos = [
    {
      id: 1,
      src: "/images/image1.jpg",
      alt: "Colis en préparation",
      caption: "Préparation minutieuse de vos colis"
    },
    {
      id: 2,
      src: "/images/image2.jpg",
      alt: "Transport sécurisé",
      caption: "Transport sécurisé vers le Burkina Faso"
    },
    {
      id: 3,
      src: "/images/image3.jpg",
      alt: "Équipe logistique",
      caption: "Notre équipe logistique experte"
    },
    {
      id: 4,
      src: "/images/image4.jpg",
      alt: "Entrepôt moderne",
      caption: "Entrepôt moderne et sécurisé"
    },
    {
      id: 5,
      src: "/images/image5.jpg",
      alt: "Livraison rapide",
      caption: "Livraison rapide et fiable"
    },
    {
      id: 6,
      src: "/images/image6.jpg",
      alt: "Service client",
      caption: "Service client dévoué à votre satisfaction"
    }
  ];

  // Autoplay logic
  useEffect(() => {
    if (isAutoplay) {
      autoplayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
      }, 4000);
    } else {
      clearInterval(autoplayRef.current);
    }

    return () => clearInterval(autoplayRef.current);
  }, [isAutoplay, photos.length]);

  // Navigation functions
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndRef.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartRef.current - touchEndRef.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  // Lightbox functions
  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
    setIsAutoplay(false);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setIsZoomed(false);
    setIsAutoplay(true);
  };

  const lightboxPrevious = () => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setIsZoomed(false);
  };

  const lightboxNext = () => {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
    setIsZoomed(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isLightboxOpen) {
        switch (e.key) {
          case 'ArrowLeft':
            lightboxPrevious();
            break;
          case 'ArrowRight':
            lightboxNext();
            break;
          case 'Escape':
            closeLightbox();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLightboxOpen]);

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6 text-[#010066]">
            Notre <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Photothèque</span>
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Découvrez nos services en images : de la préparation à la livraison, 
            suivez le parcours de vos colis en toute transparence.
          </p>
        </div>

        {/* Main Carousel */}
        <div className="relative max-w-5xl mx-auto">
          <div 
            className="relative overflow-hidden rounded-3xl shadow-2xl bg-white"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            
            {/* Images Container */}
            <div className="relative aspect-video">
              <div 
                className="flex transition-transform duration-700 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {photos.map((photo, index) => (
                  <div key={photo.id} className="flex-shrink-0 w-full h-full relative group">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay with caption and zoom button */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-white font-bold text-xl mb-2">{photo.caption}</h3>
                        <button
                          onClick={() => openLightbox(index)}
                          className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300"
                        >
                          <Maximize2 className="w-4 h-4" />
                          Voir en grand
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 group"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800 group-hover:text-orange-500" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 group"
            >
              <ChevronRight className="w-6 h-6 text-gray-800 group-hover:text-orange-500" />
            </button>

            {/* Autoplay Control */}
            <button
              onClick={() => setIsAutoplay(!isAutoplay)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
            >
              {isAutoplay ? (
                <Pause className="w-5 h-5 text-gray-800" />
              ) : (
                <Play className="w-5 h-5 text-gray-800 ml-0.5" />
              )}
            </button>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-3 mt-8">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-orange-500 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-6 gap-4 mt-8">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => goToSlide(index)}
                className={`aspect-video rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 ${
                  index === currentIndex
                    ? 'ring-3 ring-orange-500 ring-offset-2'
                    : 'ring-1 ring-gray-200 hover:ring-gray-300'
                }`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Lightbox Modal */}
        {isLightboxOpen && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-6xl max-h-full">
              
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute -top-12 right-0 w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Zoom Controls */}
              <div className="absolute -top-12 right-16 flex gap-2 z-10">
                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
                >
                  {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                </button>
              </div>

              {/* Lightbox Image */}
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className={`relative transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-move' : 'cursor-zoom-in'}`}>
                  <img
                    src={photos[lightboxIndex].src}
                    alt={photos[lightboxIndex].alt}
                    className="w-full h-auto max-h-[80vh] object-contain"
                    onClick={() => setIsZoomed(!isZoomed)}
                  />
                </div>
                
                {/* Caption */}
                <div className="p-6 bg-white">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {photos[lightboxIndex].caption}
                  </h3>
                  <p className="text-gray-600">
                    {lightboxIndex + 1} / {photos.length}
                  </p>
                </div>
              </div>

              {/* Lightbox Navigation */}
              <button
                onClick={lightboxPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={lightboxNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}