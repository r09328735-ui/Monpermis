import React from 'react';
import { STATUTS } from './dossierModel.js';

/** Statuts proposables par l'utilisateur pour une pièce non statuée. */
const CHOIX = ['disponible', 'a_obtenir', 'a_verifier'];

/**
 * Complément d'information facultatif : ne concerne QUE les pièces dont le
 * statut est absent en base. Les données déjà disponibles côté serveur ne
 * sont jamais resaisies ici.
 *
 * @param {Array}    pieces      Pièces en statut `non_statuee`
 * @param {object}   complements { [pieceId]: statutChoisi }
 * @param {function} onChange    setter du dictionnaire de compléments
 */
export function ComplementPieces({ pieces, complements, onChange }) {
  return (
    <fieldset className="dao-complement">
      <legend>Pièces non encore statuées ({pieces.length})</legend>
      <p className="dao-complement-note">
        Facultatif : précisez le statut de ces pièces pour compléter le dossier. Sans
        précision, elles apparaîtront « Non statuée ».
      </p>
      {pieces.map((piece) => (
        <div key={piece.id} className="dao-complement-piece">
          <span className="dao-complement-designation">{piece.designation}</span>
          <select
            value={complements[piece.id] || ''}
            onChange={(e) =>
              onChange({ ...complements, [piece.id]: e.target.value || undefined })
            }
            aria-label={`Statut de : ${piece.designation}`}
          >
            <option value="">Non statuée</option>
            {CHOIX.map((code) => (
              <option key={code} value={code}>
                {STATUTS[code].label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </fieldset>
  );
}
