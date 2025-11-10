import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Download,
  Printer,
  Container as ContainerIcon,
  X,
  AlertCircle,
  Check,
  Mail,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/* ================= UTILS ================= */
const formatPhone = (tel) => {
  if (!tel) return '';
  const digits = tel.replace(/\D/g, '');
  if (tel.startsWith('+')) {
    return tel
      .replace(/[^+\d]/g, '')
      .replace(/^(\+\d{1,3})(\d{1,3})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?$/, (_m, a, b, c, d, e, f) =>
        [a, b, c, d, e, f].filter(Boolean).join(' ')
      );
  }
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

/* ================= COMPONENT ================= */
const BordereauDialog = ({ client, onClose, isOpen, containerId = null }) => {
  const printRef = useRef(null);

  const [formData, setFormData] = useState({
    factureClient: '',
    dateEdition: new Date().toLocaleDateString('fr-FR'),
    items: [],
    effetsPersonnels: false,
    effetsNeufs: false,
    demandeOui: false,
    demandeNon: true,
    livraison: '',
    destinataireNom: client?.recipientName || '',
    destinataireAdresse: client?.recipientAddress || '',
    destinataireTel: client?.recipientPhone || '',
    destinataireEmail: '',
    total: 0,
    acompte: 0,
    reste: 0
  });

  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(containerId);
  const [packages, setPackages] = useState([]);
  const [shipmentInfo, setShipmentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  /* -------- API calls -------- */
  const fetchContainers = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/containers?limit=100');
      if (!res.ok) throw new Error('Erreur lors du chargement des conteneurs');
      const data = await res.json();
      setContainers(data.containers || []);
    } catch (error) {
      console.error(error);
      setError('Impossible de charger les conteneurs');
      toast.error('Erreur lors du chargement des conteneurs');
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    if (!selectedContainer) {
      setPackages([]);
      setShipmentInfo(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let url = `/api/containers/${selectedContainer}/packages`;
      if (client?.id) url += `?clientId=${client.id}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Erreur lors du chargement des colis');

      const data = await res.json();
      const containerPackages = data.packages || [];
      setPackages(containerPackages);

      const items = containerPackages.map((pkg) => ({
        id: pkg.id,
        packageNumber: pkg.packageNumber,
        description: `${pkg.description} (${pkg.packageNumber})`,
        price: (pkg.totalAmount ?? 0).toString(),
        paidAmount: (pkg.paidAmount ?? 0),
        quantity: pkg.totalQuantity || 1,
        paymentStatus: pkg.paymentStatus,
        readonly: true
      }));

      const total = containerPackages.reduce((sum, pkg) => sum + (pkg.totalAmount ?? 0), 0);
      
      // ⚠️ IMPORTANT: Récupérer le paiement depuis le SHIPMENT, pas les colis
      let paid = 0;
      let shipment = null;
      if (client?.id && selectedContainer) {
        try {
          // Chercher le shipment pour ce client + conteneur
          const shipmentRes = await fetch(`/api/shipments?clientId=${client.id}&containerId=${selectedContainer}&limit=1`);
          if (shipmentRes.ok) {
            const shipmentData = await shipmentRes.json();
            if (shipmentData.data && shipmentData.data.length > 0) {
              shipment = shipmentData.data[0];
              paid = shipment.paidAmount || 0;
            }
          }
        } catch (err) {
          console.warn('Impossible de récupérer le shipment:', err);
          // En cas d'erreur, on garde paid = 0
        }
      }

      setShipmentInfo(shipment);

      setFormData((prev) => ({
        ...prev,
        items: items.length > 0 ? items : [{ description: '', price: '', quantity: 1, readonly: false }],
        total,
        acompte: paid,
        reste: total - paid
      }));

      if (containerPackages.length === 0) {
        toast.info(
          client ? `Aucun colis trouvé pour ${client.firstName} ${client.lastName} dans ce conteneur` : 'Aucun colis dans ce conteneur'
        );
      }
    } catch (error) {
      console.error(error);
      setShipmentInfo(null);
      setError('Impossible de charger les colis');
      toast.error('Erreur lors du chargement des colis');
    } finally {
      setLoading(false);
    }
  }, [selectedContainer, client]);

  useEffect(() => { if (isOpen) fetchContainers(); }, [isOpen, fetchContainers]);
  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  // Numéro auto
  useEffect(() => {
    if (isOpen && !formData.factureClient) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const r = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setFormData((prev) => ({ ...prev, factureClient: `BRD-${y}${m}${d}${r}` }));
    }
  }, [isOpen, formData.factureClient]);

  /* -------- Items / Totaux -------- */
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    if (newItems[index].readonly && field !== 'price') return;
    if (field === 'quantity') {
      newItems[index][field] = Math.max(1, parseInt(value || '1', 10));
    } else {
      newItems[index][field] = value;
    }
    setFormData({ ...formData, items: newItems });
    calculateTotal(newItems);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', price: '', quantity: 1, readonly: false }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    calculateTotal(newItems);
  };

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(String(item.quantity)) || 1;
      return sum + price * quantity;
    }, 0);
    const reste = total - (parseFloat(String(formData.acompte)) || 0);
    setFormData((prev) => ({ ...prev, total, reste }));
  };

  /* -------- Actions -------- */
  const handlePrint = () => {
    if (!selectedContainer) return toast.error('Veuillez sélectionner un conteneur');
    setIsGenerating(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
      setIsGenerating(false);
      toast.success('Bordereau généré pour impression');
    }, 350);
  };

  // PDF via jsPDF + html2canvas
  const handleDownload = async () => {
    if (!selectedContainer) return toast.error('Veuillez sélectionner un conteneur');
    if (!printRef.current) return toast.error('Erreur: Contenu non trouvé');

    try {
      setIsGenerating(true);
      toast.loading('Génération du PDF en cours...', { id: 'pdf-generation' });

      // Capturer le contenu avec html2canvas
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: printRef.current.scrollWidth,
        height: printRef.current.scrollHeight,
        windowWidth: printRef.current.scrollWidth,
        windowHeight: printRef.current.scrollHeight,
      });

      // Créer le PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Calculer les dimensions pour A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Si le contenu dépasse une page, on ajuste ou on pagine
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Télécharger le PDF
      const filename = `bordereau-${client?.clientCode || 'client'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast.success('Bordereau PDF téléchargé avec succès', { id: 'pdf-generation' });
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      toast.error(error.message || 'Erreur lors de la génération du PDF', { id: 'pdf-generation' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmail = async () => {
    if (!selectedContainer) return toast.error('Veuillez sélectionner un conteneur');
    try {
      // TODO: POST /api/bordereau/email
      toast.success('E-mail envoyé au client (simulation)');
    } catch {
      toast.error("Impossible d'envoyer l'e-mail");
    }
  };

  const handleShareLink = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://import-export-bf.com';
      const link = `${origin}/bordereau/${shipmentInfo?.shipmentNumber || formData.factureClient}`;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        toast.success('Lien copié dans le presse-papiers');
      } else {
        toast.error('Fonction de copie non disponible');
      }
    } catch {
      toast.error('Erreur lors de la génération du lien');
    }
  };

  const selectedContainerData = containers.find((c) => c.id === selectedContainer);
  const totalWeight = packages.reduce((s, p) => s + (p.totalWeight || 0), 0);
  const totalVolume = packages.reduce((s, p) => s + (p.totalVolume || 0), 0);

  const isValid =
    !!selectedContainer &&
    formData.items.length > 0 &&
    formData.items.some((item) => item.description && item.price);

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PARTIAL':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'PAID':
        return 'Payé';
      case 'PARTIAL':
        return 'Partiel';
      default:
        return 'Impayé';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col w-[98vw] xs:w-[95vw] sm:w-full sm:max-w-[1100px] max-h-[95vh] xs:max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6 pb-2 xs:pb-3 sm:pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base xs:text-lg sm:text-xl">
            <FileText className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-[#010066]" />
            <span className="hidden xs:inline">Bordereau d'expédition professionnel</span>
            <span className="xs:hidden">Bordereau</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-3 xs:px-4 sm:px-6 py-2 xs:py-3 sm:py-4">
            {/* ====== Carte de sélection conteneur (hors PDF) ====== */}
          <Card className="mb-3 xs:mb-4 sm:mb-6" data-html2canvas-ignore>
            <CardContent className="p-2 xs:p-3 sm:p-4 space-y-2 xs:space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 xs:gap-3 sm:gap-4">
                <ContainerIcon className="h-4 w-4 xs:h-5 xs:w-5 text-[#010066] flex-shrink-0" />
                <div className="flex-1 w-full">
                  <label className="text-xs xs:text-sm font-medium mb-1 xs:mb-2 block">Conteneur :</label>
                  <Select value={selectedContainer ?? ''} onValueChange={setSelectedContainer}>
                    <SelectTrigger className="w-full min-h-[44px] sm:min-h-[40px] text-xs xs:text-sm">
                      <SelectValue placeholder="Sélectionner un conteneur" />
                    </SelectTrigger>
                    <SelectContent>
                      {containers.map((container) => (
                        <SelectItem key={container.id} value={container.id}>
                          <span className="flex flex-col xs:flex-row xs:items-center xs:gap-2 font-medium text-xs xs:text-sm">
                            {container.containerNumber}
                            {container.departureDate && (
                              <span className="text-gray-500 text-[11px] xs:text-xs font-normal">
                                {new Date(container.departureDate).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedContainerData && (
                <div className="p-2 xs:p-3 sm:p-4 bg-gradient-to-r from-[#010066]/5 to-[#010066]/10 rounded-xl border border-[#010066]/20">
                  {/* Version mobile - cartes empilées */}
                  <div className="xs:hidden space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600">Conteneur</span>
                      <span className="text-xs font-bold text-[#010066] truncate">{selectedContainerData.containerNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600">Destination</span>
                      <span className="text-xs font-bold text-[#010066] truncate">{selectedContainerData.destination}</span>
                    </div>
                    {selectedContainerData.departureDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-600">Départ</span>
                        <span className="text-xs font-bold text-[#010066]">
                          {new Date(selectedContainerData.departureDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600">Colis</span>
                      <span className="text-xs font-bold text-[#010066]">{packages.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600">Poids/Volume</span>
                      <span className="text-xs font-bold text-[#010066]">
                        {(totalWeight || 0) > 0 ? `${totalWeight.toFixed(1)}kg` : '-'} • {(totalVolume || 0) > 0 ? `${totalVolume.toFixed(2)}m³` : '-'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Version desktop - grille */}
                  <div className="hidden xs:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 xs:gap-3 sm:gap-4 text-xs xs:text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Conteneur</span>
                      <p className="font-bold text-[#010066] truncate">{selectedContainerData.containerNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Destination</span>
                      <p className="font-bold text-[#010066] truncate">{selectedContainerData.destination}</p>
                    </div>
                    {selectedContainerData.departureDate && (
                      <div>
                        <span className="font-medium text-gray-600">Départ</span>
                        <p className="font-bold text-[#010066]">
                          {new Date(selectedContainerData.departureDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-600">Colis</span>
                      <p className="font-bold text-[#010066]">{packages.length}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Poids/Volume</span>
                      <p className="font-bold text-[#010066] text-xs sm:text-sm">
                        {(totalWeight || 0) > 0 ? `${totalWeight.toFixed(1)}kg` : '-'} • {(totalVolume || 0) > 0 ? `${totalVolume.toFixed(2)}m³` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ====== ZONE CAPTURÉE EN PDF - DESIGN EXACT ====== */}
          <div
            ref={printRef}
            className="bg-white shadow-2xl overflow-hidden print:shadow-none print:rounded-none"
            style={{ fontFamily: 'Arial, sans-serif', width: '210mm', margin: '0 auto' }}
          >
            {/* En-tête exact comme l'image */}
            <div className="bg-[#010066] text-white px-3 xs:px-4 sm:px-6 py-2 xs:py-3 sm:py-4">
              <div className="flex flex-col gap-3 xs:gap-4">
                {/* Logo et nom de l'entreprise */}
                <div className="flex items-center gap-2 xs:gap-3">
                  <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center p-1 xs:p-2">
                    <img
                      src="/logo_short.png"
                      alt="Logo IMPORT EXPORT BF"
                      className="w-full h-full object-contain"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-300 mb-1">IMPORT-EXPORT BF</div>
                    <h1 className="text-sm xs:text-lg sm:text-2xl font-bold">IMPORT EXPORT BF</h1>
                  </div>
                </div>
                
                {/* Contact et informations shipment */}
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-4">
                  <div className="text-xs text-gray-300 space-y-0.5 xs:space-y-1">
                    <p className="hidden xs:block">+33 6 70 69 98 23</p>
                    <p className="hidden xs:block">+226 76 60 19 81</p>
                    <p className="hidden xs:block">contact@ieBF.fr</p>
                    <p className="xs:hidden">+33 6 70 69 98 23 • +226 76 60 19 81</p>
                  </div>
                  <div className="flex items-center gap-2 xs:gap-3 w-full xs:w-auto justify-between xs:justify-end">
                    <div className="text-left xs:text-right">
                      <p className="text-xs text-gray-300">Shipment N°</p>
                      <p className="text-sm xs:text-base sm:text-lg font-bold">
                        {shipmentInfo?.shipmentNumber || '—'}
                      </p>
                      <p className="text-xs text-gray-300">Date: {formData.dateEdition}</p>
                    </div>
                    <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 bg-white rounded flex items-center justify-center">
                      <QRCode
                        value={`${typeof window !== 'undefined' ? window.location.origin : 'https://import-export-bf.com'}/tracking?q=${shipmentInfo?.shipmentNumber || ''}`}
                        size={40}
                        level="M"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bandeau conteneur exact */}
            {selectedContainerData && (
              <div className="bg-white border-b border-gray-300 px-3 xs:px-4 sm:px-6 py-2 xs:py-2 sm:py-3">
                <div className="flex flex-col gap-2 xs:gap-3">
                  {/* Version mobile - empilé */}
                  <div className="xs:hidden space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Conteneur:</span>
                      <span className="font-bold truncate ml-2">{selectedContainerData.containerNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Départ:</span>
                      <span className="font-bold truncate ml-2">
                        {selectedContainerData.departureDate ? 
                          new Date(selectedContainerData.departureDate).toLocaleDateString('fr-FR') : 
                          'À déterminer'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Colis:</span>
                      <span className="font-bold">{packages.length} colis</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Suivi:</span>
                      <span className="font-bold truncate ml-2">{shipmentInfo?.shipmentNumber || '—'}</span>
                    </div>
                  </div>
                  
                  {/* Version desktop - horizontal */}
                  <div className="hidden xs:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm font-semibold">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <span>Conteneur: <span className="font-bold">{selectedContainerData.containerNumber}</span></span>
                      <span>Départ: <span className="font-bold">
                        {selectedContainerData.departureDate ? 
                          new Date(selectedContainerData.departureDate).toLocaleDateString('fr-FR') : 
                          'À déterminer'
                        }</span></span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <span className="font-bold">{packages.length} colis</span>
                      <span>Suivi: <span className="font-bold">{shipmentInfo?.shipmentNumber || '—'}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="px-3 xs:px-4 sm:px-6 py-2 xs:py-3 space-y-3 xs:space-y-4">
              {/* Section Expéditeur / Destinataire - Design exact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                {/* Expéditeur */}
                <div className="border border-gray-300 p-2 xs:p-3 sm:p-4 bg-gray-50">
                  <h3 className="text-xs sm:text-sm font-bold text-black mb-2 sm:mb-3 uppercase">EXPÉDITEUR</h3>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <span className="text-gray-600 xs:w-12 flex-shrink-0">Code:</span>
                      <span className="font-bold truncate">{client?.clientCode || 'CLI20250001'}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <span className="text-gray-600 xs:w-12 flex-shrink-0">Nom:</span>
                      <span className="font-bold truncate">{client?.firstName || ''} {client?.lastName || ''}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <span className="text-gray-600 xs:w-12 flex-shrink-0">Tél:</span>
                      <span className="font-bold truncate">{formatPhone(client?.phone)}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-start gap-1 xs:gap-2">
                      <span className="text-gray-600 xs:w-12 flex-shrink-0">Adresse:</span>
                      <span className="font-bold break-words">{client?.address || ''}, {client?.city || ''}</span>
                    </div>
                  </div>
                </div>

                {/* Destinataire */}
                <div className="border border-gray-300 p-2 xs:p-3 sm:p-4 bg-gray-50">
                  <h3 className="text-xs sm:text-sm font-bold text-black mb-2 sm:mb-3 uppercase">DESTINATAIRE</h3>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <span className="text-gray-600 xs:w-12 flex-shrink-0">Nom:</span>
                      <span className="font-bold truncate">{formData.destinataireNom || client?.recipientName || 'Non renseigné'}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <span className="text-gray-600 xs:w-12 flex-shrink-0">Tél:</span>
                      <span className="font-bold truncate">{formatPhone(formData.destinataireTel || client?.recipientPhone)}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-start gap-1 xs:gap-2">
                      <span className="text-gray-600 xs:w-12 flex-shrink-0">Adresse:</span>
                      <span className="font-bold break-words">{formData.destinataireAdresse || client?.recipientAddress || 'Non renseignée'}, {client?.recipientCity || ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des colis - Tableau exact */}
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-black mb-2">Détail des colis ({formData.items.length})</h3>
                
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="border border-gray-300">
                    {/* Version mobile - cartes empilées */}
                    <div className="sm:hidden space-y-2 p-2">
                      {formData.items.map((item, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${index % 2 === 0 ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-sm">{item.packageNumber || `PKG${index + 1}`}</div>
                            <div className="text-right">
                              <div className="font-bold text-sm">{parseFloat(item.price || 0).toFixed(2)}€</div>
                              <div className="text-xs text-gray-600">Qté: {item.quantity}</div>
                            </div>
                          </div>
                          <div className="text-sm">
                            <div className="font-semibold mb-1">{item.description}</div>
                            {item.types && item.types.length > 0 && (
                              <div className="text-xs text-gray-600">
                                {item.types.map(t => `${t.type} (×${t.quantity})`).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Version desktop - tableau */}
                    <div className="hidden sm:block">
                      {/* En-tête tableau */}
                      <div className="bg-[#010066] text-white text-xs font-bold">
                        <div className="grid grid-cols-4 gap-1 sm:gap-2 px-2 sm:px-3 py-2">
                          <div>N° Colis</div>
                          <div>Description</div>
                          <div className="text-center">Qté</div>
                          <div className="text-right">Montant</div>
                        </div>
                      </div>
                      
                      {/* Corps tableau */}
                      <div className="divide-y divide-gray-200">
                        {formData.items.map((item, index) => (
                          <div key={index} className={`grid grid-cols-4 gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <div className="font-bold">{item.packageNumber || `PKG${index + 1}`}</div>
                            <div>
                              <div className="font-semibold">{item.description}</div>
                              {item.types && item.types.length > 0 && (
                                <div className="text-xs text-gray-600">
                                  {item.types.map(t => `${t.type} (×${t.quantity})`).join(', ')}
                                </div>
                              )}
                            </div>
                            <div className="text-center">{item.quantity}</div>
                            <div className="text-right font-bold">{parseFloat(item.price || 0).toFixed(2)}€</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 print:hidden" data-html2canvas-ignore>
                  <Button onClick={addItem} variant="outline" size="sm" className="w-full min-h-[44px] sm:min-h-[36px]">
                    + Ajouter un article
                  </Button>
                </div>
              </div>

              {/* Totaux - Design exact aligné à droite */}
              <div className="mt-4">
                {/* Version mobile - cartes empilées */}
                <div className="sm:hidden space-y-3">
                  <div className="bg-white border border-gray-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total général</span>
                      <span className="text-lg font-bold">{formData.total.toFixed(2)}€</span>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-700">Montant payé</span>
                      <span className="text-lg font-bold text-green-800">{formData.acompte.toFixed(2)}€</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-orange-700">Reste à payer</span>
                      <span className="text-lg font-bold text-orange-800">{formData.reste.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                {/* Version desktop - aligné à droite */}
                <div className="hidden sm:flex justify-end">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm font-bold">
                    <div className="text-right">
                      <div className="text-xs text-gray-600 uppercase mb-1">TOTAL GÉNÉRAL</div>
                      <div className="text-base sm:text-lg">{formData.total.toFixed(2)}€</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 uppercase mb-1">MONTANT PAYÉ</div>
                      <div className="text-base sm:text-lg">{formData.acompte.toFixed(2)}€</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 uppercase mb-1">RESTE À PAYER</div>
                      <div className="text-base sm:text-lg text-blue-600">{formData.reste.toFixed(2)}€</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditions - Design exact */}
              <div className="bg-gray-50 border border-gray-300 p-2 xs:p-3">
                <h4 className="text-xs font-bold text-black mb-1 sm:mb-2 uppercase">CONDITIONS</h4>
                <div className="text-xs text-black space-y-1">
                  <p className="break-words">• Marchandises non précisées ne pourront être réclamées • Valeurs justifiées par facture</p>
                  <p className="break-words">• Livraison optionnelle déterminée avant départ • Sous réserve procédures douanières</p>
                </div>
              </div>

              {/* Signature - Design exact */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between pt-2 xs:pt-3 sm:pt-4 border-t border-gray-300 gap-3 sm:gap-0">
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="break-words">Document généré le {formData.dateEdition} par {client?.firstName || ''} {client?.lastName || ''}</p>
                  <p className="break-words">IMPORT EXPORT BF - Service d'envoi de colis France-Burkina Faso</p>
                </div>
                <div className="text-center w-full sm:w-auto">
                  <p className="text-xs text-gray-600 mb-2">Signature</p>
                  <div className="w-20 xs:w-24 sm:w-32 h-5 xs:h-6 sm:h-8 border-b border-gray-400 mx-auto sm:mx-0"></div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </ScrollArea>

        {/* ====== Boutons d'action (hors PDF) ====== */}
        <DialogFooter className="border-t px-3 xs:px-4 sm:px-6 py-2 xs:py-3 sm:py-4 bg-gray-50" data-html2canvas-ignore>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-3 sm:gap-0">
            {/* Version mobile - boutons empilés */}
            <div className="sm:hidden space-y-2">
              <Button 
                onClick={handleDownload} 
                variant="default" 
                disabled={!isValid || isGenerating} 
                className="w-full min-h-[44px] bg-[#010066] hover:bg-[#010088]"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Génération...' : 'Télécharger PDF'}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handlePrint} 
                  variant="outline" 
                  disabled={!isValid || isGenerating}
                  className="min-h-[44px]"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Imprimer</span>
                  <span className="xs:hidden">Print</span>
                </Button>
                <Button 
                  onClick={handleEmail} 
                  variant="outline" 
                  disabled={!isValid}
                  className="min-h-[44px]"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Email</span>
                  <span className="xs:hidden">Mail</span>
                </Button>
              </div>
              <Button 
                onClick={handleShareLink} 
                variant="outline" 
                disabled={!isValid}
                className="w-full min-h-[44px]"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Copier le lien
              </Button>
            </div>
            
            {/* Version desktop - boutons horizontaux */}
            <div className="hidden sm:flex gap-2">
              <Button onClick={handlePrint} variant="outline" disabled={!isValid || isGenerating}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button onClick={handleDownload} variant="default" disabled={!isValid || isGenerating} className="bg-[#010066] hover:bg-[#010088]">
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Génération...' : 'Télécharger PDF'}
              </Button>
              <Button onClick={handleEmail} variant="outline" disabled={!isValid}>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer par email
              </Button>
              <Button onClick={handleShareLink} variant="outline" disabled={!isValid}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Copier le lien
              </Button>
            </div>

            <Button variant="ghost" onClick={() => onClose(false)}>
              Fermer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BordereauDialog;
