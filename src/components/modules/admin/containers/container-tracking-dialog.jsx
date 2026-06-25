"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SelectItem } from "@/components/ui/select";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { FloatingLabelTextarea } from "@/components/ui/floating-label-textarea";
import { Loader2, MapPin, Bell, BellOff, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useContainerMutations } from "@/hooks/use-containers";

const statusOptions = [
  { value: "PREPARATION", label: "En préparation" },
  { value: "LOADED", label: "Chargé" },
  { value: "IN_TRANSIT", label: "En transit" },
  { value: "CUSTOMS", label: "En douane" },
  { value: "DELIVERED", label: "Livré" },
  { value: "CANCELLED", label: "Annulé" },
];

/**
 * Dialog de suivi : met à jour la localisation + (optionnellement) le statut
 * du conteneur, ajoute une entrée d'historique et notifie les clients.
 */
export function ContainerTrackingDialog({ container, isOpen, onClose, onUpdated }) {
  const { updateContainer } = useContainerMutations();
  const [form, setForm] = useState({
    location: "",
    description: "",
    status: "", // pas de présélection
    isPublic: true,
    notifyClients: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (container) {
      setForm({
        location: container.currentLocation || "",
        description: "",
        status: "", // pas de présélection du statut
        isPublic: true,
        notifyClients: false,
      });
    }
  }, [container, isOpen]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!container) return;
    if (!form.location || !form.description) {
      toast.error("Localisation et description obligatoires");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/containers/${container.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: form.location,
          description: form.description,
          isPublic: form.isPublic,
          notifyClients: form.notifyClients,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "Erreur lors de la mise à jour");
      }
      const data = await res.json().catch(() => ({}));

      // Mise à jour du statut seulement si un statut a été choisi et qu'il change
      if (form.status && form.status !== container.status) {
        await updateContainer(container.id, {
          status: form.status,
          currentLocation: form.location,
        });
      }

      if (form.notifyClients && data.notificationResult) {
        const { success, total } = data.notificationResult;
        toast.success(`Mise à jour enregistrée — ${success}/${total} SMS envoyés`);
      } else {
        toast.success("Mise à jour enregistrée");
      }

      onUpdated?.();
      onClose?.();
    } catch (err) {
      toast.error(err.message || "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#0E7A34]" />
            Suivi — {container?.containerNumber}
          </DialogTitle>
          <DialogDescription>
            Mettez à jour la localisation et le statut du conteneur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FloatingLabelInput
            id="track-location"
            label="Localisation *"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            disabled={submitting}
            placeholder="Port d'Abidjan, Côte d'Ivoire"
          />

          <FloatingLabelSelect
            id="track-status"
            label="Nouveau statut (optionnel)"
            value={form.status}
            onValueChange={(v) => set("status", v)}
            disabled={submitting}
          >
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </FloatingLabelSelect>

          <FloatingLabelTextarea
            id="track-desc"
            label="Description *"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            disabled={submitting}
          />

          <div className="flex items-center justify-between">
            <Label htmlFor="track-public" className="flex items-center gap-2 text-sm">
              {form.isPublic ? (
                <Eye className="h-4 w-4 text-green-500" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              Visible par les clients
            </Label>
            <Switch
              id="track-public"
              checked={form.isPublic}
              onCheckedChange={(c) => set("isPublic", c)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="track-notify" className="flex items-center gap-2 text-sm">
              {form.notifyClients ? (
                <Bell className="h-4 w-4 text-blue-500" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              Notifier les clients (SMS)
            </Label>
            <Switch
              id="track-notify"
              checked={form.notifyClients}
              onCheckedChange={(c) => set("notifyClients", c)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !form.location || !form.description}
            className="bg-[#0E7A34] hover:bg-[#0B5C28] text-white"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ContainerTrackingDialog;
