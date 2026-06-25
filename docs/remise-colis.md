# Remise des colis au destinataire (« Remis »)

> Spécification à implémenter plus tard. Ce document décrit l'état actuel,
> les options retenues et le plan d'implémentation pour pouvoir marquer un
> **shipment comme « Remis »** lorsque le destinataire récupère ses colis.

## 1. Besoin

Pouvoir passer un **shipment** à l'état **« Remis au destinataire »** au
moment où la personne vient récupérer ses colis (typiquement au point de
retrait au Burkina Faso). Idéalement, enregistrer **qui** a récupéré et
**quand**.

## 2. État actuel du modèle (constats)

- Le modèle `Shipment` (`prisma/schema.prisma`, ~ lignes 679-722) **n'a pas
  de statut logistique propre** (pas d'enum `ShipmentStatus`). Son seul
  statut est `paymentStatus` (PENDING / PARTIAL / PAID / CANCELLED / REFUNDED).
- Le statut logistique est aujourd'hui **implicite**, porté par :
  - `Container.status` — enum `ContainerStatus` (PREPARATION, LOADED,
    IN_TRANSIT, CUSTOMS, DELIVERED, CANCELLED) ;
  - `Package.status` — enum `PackageStatus` (REGISTERED, COLLECTED,
    IN_CONTAINER, IN_TRANSIT, CUSTOMS, **DELIVERED**, RETURNED, CANCELLED).
- **`DELIVERED` existe déjà** au niveau du colis (`Package`).
- **Aucun champ** `deliveredAt`, `deliveredBy`, `receivedBy`, `handedOverAt`
  n'existe sur `Shipment` ni sur `Package`.

### Fichiers clés (références)

| Rôle | Fichier |
|------|---------|
| Modèle Shipment + enums | `prisma/schema.prisma` (Shipment 679-722 ; enums 202-228) |
| API maj statut colis | `src/app/api/packages/[id]/status/route.js` (`PATCH`, valide DELIVERED) |
| API maj shipment | `src/app/api/shipments/[id]/route.js` (`PUT`, paiement + champs) |
| Liste shipments | `src/components/modules/admin/shipments/shipments-table.jsx` |
| Colonnes / badges | `src/components/modules/admin/shipments/shipments-columns.jsx` (16-38) |
| Détail shipment | `src/components/modules/admin/shipments/shipment-detail.jsx` |
| Dialog paiement | `src/components/modules/admin/shipments/shipment-edit-dialog.jsx` |
| Hooks | `src/hooks/use-shipments.js` (`useShipmentMutations`, `useShipmentDetails`) |
| Badge statut colis | `src/components/modules/admin/packages/packages-columns.jsx` (16-54) |

## 3. Deux approches possibles

### Approche A — Champ dédié sur Shipment (recommandée, propre & traçable)

Ajouter au modèle `Shipment` :

```prisma
model Shipment {
  // ...
  deliveredAt DateTime?   // date/heure de remise
  receivedBy  String?     // nom de la personne qui récupère
  deliveredBy String?     // id/nom de l'agent qui remet
  // ...
}
```

- État « Remis » = `deliveredAt != null`.
- **Nécessite une migration Prisma** (`prisma migrate dev --name shipment_delivery`)
  à appliquer sur la base au déploiement.
- Avantages : traçabilité (qui / quand), filtrable, badge dédié.

### Approche B — Réutiliser les colis livrés (sans migration)

- « Remettre » = passer **tous les colis** du shipment au statut
  `DELIVERED` (déjà existant) via l'API `PATCH /api/packages/[id]/status`.
- Le shipment s'affiche **« Remis »** quand **tous** ses colis sont `DELIVERED`
  (statut dérivé, calculé côté front/back).
- Avantages : aucune migration, marche immédiatement.
- Limite : ne stocke pas **qui** a récupéré ni l'horodatage de remise précis
  (sauf à le mettre dans une note).

> Décision restée ouverte (question posée, non tranchée). À fixer avant
> implémentation.

## 4. Plan d'implémentation (si Approche A)

1. **Schéma** : ajouter `deliveredAt`, `receivedBy`, `deliveredBy` à `Shipment`
   + migration Prisma.
2. **API** : nouvelle route `POST /api/shipments/[id]/deliver`
   - body : `{ receivedBy, deliveredAt? }`
   - renseigne `deliveredAt` (par défaut = maintenant), `receivedBy`,
     `deliveredBy = session.user.id` ;
   - option : passer aussi tous les `packages` du shipment à `DELIVERED` ;
   - crée une entrée d'audit log ;
   - (option) notifie le client par SMS.
3. **Hook** : ajouter `markDelivered(shipmentId, data)` dans
   `src/hooks/use-shipments.js`.
4. **UI** :
   - bouton **« Marquer comme remis »** dans `shipment-detail.jsx`
     (et/ou action dans le dropdown de `shipments-table.jsx`) ;
   - dialog de remise (composants **floating-label**, sans gradient, bouton
     vert `#0E7A34`) avec champ « Nom du destinataire qui récupère » + date ;
   - badge **« Remis »** (vert) dans les colonnes / le détail quand
     `deliveredAt` est renseigné ;
   - filtre « Remis » dans la liste.
5. **Cohérence visuelle** : rester épuré (neutre + vert/or en accent, pas de
   dégradé).

## 5. Plan d'implémentation (si Approche B)

1. **UI** : bouton « Marquer comme remis » → confirme, puis boucle
   `PATCH /api/packages/[id]/status { status: "DELIVERED" }` sur tous les colis.
2. **Statut dérivé** : helper `isShipmentRemis(shipment)` = tous les colis
   `DELIVERED`. Afficher badge « Remis ».
3. (option) Stocker le nom du destinataire dans `Shipment.notes`.

## 6. Points à trancher avant de coder

- [ ] Approche A (champ dédié + migration) **ou** B (réutiliser DELIVERED) ?
- [ ] Enregistre-t-on le **nom du destinataire** + date de remise, ou juste
      l'état ?
- [ ] La remise du shipment doit-elle **forcer tous les colis** à `DELIVERED` ?
- [ ] Notifier le client (SMS) à la remise ?
