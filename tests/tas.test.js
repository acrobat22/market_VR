/**
 * @file Tests du tas d'articles (carte des hauteurs, formes réelles).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PAS_CARTE, Tas, profilDeTriangles } from '../src/marche/tas.js';

/** Générateur pseudo-aléatoire reproductible (pour des tests stables). */
function generateur(graine) {
  let etat = graine;
  return () => {
    etat = (etat * 1664525 + 1013904223) % 4294967296;
    return etat / 4294967296;
  };
}

/**
 * Maillage en triangles d'une surface paramétrée (grille latitude × longitude).
 *
 * @param {(i: number, j: number) => number[]} sommet - Position [x, y, z] du point (i, j).
 * @param {number} lignes - Nombre de divisions selon i.
 * @param {number} colonnes - Nombre de divisions selon j (fermé : j = colonnes revient à 0).
 * @returns {number[]} Triangles à la suite (9 nombres par triangle).
 */
function mailler(sommet, lignes, colonnes) {
  const triangles = [];
  for (let i = 0; i < lignes; i++) {
    for (let j = 0; j < colonnes; j++) {
      const [a, b, c, d] = [sommet(i, j), sommet(i + 1, j), sommet(i + 1, j + 1), sommet(i, j + 1)];
      triangles.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
  }
  return triangles;
}

/**
 * Maillage d'un ovoïde, tourné autour de la verticale.
 *
 * @param {number} demiX - Demi-longueur (avant rotation).
 * @param {number} demiY - Demi-hauteur.
 * @param {number} demiZ - Demi-largeur (avant rotation).
 * @param {number} [lacet=0] - Rotation autour de la verticale.
 * @returns {number[]}
 */
function ovoide(demiX, demiY, demiZ, lacet = 0) {
  const cosinus = Math.cos(lacet);
  const sinus = Math.sin(lacet);
  return mailler((i, j) => {
    const latitude = Math.PI * (i / 40 - 0.5);
    const longitude = 2 * Math.PI * j / 80;
    const x = demiX * Math.cos(latitude) * Math.cos(longitude);
    const z = demiZ * Math.cos(latitude) * Math.sin(longitude);
    return [x * cosinus + z * sinus, demiY * Math.sin(latitude), -x * sinus + z * cosinus];
  }, 40, 80);
}

/**
 * Maillage d'un cône pointe en haut, base plate au sol.
 *
 * @param {number} rayon - Rayon de la base.
 * @param {number} hauteur - Hauteur de la pointe.
 * @returns {number[]}
 */
function maillageCone(rayon, hauteur) {
  const point = (r, j, y) => [r * Math.cos(2 * Math.PI * j / 80), y, r * Math.sin(2 * Math.PI * j / 80)];
  return [
    ...mailler((i, j) => point(rayon * i / 20, j, hauteur * (1 - i / 20)), 20, 80),
    ...mailler((i, j) => point(rayon * i / 20, j, 0), 20, 80),
  ];
}

/**
 * Maillage d'un cube (douze triangles).
 *
 * @param {number} cote - Longueur d'une arête.
 * @returns {number[]}
 */
function maillageCube(cote) {
  const s = (x, y, z) => [x * cote, y * cote, z * cote];
  const face = (a, b, c, d) => [...a, ...b, ...c, ...a, ...c, ...d];
  return [
    ...face(s(0, 0, 0), s(1, 0, 0), s(1, 0, 1), s(0, 0, 1)),
    ...face(s(0, 1, 0), s(1, 1, 0), s(1, 1, 1), s(0, 1, 1)),
    ...face(s(0, 0, 0), s(1, 0, 0), s(1, 1, 0), s(0, 1, 0)),
    ...face(s(0, 0, 1), s(1, 0, 1), s(1, 1, 1), s(0, 1, 1)),
    ...face(s(0, 0, 0), s(0, 0, 1), s(0, 1, 1), s(0, 1, 0)),
    ...face(s(1, 0, 0), s(1, 0, 1), s(1, 1, 1), s(1, 1, 0)),
  ];
}

const CAGETTE = { largeur: 0.28, profondeur: 0.22, hauteurFond: 0.01 };
const POMME = profilDeTriangles(ovoide(0.04, 0.04, 0.04));

test('le profil d’une sphère suit sa vraie surface', () => {
  assert.ok(Math.abs(POMME.hauteur - 0.08) < 1e-6);
  assert.equal(POMME.colonnes, Math.ceil(0.08 / PAS_CARTE));
  // Près du centre, le dessous touche le bas et le dessus atteint le haut.
  const centre = (POMME.rangees >> 1) * POMME.colonnes + (POMME.colonnes >> 1);
  assert.ok(POMME.dessous[centre] < 0.002 && POMME.dessus[centre] > 0.078);
  // Sur le flanc, la surface est lue au centre de la case, pas à ses bords :
  // à 3,25 cm de l'axe d'une sphère de 4 cm, demi-épaisseur √(4² − 3,25²) ≈ 2,33 cm.
  const flanc = (POMME.rangees >> 1) * POMME.colonnes + (POMME.colonnes >> 1) + 6;
  const attendu = Math.sqrt(0.04 ** 2 - 0.0325 ** 2);
  assert.ok(Math.abs(POMME.dessus[flanc] - (0.04 + attendu)) < 0.001, `${POMME.dessus[flanc]}`);
  assert.ok(Math.abs(POMME.dessous[flanc] - (0.04 - attendu)) < 0.001, `${POMME.dessous[flanc]}`);
});

test('le premier article repose sur le fond', () => {
  const tas = new Tas(CAGETTE);
  // À une fraction de millimètre près (la surface est lue au centre de cases de 5 mm).
  assert.ok(Math.abs(tas.deposer(POMME, generateur(1)).bas - CAGETTE.hauteurFond) < 0.001);
});

test('un article lâché au même endroit qu’un autre se pose dessus', () => {
  const tas = new Tas(CAGETTE);
  const auCentre = () => 0.5;
  const premiere = tas.deposer(POMME, auCentre);
  const seconde = tas.deposer(POMME, auCentre);
  assert.ok(Math.abs(seconde.bas - (premiere.bas + POMME.hauteur)) < 0.002, `${seconde.bas}`);
});

test('un cube posé sur un cube repose à plat dessus', () => {
  const tas = new Tas(CAGETTE);
  const cube = profilDeTriangles(maillageCube(0.05));
  const auCentre = () => 0.5;
  tas.deposer(cube, auCentre);
  assert.ok(Math.abs(tas.deposer(cube, auCentre).bas - (CAGETTE.hauteurFond + 0.05)) < 1e-9);
});

test('un article posé sur une pointe descend jusqu’à la toucher (pas d’ovoïde englobant)', () => {
  const tas = new Tas(CAGETTE);
  const auCentre = () => 0.5;
  const cone = profilDeTriangles(maillageCone(0.05, 0.06));
  tas.deposer(cone, auCentre);
  // Une petite boule à côté de la pointe, sur le flanc : avec un ovoïde
  // englobant le cône, elle serait restée bien plus haut.
  const boule = profilDeTriangles(ovoide(0.015, 0.015, 0.015));
  const decaleDeTroisCases = [0.5 + 3 / (tas.colonnes - boule.colonnes), 0.5];
  let tirage = 0;
  const place = tas.deposer(boule, () => decaleDeTroisCases[tirage++ % 2]);
  // Le flanc du cône, à environ 3,5 cm du centre de la boule… elle se pose sur la pente.
  assert.ok(place.bas < CAGETTE.hauteurFond + 0.06, `${place.bas}`);
  assert.ok(place.bas > CAGETTE.hauteurFond + 0.02, `${place.bas}`);
});

test('les articles restent dans la cagette, même allongés et tournés', () => {
  const tas = new Tas(CAGETTE);
  const hasard = generateur(3);
  for (let indice = 0; indice < 20; indice++) {
    const profil = profilDeTriangles(ovoide(0.09, 0.02, 0.02, hasard() * Math.PI * 2));
    const { x, z } = tas.deposer(profil, hasard);
    assert.ok(Math.abs(x) + profil.colonnes * PAS_CARTE / 2 <= CAGETTE.largeur / 2 + 1e-9, `x = ${x}`);
    assert.ok(Math.abs(z) + profil.rangees * PAS_CARTE / 2 <= CAGETTE.profondeur / 2 + 1e-9, `z = ${z}`);
  }
});

test('les creux se remplissent d’abord : le tas reste bas et ne fait pas de tour', () => {
  const tas = new Tas(CAGETTE);
  const hasard = generateur(7);
  const places = Array.from({ length: 12 }, () => tas.deposer(POMME, hasard));
  // 12 pommes de 8 cm dans 28 × 22 cm : deux couches au plus.
  const plusHaut = Math.max(...places.map((place) => place.bas));
  assert.ok(plusHaut <= CAGETTE.hauteurFond + 2 * POMME.hauteur, `${plusHaut}`);
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
      assert.ok(distance >= POMME.hauteur - 0.01, `distance ${distance}`);
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
