/**
 * @file Tests de la surveillance de fluidité (qualité adaptative).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SurveillantFluidite } from '../src/coeur/qualiteAdaptative.js';

/** Réglages courts pour des tests lisibles. */
const REGLAGES = { imagesAIgnorer: 2, imagesParMesure: 5, seuilMoyenMs: 20, ecartMaximalMs: 120 };

/**
 * Envoie une suite d'images régulièrement espacées.
 *
 * @param {SurveillantFluidite} surveillant - Surveillant à alimenter.
 * @param {number} nombre - Nombre d'images.
 * @param {number} ecart - Écart entre deux images, en ms.
 * @param {number} depart - Instant de la première image.
 * @returns {{ alertes: number, fin: number }} Nombre de signaux « trop lent » et instant final.
 */
function envoyerImages(surveillant, nombre, ecart, depart = 0) {
  let alertes = 0;
  let temps = depart;
  for (let image = 0; image < nombre; image++) {
    temps += ecart;
    if (surveillant.enregistrerImage(temps)) {
      alertes++;
    }
  }
  return { alertes, fin: temps };
}

test('un affichage fluide ne déclenche aucune baisse de qualité', () => {
  const surveillant = new SurveillantFluidite(REGLAGES);
  assert.equal(envoyerImages(surveillant, 50, 14).alertes, 0);
});

test('un affichage lent déclenche une baisse après une mesure complète', () => {
  const surveillant = new SurveillantFluidite(REGLAGES);
  // 1 image de référence + 2 ignorées + 5 mesurées = alerte à la 8e image.
  assert.equal(envoyerImages(surveillant, 7, 30).alertes, 0);
  assert.equal(envoyerImages(surveillant, 1, 30, 210).alertes, 1);
});

test('après une alerte, une nouvelle mesure complète est nécessaire', () => {
  const surveillant = new SurveillantFluidite(REGLAGES);
  const { fin } = envoyerImages(surveillant, 8, 30);
  assert.equal(envoyerImages(surveillant, 4, 30, fin).alertes, 0);
  assert.equal(envoyerImages(surveillant, 1, 30, fin + 120).alertes, 1);
});

test('les pauses exceptionnelles (chargement, onglet caché) sont ignorées', () => {
  const surveillant = new SurveillantFluidite(REGLAGES);
  let temps = 0;
  let alertes = 0;
  for (let image = 0; image < 30; image++) {
    // Une image sur trois arrive après une longue pause.
    temps += image % 3 === 0 ? 500 : 14;
    if (surveillant.enregistrerImage(temps)) {
      alertes++;
    }
  }
  assert.equal(alertes, 0);
});

test('réinitialiser repart de zéro (par exemple à l’entrée en VR)', () => {
  const surveillant = new SurveillantFluidite(REGLAGES);
  envoyerImages(surveillant, 7, 30);
  surveillant.reinitialiser();
  assert.equal(envoyerImages(surveillant, 7, 30, 1000).alertes, 0);
});
