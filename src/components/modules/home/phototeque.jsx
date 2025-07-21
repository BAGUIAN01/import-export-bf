"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Maximize2, X, ZoomIn, ZoomOut, Video, Image } from 'lucide-react';

export default function Mediatheque() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const autoplayRef = useRef();
  const videoRef = useRef(null);
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  // Médias d'exemple - remplacez par vos vrais médias
  const medias = [
    {
      id: 1,
      type: 'image',
      src: "/images/image1.jpg",
      alt: "Colis en préparation",
      caption: "Préparation minutieuse de vos colis"
    },
    {
      id: 2,
      type: 'image',
      src: "/images/image2.jpg",
      alt: "Transport sécurisé",
      caption: "Transport sécurisé vers le Burkina Faso"
    },
    {
      id: 3,
      type: 'image',
      src: "/images/image3.jpg",
      alt: "Équipe logistique",
      caption: "Notre équipe logistique experte"
    },
    {
      id: 4,
      type: 'image',
      src: "/images/image4.jpg",
      alt: "Entrepôt moderne",
      caption: "Entrepôt moderne et sécurisé"
    },
    {
      id: 5,
      type: 'image',
      src: "/images/image5.jpg",
      alt: "Livraison rapide",
      caption: "Livraison rapide et fiable"
    },
    {
      id: 6,
      type: 'image',
      src: "/images/image6.jpg",
      alt: "Service client",
      caption: "Service client dévoué à votre satisfaction"
    },
    {
      id: 7,
      type: "video",
      src: "/images/video1.mp4",
      alt: "Transport sécurisé",
      caption: "Départ de Ouagadougou vers la France"
    },
    {
      id: 8,
      type: "video",
      src: "/images/video2.mp4",
      alt: "Chargement de véhicules",
      caption: "Chargement reussi de véhicule"
    },
    {
      id: 9,
      type: "video",
      src: "/images/video7.mp4",
      alt: "Chargement de véhicules",
      caption: "Chargement sécurisé"
    },
    {
      id: 10,
      type: "video",
      src: "/images/video8.mp4",
      alt: "Entrepôt moderne",
      caption: "Entrepôt moderne et sécurisé"
    },
    {
      id: 11,
      type: "video",
      src: "/images/video9.mp4",
      alt: "Chargment de bariques",
      caption: "Chargment de bariques"
    },
    {
      id: 12,
      type: "video",
      src: "/images/video6.mp4",
      alt: "Chargement de cartons et colis divers",
      caption: "Chargement de cartons et colis divers"
    },
  ];

  // Autoplay logic
  useEffect(() => {
    if (isAutoplay && !isVideoPlaying) {
      autoplayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % medias.length);
      }, 4000);
    } else {
      clearInterval(autoplayRef.current);
    }

    return () => clearInterval(autoplayRef.current);
  }, [isAutoplay, isVideoPlaying, medias.length]);

  // Reset video state when changing slides
  useEffect(() => {
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [currentIndex]);

  // Navigation functions
  const goToSlide = (index) => {
    setCurrentIndex(index);
    pauseCurrentVideo();
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + medias.length) % medias.length);
    pauseCurrentVideo();
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % medias.length);
    pauseCurrentVideo();
  };

  // Video functions
  const pauseCurrentVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsVideoPlaying(true);
        }).catch((error) => {
          console.log("Erreur de lecture:", error);
        });
      }
    }
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
    pauseCurrentVideo();
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setIsZoomed(false);
    setIsAutoplay(true);
  };

  const lightboxPrevious = () => {
    setLightboxIndex((prev) => (prev - 1 + medias.length) % medias.length);
    setIsZoomed(false);
  };

  const lightboxNext = () => {
    setLightboxIndex((prev) => (prev + 1) % medias.length);
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
            Notre <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Médiathèque</span>
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Découvrez nos services en images et vidéos : de la préparation à la livraison, 
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
                {medias.map((media, index) => (
                  <div key={media.id} className="flex-shrink-0 w-full h-full relative group">
                    {media.type === 'image' ? (
                      <img
                        src={media.src}
                        alt={media.alt}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          ref={index === currentIndex ? videoRef : null}
                          src={media.src}
                          className="w-full h-full object-cover cursor-pointer"
                          controls={false}
                          preload="metadata"
                          onPlay={() => setIsVideoPlaying(true)}
                          onPause={() => setIsVideoPlaying(false)}
                          onEnded={() => setIsVideoPlaying(false)}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVideoPlay();
                          }}
                        />
                        
                        {/* Video Play Button Overlay */}
                        {!isVideoPlaying && index === currentIndex && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVideoPlay();
                              }}
                              className="w-24 h-24 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:bg-white hover:scale-110 transition-all duration-300 z-10"
                            >
                              <Play className="w-12 h-12 text-gray-800 ml-1" />
                            </button>
                          </div>
                        )}
                        
                        {/* Video Pause Button when playing */}
                        {isVideoPlaying && index === currentIndex && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVideoPlay();
                              }}
                              className="w-24 h-24 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:bg-black/70 transition-all duration-300 z-10 md:opacity-0 md:group-hover:opacity-100"
                            >
                              <Pause className="w-12 h-12 text-white" />
                            </button>
                          </div>
                        )}

                        {/* Mobile-specific pause button - always visible when video is playing */}
                        {isVideoPlaying && index === currentIndex && (
                          <div className="absolute top-20 right-40 md:hidden z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVideoPlay();
                              }}
                              className="w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-black/80 transition-all duration-300"
                            >
                              <Pause className="w-6 h-6 text-white" />
                            </button>
                          </div>
                        )}
                        
                        {/* Video Type Indicator */}
                        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-white" />
                            <span className="text-white text-sm font-medium">Vidéo</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Media Type Indicator for Images */}
                    {media.type === 'image' && (
                      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-white" />
                          <span className="text-white text-sm font-medium">Image</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay with caption and zoom button */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-white font-bold text-xl mb-2">{media.caption}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLightbox(index);
                          }}
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
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 group z-10"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800 group-hover:text-orange-500" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 group z-10"
            >
              <ChevronRight className="w-6 h-6 text-gray-800 group-hover:text-orange-500" />
            </button>

            {/* Autoplay Control */}
            <button
              onClick={() => setIsAutoplay(!isAutoplay)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 z-10"
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
            {medias.map((media, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 relative ${
                  index === currentIndex
                    ? 'bg-orange-500 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                {/* Media type indicator on dots */}
                {media.type === 'video' && index === currentIndex && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <Video className="w-3 h-3 text-orange-500" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-6 gap-4 mt-8">
            {medias.map((media, index) => (
              <button
                key={media.id}
                onClick={() => goToSlide(index)}
                className={`aspect-video rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 relative ${
                  index === currentIndex
                    ? 'ring-3 ring-orange-500 ring-offset-2'
                    : 'ring-1 ring-gray-200 hover:ring-gray-300'
                }`}
              >
                {media.type === 'image' ? (
                  <img
                    src={media.src}
                    alt={media.alt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                    {/* Video indicator on thumbnail */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                  </>
                )}
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
              {medias[lightboxIndex].type === 'image' && (
                <div className="absolute -top-12 right-16 flex gap-2 z-10">
                  <button
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
                  >
                    {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {/* Lightbox Image/Video */}
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className={`relative transition-transform duration-300 ${isZoomed && medias[lightboxIndex].type === 'image' ? 'scale-150 cursor-move' : 'cursor-zoom-in'}`}>
                  {medias[lightboxIndex].type === 'image' ? (
                    <img
                      src={medias[lightboxIndex].src}
                      alt={medias[lightboxIndex].alt}
                      className="w-full h-auto max-h-[80vh] object-contain"
                      onClick={() => setIsZoomed(!isZoomed)}
                    />
                  ) : (
                    <video
                      src={medias[lightboxIndex].src}
                      className="w-full h-auto max-h-[80vh] object-contain"
                      controls
                      autoPlay
                    />
                  )}
                </div>
                
                {/* Caption */}
                <div className="p-6 bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    {medias[lightboxIndex].type === 'video' ? (
                      <Video className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Image className="w-5 h-5 text-orange-500" />
                    )}
                    <h3 className="text-xl font-bold text-gray-900">
                      {medias[lightboxIndex].caption}
                    </h3>
                  </div>
                  <p className="text-gray-600">
                    {lightboxIndex + 1} / {medias.length}
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