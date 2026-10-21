# Tarifs : une seule grille de prix

Écran **Gestion → Tarifs** (`/admin/pricing`, administrateur seulement).
Maquette : `maquettes/tarifs/index.html`.

## Qui lit la grille

| Endroit | Ce qu'il lit |
| --- | --- |
| Caisse (`/admin/caisse/commande`) | articles « Proposé à la caisse », prix Région parisienne, photo |
| Formulaire de colis (Nouvelle expédition) | mêmes articles, prix Région parisienne ou Province, photo |
| Liste des colis, statistiques de la caisse | le nom de l'article (articles retirés compris) |
| Site public, grille de la page d'accueil | articles « Affiché sur le site », une carte par catégorie ; l'enlèvement en une ligne sous la grille |

Tout passe par `src/hooks/use-pricing.js` (écrans) et `src/lib/pricing-public.js`
(page d'accueil). Les règles communes (format « 120 € / 160 € », « dès 280 € »,
« Sur devis », tri, validation) sont dans `src/lib/data/pricing-catalog.js`.

**Repli** : si la table ne répond pas (base injoignable, migration pas encore
appliquée), la caisse et le formulaire reprennent la liste de
`src/lib/data/packages.js`, et le site sa grille d'origine. Rien ne reste vide.

## Données

Table `pricings` (modèle `Pricing`). Colonnes ajoutées par la migration
`20261021120000_pricing_catalog` : `category`, `sortOrder`, `priceMode`
(`FIXED`, `FROM`, `QUOTE`), `priceProvince`, `imageUrl`, `imageKey`,
`showOnWebsite`, `updatedByName`. `isActive` veut dire « proposé à la caisse ».

La migration remplit la table avec les **prix de la caisse** au 21/10/2026
(55 articles). Une ligne déjà réglée n'est jamais écrasée ; seules les lignes
d'essai de `scripts/seed.js` (sans catégorie) sont remises à jour.

⚠️ À la mise en ligne, la grille du site prend les prix de la caisse. Onze prix
du site d'avant étaient différents (cartons en Province, vins et champagnes,
cantines, groupe électrogène) : à vérifier dans l'écran Tarifs.

Les colis gardent le prix de leur enregistrement : modifier un tarif ne touche
pas l'historique.

**Ajouter un article** : le type d'un colis est rangé en JSON (`packages.types`),
pas dans une liste fermée de la base. Un article ajouté reçoit un code dérivé
de son nom (`TROTTINETTE_ELECTRIQUE`) ; la route `/api/packages` accepte tout
code présent dans la table.

## Photos : Cloudflare R2

La photo est réduite dans le navigateur (WebP, 800 px, environ 20 à 50 Ko),
envoyée à `/api/pricing/[id]/image`, qui la dépose dans R2. Seule son adresse
est gardée en base. Remplacer ou retirer une photo efface l'ancien fichier.

Tant que R2 n'est pas branché, le dialogue le dit et la colonne photo n'apparaît
pas. Pour le brancher :

1. Cloudflare → R2 → créer un bucket (ex. `naange-photos`).
2. Lui donner une adresse publique : un sous-domaine du site si le domaine est
   chez Cloudflare, sinon l'adresse `r2.dev`.
3. R2 → Gérer les jetons d'API → droits « lecture et écriture » sur ce bucket.
4. Vercel → variables d'environnement : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` (l'adresse publique de
   l'étape 2), puis redéployer.

## Routes

| Route | Qui | Rôle |
| --- | --- | --- |
| `GET /api/pricing` | toute session | la grille, triée ; `photoStorageReady` |
| `POST /api/pricing` | administrateur | ajouter un article |
| `PUT /api/pricing/[id]` | administrateur | modifier (champ absent = inchangé) |
| `POST`/`DELETE /api/pricing/[id]/image` | administrateur | photo (503 si R2 n'est pas branché) |

Chaque écriture régénère la page d'accueil (`revalidatePath("/")`), qui se
régénère aussi d'elle-même toutes les heures.
