/**
 * Modèle du dossier : normalisation des données API et assemblage
 * de la structure du document (sections réellement présentes, sommaire,
 * pièces manquantes, récapitulatif). Aucune dépendance React ici —
 * fonctions pures, testables isolément.
 *
 * RÈGLE STRICTE : toute valeur affichée provient des réponses API. Lorsqu'un
 * champ attendu est absent, on renvoie explicitement `INFO_ABSENTE` plutôt que
 * d'inventer ou de généraliser. Les seuls textes non issus de l'API sont les
 * explications GÉNÉRIQUES sur le rôle de chaque catégorie de pièces (demandées
 * par le cahier des charges), qui ne contiennent aucune donnée propre au marché.
 */

/** Valeur affichée lorsqu'une information n'est pas fournie par l'API. */
export const INFO_ABSENTE = 'Information non communiquée';

/**
 * Catégories de pièces, dans l'ordre d'apparition dans le dossier.
 * `role` / `contenu` : explications génériques (non issues de l'API) affichées
 * en tête de chaque section pour expliciter l'objet de la catégorie.
 */
export const CATEGORIES = [
  {
    code: 'administrative',
    titre: 'Pièces administratives',
    role:
      "Les pièces administratives établissent l'existence légale du soumissionnaire " +
      "et sa régularité vis-à-vis de ses obligations déclaratives, fiscales et sociales. " +
      "Elles conditionnent la recevabilité même de l'offre : une pièce administrative " +
      "manquante ou périmée entraîne généralement le rejet du dossier avant tout examen " +
      "technique ou financier.",
    contenu:
      "On y retrouve habituellement le Registre du Commerce et du Crédit Mobilier (RCCM), " +
      "l'Identifiant Fiscal Unique (IFU), les attestations fiscale et de sécurité sociale, " +
      "les quitus et les déclarations sur l'honneur exigés par le dossier d'appel d'offres.",
  },
  {
    code: 'financiere',
    titre: 'Pièces financières',
    role:
      "Les pièces financières démontrent la capacité du soumissionnaire à assumer les " +
      "engagements financiers du marché et sa solidité économique. Elles permettent à " +
      "l'autorité contractante de s'assurer que l'entreprise dispose des ressources " +
      "nécessaires à la bonne exécution des prestations.",
    contenu:
      "Elles comprennent généralement les états financiers certifiés des derniers exercices, " +
      "une attestation de chiffre d'affaires, une ligne de crédit ou une attestation de " +
      "capacité financière, ainsi que la caution de soumission lorsqu'elle est exigée.",
  },
  {
    code: 'technique',
    titre: 'Pièces techniques',
    role:
      "Les pièces techniques attestent de l'expérience et des moyens dont dispose le " +
      "soumissionnaire pour exécuter le marché conformément au cahier des charges. Elles " +
      "servent à évaluer la qualification technique et la crédibilité opérationnelle de l'offre.",
    contenu:
      "Elles regroupent notamment les références de marchés similaires, les curriculum vitae " +
      "du personnel clé, la liste des moyens matériels et logistiques, les certifications " +
      "éventuelles et la méthodologie d'exécution proposée.",
  },
  {
    code: 'offre',
    titre: "Pièces de l'offre",
    role:
      "Les pièces de l'offre constituent la proposition commerciale et technique proprement " +
      "dite, celle qui sera comparée à celle des autres soumissionnaires lors de l'évaluation. " +
      "Elles engagent le soumissionnaire sur les prix et les prestations proposés.",
    contenu:
      "Elles incluent le plus souvent le bordereau des prix unitaires, le devis quantitatif " +
      "et estimatif, le mémoire technique et tout document chiffrant ou décrivant précisément " +
      "la prestation proposée.",
  },
];

/** Statuts possibles d'une pièce. `non_statuee` = statut absent en base. */
export const STATUTS = {
  disponible: { code: 'disponible', label: 'Disponible', couleur: '#15803d' },
  a_obtenir: { code: 'a_obtenir', label: 'À obtenir', couleur: '#b45309' },
  a_verifier: { code: 'a_verifier', label: 'À vérifier', couleur: '#1d4ed8' },
  non_statuee: { code: 'non_statuee', label: 'Non statuée', couleur: '#6b7280' },
};

