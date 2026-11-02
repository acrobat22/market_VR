/**
 * @file Articles vendus à l'étal.
 *
 * Chaque article renvoie à un modèle 3D photographié (Poly Haven ou pack
 * KIRI Engine « Fruit and Veg », CC0),
 * rangé dans `ressources/modeles/<modele>/<modele>.gltf`, mis à sa taille réelle.
 * Ajouter un article = ajouter une ligne ici (et son modèle).
 */

/**
 * @typedef {object} Article
 * @property {string} id - Identifiant interne.
 * @property {string} rayon - Rayon (étal) où l'article est vendu (voir `rayons.js`).
 * @property {string} singulier - Nom affiché sur l'ardoise pour un exemplaire (« 1 citron »).
 * @property {string} pluriel - Nom affiché pour plusieurs exemplaires (« 2 citrons »).
 * @property {string} modele - Nom du dossier du modèle 3D.
 * @property {number} quantite - Nombre d'exemplaires exposés : la cagette pleine (2 couches),
 *   20 au plus pour ménager le casque (chaque exemplaire est un objet à dessiner).
 * @property {number} taille - Taille réelle de l'article, en mètres : sa plus grande dimension
 *   (longueur d'une carotte, diamètre d'une pomme). Le modèle est mis à cette taille, quelle
 *   que soit l'échelle du scan (moyenne des variantes : elles gardent leurs différences).
 * @property {string[]} [elements] - Éléments du modèle à utiliser, en alternance (modèles
 *   composés : chaque exemplaire est alors un seul élément, ce qui donne de la variété).
 */

