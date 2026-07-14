import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { STATUTS, formaterDate } from '../dossierModel.js';

/**
 * Document PDF du dossier d'appel d'offres.
 * Une <Page> par section logique ; le contenu long (listes de pièces)
 * se prolonge automatiquement sur les pages suivantes.
 * En-tête (référence AO / soumissionnaire) et pied de page (numérotation)
 * répétés sur toutes les pages sauf la page de garde.
 */

const BLEU = '#1f3a5f';
const GRIS = '#555555';
const GRIS_CLAIR = '#e5e7eb';

const s = StyleSheet.create({
  page: {
    paddingTop: 70,
    paddingBottom: 60,
    paddingHorizontal: 56, // ~2 cm
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#1a1a1a',
    lineHeight: 1.45,
  },
  // ---- En-tête / pied de page répétés ----
  header: {
    position: 'absolute',
    top: 24,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.75,
    borderBottomColor: GRIS_CLAIR,
    paddingBottom: 6,
    fontSize: 8,
    color: GRIS,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.75,
    borderTopColor: GRIS_CLAIR,
    paddingTop: 6,
    fontSize: 8,
    color: GRIS,
  },
  // ---- Typographie ----
  h1: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BLEU, marginBottom: 14 },
  h2: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: BLEU, marginTop: 14, marginBottom: 6 },
  paragraphe: { marginBottom: 8, textAlign: 'justify' },
  // ---- Page de garde ----
  gardePage: { padding: 56, fontFamily: 'Helvetica', color: '#1a1a1a', justifyContent: 'space-between' },
  gardeCadre: { borderWidth: 1.5, borderColor: BLEU, padding: 32, marginTop: 90 },
  gardeAutorite: { fontSize: 11, color: GRIS, textAlign: 'center', marginBottom: 24 },
  gardeTitreDossier: { fontSize: 13, color: BLEU, textAlign: 'center', letterSpacing: 2, marginBottom: 18, fontFamily: 'Helvetica-Bold' },
  gardeIntitule: { fontSize: 17, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 24, lineHeight: 1.4 },
  gardeReference: { fontSize: 11, textAlign: 'center', color: GRIS, marginBottom: 8 },
  gardeSoumissionnaire: { marginTop: 40, textAlign: 'center' },
  // ---- Tableaux ----
  ligne: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: GRIS_CLAIR, paddingVertical: 5 },
  ligneEntete: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: BLEU,
    paddingVertical: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  colNum: { width: '7%', paddingHorizontal: 4 },
  colDesignation: { width: '55%', paddingHorizontal: 4 },
  colStatut: { width: '18%', paddingHorizontal: 4 },
  colObligatoire: { width: '20%', paddingHorizontal: 4 },
  badge: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  commentaire: { fontSize: 8.5, color: GRIS, marginTop: 1 },
  // ---- Encadré pièces manquantes ----
  alerte: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#f59e0b',
    padding: 12,
    marginBottom: 12,
  },
  // ---- Signature ----
  zoneSignature: {
    marginTop: 36,
    alignSelf: 'flex-end',
    width: 220,
  },
  cadreSignature: {
    borderWidth: 0.75,
    borderColor: GRIS,
    height: 90,
    marginTop: 8,
  },
});

/** En-tête + pied de page communs (répétés sur chaque page via `fixed`). */
function EnteteEtPied({ dossier }) {
  return (
    <>
      <View style={s.header} fixed>
        <Text>Dossier de soumission — {dossier.offre.reference}</Text>
        <Text>{dossier.entreprise.raisonSociale}</Text>
      </View>
      <View style={s.footer} fixed>
        <Text>Généré via MarchéConnect le {formaterDate(dossier.dateGeneration.toISOString())}</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
      </View>
    </>
  );
}

/** Badge texte coloré selon le statut d'une pièce. */
function Statut({ code }) {
  const statut = STATUTS[code] || STATUTS.non_statuee;
  return <Text style={[s.badge, { color: statut.couleur }]}>{statut.label}</Text>;
}

/** Tableau des pièces d'une section. */
function TableauPieces({ pieces }) {
  return (
    <View>
      <View style={s.ligneEntete}>
        <Text style={s.colNum}>N°</Text>
        <Text style={s.colDesignation}>Désignation de la pièce</Text>
        <Text style={s.colStatut}>Statut</Text>
        <Text style={s.colObligatoire}>Caractère</Text>
      </View>
      {pieces.map((p, i) => (
        <View key={p.id} style={s.ligne} wrap={false}>
          <Text style={s.colNum}>{i + 1}</Text>
          <View style={s.colDesignation}>
            <Text>{p.designation}</Text>
            {p.commentaire ? <Text style={s.commentaire}>{p.commentaire}</Text> : null}
          </View>
          <View style={s.colStatut}>
            <Statut code={p.statut} />
          </View>
          <Text style={s.colObligatoire}>{p.obligatoire ? 'Obligatoire' : 'Facultative'}</Text>
        </View>
      ))}
    </View>
  );
}

