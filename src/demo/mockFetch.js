/**
 * Fetch mocké pour la DÉMO uniquement : simule les trois endpoints du backend
 * avec des données réalistes (Bénin) et une latence artificielle.
 * En production, ne passez PAS la prop `fetchImpl` — le composant utilisera
 * le vrai `fetch` vers votre API.
 */

const OFFRE = {
  id: 'demo-offre-001',
  reference: 'AON/DGI/2026/007',
  intitule:
    "Acquisition de matériel roulant au profit de la Direction Générale des Impôts",
  autoriteContractante: "Ministère de l'Économie et des Finances (MEF)",
  typeMarche: 'Fournitures',
  dateLimite: '2026-08-15T10:00:00.000Z',
  lieuDepot: 'Cotonou, DNCMP',
};

const PIECES = {
  offreId: 'demo-offre-001',
  pieces: [
    { id: 'p-01', designation: "Attestation fiscale (IFU à jour)", categorie: 'administrative', statut: 'disponible', obligatoire: true, commentaire: 'Valide jusqu’au 31/12/2026' },
    { id: 'p-02', designation: 'Extrait RCCM de moins de 3 mois', categorie: 'administrative', statut: 'a_obtenir', obligatoire: true },
    { id: 'p-03', designation: 'Attestation CNSS', categorie: 'administrative', statut: 'disponible', obligatoire: true },
    { id: 'p-04', designation: 'Casier judiciaire du dirigeant', categorie: 'administrative', statut: null, obligatoire: true },
    { id: 'p-05', designation: 'États financiers certifiés des 3 derniers exercices', categorie: 'financiere', statut: 'disponible', obligatoire: true },
    { id: 'p-06', designation: 'Ligne de crédit ou attestation de capacité financière', categorie: 'financiere', statut: 'a_obtenir', obligatoire: true },
    { id: 'p-07', designation: 'Caution de soumission (2 % du montant)', categorie: 'financiere', statut: 'a_verifier', obligatoire: true },
    { id: 'p-08', designation: 'Liste du personnel clé avec CV', categorie: 'technique', statut: 'disponible', obligatoire: true },
    { id: 'p-09', designation: 'Références de marchés similaires (3 dernières années)', categorie: 'technique', statut: 'disponible', obligatoire: true },
    { id: 'p-10', designation: 'Bordereau des prix unitaires', categorie: 'offre', statut: 'disponible', obligatoire: true },
    { id: 'p-11', designation: 'Devis quantitatif et estimatif', categorie: 'offre', statut: 'a_obtenir', obligatoire: true },
    { id: 'p-12', designation: 'Prospectus techniques des véhicules proposés', categorie: 'offre', statut: 'disponible', obligatoire: false, commentaire: 'Catalogue constructeur accepté' },
  ],
};

const PROFIL = {
  raisonSociale: 'BTP SAHEL SARL',
  ifu: '3202300456789',
  rccm: 'RB/COT/24 B 12345',
  adresse: 'Lot 45, Quartier Fidjrossè, Cotonou',
  telephone: '+229 97 00 00 00',
  email: 'contact@btpsahel.bj',
  signataire: { nom: 'Ayaba HOUNKPATIN', fonction: 'Directrice Générale' },
};

/** Fabrique une Response JSON avec latence simulée. */
function reponseJson(data, delaiMs) {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        ),
      delaiMs
    )
  );
}

export function mockFetch(url) {
  const chemin = String(url);
  if (/\/api\/offres\/[^/]+$/.test(chemin)) return reponseJson(OFFRE, 500);
  if (/\/api\/dossiers\/[^/]+\/pieces$/.test(chemin)) return reponseJson(PIECES, 700);
  if (/\/api\/utilisateurs\/[^/]+\/profil-entreprise$/.test(chemin))
    return reponseJson(PROFIL, 600);
  return Promise.resolve(new Response('Not found', { status: 404 }));
}

/** Variante qui fait échouer l'endpoint des pièces (démo de l'état d'erreur). */
export function mockFetchAvecErreur(url) {
  if (/\/pieces$/.test(String(url))) {
    return Promise.resolve(new Response('Internal Server Error', { status: 500 }));
  }
  return mockFetch(url);
}
