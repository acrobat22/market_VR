/**
 * @file Tests de la disposition de l'étal en arc : tout est à portée de main
 * d'un joueur assis, et rien ne se chevauche.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CONFIG } from '../src/config.js';
import { disposerEtal } from '../src/marche/disposition.js';

const ETAL = CONFIG.etal;
const CAGETTE = CONFIG.cagette;

/**
 * Joueur âgé assis à l'origine : épaules à 1,02 m du sol, à 18 cm de part et
 * d'autre, 5 cm en arrière des yeux (l'origine de la VR est la tête).
 */
const EPAULES = [-0.18, 0.18].map((x) => ({ x, y: 1.02, z: 0.05 }));

/**
 * Portée de l'épaule au bout des doigts, assis : le rang avant sans se
 * pencher, le gradin en se penchant d'une dizaine de centimètres au plus.
 */
const PORTEE_AVANT = 0.65;
const PORTEE_ARRIERE = 0.75;

/** Panier « wicker_basket_01 » : empreinte mesurée sur le modèle (38 × 30 cm). */
const PANIER = { largeur: 0.38, profondeur: 0.3 };

/** Cagettes : en travers au rang avant, en long sur le gradin. */
const CAGETTE_AVANT = { largeur: CAGETTE.largeur, profondeur: CAGETTE.profondeur };
const CAGETTE_ARRIERE = { largeur: CAGETTE.profondeur, profondeur: CAGETTE.largeur };

const DISPOSITION = disposerEtal(ETAL, 2, 6);

/**
 * Distance à l'épaule la plus proche.
 *
 * @param {{ x: number, z: number }} pose - Centre au sol.
 * @param {number} hauteur - Hauteur du point à atteindre (dessus du contenu).
 * @returns {number}
 */
function distanceEpaule(pose, hauteur) {
  return Math.min(...EPAULES.map((epaule) => Math.hypot(pose.x - epaule.x, hauteur - epaule.y, pose.z - epaule.z)));
}

/**
 * Coins d'une empreinte rectangulaire posée et tournée (vue de dessus).
 *
 * @param {{ x: number, z: number, lacet: number }} pose - Centre et rotation.
 * @param {{ largeur: number, profondeur: number }} taille - Dimensions.
 * @returns {number[][]} Quatre coins [x, z].
 */
function coins(pose, { largeur, profondeur }) {
  const cosinus = Math.cos(pose.lacet);
  const sinus = Math.sin(pose.lacet);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => {
    const a = u * largeur / 2;
    const b = v * profondeur / 2;
    // Rotation de Three.js autour de y : x' = x cos + z sin, z' = -x sin + z cos.
    return [pose.x + a * cosinus + b * sinus, pose.z - a * sinus + b * cosinus];
  });
}

/**
 * Écart entre deux rectangles (vue de dessus), par les axes séparateurs :
 * positif s'ils sont séparés, négatif s'ils se chevauchent.
 *
 * @param {number[][]} premier - Coins du premier.
 * @param {number[][]} second - Coins du second.
 * @returns {number}
 */
function ecart(premier, second) {
  let meilleur = -Infinity;
  for (const polygone of [premier, second]) {
    for (let indice = 0; indice < 4; indice++) {
      const [x1, z1] = polygone[indice];
      const [x2, z2] = polygone[(indice + 1) % 4];
      const longueur = Math.hypot(x2 - x1, z2 - z1);
      const normale = [(z2 - z1) / longueur, (x1 - x2) / longueur];
      const projeter = (points) => points.map(([x, z]) => x * normale[0] + z * normale[1]);
      const a = projeter(premier);
      const b = projeter(second);
      meilleur = Math.max(meilleur, Math.min(...b) - Math.max(...a), Math.min(...a) - Math.max(...b));
    }
  }
  return meilleur;
}

/**
 * Déplacement maximal d'un coin dû au désordre (angle et position au hasard).
 *
 * @param {{ largeur: number, profondeur: number }} taille - Dimensions.
 * @returns {number}
 */
function desordreMaximal({ largeur, profondeur }) {
  return Math.hypot(largeur, profondeur) / 2 * (ETAL.desordreAngle / 2) + Math.SQRT2 * ETAL.desordrePosition / 2;
}

