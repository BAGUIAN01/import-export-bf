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
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';

/* ================= BRANDING ================= */
const AGENCY_NAME = 'IMPORT EXPORT BF';
const AGENCY_TAGLINE = 'Gestion des colis';
const AGENCY_LOGO_URL = '/logo.png'; // place ton logo dans /public

// Palette (ajuste si besoin pour coller au logo)
const BRAND = {
  bg: '#143B9C',     // bleu profond
  bg2: '#1E4ED8',    // bleu secondaire
  chipBg: '#2453D6', // cartouche
  accent: '#FF7A00', // orange logo
  textLight: '#FFFFFF',
  textSub: 'rgba(255,255,255,0.85)',
};

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
        description: `${pkg.description} (${pkg.packageNumber})`,
        price: (pkg.totalAmount ?? 0).toString(),
        quantity: pkg.totalQuantity || 1,
        readonly: true
      }));

      const total = containerPackages.reduce((sum, pkg) => sum + (pkg.totalAmount ?? 0), 0);

      setFormData((prev) => ({
        ...prev,
        items: items.length > 0 ? items : [{ description: '', price: '', quantity: 1, readonly: false }],
        total,
        reste: total - prev.acompte
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
      setFormData((prev) => ({ ...prev, factureClient: `${y}${m}${d}${r}` }));
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

  // PDF COULEUR — UNIQUEMENT la zone printRef (bordereau)
  const handleDownload = async () => {
    if (!selectedContainer) return toast.error('Veuillez sélectionner un conteneur');
    if (!printRef.current) return toast.error('Aucune zone à exporter');

    try {
      setIsGenerating(true);
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Bordereau-${formData.factureClient || 'document'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      await html2pdf().from(printRef.current).set(opt).save();
      toast.success('PDF téléchargé');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du PDF');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[980px] max-h-[90vh] overflow-hidden p-4">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Créer un bordereau d'expédition
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* ====== Cette carte n'est PAS dans le PDF ====== */}
          <Card data-html2canvas-ignore>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <ContainerIcon className="h-5 w-5 text-blue-600" />
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
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <span className="font-medium text-gray-600">Conteneur :</span>
                      <p className="font-semibold">{selectedContainerData.containerNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Destination :</span>
                      <p className="font-semibold">{selectedContainerData.destination}</p>
                    </div>
                    {selectedContainerData.departureDate && (
                      <div>
                        <span className="font-medium text-gray-600">Date de départ :</span>
                        <p className="font-semibold">
                          {new Date(selectedContainerData.departureDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-600">Colis trouvés :</span>
                      <p className="font-semibold">
                        {packages.length} colis
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Récap :</span>
                      <p className="font-semibold">
                        {(totalWeight || 0) > 0 ? `${totalWeight.toFixed(2)} kg` : '-'} •{' '}
                        {(totalVolume || 0) > 0 ? `${totalVolume.toFixed(3)} m³` : '-'}
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

          {/* ====== ZONE CAPTURÉE EN PDF ====== */}
          <div
            ref={printRef}
            className="pdf-surface bg-white border border-gray-200 rounded-lg overflow-hidden print:border-0 print:shadow-none"
          >
            <div className="border-2 border-black">
              {/* Entête brandée */}
              <div
                className="text-white p-3 flex items-center justify-between"
                style={{
                  background: `linear-gradient(90deg, ${BRAND.bg} 0%, ${BRAND.bg2} 100%)`,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 relative">
                    <img
                      src={AGENCY_LOGO_URL}
                      alt={`${AGENCY_NAME} logo`}
                      className="h-10 w-10 rounded-lg bg-white p-1 shadow-sm print:shadow-none"
                      style={{ border: `2px solid ${BRAND.accent}` }}
                    />
                  </div>
                  <div className="leading-tight">
                    <div
                      className="inline-flex items-center rounded font-bold text-sm tracking-wide"
                      style={{
                        backgroundColor: BRAND.chipBg,
                        color: BRAND.textLight,
                        padding: '8px 16px',
                        boxShadow: `0 0 0 2px ${BRAND.bg} inset`
                      }}
                    >
                      {AGENCY_NAME}
                    </div>
                    <div className="mt-0.5 text-[11px]" style={{ color: BRAND.textSub }}>
                      {AGENCY_TAGLINE}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div
                    className="inline-block px-2 py-1 rounded mb-1"
                    style={{ backgroundColor: 'rgba(255,122,0,0.12)', color: BRAND.textLight, border: `1px solid ${BRAND.accent}` }}
                  >
                    Import / Export
                  </div>
                  <div style={{ color: BRAND.textSub }}>Tél. : +33 6 70 69 98 23 / +226 76 60 19 81</div>
                  <div style={{ color: BRAND.textSub }}>Email : contact@ieBF.fr</div>
                </div>
              </div>

              {/* Date d’édition + Facture + QR */}
              <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-7 flex border-r border-black">
                  <div className="w-40 p-3 text-sm font-medium border-r border-black">Date d’édition</div>
                  <div className="flex-1 p-3">
                    <Input
                      value={formData.dateEdition}
                      onChange={(e) => setFormData({ ...formData, dateEdition: e.target.value })}
                      className="border-0 text-sm h-auto p-0 print:bg-transparent"
                    />
                  </div>
                </div>
                <div className="col-span-5 p-3 flex items-center justify-between gap-3">
                  <div className="text-right">
                    <div className="text-xs font-medium">Facture client N°</div>
                    <Input
                      value={formData.factureClient}
                      onChange={(e) => setFormData({ ...formData, factureClient: e.target.value })}
                      className="border-0 text-center font-bold h-auto p-1 w-28 text-sm print:bg-transparent"
                    />
                  </div>
                  <div className="print:hidden">
                    <QRCode value={formData.factureClient || 'N/A'} size={60} />
                  </div>
                  <div className="hidden print:block">
                    <QRCode value={formData.factureClient || 'N/A'} size={60} />
                  </div>
                </div>
              </div>

              {/* Bandeau jaune */}
              <div className="bg-yellow-400 p-4 text-center border-b border-black">
                <div className="font-bold text-xl">IMPORT EXPORT BF</div>
                <div className="text-sm font-medium">EXPÉDIEZ VOS MARCHANDISES EN TOUTE SÉCURITÉ !</div>
                <div className="text-xs mt-1">Service d'envoi de colis France — Burkina Faso</div>
              </div>

              {/* Infos conteneur (récap compact) */}
              {selectedContainerData && (
                <div className="bg-blue-50 p-3 border-b border-black text-sm">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <span><strong>Conteneur :</strong> {selectedContainerData.containerNumber}</span>
                    <span><strong>Destination :</strong> {selectedContainerData.destination}</span>
                    {selectedContainerData.departureDate && (
                      <span><strong>Date de départ :</strong> {new Date(selectedContainerData.departureDate).toLocaleDateString('fr-FR')}</span>
                    )}
                    <span><strong>Colis :</strong> {packages.length}</span>
                    <span><strong>Montant total :</strong> {formData.total.toFixed(2)}€</span>
                  </div>
                </div>
              )}

              {/* Expéditeur */}
              <div className="border-b border-black">
                <div className="flex border-b border-black">
                  <div className="w-40 p-3 text-sm font-medium border-r border-black bg-gray-50">Nom, Prénom</div>
                  <div className="flex-1 p-3">
                    <div className="font-medium">{client?.firstName || ''} {client?.lastName || ''}</div>
                  </div>
                </div>
                <div className="flex border-b border-black">
                  <div className="w-40 p-3 text-sm font-medium border-r border-black bg-gray-50">Adresse</div>
                  <div className="flex-1 p-3">
                    <div>{client?.address || ''}{client?.city ? `, ${client.city}` : ''}</div>
                  </div>
                </div>
                <div className="flex border-b border-black">
                  <div className="w-40 p-3 text-sm font-medium border-r border-black bg-gray-50">Téléphone</div>
                  <div className="flex-1 p-3">{formatPhone(client?.phone)}</div>
                </div>
                <div className="flex">
                  <div className="w-40 p-3 text-sm font-medium border-r border-black bg-gray-50">E-mail</div>
                  <div className="flex-1 p-3">{client?.email || ''}</div>
                </div>
              </div>

              {/* Marchandises */}
              <div className="bg-yellow-400 p-3 text-center font-bold border-b border-black">
                Descriptif de la marchandise
              </div>

              <div className="flex border-b border-black bg-gray-50">
                <div className="flex-1 p-3 text-sm font-medium border-r border-black text-center">
                  NOMBRE ET NATURE DE LA MARCHANDISE
                </div>
                <div className="w-24 p-3 text-sm font-medium text-center border-r border-black">Qté</div>
                <div className="w-28 p-3 text-sm font-medium text-center">Prix<br />convenu</div>
              </div>

              <div className="min-h-48">
                {loading ? (
                  <div className="p-4 space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex border-b border-gray-300 group">
                        <div className="flex-1 p-2 border-r border-black">
                          <div className="flex items-center gap-2">
                            <Input
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="border-0 text-sm h-auto p-1 print:bg-transparent"
                              placeholder="Description de l'article…"
                              readOnly={item.readonly}
                            />
                            {!item.readonly && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 print:hidden"
                                title="Supprimer la ligne"
                                data-html2canvas-ignore
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="w-24 p-2 border-r border-black">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="border-0 text-sm h-auto p-1 text-center print:bg-transparent"
                            min={1}
                            readOnly={item.readonly}
                          />
                        </div>
                        <div className="w-28 p-2">
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            className="border-0 text-sm h-auto p-1 text-center print:bg-transparent"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    ))}

                    {Array.from({ length: Math.max(0, 5 - formData.items.length) }).map((_, index) => (
                      <div key={`empty-${index}`} className="flex border-b border-gray-300 h-10">
                        <div className="flex-1 p-2 border-r border-black"></div>
                        <div className="w-24 p-2 border-r border-black"></div>
                        <div className="w-28 p-2"></div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="p-2 print:hidden" data-html2canvas-ignore>
                <Button onClick={addItem} variant="outline" size="sm">
                  Ajouter un article
                </Button>
              </div>

              {/* Totaux & options */}
              <div className="flex">
                <div className="flex-1 border-r border-black">
                  <div className="flex">
                    <div className="flex-1 p-3 bg-yellow-300">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.effetsPersonnels}
                          onCheckedChange={(checked) => setFormData({ ...formData, effetsPersonnels: Boolean(checked) })}
                        />
                        <span className="text-sm font-medium">Effets personnels usagés</span>
                      </div>
                    </div>
                    <div className="flex-1 p-3 bg-yellow-300">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.effetsNeufs}
                          onCheckedChange={(checked) => setFormData({ ...formData, effetsNeufs: Boolean(checked) })}
                        />
                        <span className="text-sm font-medium">Effets neufs</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-black">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">Demande de livraison :</span>
                      <Checkbox
                        checked={formData.demandeOui}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, demandeOui: Boolean(checked), demandeNon: !checked })
                        }
                      />
                      <span className="text-xs">OUI</span>
                      <Checkbox
                        checked={formData.demandeNon}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, demandeNon: Boolean(checked), demandeOui: !checked })
                        }
                      />
                      <span className="text-xs">NON</span>
                    </div>
                    <div className="text-xs">
                      <label className="block mb-1">DOCUMENTS, FACTURES OU JUSTIFICATIFS :</label>
                      <Input
                        value={formData.livraison}
                        onChange={(e) => setFormData({ ...formData, livraison: e.target.value })}
                        className="border border-gray-300 text-xs h-8 p-2"
                        placeholder="Référence / valeur / remarque"
                      />
                    </div>
                  </div>
                </div>
                <div className="w-40">
                  <div className="p-3 border-b border-black text-center">
                    <div className="text-sm font-medium">TOTAL :</div>
                    <div className="font-bold text-lg">{formData.total.toFixed(2)}€</div>
                  </div>
                  <div className="p-3 border-b border-black text-center bg-blue-600 text-white">
                    <div className="text-sm font-medium">ACOMPTE :</div>
                    <Input
                      type="number"
                      value={formData.acompte}
                      onChange={(e) => {
                        const acompte = parseFloat(e.target.value) || 0;
                        if (acompte > formData.total) return toast.error("L'acompte ne peut pas être supérieur au total");
                        setFormData({ ...formData, acompte, reste: formData.total - acompte });
                      }}
                      className="border-0 text-center font-bold h-auto p-1 bg-transparent text-white text-lg"
                      placeholder="0"
                      step="0.01"
                    />
                  </div>
                  <div className="p-3 text-center bg-blue-800 text-white">
                    <div className="text-sm font-medium">RESTE :</div>
                    <div className="font-bold text-lg">{formData.reste.toFixed(2)}€</div>
                  </div>
                </div>
              </div>

              {/* Destinataire */}
              <div className="bg-blue-600 text-white p-3 text-center font-bold">DESTINATAIRE</div>

              <div>
                <div className="flex border-b border-black">
                  <div className="w-40 p-3 text-sm font-medium border-r border-black bg-gray-50">Nom, Prénom</div>
                  <div className="flex-1 p-3">
                    <Input
                      value={formData.destinataireNom}
                      onChange={(e) => setFormData({ ...formData, destinataireNom: e.target.value })}
                      className="border-0 text-sm h-auto p-0 print:bg-transparent"
                    />
                  </div>
                </div>
                <div className="flex border-b border-black">
                  <div className="w-40 p-3 text-sm font-medium border-r border-black bg-gray-50">Adresse</div>
                  <div className="flex-1 p-3">
                    <Input
                      value={formData.destinataireAdresse}
                      onChange={(e) => setFormData({ ...formData, destinataireAdresse: e.target.value })}
                      className="border-0 text-sm h-auto p-0 print:bg-transparent"
                    />
                  </div>
                </div>
                <div className="flex border-b border-black">
                  <div className="w-40 p-3 text-sm font-medium border-r border-black bg-gray-50">Téléphone</div>
                  <div className="flex-1 p-3">
                    <Input
                      value={formData.destinataireTel}
                      onChange={(e) => setFormData({ ...formData, destinataireTel: e.target.value })}
                      className="border-0 text-sm h-auto p-0 print:bg-transparent"
                    />
                  </div>
                </div>
                <div className="flex">
                  <div className="w-40 p-3 text-sm font-medium border-r border-black bg-gray-50">E-mail</div>
                  <div className="flex-1 p-3">
                    <Input
                      value={formData.destinataireEmail}
                      onChange={(e) => setFormData({ ...formData, destinataireEmail: e.target.value })}
                      className="border-0 text-sm h-auto p-0 print:bg-transparent"
                      placeholder="destinataire@email.com"
                    />
                  </div>
                  <div className="w-40 p-3 text-right border-l border-black">
                    <div className="text-xs font-medium">SIGNATURE :</div>
                    <div className="h-12 border-b border-black mt-2"></div>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="text-xs p-3 bg-gray-50 space-y-1 leading-relaxed">
                <div>1 — Toutes marchandises non précisées sur ce document ne pourront pas être réclamées.</div>
                <div>2 — Toutes valeurs déclarées doivent être justifiées par une facture.</div>
                <div>3 — La livraison à destination est optionnelle et le montant est déterminé avant le départ.</div>
                <div>4 — Sous réserve de procédures douanières.</div>
                <div>5 — L'agence n'est pas responsable des colis non réclamés après 6 mois.</div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== Boutons (hors PDF) ====== */}
        <DialogFooter className="border-t pt-4 flex-shrink-0" data-html2canvas-ignore>
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline" disabled={!isValid || isGenerating} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                {isGenerating ? 'Génération…' : 'Imprimer'}
              </Button>
              <Button onClick={handleDownload} variant="outline" disabled={!isValid || isGenerating} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Télécharger PDF
              </Button>
              <Button onClick={handleEmail} variant="outline" disabled={!isValid} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Envoyer par e-mail
              </Button>
              <Button onClick={handleShareLink} variant="outline" disabled={!isValid} className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Lien de partage
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onClose(false)}>Annuler</Button>
              <Button onClick={handlePrint} disabled={!isValid || isGenerating} className="flex items-center gap-2">
                {isValid ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                Créer le bordereau
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BordereauDialog;
