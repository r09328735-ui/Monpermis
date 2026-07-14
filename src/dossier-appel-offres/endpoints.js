/**
 * ============================================================================
 *  ENDPOINTS API ATTENDUS — À ADAPTER À VOS ROUTES RÉELLES
 * ============================================================================
 *
 *  C'est le SEUL fichier à modifier pour brancher le composant sur votre
 *  backend Node.js/Express existant. Les trois appels sont des GET simples ;
 *  le token d'authentification (prop `authToken`) est envoyé en header
 *  `Authorization: Bearer <token>` sur chaque requête.
 *
 * ----------------------------------------------------------------------------
 *  1) DÉTAILS DE L'APPEL D'OFFRES
 * ----------------------------------------------------------------------------
 *  GET /api/offres/:offreId
 *
 *  Réponse JSON attendue :
 *  {
 *    "id":                  "665f1a2b3c4d5e6f7a8b9c0d",
 *    "reference":           "AON/DGI/2026/007",
 *    "intitule":            "Acquisition de matériel roulant au profit de la DGI",
 *    "autoriteContractante":"Ministère de l'Économie et des Finances (MEF)",
 *    "typeMarche":          "Fournitures",              // optionnel
 *    "dateLimite":          "2026-08-15T10:00:00.000Z", // ISO 8601
 *    "lieuDepot":           "Cotonou, DNCMP"            // optionnel
 *  }
 *
 * ----------------------------------------------------------------------------
 *  2) PIÈCES EXIGÉES (déjà extraites côté serveur)
 * ----------------------------------------------------------------------------
 *  GET /api/dossiers/:offreId/pieces
 *
 *  Réponse JSON attendue :
 *  {
 *    "offreId": "665f1a2b3c4d5e6f7a8b9c0d",
 *    "pieces": [
 *      {
 *        "id":          "p-001",
 *        "designation": "Attestation fiscale (IFU à jour)",
 *        "categorie":   "administrative",  // administrative | financiere | technique | offre
 *        "statut":      "disponible",      // disponible | a_obtenir | a_verifier | null (non statuée)
 *        "obligatoire": true,              // optionnel, défaut true
 *        "commentaire": "Valide jusqu'au 31/12/2026" // optionnel
 *      }
 *    ]
 *  }
 *
 *  NB : une réponse qui est directement un tableau `[ ...pieces ]` (sans
 *  l'enveloppe { pieces }) est également acceptée par le client.
 *
 * ----------------------------------------------------------------------------
 *  3) PROFIL ENTREPRISE DE L'UTILISATEUR (déjà enregistré)
 * ----------------------------------------------------------------------------
 *  GET /api/utilisateurs/:userId/profil-entreprise
 *
 *  Réponse JSON attendue :
 *  {
 *    "raisonSociale": "BTP SAHEL SARL",
 *    "ifu":           "3202300456789",
 *    "rccm":          "RB/COT/24 B 12345",
 *    "adresse":       "Lot 45, Quartier Fidjrossè, Cotonou",
 *    "telephone":     "+229 97 00 00 00",   // optionnel
 *    "email":         "contact@btpsahel.bj",// optionnel
 *    "signataire": {
 *      "nom":      "Ayaba HOUNKPATIN",
 *      "fonction": "Directrice Générale"
 *    }
 *  }
 * ============================================================================
 */

export const ENDPOINTS = {
  /** GET — détails de l'appel d'offres */
  offre: (offreId) => `/api/offres/${encodeURIComponent(offreId)}`,

  /** GET — liste des pièces exigées pour cet AO */
  pieces: (offreId) => `/api/dossiers/${encodeURIComponent(offreId)}/pieces`,

  /** GET — profil entreprise de l'abonné */
  profilEntreprise: (userId) =>
    `/api/utilisateurs/${encodeURIComponent(userId)}/profil-entreprise`,
};
