/**
 * @file Articles vendus à l'étal.
 *
 * Chaque article renvoie à un modèle 3D photographié (Poly Haven ou pack
 * KIRI Engine « Fruit and Veg », CC0),
 * rangé dans `ressources/modeles/<modele>/<modele>.gltf`, à l'échelle réelle.
 * Ajouter un article = ajouter une ligne ici (et son modèle).
 */

/**
 * @typedef {object} Article
 * @property {string} id - Identifiant interne.
 * @property {string} rayon - Rayon (étal) où l'article est vendu (voir `rayons.js`).
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
  { id: 'pomme', rayon: 'fruits', singulier: 'pomme', pluriel: 'pommes', modele: 'food_apple_01', quantite: 9 },
  {
    id: 'poire',
    rayon: 'fruits',
    singulier: 'poire', pluriel: 'poires',
    modele: 'food_pears_asian_01',
    quantite: 12,
    elements: ['food_pears_asian_01_a', 'food_pears_asian_01_b', 'food_pears_asian_01_c', 'food_pears_asian_01_d', 'food_pears_asian_01_e'],
  },
  { id: 'citron', rayon: 'fruits', singulier: 'citron', pluriel: 'citrons', modele: 'lemon', quantite: 9 },
  { id: 'citron-vert', rayon: 'fruits', singulier: 'citron vert', pluriel: 'citrons verts', modele: 'food_lime_01', quantite: 12 },
  { id: 'kiwi', rayon: 'fruits', singulier: 'kiwi', pluriel: 'kiwis', modele: 'food_kiwi_01', quantite: 12 },
  // Le modèle mesure 14 cm de haut : ramené à ~10,5 cm, comme un vrai avocat.
  { id: 'avocat', rayon: 'fruits', singulier: 'avocat', pluriel: 'avocats', modele: 'food_avocado_01', quantite: 6, echelle: 0.75 },
  { id: 'grenade', rayon: 'fruits', singulier: 'grenade', pluriel: 'grenades', modele: 'food_pomegranate_01', quantite: 6 },
  { id: 'litchi', rayon: 'fruits', singulier: 'litchi', pluriel: 'litchis', modele: 'food_lychee_01', quantite: 16 },
  { id: 'bananes', rayon: 'fruits', singulier: 'régime de bananes', pluriel: 'régimes de bananes', modele: 'bananas', quantite: 1, elements: ['bananas_bunch'] },
  // Fruits du pack KIRI Engine « Fruit and Veg » (CC0), convertis par
  // outils/convertir_kiri.py. L'étal en montre 10 au hasard à chaque partie.
  {
    id: 'orange',
    rayon: 'fruits',
    singulier: 'orange', pluriel: 'oranges',
    modele: 'kiri_orange',
    quantite: 9,
    // A24 (4 cm) et A60 (11 cm) écartées : trop différentes des autres.
    elements: ['A25_Orange', 'A49_Orange'],
  },
  // Mangue de 17 cm ramenée à 14 cm.
  {
    id: 'mangue',
    rayon: 'fruits',
    singulier: 'mangue', pluriel: 'mangues',
    modele: 'kiri_mangue',
    quantite: 4,
    echelle: 0.8,
    elements: ['A29_Mango', 'A114_Mango', 'A115_Mango'],
  },
  {
    id: 'peche',
    rayon: 'fruits',
    singulier: 'pêche', pluriel: 'pêches',
    modele: 'kiri_peche',
    quantite: 9,
    // A12 (5 cm) écartée : trop petite à côté des deux autres.
    elements: ['A28_Peach', 'A51_Peach'],
  },
  { id: 'prune', rayon: 'fruits', singulier: 'prune', pluriel: 'prunes', modele: 'kiri_prune', quantite: 12 },
  { id: 'clementine', rayon: 'fruits', singulier: 'clémentine', pluriel: 'clémentines', modele: 'kiri_clementine', quantite: 12 },
  { id: 'kumquat', rayon: 'fruits', singulier: 'kumquat', pluriel: 'kumquats', modele: 'kiri_kumquat', quantite: 20 },
  {
    id: 'mangoustan',
    rayon: 'fruits',
    singulier: 'mangoustan', pluriel: 'mangoustans',
    modele: 'kiri_mangoustan',
    quantite: 9,
    elements: ['A127_Mangosteen', 'A129_Mangosteen'],
  },
  {
    id: 'papaye',
    rayon: 'fruits',
    singulier: 'papaye', pluriel: 'papayes',
    modele: 'kiri_papaye',
    quantite: 2,
    elements: ['A11_Papaya', 'A54_Papaya'],
  },
  {
    id: 'fruit-passion',
    rayon: 'fruits',
    singulier: 'fruit de la passion', pluriel: 'fruits de la passion',
    modele: 'kiri_fruit_passion',
    quantite: 12,
  },
  { id: 'kaki', rayon: 'fruits', singulier: 'kaki', pluriel: 'kakis', modele: 'kiri_kaki', quantite: 9 },
  { id: 'goyave', rayon: 'fruits', singulier: 'goyave', pluriel: 'goyaves', modele: 'kiri_goyave', quantite: 6 },
  {
    id: 'fruit-dragon',
    rayon: 'fruits',
    singulier: 'fruit du dragon', pluriel: 'fruits du dragon',
    modele: 'kiri_fruit_dragon',
    quantite: 4,
  },
  // Pomme cannelle (« custard apple ») de 4,5 cm portée à 9 cm.
  {
    id: 'pomme-cannelle',
    rayon: 'fruits',
    singulier: 'pomme cannelle', pluriel: 'pommes cannelle',
    modele: 'kiri_anone',
    quantite: 6,
    echelle: 2,
  },
  {
    id: 'noix-coco',
    rayon: 'fruits',
    singulier: 'noix de coco', pluriel: 'noix de coco',
    modele: 'kiri_noix_coco',
    quantite: 3,
    elements: ['A111_Coconut', 'A116_Coconut'],
  },
  {
    id: 'melon',
    rayon: 'fruits',
    singulier: 'melon', pluriel: 'melons',
    modele: 'kiri_melon',
    quantite: 2,
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
    quantite: 8,
    elements: ['A31_Carrot', 'A103_Carrot', 'A134_Carrot'],
  },
  {
    id: 'pomme-de-terre',
    rayon: 'legumes',
    singulier: 'pomme de terre', pluriel: 'pommes de terre',
    modele: 'kiri_pomme_de_terre',
    quantite: 12,
    elements: ['A18_Potato', 'A19_Potato', 'A20_Potato', 'A23_Potato', 'A36_Potato'],
  },
  {
    id: 'chou',
    rayon: 'legumes',
    singulier: 'chou', pluriel: 'choux',
    modele: 'kiri_chou',
    quantite: 3,
    elements: ['A15_Cabbage', 'A69_Cabbage'],
  },
  // Brocoli de 20 cm ramené à 16 cm.
  { id: 'brocoli', rayon: 'legumes', singulier: 'brocoli', pluriel: 'brocolis', modele: 'kiri_brocoli', quantite: 3, echelle: 0.8 },
  { id: 'concombre', rayon: 'legumes', singulier: 'concombre', pluriel: 'concombres', modele: 'kiri_concombre', quantite: 4 },
  // Aubergine de 27 cm ramenée à 20 cm.
  { id: 'aubergine', rayon: 'legumes', singulier: 'aubergine', pluriel: 'aubergines', modele: 'kiri_aubergine', quantite: 3, echelle: 0.75 },
  // Champignon de 2,7 cm porté à 4,6 cm.
  { id: 'champignon', rayon: 'legumes', singulier: 'champignon', pluriel: 'champignons', modele: 'kiri_champignon', quantite: 20, echelle: 1.7 },
  // Tête d'ail de 3,4 cm portée à 5 cm.
  { id: 'ail', rayon: 'legumes', singulier: 'tête d’ail', pluriel: 'têtes d’ail', modele: 'kiri_ail', quantite: 12, echelle: 1.5 },
  // Courge de 30 cm ramenée à 22 cm, pour tenir dans sa cagette.
  {
    id: 'courge-butternut',
    rayon: 'legumes',
    singulier: 'courge butternut', pluriel: 'courges butternut',
    modele: 'kiri_courge_butternut',
    quantite: 2,
    echelle: 0.75,
  },
  {
    id: 'navet',
    rayon: 'legumes',
    singulier: 'navet', pluriel: 'navets',
    modele: 'kiri_navet',
    quantite: 6,
    elements: ['A33_Turnip', 'A94_Turnip'],
  },
  // Oignon : modèle Poly Haven (CC0).
  { id: 'oignon', rayon: 'legumes', singulier: 'oignon', pluriel: 'oignons', modele: 'yellow_onion', quantite: 12 },
].map(Object.freeze));
