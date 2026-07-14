import { useCallback, useEffect, useMemo, useState } from 'react';
import { createApiClient } from './apiClient.js';

/**
 * Hook de récupération des trois ressources nécessaires au dossier.
 * Les appels partent en parallèle ; chaque échec est identifié
 * individuellement pour afficher un message d'erreur précis.
 *
 * @returns {{
 *   loading: boolean,
 *   errors: string[],            // messages d'erreur (vide si tout est OK)
 *   data: { offre, pieces, profil } | null,
 *   reload: () => void
 * }}
 */
export function useDossierData({ offreId, userId, apiBaseUrl, authToken }) {
  const api = useMemo(
    () => createApiClient({ baseUrl: apiBaseUrl, authToken }),
    [apiBaseUrl, authToken]
  );

  const [state, setState] = useState({ loading: true, errors: [], data: null });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let annule = false; // évite un setState après démontage / changement d'AO
    setState({ loading: true, errors: [], data: null });

    Promise.allSettled([
      api.getOffre(offreId),
      api.getPieces(offreId),
      api.getProfilEntreprise(userId),
    ]).then(([offre, pieces, profil]) => {
      if (annule) return;
      const errors = [offre, pieces, profil]
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason?.message || String(r.reason));

      setState({
        loading: false,
        errors,
        data:
          errors.length === 0
            ? { offre: offre.value, pieces: pieces.value, profil: profil.value }
            : null,
      });
    });

    return () => {
      annule = true;
    };
  }, [api, offreId, userId, reloadKey]);

  return { ...state, reload };
}
