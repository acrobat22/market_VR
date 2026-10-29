/**
 * @file Panier du joueur : faut-il considérer qu'un article y est lâché ?
 *
 * Logique pure (sans Three.js), testable avec `node --test`.
 */

/**
 * @typedef {object} ZonePanier
 * @property {{ x: number, z: number }} centre - Centre du panier, vu de dessus.
 * @property {number} demiLargeur - Demi-largeur acceptée (en x), marge comprise.
 * @property {number} demiProfondeur - Demi-profondeur acceptée (en z), marge comprise.
 * @property {number} hauteurMaximale - Au-dessus de cette hauteur, l'article est trop haut.
 */

/**
 * Indique si un article lâché à ce point tombe dans le panier. La zone est
 * volontairement généreuse : il suffit d'être au-dessus, sans viser juste.
 *
 * @param {{ x: number, y: number, z: number }} point - Centre de l'article lâché.
 * @param {ZonePanier} zone - Zone acceptée.
 * @returns {boolean}
 */
export function estAuDessusDuPanier(point, zone) {
  return Math.abs(point.x - zone.centre.x) <= zone.demiLargeur
    && Math.abs(point.z - zone.centre.z) <= zone.demiProfondeur
    && point.y <= zone.hauteurMaximale;
}
