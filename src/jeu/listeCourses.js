/**
 * @file Tirage au hasard de la liste de courses et des quantités demandées.
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

/**
 * @template T
 * @typedef {object} Commande
 * @property {T} article - Article demandé.
 * @property {number} quantite - Nombre d'exemplaires demandés (≥ 1).
 */

/**
 * Tire le nombre d'exemplaires demandés pour chaque article : entre 1 et
 * `quantiteMaximale`, sans dépasser le stock de l'étal, et sans que le total
 * dépasse la contenance du panier (les plus grosses quantités sont alors
 * réduites une à une).
 *
 * @template T
 * @param {readonly T[]} articles - Articles de la liste (déjà tirés).
 * @param {(article: T) => number} stock - Nombre d'exemplaires exposés de l'article.
 * @param {{ quantiteMaximale: number, contenancePanier: number }} reglages - Limites.
 * @param {() => number} [hasard=Math.random] - Renvoie un nombre dans [0, 1[.
 * @returns {Commande<T>[]} Une commande par article, dans le même ordre.
 */
export function tirerQuantites(articles, stock, reglages, hasard = Math.random) {
  const commandes = articles.map((article) => {
    const maximum = Math.max(1, Math.min(reglages.quantiteMaximale, stock(article)));
    return { article, quantite: 1 + Math.floor(hasard() * maximum) };
  });
  let total = commandes.reduce((somme, commande) => somme + commande.quantite, 0);
  while (total > reglages.contenancePanier) {
    const plusGrosse = commandes.reduce((plus, commande) => (commande.quantite > plus.quantite ? commande : plus));
    if (plusGrosse.quantite === 1) {
      break;
    }
    plusGrosse.quantite -= 1;
    total -= 1;
  }
  return commandes;
}
