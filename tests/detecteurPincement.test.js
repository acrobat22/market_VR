/**
 * @file Tests du détecteur de pincement (logique pure, sans casque).
 *
 * Lancement : `node --test` depuis la racine du projet.
 * Documentation : https://nodejs.org/api/test.html
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DetecteurPincement, EVENEMENT_PINCEMENT } from '../src/entrees/detecteurPincement.js';

/** Seuils utilisés dans les tests (en mètres). */
const SEUILS = { seuilFermeture: 0.025, seuilOuverture: 0.04 };

test('une main ouverte ne déclenche rien', () => {
  const detecteur = new DetecteurPincement(SEUILS);
  assert.equal(detecteur.mettreAJour(0.08), null);
  assert.equal(detecteur.estPince, false);
});

test('rapprocher les doigts sous le seuil de fermeture déclenche un début de pincement', () => {
  const detecteur = new DetecteurPincement(SEUILS);
  assert.equal(detecteur.mettreAJour(0.02), EVENEMENT_PINCEMENT.DEBUT);
  assert.equal(detecteur.estPince, true);
});

test('le seuil de fermeture est inclus', () => {
  const detecteur = new DetecteurPincement(SEUILS);
  assert.equal(detecteur.mettreAJour(0.025), EVENEMENT_PINCEMENT.DEBUT);
});

test('le début de pincement n’est signalé qu’une seule fois', () => {
  const detecteur = new DetecteurPincement(SEUILS);
  detecteur.mettreAJour(0.02);
  assert.equal(detecteur.mettreAJour(0.015), null);
  assert.equal(detecteur.mettreAJour(0.02), null);
});

test('un léger tremblement entre les deux seuils ne relâche pas la brique', () => {
  const detecteur = new DetecteurPincement(SEUILS);
  detecteur.mettreAJour(0.02);
  for (const distance of [0.03, 0.035, 0.028, 0.04]) {
    assert.equal(detecteur.mettreAJour(distance), null, `distance ${distance}`);
  }
  assert.equal(detecteur.estPince, true);
});

test('écarter les doigts au-delà du seuil d’ouverture déclenche une fin de pincement', () => {
  const detecteur = new DetecteurPincement(SEUILS);
  detecteur.mettreAJour(0.02);
  assert.equal(detecteur.mettreAJour(0.045), EVENEMENT_PINCEMENT.FIN);
  assert.equal(detecteur.estPince, false);
});

test('entre les deux seuils, une main ouverte ne commence pas de pincement', () => {
  const detecteur = new DetecteurPincement(SEUILS);
  assert.equal(detecteur.mettreAJour(0.03), null);
  assert.equal(detecteur.estPince, false);
});

test('la perte du suivi de la main pendant un pincement relâche la brique', () => {
  const detecteur = new DetecteurPincement(SEUILS);
  detecteur.mettreAJour(0.02);
  assert.equal(detecteur.mettreAJour(null), EVENEMENT_PINCEMENT.FIN);
  assert.equal(detecteur.estPince, false);
});

test('la perte du suivi d’une main ouverte ne déclenche rien', () => {
  const detecteur = new DetecteurPincement(SEUILS);
  assert.equal(detecteur.mettreAJour(null), null);
});

test('un nouveau pincement est possible après un relâchement', () => {
  const detecteur = new DetecteurPincement(SEUILS);
  detecteur.mettreAJour(0.02);
  detecteur.mettreAJour(0.05);
  assert.equal(detecteur.mettreAJour(0.02), EVENEMENT_PINCEMENT.DEBUT);
});

test('des seuils incohérents sont refusés avec un message clair', () => {
  assert.throws(
    () => new DetecteurPincement({ seuilFermeture: 0.04, seuilOuverture: 0.03 }),
    RangeError,
  );
  assert.throws(
    () => new DetecteurPincement({ seuilFermeture: 0, seuilOuverture: 0.03 }),
    RangeError,
  );
  assert.throws(
    () => new DetecteurPincement({ seuilFermeture: Number.NaN, seuilOuverture: 0.03 }),
    RangeError,
  );
});
