/**
 * @file Tests de la partie (liste cochée au fil des dépôts) et du panier.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Partie } from '../src/jeu/partie.js';
import { estAuDessusDuPanier } from '../src/jeu/panier.js';

const LISTE = [
  { id: 'pomme', nom: 'Pommes' },
  { id: 'kiwi', nom: 'Kiwis' },
  { id: 'oignon', nom: 'Oignons' },
];

test('une nouvelle partie n’a rien de coché', () => {
  const partie = new Partie(LISTE);
  assert.equal(partie.nombreCochees, 0);
  assert.equal(partie.estTerminee, false);
  assert.ok(partie.lignes.every((ligne) => !ligne.estCochee));
});

test('un article de la liste est accepté et coché', () => {
  const partie = new Partie(LISTE);
  assert.equal(partie.deposer('kiwi'), true);
  assert.equal(partie.lignes[1].estCochee, true);
  assert.equal(partie.nombreCochees, 1);
});

test('un article hors liste est refusé', () => {
  const partie = new Partie(LISTE);
  assert.equal(partie.deposer('citron'), false);
  assert.equal(partie.nombreCochees, 0);
});

test('un article déjà coché est refusé la seconde fois', () => {
  const partie = new Partie(LISTE);
  partie.deposer('pomme');
  assert.equal(partie.deposer('pomme'), false);
  assert.equal(partie.nombreCochees, 1);
});

test('la partie est terminée quand tout est coché', () => {
  const partie = new Partie(LISTE);
  partie.deposer('oignon');
  partie.deposer('pomme');
  assert.equal(partie.estTerminee, false);
  partie.deposer('kiwi');
  assert.equal(partie.estTerminee, true);
});

test('la liste reçue n’est pas modifiée', () => {
  const copie = structuredClone(LISTE);
  new Partie(LISTE).deposer('pomme');
  assert.deepEqual(LISTE, copie);
});

// Valeurs exactes en binaire, pour tester le bord sans erreur d'arrondi.
const ZONE = { centre: { x: 0, z: -0.5 }, demiLargeur: 0.25, demiProfondeur: 0.125, hauteurMaximale: 1.125 };

test('un article lâché au-dessus du panier y tombe', () => {
  assert.equal(estAuDessusDuPanier({ x: 0.05, y: 0.95, z: -0.45 }, ZONE), true);
});

test('le bord de la zone compte encore comme dans le panier', () => {
  assert.equal(estAuDessusDuPanier({ x: 0.25, y: 1.125, z: -0.625 }, ZONE), true);
});

test('un article lâché à côté du panier n’y tombe pas', () => {
  assert.equal(estAuDessusDuPanier({ x: 0.3, y: 0.95, z: -0.5 }, ZONE), false);
  assert.equal(estAuDessusDuPanier({ x: 0, y: 0.95, z: -0.7 }, ZONE), false);
});

test('un article lâché trop haut n’y tombe pas', () => {
  assert.equal(estAuDessusDuPanier({ x: 0, y: 1.3, z: -0.5 }, ZONE), false);
});
