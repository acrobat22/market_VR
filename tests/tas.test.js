/**
 * @file Tests du tas d'articles (carte des hauteurs).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Tas } from '../src/marche/tas.js';

/** Générateur pseudo-aléatoire reproductible (pour des tests stables). */
function generateur(graine) {
  let etat = graine;
  return () => {
    etat = (etat * 1664525 + 1013904223) % 4294967296;
    return etat / 4294967296;
  };
}

const CAGETTE = { largeur: 0.28, profondeur: 0.22, hauteurFond: 0.01 };
const POMME = { demiLongueur: 0.04, demiLargeur: 0.04, demiHauteur: 0.04, lacet: 0 };
const CAROTTE = { demiLongueur: 0.09, demiLargeur: 0.02, demiHauteur: 0.02, lacet: 0.7 };

test('le premier article repose sur le fond', () => {
  const tas = new Tas(CAGETTE);
  // À une fraction de millimètre près (la carte des hauteurs est en cases de 5 mm).
  assert.ok(Math.abs(tas.deposer(POMME, generateur(1)).bas - CAGETTE.hauteurFond) < 0.001);
});

test('un article lâché au même endroit qu’un autre se pose dessus', () => {
  const tas = new Tas(CAGETTE);
  const auCentre = () => 0.5;
  const premiere = tas.deposer(POMME, auCentre);
  const seconde = tas.deposer(POMME, auCentre);
  assert.ok(Math.abs(seconde.bas - (premiere.bas + 2 * POMME.demiHauteur)) < 0.005, `${seconde.bas}`);
});

test('les articles restent dans la cagette, même allongés et tournés', () => {
  const tas = new Tas(CAGETTE);
  const hasard = generateur(3);
  for (let indice = 0; indice < 20; indice++) {
    const forme = { ...CAROTTE, lacet: hasard() * Math.PI * 2 };
    const { x, z } = tas.deposer(forme, hasard);
    const etendueX = Math.hypot(forme.demiLongueur * Math.cos(forme.lacet), forme.demiLargeur * Math.sin(forme.lacet));
    const etendueZ = Math.hypot(forme.demiLongueur * Math.sin(forme.lacet), forme.demiLargeur * Math.cos(forme.lacet));
    assert.ok(Math.abs(x) + etendueX <= CAGETTE.largeur / 2 + 1e-9, `x = ${x}`);
    assert.ok(Math.abs(z) + etendueZ <= CAGETTE.profondeur / 2 + 1e-9, `z = ${z}`);
  }
});

test('les creux se remplissent d’abord : le tas reste bas et ne fait pas de tour', () => {
  const tas = new Tas(CAGETTE);
  const hasard = generateur(7);
  const places = Array.from({ length: 12 }, () => tas.deposer(POMME, hasard));
  // 12 pommes de 8 cm dans 28 × 22 cm : deux couches au plus.
  const plusHaut = Math.max(...places.map((place) => place.bas));
  assert.ok(plusHaut <= CAGETTE.hauteurFond + 2 * 2 * POMME.demiHauteur, `${plusHaut}`);
});

test('deux articles posés côte à côte au fond ne se chevauchent pas', () => {
  const tas = new Tas(CAGETTE);
  const hasard = generateur(11);
  const places = [];
  for (let indice = 0; indice < 6; indice++) {
    places.push(tas.deposer(POMME, hasard));
  }
  const auFond = places.filter((place) => place.bas < CAGETTE.hauteurFond + 1e-6);
  for (let i = 0; i < auFond.length; i++) {
    for (let j = i + 1; j < auFond.length; j++) {
      const distance = Math.hypot(auFond[i].x - auFond[j].x, auFond[i].z - auFond[j].z);
      // Deux sphères au fond ne peuvent pas être plus proches que leur diamètre (à une case près).
      assert.ok(distance >= 2 * POMME.demiLongueur - 0.01, `distance ${distance}`);
    }
  }
});

test('un contenant plein refuse les articles qui seraient posés trop haut', () => {
  const tas = new Tas(CAGETTE);
  const hasard = generateur(13);
  const basMaximal = CAGETTE.hauteurFond + 0.06;
  let posees = 0;
  for (let indice = 0; indice < 40; indice++) {
    const place = tas.deposer(POMME, hasard, basMaximal);
    if (place) {
      posees += 1;
      assert.ok(place.bas <= basMaximal, `${place.bas}`);
    }
  }
  assert.ok(posees > 0 && posees < 40, `${posees} pommes posées`);
});
