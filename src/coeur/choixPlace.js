/**
 * @file Choix de la place de marché affichée autour de l'étal.
 *
 * Logique pure (sans Three.js ni navigateur), testable avec `node --test`.
 * Le générateur de hasard est injectable pour des tests reproductibles.
 */

/**
 * Choisit la place à afficher.
 *
 * - Si une place est demandée par son nom et existe, c'est elle.
 * - Sinon, une place est tirée au hasard, en écartant la précédente
 *   (sauf s'il n'y en a qu'une).
 *
 * @template {{ nom: string }} P
 * @param {readonly P[]} places - Places possibles (au moins une).
 * @param {object} [options]
 * @param {?string} [options.nomDemande=null] - Place imposée (paramètre `?place=`).
 * @param {?string} [options.nomPrecedent=null] - Place affichée la fois précédente.
 * @param {() => number} [options.hasard=Math.random] - Renvoie un nombre dans [0, 1[.
 * @returns {P} Place choisie.
 * @throws {RangeError} S'il n'y a aucune place.
 */
export function choisirPlace(places, { nomDemande = null, nomPrecedent = null, hasard = Math.random } = {}) {
  if (places.length === 0) {
    throw new RangeError('Il faut au moins une place.');
  }
  const demandee = places.find((place) => place.nom === nomDemande);
  if (demandee) {
    return demandee;
  }
  const autres = places.filter((place) => place.nom !== nomPrecedent);
  const candidates = autres.length > 0 ? autres : places;
  return candidates[Math.floor(hasard() * candidates.length)];
}
