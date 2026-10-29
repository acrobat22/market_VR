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
 * @property {string} nom - Nom affiché sur la liste de courses (pluriel, avec majuscule).
 * @property {string} modele - Nom du dossier du modèle 3D.
 * @property {number} quantite - Nombre d'exemplaires exposés dans la cagette.
 * @property {number} [echelle=1] - Échelle du modèle (pour qu'il tienne dans sa cagette).
 * @property {string[]} [elements] - Éléments du modèle à utiliser, en alternance (modèles
 *   composés : chaque exemplaire est alors un seul élément, ce qui donne de la variété).
 */

/** @type {readonly Article[]} */
export const ARTICLES = Object.freeze([
  { id: 'pomme', nom: 'Pommes', modele: 'food_apple_01', quantite: 9 },
  {
    id: 'poire',
    nom: 'Poires',
    modele: 'food_pears_asian_01',
    quantite: 12,
    elements: ['food_pears_asian_01_a', 'food_pears_asian_01_b', 'food_pears_asian_01_c', 'food_pears_asian_01_d', 'food_pears_asian_01_e'],
  },
  { id: 'citron', nom: 'Citrons', modele: 'lemon', quantite: 9 },
  { id: 'citron-vert', nom: 'Citrons verts', modele: 'food_lime_01', quantite: 12 },
  { id: 'kiwi', nom: 'Kiwis', modele: 'food_kiwi_01', quantite: 12 },
  // Le modèle mesure 14 cm de haut : ramené à ~10,5 cm, comme un vrai avocat.
  { id: 'avocat', nom: 'Avocats', modele: 'food_avocado_01', quantite: 6, echelle: 0.75 },
  { id: 'grenade', nom: 'Grenades', modele: 'food_pomegranate_01', quantite: 6 },
  { id: 'bananes', nom: 'Bananes', modele: 'bananas', quantite: 1, elements: ['bananas_bunch'] },
  { id: 'patate-douce', nom: 'Patates douces', modele: 'sweet_potato', quantite: 9 },
  { id: 'oignon', nom: 'Oignons', modele: 'yellow_onion', quantite: 12 },
  { id: 'croissant', nom: 'Croissants', modele: 'croissant', quantite: 4 },
  {
    id: 'petit-pain',
    nom: 'Petits pains',
    modele: 'hamburger_buns',
    quantite: 4,
    elements: ['hamburger_buns_01', 'hamburger_buns_02', 'hamburger_buns_03'],
  },
].map(Object.freeze));
