/**
 * @file Rayons du marché : un étal par type de produit.
 *
 * Le joueur choisit son étal sur la page d'accueil ; l'étal n'expose que les
 * articles de son rayon, et la liste de courses est tirée parmi eux.
 * Un rayon reste « bientôt disponible » tant que ses modèles 3D (CC0) manquent.
 */

/**
 * @typedef {object} Rayon
 * @property {string} id - Identifiant (repris par le champ `rayon` des articles).
 * @property {string} nom - Nom affiché sur la page d'accueil.
 * @property {boolean} disponible - `false` tant que l'étal n'est pas prêt.
 */

/** @type {readonly Rayon[]} */
export const RAYONS = Object.freeze([
  { id: 'fruits', nom: 'Fruits', disponible: true },
  { id: 'legumes', nom: 'Légumes', disponible: false },
  { id: 'poissons', nom: 'Poissons', disponible: false },
  { id: 'boulangerie', nom: 'Pains et viennoiseries', disponible: false },
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
