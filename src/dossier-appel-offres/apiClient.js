import { ENDPOINTS } from './endpoints.js';

/**
 * Client HTTP minimaliste pour le backend MarchéConnect.
 *
 * @param {object}   options
 * @param {string}   [options.baseUrl='']  Préfixe des routes (ex: 'https://api.marcheconnect.bj').
 *                                         Vide = même origine que l'app (proxy Vite/Nginx).
 * @param {string}   [options.authToken]   Token JWT géré par votre app ; envoyé en
 *                                         header `Authorization: Bearer <token>`.
 * @param {function} [options.fetchImpl]   Implémentation de fetch injectable
 *                                         (utilisée par la démo pour mocker l'API).
 */
export function createApiClient({ baseUrl = '', authToken, fetchImpl } = {}) {
  const doFetch = fetchImpl || ((...args) => fetch(...args));

  async function get(path, label) {
    let response;
    try {
      response = await doFetch(baseUrl + path, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
    } catch (cause) {
      // Erreur réseau (serveur injoignable, CORS, coupure…)
      throw new Error(`${label} : serveur injoignable (${path}).`, { cause });
    }
    if (!response.ok) {
      throw new Error(
        `${label} : réponse ${response.status} ${response.statusText || ''} (GET ${path}).`
      );
    }
    return response.json();
  }

  return {
    /** Détails de l'AO — voir endpoints.js §1 */
    getOffre: (offreId) =>
      get(ENDPOINTS.offre(offreId), "Détails de l'appel d'offres"),

    /** Pièces exigées — voir endpoints.js §2 (accepte {pieces:[…]} ou […]) */
    getPieces: async (offreId) => {
      const data = await get(ENDPOINTS.pieces(offreId), 'Liste des pièces exigées');
      return Array.isArray(data) ? data : data.pieces || [];
    },

    /** Profil entreprise — voir endpoints.js §3 */
    getProfilEntreprise: (userId) =>
      get(ENDPOINTS.profilEntreprise(userId), 'Profil entreprise'),
  };
}
