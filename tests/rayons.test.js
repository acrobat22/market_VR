/**
 * @file Tests des rayons : chaque article a un rayon connu, chaque étal
 * peut fournir une liste complète.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ARTICLES } from '../src/marche/articles.js';
import { RAYONS, articlesDuRayon } from '../src/marche/rayons.js';
import { CONFIG } from '../src/config.js';

test('chaque article appartient à un rayon connu', () => {
  const rayons = new Set(RAYONS.map((rayon) => rayon.id));
  for (const article of ARTICLES) {
    assert.ok(rayons.has(article.rayon), `${article.id} : rayon « ${article.rayon} » inconnu`);
  }
});

test('chaque étal a assez d’articles pour la plus longue liste', () => {
  for (const rayon of RAYONS) {
    const nombre = articlesDuRayon(ARTICLES, rayon.id).length;
    assert.ok(nombre >= CONFIG.liste.tailleMaximale, `${rayon.id} : ${nombre} articles`);
  }
});

test('l’étal de légumes ne vend que des légumes', () => {
  const ids = articlesDuRayon(ARTICLES, 'legumes').map((article) => article.id);
  assert.ok(ids.includes('carotte') && ids.includes('oignon'));
  assert.ok(!ids.includes('pomme'));
});

test('l’étal de fruits ne vend que des fruits', () => {
  const ids = articlesDuRayon(ARTICLES, 'fruits').map((article) => article.id);
  assert.ok(ids.includes('pomme'));
  assert.ok(!ids.includes('carotte') && !ids.includes('oignon'));
});