/** @type {readonly Article[]} */
export const ARTICLES = Object.freeze([
  { id: 'pomme', rayon: 'fruits', singulier: 'pomme', pluriel: 'pommes', modele: 'food_apple_01', taille: 0.08, quantite: 8 },
  {
    id: 'poire',
    rayon: 'fruits',
    singulier: 'poire', pluriel: 'poires',
    modele: 'food_pears_asian_01',
    taille: 0.11,
    quantite: 11,
    elements: ['food_pears_asian_01_a', 'food_pears_asian_01_b', 'food_pears_asian_01_c', 'food_pears_asian_01_d', 'food_pears_asian_01_e'],
  },
  { id: 'citron', rayon: 'fruits', singulier: 'citron', pluriel: 'citrons', modele: 'lemon', taille: 0.085, quantite: 18 },
  { id: 'citron-vert', rayon: 'fruits', singulier: 'citron vert', pluriel: 'citrons verts', modele: 'food_lime_01', taille: 0.06, quantite: 20 },
  { id: 'kiwi', rayon: 'fruits', singulier: 'kiwi', pluriel: 'kiwis', modele: 'food_kiwi_01', taille: 0.065, quantite: 20 },
  { id: 'avocat', rayon: 'fruits', singulier: 'avocat', pluriel: 'avocats', modele: 'food_avocado_01', taille: 0.11, quantite: 13 },
  { id: 'grenade', rayon: 'fruits', singulier: 'grenade', pluriel: 'grenades', modele: 'food_pomegranate_01', taille: 0.095, quantite: 8 },
  { id: 'litchi', rayon: 'fruits', singulier: 'litchi', pluriel: 'litchis', modele: 'food_lychee_01', taille: 0.035, quantite: 20 },
  { id: 'bananes', rayon: 'fruits', singulier: 'régime de bananes', pluriel: 'régimes de bananes', modele: 'bananas', taille: 0.22, quantite: 3, elements: ['bananas_bunch'] },
  // Fruits du pack KIRI Engine « Fruit and Veg » (CC0), convertis par
  // outils/convertir_kiri.py. L'étal en montre 10 au hasard à chaque partie.
  {
    id: 'orange',
    rayon: 'fruits',
    singulier: 'orange', pluriel: 'oranges',
    modele: 'kiri_orange',
    taille: 0.075,
    quantite: 13,
    // A24 (4 cm) et A60 (11 cm) écartées : trop différentes des autres.
    elements: ['A25_Orange', 'A49_Orange'],
  },
  {
    id: 'mangue',
    rayon: 'fruits',
    singulier: 'mangue', pluriel: 'mangues',
    modele: 'kiri_mangue',
    taille: 0.12,
    quantite: 5,
    elements: ['A29_Mango', 'A114_Mango', 'A115_Mango'],
  },
  {
    id: 'peche',
    rayon: 'fruits',
    singulier: 'pêche', pluriel: 'pêches',
    modele: 'kiri_peche',
    taille: 0.075,
    quantite: 13,
    // A12 (5 cm) écartée : trop petite à côté des deux autres.
    elements: ['A28_Peach', 'A51_Peach'],
  },
  { id: 'prune', rayon: 'fruits', singulier: 'prune', pluriel: 'prunes', modele: 'kiri_prune', taille: 0.05, quantite: 20 },
  { id: 'clementine', rayon: 'fruits', singulier: 'clémentine', pluriel: 'clémentines', modele: 'kiri_clementine', taille: 0.06, quantite: 18 },
  { id: 'kumquat', rayon: 'fruits', singulier: 'kumquat', pluriel: 'kumquats', modele: 'kiri_kumquat', taille: 0.04, quantite: 20 },
  {
    id: 'mangoustan',
    rayon: 'fruits',
    singulier: 'mangoustan', pluriel: 'mangoustans',
    modele: 'kiri_mangoustan',
    taille: 0.065,
    quantite: 18,
    elements: ['A127_Mangosteen', 'A129_Mangosteen'],
  },
  {
    id: 'papaye',
    rayon: 'fruits',
    singulier: 'papaye', pluriel: 'papayes',
    modele: 'kiri_papaye',
    taille: 0.2,
    quantite: 5,
    elements: ['A11_Papaya', 'A54_Papaya'],
  },
  {
    id: 'fruit-passion',
    rayon: 'fruits',
    singulier: 'fruit de la passion', pluriel: 'fruits de la passion',
    modele: 'kiri_fruit_passion',
    taille: 0.065,
    quantite: 20,
  },
  { id: 'kaki', rayon: 'fruits', singulier: 'kaki', pluriel: 'kakis', modele: 'kiri_kaki', taille: 0.07, quantite: 18 },
  {
    id: 'fruit-dragon',
    rayon: 'fruits',
    singulier: 'fruit du dragon', pluriel: 'fruits du dragon',
    modele: 'kiri_fruit_dragon',
    taille: 0.12,
    quantite: 8,
  },
  {
    id: 'pomme-cannelle',
    rayon: 'fruits',
    singulier: 'pomme cannelle', pluriel: 'pommes cannelle',
    modele: 'kiri_anone',
    taille: 0.09,
    quantite: 8,
  },
  {
    id: 'noix-coco',
    rayon: 'fruits',
    singulier: 'noix de coco', pluriel: 'noix de coco',
    modele: 'kiri_noix_coco',
    taille: 0.13,
    quantite: 3,
    elements: ['A111_Coconut', 'A116_Coconut'],
  },
  {
    id: 'melon',
    rayon: 'fruits',
    singulier: 'melon', pluriel: 'melons',
    modele: 'kiri_melon',
    taille: 0.15,
    quantite: 3,
    // A137 (34 cm) écarté : bien trop gros pour une cagette.
    elements: ['A131_Cantaloupe'],
  },
  // Légumes : scans du pack KIRI Engine « Fruit and Veg » (CC0), convertis par
  // outils/convertir_kiri.py ; plusieurs variantes par légume pour la variété.
  {
    id: 'carotte',
    rayon: 'legumes',
    singulier: 'carotte', pluriel: 'carottes',
    modele: 'kiri_carotte',
    taille: 0.18,
    quantite: 13,
    elements: ['A31_Carrot', 'A103_Carrot', 'A134_Carrot'],
  },
  {
    id: 'pomme-de-terre',
    rayon: 'legumes',
    singulier: 'pomme de terre', pluriel: 'pommes de terre',
    modele: 'kiri_pomme_de_terre',
    taille: 0.08,
    quantite: 20,
    elements: ['A18_Potato', 'A19_Potato', 'A20_Potato', 'A23_Potato', 'A36_Potato'],
  },
  {
    id: 'chou',
    rayon: 'legumes',
    singulier: 'chou', pluriel: 'choux',
    modele: 'kiri_chou',
    taille: 0.16,
    quantite: 2,
    elements: ['A15_Cabbage', 'A69_Cabbage'],
  },
  { id: 'brocoli', rayon: 'legumes', singulier: 'brocoli', pluriel: 'brocolis', modele: 'kiri_brocoli', taille: 0.16, quantite: 3 },
  { id: 'concombre', rayon: 'legumes', singulier: 'concombre', pluriel: 'concombres', modele: 'kiri_concombre', taille: 0.22, quantite: 5 },
  { id: 'aubergine', rayon: 'legumes', singulier: 'aubergine', pluriel: 'aubergines', modele: 'kiri_aubergine', taille: 0.2, quantite: 5 },
  { id: 'champignon', rayon: 'legumes', singulier: 'champignon', pluriel: 'champignons', modele: 'kiri_champignon', taille: 0.05, quantite: 20 },
  { id: 'ail', rayon: 'legumes', singulier: 'tête d’ail', pluriel: 'têtes d’ail', modele: 'kiri_ail', taille: 0.055, quantite: 20 },
  {
    id: 'courge-butternut',
    rayon: 'legumes',
    singulier: 'courge butternut', pluriel: 'courges butternut',
    modele: 'kiri_courge_butternut',
    taille: 0.22,
    quantite: 3,
  },
  {
    id: 'navet',
    rayon: 'legumes',
    singulier: 'navet', pluriel: 'navets',
    modele: 'kiri_navet',
    taille: 0.08,
    quantite: 18,
    elements: ['A33_Turnip', 'A94_Turnip'],
  },
  // Oignon : modèle Poly Haven (CC0).
  { id: 'oignon', rayon: 'legumes', singulier: 'oignon', pluriel: 'oignons', modele: 'yellow_onion', taille: 0.075, quantite: 18 },
].map(Object.freeze));

/**
 * Échelle à donner au modèle d'un article pour qu'il mesure sa taille réelle.
 *
 * @param {number} tailleCible - Taille réelle voulue (plus grande dimension), en mètres.
 * @param {readonly number[]} dimensionsMesurees - Plus grande dimension de chaque variante du
 *   modèle, à l'échelle 1, en mètres.
 * @returns {number} Échelle commune à toutes les variantes (1 si rien n'a été mesuré).
 */
export function calculerEchelle(tailleCible, dimensionsMesurees) {
  const mesures = dimensionsMesurees.filter((dimension) => dimension > 0);
  if (mesures.length === 0) {
    return 1;
  }
  const moyenne = mesures.reduce((somme, dimension) => somme + dimension, 0) / mesures.length;
  return tailleCible / moyenne;
}
