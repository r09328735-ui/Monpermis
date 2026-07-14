# MarchéConnect — Générateur de dossier d'appel d'offres

Composant React **autonome**, prêt pour la production, qui assemble un dossier
de soumission structuré et détaillé, téléchargeable en PDF, à partir des données
de votre backend Node.js/Express (MongoDB). L'utilisateur ne saisit **rien** qui
soit déjà en base : le composant reçoit uniquement `offreId`, `userId` (et
éventuellement `authToken`) et récupère tout via l'API.

> **Règle de fidélité aux données.** Toute information affichée provient des trois
> endpoints. Lorsqu'un champ attendu est absent de la réponse, le document
> affiche explicitement **« Information non communiquée »** — jamais de texte de
> remplissage ni de donnée inventée. Les seuls textes non issus de l'API sont les
> explications **génériques** sur le rôle de chaque catégorie de pièces.

## Intégration dans votre application

```jsx
import { DossierAppelOffres } from 'marcheconnect-dossier-ao';
// ou, si vous copiez simplement le dossier src/dossier-appel-offres/ :
import { DossierAppelOffres } from './dossier-appel-offres/DossierAppelOffres.jsx';

<DossierAppelOffres
  offreId={offre._id}          // identifiant MongoDB de l'AO consulté
  userId={utilisateur._id}     // identifiant de l'abonné
  authToken={tokenJwt}         // optionnel — envoyé en Authorization: Bearer
  apiBaseUrl=""                // optionnel — préfixe API (défaut : même origine)
/>
```

`react` / `react-dom` sont des *peer dependencies* (déjà présents dans votre
app). La seule dépendance propre est **`@react-pdf/renderer`** :

```bash
npm i @react-pdf/renderer
```

Il n'y a **pas de mode démo ni de données simulées** : le composant appelle
directement les trois endpoints réels ci-dessous.

## Endpoints API attendus (à exposer côté backend)

Les chemins sont centralisés dans **`src/dossier-appel-offres/endpoints.js`** —
c'est le seul fichier à modifier pour les adapter à vos routes réelles.
Chaque requête part avec le header `Authorization: Bearer <authToken>` si la
prop est fournie.

### 1. `GET /api/offres/:offreId` — détails de l'appel d'offres

Champs **repris intégralement** dans le document (section « Détails de l'appel
d'offres »). Seuls `reference`, `intitule` et `autoriteContractante` sont
attendus ; tous les autres sont optionnels et affichés s'ils sont présents.
**Tout champ supplémentaire** que vous renverrez (non listé ici) est également
repris tel quel dans le tableau des détails.

```json
{
  "id": "665f1a2b3c4d5e6f7a8b9c0d",
  "reference": "AON/DGI/2026/007",
  "intitule": "Acquisition de matériel roulant au profit de la DGI",
  "autoriteContractante": "Ministère de l'Économie et des Finances (MEF)",
  "typeMarche": "Fournitures",
  "objet": "…",
  "description": "Fourniture, livraison et mise en service de 15 véhicules…",
  "montantEstime": "450 000 000 FCFA HT",
  "budget": "…",
  "financement": "Budget National, Gestion 2026",
  "modeSelection": "Appel d'offres national ouvert",
  "delaiExecution": "90 jours à compter de la notification",
  "allotissement": "…",
  "lots": ["Lot 1 : …", "Lot 2 : …"],
  "contraintes": ["Garantie constructeur ≥ 24 mois", "SAV dans 3 départements"],
  "conditions": "…",
  "dateOuverture": "2026-08-15T10:30:00.000Z",
  "dateLimite": "2026-08-15T10:00:00.000Z",
  "lieuDepot": "Cotonou, DNCMP"
}
```

- Les champs `montantEstime`, `financement`, `modeSelection`, `delaiExecution`,
  `contraintes`, `objet` et `description` alimentent la section rédigée
  **« Analyse du marché »** (uniquement s'ils sont présents).
- Les dates (`dateLimite`, `dateOuverture`, toute clé contenant « date ») sont
  formatées automatiquement en français.
- Les tableaux (`lots`, `contraintes`…) sont rendus en liste.

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

`telephone` et `email` sont optionnels (sinon « Information non communiquée »).

## Structure du dossier généré

1. **Page de garde** — intitulé, autorité contractante, référence, type de
   marché, date limite, lieu de dépôt, soumissionnaire.
2. **Sommaire** — généré automatiquement selon les sections réellement présentes.
3. **Détails de l'appel d'offres** — reprise **intégrale** de tous les champs
   reçus (champs absents signalés « Information non communiquée »).
4. **Analyse du marché** — texte **rédigé** (nature du marché, conditions
   économiques et procédurales, contraintes, modalités de dépôt) construit à
   partir des seules données transmises.
5. **Lettre de présentation** — plusieurs paragraphes rédigés (présentation de
   l'entreprise, référence au marché visé, engagement) + tableau d'identification.
6. **Une section par catégorie de pièces présente** — texte explicatif (rôle et
   contenu de la catégorie) suivi du tableau désignation / statut / caractère.
7. **Pièces manquantes** — section mise en évidence, incluse uniquement si des
   pièces sont en statut `a_obtenir`.
8. **Synthèse, récapitulatif et signature** — synthèse **rédigée** de l'état
   d'avancement, récapitulatif chiffré par catégorie, zone de signature.

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
src/
├── index.js                    ← point d'entrée public (barrel export)
└── dossier-appel-offres/
    ├── endpoints.js            ← ENDPOINTS À ADAPTER (seul fichier à modifier)
    ├── apiClient.js            ← client HTTP (Authorization, erreurs typées)
    ├── useDossierData.js       ← hook : 3 appels parallèles, loading/erreurs
    ├── dossierModel.js         ← assemblage + rédaction (fonctions pures)
    ├── DossierAppelOffres.jsx  ← composant principal (export par défaut)
    ├── ComplementPieces.jsx    ← complément des pièces non statuées
    ├── dossier-appel-offres.css
    └── pdf/
        └── DossierPDF.jsx      ← document PDF (@react-pdf/renderer)
```
