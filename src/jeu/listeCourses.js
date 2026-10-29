/**
 * @file Tirage au hasard de la liste de courses.
 *
 * Logique pure (sans Three.js), testable avec `node --test`. Le générateur
 * de hasard est injectable pour des tests reproductibles.
 */

/**
 * Tire une liste d'articles différents, dans un ordre aléatoire.
 * Méthode : mélange de Fisher-Yates sur une copie, puis on garde le début.
 *
 * @template T
 * @param {readonly T[]} articles - Articles proposés à l'étal.
 * @param {number} taille - Nombre d'articles voulus sur la liste (entier ≥ 1).
 * @param {() => number} [hasard=Math.random] - Renvoie un nombre dans [0, 1[.
 * @returns {T[]} Liste tirée (tous les articles s'il y en a moins que demandé).
 * @throws {RangeError} Si la taille n'est pas un entier ≥ 1.
 */
export function tirerListe(articles, taille, hasard = Math.random) {
  if (!Number.isInteger(taille) || taille < 1) {
    throw new RangeError(`La liste doit compter au moins un article (reçu : ${taille}).`);
  }
  const melange = [...articles];
  for (let indice = melange.length - 1; indice > 0; indice--) {
    const autre = Math.floor(hasard() * (indice + 1));
    [melange[indice], melange[autre]] = [melange[autre], melange[indice]];
  }
  return melange.slice(0, Math.min(taille, melange.length));
}
