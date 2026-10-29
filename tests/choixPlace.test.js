/**
 * @file Tests du choix de la place de marché.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { choisirPlace } from '../src/coeur/choixPlace.js';

/** Générateur pseudo-aléatoire reproductible (pour des tests stables). */
function generateur(graine) {
  let etat = graine;
  return () => {
    etat = (etat * 1664525 + 1013904223) % 4294967296;
    return etat / 4294967296;
  };
}

const PLACES = ['dresde', 'ulm', 'venise', 'furstenstein', 'rome'].map((nom) => ({ nom }));

test('la place choisie fait partie des places possibles', () => {
  for (let graine = 1; graine < 50; graine++) {
    assert.ok(PLACES.includes(choisirPlace(PLACES, { hasard: generateur(graine) })), `graine ${graine}`);
  }
});

test('la place précédente n’est jamais choisie deux fois de suite', () => {
  for (let graine = 1; graine < 200; graine++) {
    const place = choisirPlace(PLACES, { nomPrecedent: 'venise', hasard: generateur(graine) });
    assert.notEqual(place.nom, 'venise', `graine ${graine}`);
  }
});

test('toutes les autres places finissent par sortir', () => {
  // Un seul générateur pour tous les tirages : avec des graines voisines,
  // le premier nombre tiré est presque toujours le même.
  const hasard = generateur(1);
  const sorties = new Set();
  for (let tirage = 0; tirage < 200; tirage++) {
    sorties.add(choisirPlace(PLACES, { nomPrecedent: 'dresde', hasard }).nom);
  }
  assert.deepEqual([...sorties].sort(), ['furstenstein', 'rome', 'ulm', 'venise']);
});

test('une place demandée par son nom est imposée, même si elle était la précédente', () => {
  const place = choisirPlace(PLACES, { nomDemande: 'rome', nomPrecedent: 'rome', hasard: generateur(1) });
  assert.equal(place.nom, 'rome');
});

test('une place demandée inconnue est ignorée (tirage au hasard)', () => {
  const place = choisirPlace(PLACES, { nomDemande: 'paris', hasard: generateur(3) });
  assert.ok(PLACES.includes(place));
});

test('avec une seule place, elle est choisie même si c’était la précédente', () => {
  assert.equal(choisirPlace([PLACES[0]], { nomPrecedent: 'dresde' }), PLACES[0]);
});

test('une liste vide est refusée', () => {
  assert.throws(() => choisirPlace([]), RangeError);
});
