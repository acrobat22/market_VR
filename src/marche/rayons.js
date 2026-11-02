/**
 * @file Rayons du marché : un étal par type de produit.
 *
 * Le joueur choisit son étal sur la page d'accueil ; l'étal n'expose que les
 * articles de son rayon, et la liste de courses est tirée parmi eux.
 */

/**
 * @typedef {object} Rayon
 * @property {string} id - Identifiant (repris par le champ `rayon` des articles).
 * @property {string} nom - Nom affiché sur la page d'accueil.
 */

/** @type {readonly Rayon[]} */
export const RAYONS = Object.freeze([
  { id: 'fruits', nom: 'Fruits' },
  { id: 'legumes', nom: 'Légumes' },
].map(Object.freeze));

/**
 * Articles vendus sur l'étal d'un rayon.
 *
 * @template {{ rayon: string }} A
 * @param {readonly A[]} articles - Tous les articles.
 * @param {string} idRayon - Rayon choisi.
 * @returns {A[]}
 */
export function articlesDuRayon(articles, idRayon) {
  return articles.filter((article) => article.rayon === idRayon);
}
