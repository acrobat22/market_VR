/**
 * @file Tests du catalogue des articles : identifiants uniques, modèles présents.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';

import { ARTICLES } from '../src/marche/articles.js';

test('les identifiants et les noms sont uniques', () => {
  assert.equal(new Set(ARTICLES.map((article) => article.id)).size, ARTICLES.length);
  assert.equal(new Set(ARTICLES.map((article) => article.nom)).size, ARTICLES.length);
});

test('chaque article a une quantité exposée positive', () => {
  for (const article of ARTICLES) {
    assert.ok(Number.isInteger(article.quantite) && article.quantite >= 1, article.id);
  }
});

test('le modèle 3D de chaque article est présent dans les ressources', async () => {
  for (const article of ARTICLES) {
    const chemin = new URL(`../ressources/modeles/${article.modele}/${article.modele}.gltf`, import.meta.url);
    await assert.doesNotReject(access(chemin), article.modele);
  }
});