export function DossierPDF({ dossier }) {
  const { offre, entreprise, sectionsCategories, piecesManquantes, sommaire, recap } = dossier;
  let numeroSection = 0;

  return (
    <Document
      title={`Dossier de soumission — ${offre.reference}`}
      author={entreprise.raisonSociale}
      language="fr"
    >
      {/* ==================== PAGE DE GARDE ==================== */}
      <Page size="A4" style={s.gardePage}>
        <View>
          <View style={s.gardeCadre}>
            <Text style={s.gardeAutorite}>RÉPUBLIQUE DU BÉNIN{'\n'}{offre.autoriteContractante}</Text>
            <Text style={s.gardeTitreDossier}>DOSSIER DE SOUMISSION</Text>
            <Text style={s.gardeIntitule}>{offre.intitule}</Text>
            <Text style={s.gardeReference}>Référence : {offre.reference}</Text>
            {offre.typeMarche ? (
              <Text style={s.gardeReference}>Type de marché : {offre.typeMarche}</Text>
            ) : null}
            <Text style={s.gardeReference}>
              Date limite de dépôt : {formaterDate(offre.dateLimite)}
            </Text>
            <View style={s.gardeSoumissionnaire}>
              <Text style={{ fontSize: 10, color: GRIS, marginBottom: 4 }}>Soumissionnaire</Text>
              <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}>
                {entreprise.raisonSociale}
              </Text>
            </View>
          </View>
        </View>
        <Text style={{ fontSize: 9, color: GRIS, textAlign: 'center' }}>
          Dossier assemblé le {formaterDate(dossier.dateGeneration.toISOString())} via MarchéConnect
        </Text>
      </Page>

      {/* ==================== SOMMAIRE ==================== */}
      <Page size="A4" style={s.page}>
        <EnteteEtPied dossier={dossier} />
        <Text style={s.h1}>Sommaire</Text>
        {sommaire.map((entree) => (
          <View key={entree.numero} style={s.ligne}>
            <Text style={{ width: '10%', fontFamily: 'Helvetica-Bold', color: BLEU }}>
              {entree.numero}.
            </Text>
            <Text>{entree.titre}</Text>
          </View>
        ))}
      </Page>

      {/* ==================== LETTRE DE PRÉSENTATION ==================== */}
      <Page size="A4" style={s.page}>
        <EnteteEtPied dossier={dossier} />
        <Text style={s.h1}>{++numeroSection}. Lettre de présentation</Text>

        <Text style={s.paragraphe}>À l'attention de : {offre.autoriteContractante}</Text>
        <Text style={s.paragraphe}>
          Objet : Soumission à l'appel d'offres {offre.reference} — {offre.intitule}
        </Text>
        <Text style={s.paragraphe}>Madame, Monsieur,</Text>
        <Text style={s.paragraphe}>
          Nous, {entreprise.raisonSociale}, immatriculée au Registre du Commerce et du Crédit
          Mobilier sous le numéro {entreprise.rccm} et identifiée fiscalement sous l'IFU{' '}
          {entreprise.ifu}, dont le siège est situé {entreprise.adresse}, avons l'honneur de vous
          soumettre le présent dossier en réponse à l'appel d'offres cité en objet.
        </Text>
        <Text style={s.paragraphe}>
          Le présent dossier rassemble l'ensemble des pièces exigées par le dossier d'appel
          d'offres, organisées par catégorie conformément au sommaire. Nous certifions
          l'exactitude des renseignements fournis et nous nous engageons à produire tout
          document complémentaire qui serait requis par l'autorité contractante.
        </Text>
        <Text style={s.paragraphe}>
          Nous vous prions d'agréer, Madame, Monsieur, l'expression de notre considération
          distinguée.
        </Text>

        <Text style={s.h2}>Identification du soumissionnaire</Text>
        {[
          ['Raison sociale', entreprise.raisonSociale],
          ['IFU', entreprise.ifu],
          ['RCCM', entreprise.rccm],
          ['Adresse', entreprise.adresse],
          ['Téléphone', entreprise.telephone || '—'],
          ['Email', entreprise.email || '—'],
          ['Signataire', `${entreprise.signataire.nom}${entreprise.signataire.fonction ? `, ${entreprise.signataire.fonction}` : ''}`],
        ].map(([label, valeur]) => (
          <View key={label} style={s.ligne}>
            <Text style={{ width: '30%', fontFamily: 'Helvetica-Bold' }}>{label}</Text>
            <Text style={{ width: '70%' }}>{valeur}</Text>
          </View>
        ))}
      </Page>

      {/* ==================== UNE SECTION PAR CATÉGORIE ==================== */}
      {sectionsCategories.map((section) => (
        <Page key={section.code} size="A4" style={s.page}>
          <EnteteEtPied dossier={dossier} />
          <Text style={s.h1}>
            {++numeroSection}. {section.titre}
          </Text>
          <Text style={s.paragraphe}>
            {section.pieces.length} pièce{section.pieces.length > 1 ? 's' : ''} exigée
            {section.pieces.length > 1 ? 's' : ''} dans cette catégorie.
          </Text>
          <TableauPieces pieces={section.pieces} />
        </Page>
      ))}

      {/* ==================== PIÈCES MANQUANTES (si présentes) ==================== */}
      {piecesManquantes.length > 0 && (
        <Page size="A4" style={s.page}>
          <EnteteEtPied dossier={dossier} />
          <Text style={[s.h1, { color: '#b45309' }]}>
            {++numeroSection}. Pièces manquantes — à obtenir
          </Text>
          <View style={s.alerte}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
              Attention : {piecesManquantes.length} pièce
              {piecesManquantes.length > 1 ? 's restent' : ' reste'} à obtenir avant la date
              limite du {formaterDate(offre.dateLimite)}.
            </Text>
            <Text style={{ fontSize: 9.5 }}>
              Le dossier ne pourra être déposé complet qu'une fois ces pièces réunies.
            </Text>
          </View>
          <TableauPieces pieces={piecesManquantes} />
        </Page>
      )}

      {/* ==================== PAGE DE CLÔTURE ==================== */}
      <Page size="A4" style={s.page}>
        <EnteteEtPied dossier={dossier} />
        <Text style={s.h1}>{++numeroSection}. Récapitulatif et signature</Text>

        <Text style={s.h2}>Récapitulatif du dossier</Text>
        <View style={s.ligneEntete}>
          <Text style={{ width: '40%', paddingHorizontal: 4 }}>Catégorie</Text>
          <Text style={{ width: '20%', paddingHorizontal: 4 }}>Pièces</Text>
          <Text style={{ width: '20%', paddingHorizontal: 4 }}>Disponibles</Text>
          <Text style={{ width: '20%', paddingHorizontal: 4 }}>À obtenir</Text>
        </View>
        {recap.map((r) => (
          <View key={r.categorie} style={s.ligne}>
            <Text style={{ width: '40%', paddingHorizontal: 4 }}>{r.categorie}</Text>
            <Text style={{ width: '20%', paddingHorizontal: 4 }}>{r.total}</Text>
            <Text style={{ width: '20%', paddingHorizontal: 4, color: STATUTS.disponible.couleur }}>
              {r.disponibles}
            </Text>
            <Text style={{ width: '20%', paddingHorizontal: 4, color: STATUTS.a_obtenir.couleur }}>
              {r.aObtenir}
            </Text>
          </View>
        ))}

        <Text style={[s.paragraphe, { marginTop: 16 }]}>
          Le présent dossier, composé de {dossier.totalPieces} pièce
          {dossier.totalPieces > 1 ? 's' : ''}, est soumis au nom de{' '}
          {entreprise.raisonSociale} dans le cadre de l'appel d'offres {offre.reference} lancé
          par {offre.autoriteContractante}.
        </Text>

        <View style={s.zoneSignature}>
          <Text style={{ fontSize: 9.5, color: GRIS }}>
            Fait à ____________________, le {formaterDate(dossier.dateGeneration.toISOString())}
          </Text>
          <Text style={{ marginTop: 10, fontFamily: 'Helvetica-Bold' }}>
            {entreprise.signataire.nom}
          </Text>
          {entreprise.signataire.fonction ? (
            <Text style={{ fontSize: 9.5, color: GRIS }}>{entreprise.signataire.fonction}</Text>
          ) : null}
          <View style={s.cadreSignature} />
          <Text style={{ fontSize: 8, color: GRIS, marginTop: 3, textAlign: 'center' }}>
            Signature et cachet
          </Text>
        </View>
      </Page>
    </Document>
  );
}
