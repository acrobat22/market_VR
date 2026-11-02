/**
 * @file Tests du catalogue des articles : identifiants uniques, modèles présents.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';

import { ARTICLES, calculerEchelle } from '../src/marche/articles.js';

test('les identifiants et les noms sont uniques', () => {
  assert.equal(new Set(ARTICLES.map((article) => article.id)).size, ARTICLES.length);
  assert.equal(new Set(ARTICLES.map((article) => article.singulier)).size, ARTICLES.length);
  assert.equal(new Set(ARTICLES.map((article) => article.pluriel)).size, ARTICLES.length);
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

test('chaque article a une taille réelle plausible (entre 2 et 40 cm)', () => {
  for (const article of ARTICLES) {
    assert.ok(article.taille >= 0.02 && article.taille <= 0.4, `${article.id} : ${article.taille} m`);
  }
});

test('l’échelle met un modèle à sa taille réelle, d’après la moyenne de ses variantes', () => {
  // Scan de 20 cm pour une carotte de 18 cm.
  assert.ok(Math.abs(calculerEchelle(0.18, [0.2]) - 0.9) < 1e-9);
  // Variantes de 6 et 10 cm (moyenne 8 cm) pour une taille de 8 cm : échelle 1.
  assert.equal(calculerEchelle(0.08, [0.06, 0.1]), 1);
});

test('sans mesure exploitable, l’échelle reste à 1', () => {
  assert.equal(calculerEchelle(0.1, []), 1);
  assert.equal(calculerEchelle(0.1, [0]), 1);
});