test('le panier et le rang avant sont à portée de main, assis', () => {
  const dessusContenu = ETAL.hauteur + CAGETTE.hauteur;
  for (const pose of [DISPOSITION.panier, ...DISPOSITION.rangAvant]) {
    const distance = distanceEpaule(pose, dessusContenu);
    assert.ok(distance <= PORTEE_AVANT, `(${pose.x.toFixed(2)} ; ${pose.z.toFixed(2)}) à ${distance.toFixed(2)} m`);
  }
});

test('le gradin est à portée en se penchant à peine', () => {
  const dessusContenu = ETAL.hauteur + ETAL.hauteurGradin + CAGETTE.hauteur;
  for (const pose of DISPOSITION.rangArriere) {
    const distance = distanceEpaule(pose, dessusContenu);
    assert.ok(distance <= PORTEE_ARRIERE, `(${pose.x.toFixed(2)} ; ${pose.z.toFixed(2)}) à ${distance.toFixed(2)} m`);
  }
});

test('rien ne se chevauche, même avec le désordre au hasard', () => {
  const avant = [
    // Le panier est posé exactement (sans désordre) : la zone de dépôt en dépend.
    { coins: coins(DISPOSITION.panier, PANIER), marge: 0 },
    ...DISPOSITION.rangAvant.map((pose) => ({ coins: coins(pose, CAGETTE_AVANT), marge: desordreMaximal(CAGETTE_AVANT) })),
  ];
  const arriere = DISPOSITION.rangArriere.map((pose) => ({
    coins: coins(pose, CAGETTE_ARRIERE), marge: desordreMaximal(CAGETTE_ARRIERE),
  }));
  // Le rang avant et le gradin sont à des hauteurs différentes : chaque rang est vérifié à part.
  for (const rang of [avant, arriere]) {
    for (let i = 0; i < rang.length; i++) {
      for (let j = i + 1; j < rang.length; j++) {
        const distance = ecart(rang[i].coins, rang[j].coins);
        assert.ok(distance > rang[i].marge + rang[j].marge, `éléments ${i} et ${j} : écart ${distance.toFixed(3)} m`);
      }
    }
  }
});

test('le rang avant tient devant le gradin, et le gradin porte ses cagettes', () => {
  const rayon = ([x, z]) => Math.hypot(x, z);
  const coinsAvant = [coins(DISPOSITION.panier, PANIER), ...DISPOSITION.rangAvant.map((pose) => coins(pose, CAGETTE_AVANT))].flat();
  const coinsArriere = DISPOSITION.rangArriere.flatMap((pose) => coins(pose, CAGETTE_ARRIERE));
  assert.ok(Math.max(...coinsAvant.map(rayon)) < ETAL.rayonGradin, 'le rang avant empiète sur le gradin');
  assert.ok(Math.min(...coinsAvant.map(rayon)) > ETAL.rayonInterieur, 'le rang avant dépasse du bord du comptoir');
  // Une cagette du gradin peut le déborder un peu (au-dessus du rang avant), 6 cm au plus.
  assert.ok(Math.min(...coinsArriere.map(rayon)) > ETAL.rayonGradin - 0.06, 'une cagette déborde trop du gradin');
  assert.ok(Math.max(...coinsArriere.map(rayon)) < ETAL.rayonExterieur, 'une cagette dépasse du fond du comptoir');
  // Les cagettes restent dans l'angle couvert par le gradin et le comptoir.
  const angle = ([x, z]) => Math.abs(Math.atan2(x, -z));
  assert.ok(Math.max(...coinsArriere.map(angle)) < ETAL.angleGradin, 'une cagette dépasse du bout du gradin');
  assert.ok(Math.max(...coinsAvant.map(angle)) < ETAL.angleComptoir, 'une cagette dépasse du bout du comptoir');
});

test('le gradin dépasse le dessus du rang avant, qu’il surplombe', () => {
  const dessusRangAvant = ETAL.hauteur + Math.max(CAGETTE.hauteur, 0.117);
  assert.ok(ETAL.hauteur + ETAL.hauteurGradin > dessusRangAvant);
});

test('toutes les cagettes de l’étal sont placées', () => {
  assert.equal(DISPOSITION.rangAvant.length + DISPOSITION.rangArriere.length, ETAL.nombreCagettes);
});
