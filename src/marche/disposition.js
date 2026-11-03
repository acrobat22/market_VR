/**
 * @file Disposition de l'étal en arc autour du joueur assis.
 *
 * Logique pure (sans Three.js), testable avec `node --test`. Le joueur est
 * assis à l'origine, face à -z. Tout est placé sur des arcs centrés sur lui,
 * pour que chaque cagette reste à portée de main sans se lever : le panier
 * et deux cagettes devant, six cagettes sur le gradin derrière.
 *
 * Un angle est mesuré depuis l'axe -z (droit devant), positif vers la droite (+x).
 */

/**
 * @typedef {object} Pose
 * @property {number} x - Centre (repère de la scène).
 * @property {number} z - Centre (repère de la scène).
 * @property {number} angle - Angle sur l'arc, depuis l'axe -z (positif vers +x).
 * @property {number} lacet - Rotation autour de la verticale (`rotation.y` de Three.js)
 *   pour que la face avant (+z local) regarde le joueur.
 */

/**
 * @typedef {object} DispositionEtal
 * @property {Pose} panier - Panier du joueur, droit devant.
 * @property {Pose[]} rangAvant - Cagettes du rang avant, de part et d'autre du panier.
 * @property {Pose[]} rangArriere - Cagettes du gradin, de gauche à droite.
 */

/**
 * Point sur un arc centré sur le joueur, tourné vers lui.
 *
 * @param {number} rayon - Distance au joueur, en mètres.
 * @param {number} angle - Angle depuis l'axe -z, en radians (positif vers +x).
 * @returns {Pose}
 */
export function surArc(rayon, angle) {
  return { x: rayon * Math.sin(angle), z: -rayon * Math.cos(angle), angle, lacet: -angle };
}

/**
 * Calcule la place du panier et des cagettes.
 *
 * @param {object} reglages - Réglages de l'étal (`CONFIG.etal`).
 * @param {number} reglages.rayonPanier - Distance du centre du panier au joueur.
 * @param {number} reglages.rayonRangAvant - Distance des cagettes avant au joueur.
 * @param {number} reglages.angleRangAvant - Angle des cagettes avant, de part et d'autre.
 * @param {number} reglages.rayonRangArriere - Distance des cagettes du gradin au joueur.
 * @param {number} reglages.pasRangArriere - Angle entre deux cagettes voisines du gradin.
 * @param {number} nombreAvant - Cagettes au rang avant (2 au plus).
 * @param {number} nombreArriere - Cagettes sur le gradin.
 * @returns {DispositionEtal}
 */
export function disposerEtal(reglages, nombreAvant, nombreArriere) {
  const anglesAvant = [-reglages.angleRangAvant, reglages.angleRangAvant].slice(0, nombreAvant);
  return {
    panier: surArc(reglages.rayonPanier, 0),
    rangAvant: anglesAvant.map((angle) => surArc(reglages.rayonRangAvant, angle)),
    // Centré devant le joueur : de gauche à droite, à pas d'angle constant.
    rangArriere: Array.from({ length: nombreArriere }, (_, indice) =>
      surArc(reglages.rayonRangArriere, (indice - (nombreArriere - 1) / 2) * reglages.pasRangArriere)),
  };
}