/**
 * Libellés et ordre d'affichage des champs de l'appel d'offres.
 * Les champs reçus mais inconnus de cette table sont tout de même affichés
 * (clé « humanisée »), afin de reprendre INTÉGRALEMENT la réponse de l'API.
 */
const LABELS_OFFRE = {
  reference: 'Référence',
  intitule: 'Intitulé du marché',
  objet: 'Objet du marché',
  description: 'Description',
  autoriteContractante: 'Autorité contractante',
  typeMarche: 'Type de marché',
  montantEstime: 'Montant estimé',
  budget: 'Budget prévisionnel',
  financement: 'Source de financement',
  modeSelection: 'Mode de sélection',
  delaiExecution: "Délai d'exécution",
  allotissement: 'Allotissement',
  lots: 'Lots',
  contraintes: 'Contraintes particulières',
  conditions: 'Conditions de participation',
  dateLimite: 'Date limite de dépôt',
  dateOuverture: "Date d'ouverture des plis",
  lieuDepot: 'Lieu de dépôt',
};

const ORDRE_OFFRE = [
  'reference',
  'intitule',
  'objet',
  'description',
  'autoriteContractante',
  'typeMarche',
  'montantEstime',
  'budget',
  'financement',
  'modeSelection',
  'delaiExecution',
  'allotissement',
  'lots',
  'contraintes',
  'conditions',
  'dateOuverture',
  'dateLimite',
  'lieuDepot',
];

/** Clés techniques à ne pas afficher dans le tableau des détails. */
const CLES_TECHNIQUES = new Set(['id', '_id', 'offreId', '__v', 'createdAt', 'updatedAt']);

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
  if (!iso) return INFO_ABSENTE;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Humanise une clé camelCase inconnue ("delaiExecution" → "Délai execution"). */
function humaniserCle(cle) {
  const mots = cle
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .trim();
  return mots.charAt(0).toUpperCase() + mots.slice(1);
}

/** Rend une valeur brute d'offre en chaîne affichable (ou INFO_ABSENTE). */
function formaterValeurOffre(cle, valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return INFO_ABSENTE;
  if (Array.isArray(valeur)) {
    return valeur.length ? valeur.map((v) => `• ${formaterValeurOffre(cle, v)}`).join('\n') : INFO_ABSENTE;
  }
  if (/date/i.test(cle) && typeof valeur === 'string') return formaterDate(valeur);
  if (typeof valeur === 'object') {
    return Object.entries(valeur)
      .map(([k, v]) => `${humaniserCle(k)} : ${formaterValeurOffre(k, v)}`)
      .join('\n');
  }
  return String(valeur);
}

/**
 * Construit la liste ORDONNÉE et INTÉGRALE des champs de l'offre pour l'affichage.
 * Tous les champs connus (même absents → INFO_ABSENTE) puis tous les champs
 * supplémentaires réellement reçus mais non répertoriés (repris tels quels).
 */
function extraireChampsOffre(offre = {}) {
  const source = offre || {};
  const champs = [];

  // 1) Champs répertoriés, dans l'ordre défini (absents → INFO_ABSENTE).
  for (const cle of ORDRE_OFFRE) {
    champs.push({
      cle,
      label: LABELS_OFFRE[cle],
      valeur: formaterValeurOffre(cle, source[cle]),
      fourni: source[cle] !== null && source[cle] !== undefined && source[cle] !== '',
    });
  }

  // 2) Champs supplémentaires reçus de l'API mais non répertoriés (repris tels quels).
  for (const cle of Object.keys(source)) {
    if (ORDRE_OFFRE.includes(cle) || CLES_TECHNIQUES.has(cle)) continue;
    champs.push({
      cle,
      label: LABELS_OFFRE[cle] || humaniserCle(cle),
      valeur: formaterValeurOffre(cle, source[cle]),
      fourni: true,
    });
  }

  return champs;
}

