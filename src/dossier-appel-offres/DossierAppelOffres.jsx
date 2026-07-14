import React, { useMemo, useState } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { useDossierData } from './useDossierData.js';
import { construireDossier, formaterDate, STATUTS } from './dossierModel.js';
import { DossierPDF } from './pdf/DossierPDF.jsx';
import { ComplementPieces } from './ComplementPieces.jsx';
import './dossier-appel-offres.css';

/**
 * ============================================================================
 *  <DossierAppelOffres /> — Générateur de dossier d'appel d'offres
 * ============================================================================
 *  Composant autonome : il récupère LUI-MÊME toutes les données via l'API
 *  (voir endpoints.js) — l'utilisateur ne saisit rien qui soit déjà en base.
 *
 *  Props :
 *  @param {string}   offreId     Identifiant de l'appel d'offres (obligatoire)
 *  @param {string}   userId      Identifiant de l'utilisateur/abonné (obligatoire)
 *  @param {string}   [authToken] Token JWT géré par votre app (header Authorization)
 *  @param {string}   [apiBaseUrl] Préfixe des routes API (défaut : même origine)
 * ============================================================================
 */
export function DossierAppelOffres({ offreId, userId, authToken, apiBaseUrl }) {
  // 1) Récupération automatique des trois ressources (parallèle).
  const { loading, errors, data, reload } = useDossierData({
    offreId,
    userId,
    apiBaseUrl,
    authToken,
  });

  // 2) Compléments saisis par l'utilisateur, UNIQUEMENT pour les pièces
  //    dont le statut est absent en base ({ [pieceId]: statut }).
  const [complements, setComplements] = useState({});
  const [enTelechargement, setEnTelechargement] = useState(false);

  // 3) Assemblage de la structure du dossier (sections, sommaire, récap).
  const dossier = useMemo(
    () =>
      data ? construireDossier(data.offre, data.pieces, data.profil, complements) : null,
    [data, complements]
  );

  /** Export PDF : génère le blob puis déclenche le téléchargement. */
  async function telechargerPdf() {
    if (!dossier) return;
    setEnTelechargement(true);
    try {
      const blob = await pdf(<DossierPDF dossier={dossier} />).toBlob();
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `dossier-${dossier.offre.reference.replace(/[^\w-]+/g, '_')}.pdf`;
      lien.click();
      URL.revokeObjectURL(url);
    } finally {
      setEnTelechargement(false);
    }
  }

  /* ---------------------- État : chargement ---------------------- */
  if (loading) {
    return (
      <div className="dao-conteneur dao-centre">
        <div className="dao-spinner" aria-hidden="true" />
        <p className="dao-chargement-texte">
          Récupération des données de l'appel d'offres, des pièces exigées et de votre
          profil entreprise…
        </p>
      </div>
    );
  }

  /* ---------------------- État : erreur ---------------------- */
  if (errors.length > 0) {
    return (
      <div className="dao-conteneur dao-centre">
        <div className="dao-erreur" role="alert">
          <h3>Impossible d'assembler le dossier</h3>
          <p>
            {errors.length === 1
              ? "L'appel suivant a échoué :"
              : 'Les appels suivants ont échoué :'}
          </p>
          <ul>
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <button type="button" className="dao-bouton" onClick={reload}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------- État : prêt ---------------------- */
  return (
    <div className="dao-conteneur">
      {/* Panneau latéral : résumé, complément éventuel, actions */}
      <aside className="dao-panneau">
        <h2 className="dao-titre">Dossier de soumission</h2>

        <dl className="dao-resume">
          <dt>Appel d'offres</dt>
          <dd>{dossier.offre.intitule}</dd>
          <dt>Référence</dt>
          <dd>{dossier.offre.reference}</dd>
          <dt>Autorité contractante</dt>
          <dd>{dossier.offre.autoriteContractante}</dd>
          <dt>Date limite</dt>
          <dd>{formaterDate(dossier.offre.dateLimite)}</dd>
          <dt>Soumissionnaire</dt>
          <dd>{dossier.entreprise.raisonSociale}</dd>
        </dl>

        {/* Alerte visuelle si des pièces sont à obtenir */}
        {dossier.piecesManquantes.length > 0 && (
          <p className="dao-alerte">
            {dossier.piecesManquantes.length} pièce
            {dossier.piecesManquantes.length > 1 ? 's' : ''} en statut «{' '}
            {STATUTS.a_obtenir.label.toLowerCase()} » — une section dédiée est incluse
            dans le dossier.
          </p>
        )}

        {/* Complément d'information : seulement les pièces NON statuées en base */}
        {dossier.piecesNonStatuees.length > 0 && (
          <ComplementPieces
            pieces={dossier.piecesNonStatuees}
            complements={complements}
            onChange={setComplements}
          />
        )}

        <button
          type="button"
          className="dao-bouton dao-bouton-principal"
          onClick={telechargerPdf}
          disabled={enTelechargement}
        >
          {enTelechargement ? 'Génération du PDF…' : 'Télécharger le dossier (PDF)'}
        </button>
      </aside>

      {/* Prévisualisation page par page du dossier assemblé */}
      <section className="dao-apercu" aria-label="Prévisualisation du dossier">
        <PDFViewer className="dao-visionneuse" showToolbar>
          <DossierPDF dossier={dossier} />
        </PDFViewer>
      </section>
    </div>
  );
}

export default DossierAppelOffres;
