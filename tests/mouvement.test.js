/**
 * @file Tests de l'accrochage magnétique et du glissement.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { estAPortee, adoucir, interpoler } from '../src/jeu/mouvement.js';

const CIBLE = { x: 0, y: 1, z: 0 };

test('une brique lâchée tout près de sa place s’accroche', () => {
  assert.equal(estAPortee({ x: 0.03, y: 1, z: 0.02 }, CIBLE, 0.05), true);
});

test('la distance limite est incluse', () => {
  assert.equal(estAPortee({ x: 0.05, y: 1, z: 0 }, CIBLE, 0.05), true);
});

test('une brique lâchée trop loin ne s’accroche pas', () => {
  assert.equal(estAPortee({ x: 0.04, y: 1.04, z: 0 }, CIBLE, 0.05), false);
});

test('l’adoucissement part de 0, arrive à 1 et passe par le milieu', () => {
  assert.equal(adoucir(0), 0);
  assert.equal(adoucir(1), 1);
  assert.equal(adoucir(0.5), 0.5);
});

test('l’adoucissement est borné entre 0 et 1', () => {
  assert.equal(adoucir(-0.5), 0);
  assert.equal(adoucir(2), 1);
});

test('l’adoucissement démarre et finit lentement', () => {
  assert.ok(adoucir(0.1) < 0.1);
  assert.ok(adoucir(0.9) > 0.9);
});

test('l’interpolation donne le départ, l’arrivée et le milieu', () => {
  const depart = { x: 0, y: 0, z: 0 };
  const arrivee = { x: 2, y: 4, z: -2 };
  assert.deepEqual(interpoler(depart, arrivee, 0), depart);
  assert.deepEqual(interpoler(depart, arrivee, 1), arrivee);
  assert.deepEqual(interpoler(depart, arrivee, 0.5), { x: 1, y: 2, z: -1 });
});