/** `valeur` si présente, sinon INFO_ABSENTE (pour usage direct en prose). */
function ou(valeur) {
  return valeur === null || valeur === undefined || valeur === '' ? INFO_ABSENTE : valeur;
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
  const src = offre || {};

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
  const piecesAVerifier = piecesNormalisees.filter((p) => p.statut === 'a_verifier');
  const piecesDisponibles = piecesNormalisees.filter((p) => p.statut === 'disponible');

  // Sommaire généré automatiquement selon les sections réellement présentes.
  const sommaire = [
    { titre: "Détails de l'appel d'offres" },
    { titre: 'Analyse du marché' },
    { titre: 'Lettre de présentation' },
    ...sectionsCategories.map((s) => ({ titre: s.titre })),
    ...(piecesManquantes.length > 0 ? [{ titre: 'Pièces manquantes — à obtenir' }] : []),
    { titre: 'Synthèse, récapitulatif et signature' },
  ].map((entree, i) => ({ ...entree, numero: i + 1 }));

  // Récapitulatif chiffré par catégorie pour la page de clôture.
  const recap = sectionsCategories.map((s) => ({
    categorie: s.titre,
    total: s.pieces.length,
    disponibles: s.pieces.filter((p) => p.statut === 'disponible').length,
    aObtenir: s.pieces.filter((p) => p.statut === 'a_obtenir').length,
  }));

  return {
    offre: {
      reference: ou(src.reference),
      intitule: ou(src.intitule),
      autoriteContractante: ou(src.autoriteContractante),
      typeMarche: ou(src.typeMarche),
      dateLimite: src.dateLimite ?? null,
      lieuDepot: ou(src.lieuDepot),
      // Champs libres éventuels utilisés par l'analyse (jamais inventés).
      objet: src.objet ?? null,
      description: src.description ?? null,
      montantEstime: src.montantEstime ?? null,
      financement: src.financement ?? null,
      modeSelection: src.modeSelection ?? null,
      delaiExecution: src.delaiExecution ?? null,
      contraintes: src.contraintes ?? null,
      // Reprise INTÉGRALE et ordonnée de tous les champs reçus.
      champs: extraireChampsOffre(src),
    },
    entreprise: {
      raisonSociale: ou(profil?.raisonSociale),
      ifu: ou(profil?.ifu),
      rccm: ou(profil?.rccm),
      adresse: ou(profil?.adresse),
      telephone: ou(profil?.telephone),
      email: ou(profil?.email),
      signataire: {
        nom: ou(profil?.signataire?.nom),
        fonction: ou(profil?.signataire?.fonction),
      },
    },
    sectionsCategories,
    piecesManquantes,
    piecesNonStatuees,
    piecesAVerifier,
    piecesDisponibles,
    sommaire,
    recap,
    totalPieces: piecesNormalisees.length,
    dateGeneration: new Date(),
  };
}

/** Accord singulier/pluriel simple. */
function pluriel(n, singulier, plurielMot) {
  return n > 1 ? plurielMot : singulier;
}

/** Vrai si une valeur d'offre a effectivement été transmise. */
function estFourni(v) {
  return v !== null && v !== undefined && v !== '';
}

/**
 * Rédige l'« Analyse du marché » sous forme de paragraphes.
 * Chaque phrase n'est produite que si la donnée correspondante existe ;
 * les informations absentes sont signalées explicitement, jamais inventées.
 *
 * @param {object} offre  L'objet `dossier.offre` renvoyé par construireDossier
 * @returns {string[]} paragraphes de texte
 */
