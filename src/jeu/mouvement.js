/**
 * @file Calculs de l'accrochage magnétique et du glissement d'une brique
 * vers sa place.
 *
 * Logique pure : fonctionne avec tout objet `{ x, y, z }` (y compris les
 * `Vector3` de Three.js), testable avec `node --test`.
 */

/**
 * @typedef {object} Point3D
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/**
 * Indique si une brique est assez proche de sa place pour s'y accrocher.
 *
 * @param {Point3D} position - Centre de la brique lâchée.
 * @param {Point3D} cible - Centre de l'emplacement visé.
 * @param {number} distanceMaximale - Distance d'accrochage, en mètres (incluse).
 * @returns {boolean}
 */
export function estAPortee(position, cible, distanceMaximale) {
  const distance = Math.hypot(position.x - cible.x, position.y - cible.y, position.z - cible.z);
  return distance <= distanceMaximale;
}

/**
 * Courbe d'adoucissement (départ et arrivée lents) pour un mouvement calme.
 *
 * @param {number} progression - Avancement brut, normalement entre 0 et 1.
 * @returns {number} Avancement adouci, borné entre 0 et 1.
 */
export function adoucir(progression) {
  const borne = Math.min(Math.max(progression, 0), 1);
  // Cubique « ease-in-out » : 4t³ puis 1 - (-2t + 2)³ / 2.
  return borne < 0.5
    ? 4 * borne ** 3
    : 1 - ((-2 * borne + 2) ** 3) / 2;
}

/**
 * Point intermédiaire entre deux positions.
 *
 * @param {Point3D} depart - Position de départ.
 * @param {Point3D} arrivee - Position d'arrivée.
 * @param {number} progression - 0 = départ, 1 = arrivée.
 * @returns {Point3D}
 */
export function interpoler(depart, arrivee, progression) {
  return {
    x: depart.x + (arrivee.x - depart.x) * progression,
    y: depart.y + (arrivee.y - depart.y) * progression,
    z: depart.z + (arrivee.z - depart.z) * progression,
  };
}
