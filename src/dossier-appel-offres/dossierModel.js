/**
 * Modèle du dossier : normalisation des données API et assemblage
 * de la structure du document (sections réellement présentes, sommaire,
 * pièces manquantes, récapitulatif). Aucune dépendance React ici —
 * fonctions pures, testables isolément.
 */

/** Catégories de pièces, dans l'ordre d'apparition dans le dossier. */
export const CATEGORIES = [
  { code: 'administrative', titre: 'Pièces administratives' },
  { code: 'financiere', titre: 'Pièces financières' },
  { code: 'technique', titre: 'Pièces techniques' },
  { code: 'offre', titre: "Pièces de l'offre" },
];

/** Statuts possibles d'une pièce. `non_statuee` = statut absent en base. */
export const STATUTS = {
  disponible: { code: 'disponible', label: 'Disponible', couleur: '#15803d' },
  a_obtenir: { code: 'a_obtenir', label: 'À obtenir', couleur: '#b45309' },
  a_verifier: { code: 'a_verifier', label: 'À vérifier', couleur: '#1d4ed8' },
  non_statuee: { code: 'non_statuee', label: 'Non statuée', couleur: '#6b7280' },
};

/** Ramène un statut brut de l'API vers un code connu. */
export function normaliserStatut(statut) {
  if (!statut) return 'non_statuee';
  const code = String(statut)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents ("à obtenir" → "a obtenir")
    .replace(/[\s-]+/g, '_');
  return STATUTS[code] ? code : 'non_statuee';
}

/** Normalise une pièce reçue de l'API (champs manquants, statuts libres…). */
export function normaliserPiece(piece, index) {
  return {
    id: piece.id ?? piece._id ?? `piece-${index}`,
    designation: piece.designation ?? piece.libelle ?? 'Pièce sans intitulé',
    categorie: CATEGORIES.some((c) => c.code === piece.categorie)
      ? piece.categorie
      : 'administrative',
    statut: normaliserStatut(piece.statut),
    obligatoire: piece.obligatoire !== false,
    commentaire: piece.commentaire ?? '',
  };
}

/** Formate une date ISO en français ("15 août 2026"). */
export function formaterDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Assemble la structure complète du dossier à partir des trois réponses API
 * (+ éventuels compléments de statut saisis par l'utilisateur pour les
 * pièces non statuées — jamais pour des données déjà en base).
 *
 * @param {object} offre        Réponse GET /api/offres/:id
 * @param {Array}  pieces       Réponse GET /api/dossiers/:offreId/pieces
 * @param {object} profil       Réponse GET /api/utilisateurs/:id/profil-entreprise
 * @param {object} [complements] { [pieceId]: statutChoisi } pour les pièces non statuées
 * @returns structure prête à être rendue (aperçu et PDF)
 */
export function construireDossier(offre, pieces, profil, complements = {}) {
  const piecesNormalisees = (pieces || []).map(normaliserPiece).map((p) =>
    // Le complément utilisateur ne s'applique qu'aux pièces NON statuées en base.
    p.statut === 'non_statuee' && complements[p.id]
      ? { ...p, statut: normaliserStatut(complements[p.id]), complement: true }
      : p
  );

  // Une section par catégorie réellement présente dans les données.
  const sectionsCategories = CATEGORIES.map((cat) => ({
    ...cat,
    pieces: piecesNormalisees.filter((p) => p.categorie === cat.code),
  })).filter((s) => s.pieces.length > 0);

  const piecesManquantes = piecesNormalisees.filter((p) => p.statut === 'a_obtenir');
  const piecesNonStatuees = piecesNormalisees.filter((p) => p.statut === 'non_statuee');

  // Sommaire généré automatiquement selon les sections présentes.
  const sommaire = [
    { titre: 'Lettre de présentation' },
    ...sectionsCategories.map((s) => ({ titre: s.titre })),
    ...(piecesManquantes.length > 0 ? [{ titre: 'Pièces manquantes — à obtenir' }] : []),
    { titre: 'Récapitulatif et signature' },
  ].map((entree, i) => ({ ...entree, numero: i + 1 }));

  // Récapitulatif par catégorie pour la page de clôture.
  const recap = sectionsCategories.map((s) => ({
    categorie: s.titre,
    total: s.pieces.length,
    disponibles: s.pieces.filter((p) => p.statut === 'disponible').length,
    aObtenir: s.pieces.filter((p) => p.statut === 'a_obtenir').length,
  }));

  return {
    offre: {
      reference: offre?.reference ?? '—',
      intitule: offre?.intitule ?? "Appel d'offres",
      autoriteContractante: offre?.autoriteContractante ?? '—',
      typeMarche: offre?.typeMarche ?? '',
      dateLimite: offre?.dateLimite ?? null,
      lieuDepot: offre?.lieuDepot ?? '',
    },
    entreprise: {
      raisonSociale: profil?.raisonSociale ?? '—',
      ifu: profil?.ifu ?? '—',
      rccm: profil?.rccm ?? '—',
      adresse: profil?.adresse ?? '—',
      telephone: profil?.telephone ?? '',
      email: profil?.email ?? '',
      signataire: {
        nom: profil?.signataire?.nom ?? '—',
        fonction: profil?.signataire?.fonction ?? '',
      },
    },
    sectionsCategories,
    piecesManquantes,
    piecesNonStatuees,
    sommaire,
    recap,
    totalPieces: piecesNormalisees.length,
    dateGeneration: new Date(),
  };
}
