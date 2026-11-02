/**
 * @file Articles vendus à l'étal.
 *
 * Chaque article renvoie à un modèle 3D photographié (Poly Haven, CC0),
 * rangé dans `ressources/modeles/<modele>/<modele>.gltf`, à l'échelle réelle.
 * Ajouter un article = ajouter une ligne ici (et son modèle).
 */

/**
 * @typedef {object} Article
 * @property {string} id - Identifiant interne.
 * @property {string} singulier - Nom affiché sur l'ardoise pour un exemplaire (« 1 citron »).
 * @property {string} pluriel - Nom affiché pour plusieurs exemplaires (« 2 citrons »).
 * @property {string} modele - Nom du dossier du modèle 3D.
 * @property {number} quantite - Nombre d'exemplaires exposés dans la cagette.
 * @property {number} [echelle=1] - Échelle du modèle (pour qu'il tienne dans sa cagette).
 * @property {string[]} [elements] - Éléments du modèle à utiliser, en alternance (modèles
 *   composés : chaque exemplaire est alors un seul élément, ce qui donne de la variété).
 */

/** @type {readonly Article[]} */
export const ARTICLES = Object.freeze([
  { id: 'pomme', singulier: 'pomme', pluriel: 'pommes', modele: 'food_apple_01', quantite: 9 },
  {
    id: 'poire',
    singulier: 'poire', pluriel: 'poires',
    modele: 'food_pears_asian_01',
    quantite: 12,
    elements: ['food_pears_asian_01_a', 'food_pears_asian_01_b', 'food_pears_asian_01_c', 'food_pears_asian_01_d', 'food_pears_asian_01_e'],
  },
  { id: 'citron', singulier: 'citron', pluriel: 'citrons', modele: 'lemon', quantite: 9 },
  { id: 'citron-vert', singulier: 'citron vert', pluriel: 'citrons verts', modele: 'food_lime_01', quantite: 12 },
  { id: 'kiwi', singulier: 'kiwi', pluriel: 'kiwis', modele: 'food_kiwi_01', quantite: 12 },
  // Le modèle mesure 14 cm de haut : ramené à ~10,5 cm, comme un vrai avocat.
  { id: 'avocat', singulier: 'avocat', pluriel: 'avocats', modele: 'food_avocado_01', quantite: 6, echelle: 0.75 },
  { id: 'grenade', singulier: 'grenade', pluriel: 'grenades', modele: 'food_pomegranate_01', quantite: 6 },
  { id: 'bananes', singulier: 'régime de bananes', pluriel: 'régimes de bananes', modele: 'bananas', quantite: 1, elements: ['bananas_bunch'] },
  { id: 'patate-douce', singulier: 'patate douce', pluriel: 'patates douces', modele: 'sweet_potato', quantite: 9 },
  { id: 'oignon', singulier: 'oignon', pluriel: 'oignons', modele: 'yellow_onion', quantite: 12 },
  { id: 'croissant', singulier: 'croissant', pluriel: 'croissants', modele: 'croissant', quantite: 4 },
  {
    id: 'petit-pain',
    singulier: 'petit pain', pluriel: 'petits pains',
    modele: 'hamburger_buns',
    quantite: 4,
    elements: ['hamburger_buns_01', 'hamburger_buns_02', 'hamburger_buns_03'],
  },
].map(Object.freeze));