export function redigerAnalyseMarche(offre) {
  const paragraphes = [];

  // 1) Nature du marché
  let nature =
    `Le présent appel d'offres, référencé ${offre.reference}, porte sur ` +
    `${estFourni(offre.intitule) && offre.intitule !== INFO_ABSENTE ? offre.intitule : 'un objet non communiqué par la plateforme'}. ` +
    `Il est lancé par ${offre.autoriteContractante}. `;
  nature += estFourni(offre.typeMarche) && offre.typeMarche !== INFO_ABSENTE
    ? `Il s'agit d'un marché de type « ${offre.typeMarche} ».`
    : `Le type de marché n'a pas été précisé dans les données transmises.`;
  paragraphes.push(nature);

  // 2) Objet / description détaillés (repris intégralement s'ils existent)
  if (estFourni(offre.objet)) {
    paragraphes.push(`Objet précisé par l'autorité contractante : « ${offre.objet} »`);
  }
  if (estFourni(offre.description)) {
    paragraphes.push(`Description communiquée : « ${offre.description} »`);
  }

  // 3) Conditions économiques et procédurales (une phrase par donnée réellement fournie)
  const eco = [];
  if (estFourni(offre.montantEstime)) eco.push(`Le montant estimé du marché est de ${offre.montantEstime}.`);
  if (estFourni(offre.financement)) eco.push(`Le financement est assuré par : ${offre.financement}.`);
  if (estFourni(offre.delaiExecution)) eco.push(`Le délai d'exécution prévu est de ${offre.delaiExecution}.`);
  if (estFourni(offre.modeSelection)) eco.push(`Le mode de sélection retenu est : ${offre.modeSelection}.`);
  paragraphes.push(
    eco.length
      ? eco.join(' ')
      : "Aucune information relative au montant estimé, au financement, au délai d'exécution ou au mode de sélection n'a été communiquée via la plateforme."
  );

  // 4) Contraintes particulières
  if (estFourni(offre.contraintes)) {
    const c = Array.isArray(offre.contraintes) ? offre.contraintes.join(' ; ') : offre.contraintes;
    paragraphes.push(`Contraintes particulières signalées : ${c}.`);
  } else {
    paragraphes.push(
      "Aucune contrainte particulière n'a été signalée dans les données transmises par la plateforme."
    );
  }

  // 5) Modalités de dépôt
  const dateTxt = formaterDate(offre.dateLimite);
  const lieuTxt = estFourni(offre.lieuDepot) && offre.lieuDepot !== INFO_ABSENTE ? ` au lieu de dépôt indiqué : ${offre.lieuDepot},` : '';
  paragraphes.push(
    offre.dateLimite
      ? `Les offres doivent être déposées au plus tard le ${dateTxt}${lieuTxt} ` +
        `date au-delà de laquelle aucune soumission ne pourra être valablement enregistrée.`
      : `La date limite de dépôt n'a pas été communiquée dans les données transmises ; ` +
        `il convient de la vérifier auprès de l'autorité contractante avant tout dépôt.`
  );

  return paragraphes;
}

/**
 * Rédige la synthèse d'avancement du dossier (page de clôture), en texte.
 * Tous les nombres proviennent des pièces réellement reçues.
 *
 * @param {object} dossier  structure renvoyée par construireDossier
 * @returns {string[]} paragraphes de texte
 */
export function redigerSynthese(dossier) {
  const nbDispo = dossier.piecesDisponibles.length;
  const nbObtenir = dossier.piecesManquantes.length;
  const nbVerifier = dossier.piecesAVerifier.length;
  const nbNonStatuees = dossier.piecesNonStatuees.length;
  const nbCat = dossier.sectionsCategories.length;
  const total = dossier.totalPieces;

  const p1 =
    `Au terme de l'assemblage, le dossier de soumission de ${dossier.entreprise.raisonSociale}, ` +
    `présenté en réponse à l'appel d'offres ${dossier.offre.reference} lancé par ` +
    `${dossier.offre.autoriteContractante}, réunit ${total} ${pluriel(total, 'pièce', 'pièces')} ` +
    `répartie${pluriel(total, '', 's')} en ${nbCat} ${pluriel(nbCat, 'catégorie', 'catégories')}.`;

  const detail = [];
  detail.push(`${nbDispo} ${pluriel(nbDispo, 'pièce est disponible', 'pièces sont disponibles')}`);
  if (nbObtenir > 0) detail.push(`${nbObtenir} ${pluriel(nbObtenir, 'reste à obtenir', 'restent à obtenir')}`);
  if (nbVerifier > 0) detail.push(`${nbVerifier} ${pluriel(nbVerifier, 'est à vérifier', 'sont à vérifier')}`);
  if (nbNonStatuees > 0) detail.push(`${nbNonStatuees} ${pluriel(nbNonStatuees, "n'est pas encore statuée", 'ne sont pas encore statuées')}`);
  const p2 = `À ce stade, ${detail.join(', ')}.`;

  let p3;
  if (nbObtenir > 0) {
    p3 =
      `Le dossier n'est pas encore complet : les pièces en statut « à obtenir » doivent être ` +
      `réunies avant la date limite de dépôt (${formaterDate(dossier.offre.dateLimite)}) pour que ` +
      `la soumission soit recevable.`;
  } else if (nbNonStatuees > 0) {
    p3 =
      `Le dossier est presque complet ; il reste à statuer sur ${nbNonStatuees} ` +
      `${pluriel(nbNonStatuees, 'pièce', 'pièces')} avant de le considérer comme prêt au dépôt.`;
  } else {
    p3 =
      `L'ensemble des pièces exigées sont disponibles : le dossier peut être considéré comme ` +
      `prêt à être déposé auprès de l'autorité contractante.`;
  }

  return [p1, p2, p3];
}
