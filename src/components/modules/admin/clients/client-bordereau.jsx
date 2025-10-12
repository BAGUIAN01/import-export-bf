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
    if (!selectedContainer) return;
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
      const paid = containerPackages.reduce((sum, pkg) => sum + (pkg.paidAmount ?? 0), 0);

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
      window.print();
      setIsGenerating(false);
      toast.success('Bordereau généré pour impression');
    }, 350);
  };

  // PDF via API Puppeteer
  const handleDownload = async () => {
    if (!client?.id) return toast.error('Client non trouvé');

    try {
      setIsGenerating(true);
      
      const response = await fetch(`/api/clients/${client.id}/bordereau`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération du PDF');
      }

      // Créer un blob et télécharger
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bordereau-${client.clientCode}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Bordereau PDF téléchargé avec succès');
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      toast.error(error.message || 'Erreur lors de la génération du PDF');
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
      const link = `${window.location.origin}/bordereau/${formData.factureClient}`;
      await navigator.clipboard.writeText(link);
      toast.success('Lien copié dans le presse-papiers');
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
      <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-[#010066]" />
            Bordereau d'expédition professionnel
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ====== Carte de sélection conteneur (hors PDF) ====== */}
          <Card className="mb-6" data-html2canvas-ignore>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <ContainerIcon className="h-5 w-5 text-[#010066]" />
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Conteneur :</label>
                  <Select value={selectedContainer ?? ''} onValueChange={setSelectedContainer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un conteneur" />
                    </SelectTrigger>
                    <SelectContent>
                      {containers.map((container) => (
                        <SelectItem key={container.id} value={container.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{container.containerNumber}</span>
                            {container.name && <span className="text-gray-500">- {container.name}</span>}
                            {container.departureDate && (
                              <Badge variant="outline" className="ml-2">
                                {new Date(container.departureDate).toLocaleDateString('fr-FR')}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedContainerData && (
                <div className="p-4 bg-gradient-to-r from-[#010066]/5 to-[#010066]/10 rounded-xl border border-[#010066]/20">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Conteneur</span>
                      <p className="font-bold text-[#010066]">{selectedContainerData.containerNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Destination</span>
                      <p className="font-bold text-[#010066]">{selectedContainerData.destination}</p>
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
                      <p className="font-bold text-[#010066]">
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

          {/* ====== ZONE CAPTURÉE EN PDF - DESIGN MODERNE ====== */}
          <div
            ref={printRef}
            className="bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {/* En-tête moderne */}
            <div className="relative bg-gradient-to-br from-[#010066] via-[#010088] to-[#0100aa] text-white p-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="h-14 w-14 rounded-lg bg-white p-2 shadow-lg"
                    />
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">IMPORT EXPORT BF</h1>
                      <p className="text-blue-200 text-sm">Service d'envoi de colis France - Burkina Faso</p>
                    </div>
                  </div>
                  <div className="text-sm text-blue-100 space-y-1">
                    <p>📞 +33 6 70 69 98 23 • +226 76 60 19 81</p>
                    <p>✉️ contact@ieBF.fr</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 mb-2">
                    <p className="text-xs text-blue-200">Bordereau N°</p>
                    <p className="text-xl font-bold">{formData.factureClient}</p>
                  </div>
                  <p className="text-xs text-blue-200">Date: {formData.dateEdition}</p>
                </div>
              </div>
            </div>

            {/* Informations conteneur - Bandeau */}
            {selectedContainerData && (
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4">
                <div className="flex items-center justify-between text-sm font-medium text-amber-900">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-amber-800">Conteneur:</span>
                      <span className="ml-2 font-bold">{selectedContainerData.containerNumber}</span>
                    </div>
                    <div>
                      <span className="text-amber-800">Destination:</span>
                      <span className="ml-2 font-bold">{selectedContainerData.destination}</span>
                    </div>
                    {selectedContainerData.departureDate && (
                      <div>
                        <span className="text-amber-800">Départ:</span>
                        <span className="ml-2 font-bold">
                          {new Date(selectedContainerData.departureDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-amber-800">Colis:</span>
                    <span className="ml-2 font-bold">{packages.length}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-8 space-y-6">
              {/* Section Expéditeur / Destinataire - Design moderne */}
              <div className="grid grid-cols-2 gap-6">
                {/* Expéditeur */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border-l-4 border-[#010066]">
                  <h3 className="text-sm font-bold text-[#010066] uppercase tracking-wide mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#010066] rounded-full flex items-center justify-center text-white text-xs">E</div>
                    Expéditeur
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Nom complet</p>
                      <p className="font-bold text-gray-900">{client?.firstName || ''} {client?.lastName || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Téléphone</p>
                      <p className="font-semibold text-gray-900">{formatPhone(client?.phone)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Email</p>
                      <p className="font-semibold text-gray-900">{client?.email || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Adresse</p>
                      <p className="font-semibold text-gray-900">{client?.address || ''}</p>
                      <p className="text-xs text-gray-600">{client?.city || ''}, {client?.country || ''}</p>
                    </div>
                  </div>
                </div>

                {/* Destinataire */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border-l-4 border-green-600">
                  <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">D</div>
                    Destinataire
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Nom complet</p>
                      <p className="font-bold text-gray-900">{formData.destinataireNom || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Téléphone</p>
                      <p className="font-semibold text-gray-900">{formatPhone(formData.destinataireTel)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Email</p>
                      <p className="font-semibold text-gray-900">{formData.destinataireEmail || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Adresse</p>
                      <p className="font-semibold text-gray-900">{formData.destinataireAdresse || 'Non renseignée'}</p>
                      <p className="text-xs text-gray-600">{client?.recipientCity || ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des colis - Tableau moderne */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Détail des colis</h3>
                
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-[#010066]/30 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          {/* QR Code pour tracking */}
                          <div className="flex-shrink-0 bg-white p-2 rounded-lg border-2 border-gray-200">
                            <QRCode
                              value={item.packageNumber ? `${window.location.origin}/tracking?q=${item.packageNumber}` : 'N/A'}
                              size={60}
                              level="M"
                            />
                          </div>

                          {/* Infos colis */}
                          <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-5">
                              <p className="text-xs text-gray-500 mb-1">Description</p>
                              <p className="font-semibold text-gray-900">{item.description}</p>
                            </div>
                            <div className="col-span-1 text-center">
                              <p className="text-xs text-gray-500 mb-1">Qté</p>
                              <p className="font-bold text-[#010066]">{item.quantity}</p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className="text-xs text-gray-500 mb-1">Montant</p>
                              <p className="font-bold text-gray-900">{parseFloat(item.price || 0).toFixed(2)}€</p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className="text-xs text-gray-500 mb-1">Payé</p>
                              <p className="font-bold text-green-600">{(item.paidAmount || 0).toFixed(2)}€</p>
                            </div>
                            <div className="col-span-2 text-center">
                              <p className="text-xs text-gray-500 mb-1">Statut</p>
                              <div className="flex items-center justify-center gap-1">
                                {getPaymentStatusIcon(item.paymentStatus)}
                                <span className={`text-xs font-semibold ${
                                  item.paymentStatus === 'PAID' ? 'text-green-600' :
                                  item.paymentStatus === 'PARTIAL' ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                  {getPaymentStatusText(item.paymentStatus)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {!item.readonly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="opacity-0 group-hover:opacity-100 print:hidden"
                              data-html2canvas-ignore
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 print:hidden" data-html2canvas-ignore>
                  <Button onClick={addItem} variant="outline" size="sm" className="w-full">
                    + Ajouter un article
                  </Button>
                </div>
              </div>

              {/* Totaux - Design moderne */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <p className="text-xs text-blue-600 uppercase tracking-wide mb-2">Total général</p>
                  <p className="text-3xl font-bold text-[#010066]">{formData.total.toFixed(2)}€</p>
                  <p className="text-xs text-blue-600 mt-1">{formData.items.length} colis</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                  <p className="text-xs text-green-600 uppercase tracking-wide mb-2">Montant payé</p>
                  <p className="text-3xl font-bold text-green-700">{formData.acompte.toFixed(2)}€</p>
                  <p className="text-xs text-green-600 mt-1">
                    {((formData.acompte / formData.total) * 100 || 0).toFixed(0)}% du total
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-300">
                  <p className="text-xs text-orange-700 uppercase tracking-wide mb-2 font-bold">Reste à payer</p>
                  <p className="text-3xl font-bold text-orange-600">{formData.reste.toFixed(2)}€</p>
                  <p className="text-xs text-orange-600 mt-1">
                    {((formData.reste / formData.total) * 100 || 0).toFixed(0)}% restant
                  </p>
                </div>
              </div>

              {/* Options de livraison - Design épuré */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Options d'expédition</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.effetsPersonnels}
                      onCheckedChange={(checked) => setFormData({ ...formData, effetsPersonnels: Boolean(checked) })}
                    />
                    <span className="text-sm font-medium text-gray-700">Effets personnels usagés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.effetsNeufs}
                      onCheckedChange={(checked) => setFormData({ ...formData, effetsNeufs: Boolean(checked) })}
                    />
                    <span className="text-sm font-medium text-gray-700">Effets neufs</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm font-medium text-gray-700">Demande de livraison:</span>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.demandeOui}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, demandeOui: Boolean(checked), demandeNon: !checked })
                      }
                    />
                    <span className="text-sm">OUI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.demandeNon}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, demandeNon: Boolean(checked), demandeOui: !checked })
                      }
                    />
                    <span className="text-sm">NON</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Documents, factures ou justificatifs</label>
                  <Input
                    value={formData.livraison}
                    onChange={(e) => setFormData({ ...formData, livraison: e.target.value })}
                    className="text-sm h-9"
                    placeholder="Référence, valeur ou remarque..."
                  />
                </div>
              </div>

              {/* Conditions - Design compact */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="text-xs font-bold text-amber-900 mb-2 uppercase">Conditions générales</h4>
                <div className="text-xs text-amber-800 space-y-1 leading-relaxed">
                  <p>• Toutes marchandises non précisées sur ce document ne pourront pas être réclamées</p>
                  <p>• Toutes valeurs déclarées doivent être justifiées par une facture</p>
                  <p>• La livraison à destination est optionnelle, montant déterminé avant départ</p>
                  <p>• Sous réserve de procédures douanières</p>
                  <p>• L'agence n'est pas responsable des colis non réclamés après 6 mois</p>
                </div>
              </div>

              {/* Signature */}
              <div className="flex items-end justify-between pt-6 border-t-2 border-dashed border-gray-300">
                <div className="text-xs text-gray-500">
                  <p className="mb-1">Document généré le {formData.dateEdition}</p>
                  <p className="font-medium">IMPORT EXPORT BF - Service d'envoi de colis France - Burkina Faso</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">Signature client</p>
                  <div className="w-48 h-16 border-b-2 border-gray-400"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== Boutons d'action (hors PDF) ====== */}
        <DialogFooter className="border-t px-6 py-4 bg-gray-50" data-html2canvas-ignore>
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
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
