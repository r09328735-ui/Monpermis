/**
 * Point d'entrée public du package.
 *
 * Usage dans votre application MarchéConnect :
 *
 *   import { DossierAppelOffres } from 'marcheconnect-dossier-ao';
 *   // ou, si vous copiez simplement le dossier src/ :
 *   import { DossierAppelOffres } from './dossier-appel-offres/DossierAppelOffres.jsx';
 *
 *   <DossierAppelOffres offreId={offre._id} userId={user._id} authToken={jwt} />
 */
export { DossierAppelOffres, default } from './dossier-appel-offres/DossierAppelOffres.jsx';

// Exports secondaires (utiles pour tester/étendre le rendu du dossier).
export { ENDPOINTS } from './dossier-appel-offres/endpoints.js';
export { createApiClient } from './dossier-appel-offres/apiClient.js';
export { useDossierData } from './dossier-appel-offres/useDossierData.js';
export { construireDossier } from './dossier-appel-offres/dossierModel.js';
export { DossierPDF } from './dossier-appel-offres/pdf/DossierPDF.jsx';
