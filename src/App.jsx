import React from 'react';
import { DossierAppelOffres } from './dossier-appel-offres/DossierAppelOffres.jsx';
import { mockFetch, mockFetchAvecErreur } from './demo/mockFetch.js';

/**
 * Page de démonstration : monte le composant avec l'API mockée.
 *
 * Intégration réelle dans votre app MarchéConnect :
 *
 *   <DossierAppelOffres
 *     offreId={offre._id}
 *     userId={utilisateur._id}
 *     authToken={tokenJwt}            // optionnel
 *     apiBaseUrl="https://api.marcheconnect.bj"  // optionnel, défaut même origine
 *   />
 */
export default function App() {
  // Ajoutez `?erreur=1` à l'URL de la démo pour visualiser l'état d'erreur.
  const simulerErreur = new URLSearchParams(window.location.search).has('erreur');

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#1f3a5f', fontSize: '1.4rem', margin: 0 }}>
          MarchéConnect — Générateur de dossier d'appel d'offres
        </h1>
        <p style={{ color: '#6b7280', margin: '6px 0 0', fontSize: '0.9rem' }}>
          Démonstration avec API simulée (retirez la prop <code>fetchImpl</code> en
          production).
        </p>
      </header>

      <DossierAppelOffres
        offreId="demo-offre-001"
        userId="demo-user-042"
        fetchImpl={simulerErreur ? mockFetchAvecErreur : mockFetch}
      />
    </main>
  );
}
