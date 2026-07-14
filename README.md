# MarchéConnect — Générateur de dossier d'appel d'offres

Composant React **autonome** qui assemble un dossier de soumission structuré et
téléchargeable en PDF, à partir des données de votre backend Node.js/Express
(MongoDB). L'utilisateur ne saisit **rien** qui soit déjà en base : le composant
reçoit uniquement `offreId` et `userId` et récupère tout via l'API.

## Démarrage rapide (démo avec API simulée)

```bash
npm install
npm run dev
```

Ouvrez l'URL affichée : la démo monte le composant avec un `fetch` mocké
(`src/demo/mockFetch.js`) et des données réalistes.

## Intégration dans votre application

```jsx
import { DossierAppelOffres } from './dossier-appel-offres/DossierAppelOffres.jsx';

<DossierAppelOffres
  offreId={offre._id}          // identifiant MongoDB de l'AO consulté
  userId={utilisateur._id}     // identifiant de l'abonné
  authToken={tokenJwt}         // optionnel — envoyé en Authorization: Bearer
  apiBaseUrl=""                // optionnel — préfixe API (défaut : même origine)
/>
```

Dépendance à installer dans votre app : `npm i @react-pdf/renderer`
(le reste est du React standard). Copiez simplement le dossier
`src/dossier-appel-offres/` dans votre projet.

## Endpoints API attendus (à exposer côté backend)

Les chemins sont centralisés dans **`src/dossier-appel-offres/endpoints.js`** —
c'est le seul fichier à modifier pour les adapter à vos routes réelles.
Chaque requête part avec le header `Authorization: Bearer <authToken>` si la
prop est fournie.

### 1. `GET /api/offres/:offreId` — détails de l'appel d'offres

```json
{
  "id": "665f1a2b3c4d5e6f7a8b9c0d",
  "reference": "AON/DGI/2026/007",
  "intitule": "Acquisition de matériel roulant au profit de la DGI",
  "autoriteContractante": "Ministère de l'Économie et des Finances (MEF)",
  "typeMarche": "Fournitures",
  "dateLimite": "2026-08-15T10:00:00.000Z",
  "lieuDepot": "Cotonou, DNCMP"
}
```

`typeMarche` et `lieuDepot` sont optionnels.

### 2. `GET /api/dossiers/:offreId/pieces` — pièces exigées (déjà extraites)

```json
{
  "offreId": "665f1a2b3c4d5e6f7a8b9c0d",
  "pieces": [
    {
      "id": "p-001",
      "designation": "Attestation fiscale (IFU à jour)",
      "categorie": "administrative",
      "statut": "disponible",
      "obligatoire": true,
      "commentaire": "Valide jusqu'au 31/12/2026"
    }
  ]
}
```

- `categorie` : `administrative` | `financiere` | `technique` | `offre`
- `statut` : `disponible` | `a_obtenir` | `a_verifier` | `null` (non statuée).
  Les variantes accentuées/espacées (« à obtenir ») sont normalisées côté client.
- `obligatoire` (optionnel, défaut `true`) et `commentaire` (optionnel).
- Une réponse qui est directement un tableau `[ …pieces ]` est aussi acceptée.

### 3. `GET /api/utilisateurs/:userId/profil-entreprise` — profil de l'abonné

```json
{
  "raisonSociale": "BTP SAHEL SARL",
  "ifu": "3202300456789",
  "rccm": "RB/COT/24 B 12345",
  "adresse": "Lot 45, Quartier Fidjrossè, Cotonou",
  "telephone": "+229 97 00 00 00",
  "email": "contact@btpsahel.bj",
  "signataire": { "nom": "Ayaba HOUNKPATIN", "fonction": "Directrice Générale" }
}
```

`telephone` et `email` sont optionnels.

## Structure du dossier généré

1. **Page de garde** — intitulé du marché, autorité contractante, référence,
   date limite, soumissionnaire, date d'assemblage.
2. **Sommaire** — généré automatiquement selon les sections réellement présentes.
3. **Lettre de présentation** — pré-remplie avec les données de l'entreprise
   (raison sociale, IFU, RCCM, adresse, signataire).
4. **Une section par catégorie de pièces présente** — tableau désignation /
   statut / caractère obligatoire.
5. **Pièces manquantes** — section mise en évidence, incluse uniquement si des
   pièces sont en statut `a_obtenir`.
6. **Page de clôture** — récapitulatif par catégorie et zone de signature.

Le PDF (A4) comporte en-tête (référence + soumissionnaire), pied de page avec
numérotation `Page X / Y`, et marges professionnelles (~2 cm).

## Comportement

- **Chargement** : les trois appels partent en parallèle ; un spinner s'affiche.
- **Erreur** : chaque appel en échec est identifié par un message précis
  (endpoint + code HTTP), avec bouton « Réessayer ».
- **Complément facultatif** : seules les pièces **non statuées en base**
  (`statut: null`) peuvent recevoir un statut saisi par l'utilisateur — jamais
  les données déjà disponibles côté serveur.
- **Prévisualisation** : le dossier assemblé est affiché page par page dans une
  visionneuse PDF intégrée, mise à jour en direct.
- **Export** : bouton de téléchargement, nom de fichier
  `dossier-<référence>.pdf`.

## Arborescence

```
src/dossier-appel-offres/
├── endpoints.js            ← ENDPOINTS À ADAPTER (seul fichier à modifier)
├── apiClient.js            ← client HTTP (Authorization, erreurs typées)
├── useDossierData.js       ← hook : 3 appels parallèles, loading/erreurs
├── dossierModel.js         ← assemblage du dossier (fonctions pures)
├── DossierAppelOffres.jsx  ← composant principal (export par défaut)
├── ComplementPieces.jsx    ← complément des pièces non statuées
├── dossier-appel-offres.css
└── pdf/
    └── DossierPDF.jsx      ← document PDF (@react-pdf/renderer)
```
