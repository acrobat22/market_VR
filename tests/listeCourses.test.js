/**
 * @file Tests du tirage au hasard de la liste de courses.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { tirerListe } from '../src/jeu/listeCourses.js';

/** Générateur pseudo-aléatoire reproductible (pour des tests stables). */
function generateur(graine) {
  let etat = graine;
  return () => {
    etat = (etat * 1664525 + 1013904223) % 4294967296;
    return etat / 4294967296;
  };
}

const ARTICLES = ['pomme', 'citron', 'kiwi', 'avocat', 'oignon', 'croissant', 'bananes'];

test('la liste contient le nombre d’articles demandé', () => {
  assert.equal(tirerListe(ARTICLES, 5, generateur(1)).length, 5);
});

test('la liste ne contient jamais deux fois le même article', () => {
  for (let graine = 1; graine < 50; graine++) {
    const liste = tirerListe(ARTICLES, 5, generateur(graine));
    assert.equal(new Set(liste).size, liste.length, `graine ${graine}`);
  }
});

test('la liste ne contient que des articles proposés', () => {
  const liste = tirerListe(ARTICLES, 5, generateur(7));
  assert.ok(liste.every((article) => ARTICLES.includes(article)));
});

test('deux tirages différents donnent des listes différentes', () => {
  assert.notDeepEqual(tirerListe(ARTICLES, 4, generateur(1)), tirerListe(ARTICLES, 4, generateur(2)));
});

test('demander plus d’articles qu’il n’en existe les donne tous', () => {
  assert.equal(tirerListe(ARTICLES, 20, generateur(3)).length, ARTICLES.length);
});

test('le tirage ne modifie pas la liste des articles proposés', () => {
  const copie = [...ARTICLES];
  tirerListe(ARTICLES, 5, generateur(4));
  assert.deepEqual(ARTICLES, copie);
});

test('une taille invalide est refusée', () => {
  assert.throws(() => tirerListe(ARTICLES, 0), RangeError);
  assert.throws(() => tirerListe(ARTICLES, 2.5), RangeError);
});
