/**
 * @file Réglages centralisés du marché.
 *
 * Unités : mètres pour les distances, millisecondes pour les durées,
 * couleurs au format hexadécimal Three.js. Le joueur est assis à l'origine,
 * face à l'étal (vers -z).
 */

export const CONFIG = Object.freeze({
  /** Place de marché pavée tout autour (Poly Haven, CC0). */
  ambiance: Object.freeze({
    photoFond: './ressources/environnements/dresden_square_4k.jpg',
    eclairageHdr: './ressources/environnements/dresden_square_1k.hdr',
    /** Hauteur de l'appareil photo lors de la prise de vue (calage du sol). */
    hauteurPrise: 1.7,
    /** Rayon approximatif de la place. */
    rayonPiece: 40,
    /** Rotation de la place autour du joueur, en radians. */
    rotation: 0.4,
    intensiteEnvironnement: 1,
    couleurSecours: 0xc8ccd0,
    opaciteOmbreSol: 0.4,
  }),

  /** Lumière du jour (ciel couvert) : ombres douces sous l'étal. */
  soleil: Object.freeze({
    couleur: 0xfff4e6,
    intensite: 1.4,
    position: Object.freeze({ x: -1.5, y: 4, z: 2 }),
    resolutionOmbre: 1024,
    flouOmbre: 4,
    etendueOmbre: 2.2,
  }),

  /** Lumière d'ambiance de secours (ciel et sol), en plus de la photo de la place. */
  ciel: Object.freeze({
    couleurHaut: 0xdfe8f0,
    couleurBas: 0x8a7f72,
    intensite: 0.5,
  }),

  /**
   * Caméra de l'aperçu et du mode sans casque (en VR, c'est le casque qui
   * fournit la position et le regard).
   */
  camera: Object.freeze({
    position: Object.freeze({ x: 0, y: 1.32, z: 0.35 }),
    visee: Object.freeze({ x: 0, y: 0.95, z: -0.85 }),
    champDeVision: 62,
  }),

  /** Étal : comptoir, structure et auvent. */
  etal: Object.freeze({
    /** Distance entre le joueur et le bord avant du comptoir. */
    distanceComptoir: 0.38,
    largeur: 1.9,
    profondeur: 0.62,
    hauteur: 0.74,
    epaisseurPlateau: 0.05,
    /** Gradin du fond (rang arrière surélevé). */
    hauteurGradin: 0.1,
    profondeurGradin: 0.27,
    /** Poteaux et auvent. */
    rayonPoteau: 0.045,
    hauteurAvant: 1.95,
    hauteurArriere: 2.25,
    debordAuvent: 0.35,
    couleursRayures: Object.freeze(['#c8463d', '#f3ead8']),
    nombreRayures: 9,
    /** Étagère du fond. */
    hauteurEtagere: 1.25,
    /** Disposition vivante des rangs (rien n'est parfaitement aligné). */
    courbureRangs: 0.06,
    orientationVersJoueur: 0.6,
    desordreAngle: 0.12,
    desordrePosition: 0.015,
    /** Cagettes du fond inclinées vers le joueur (radians) et rehaussées sur des cales (m). */
    inclinaisonRangArriere: 0.22,
    rehausses: Object.freeze([0.03, 0, 0.06, 0.02, 0.05, 0]),
    textureBois: 'rough_wood',
    textureToile: 'rough_linen',
    dossierTextures: './ressources/textures/',
  }),

  /** Cagettes en planches qui présentent les articles. */
  cagette: Object.freeze({
    largeur: 0.25,
    profondeur: 0.21,
    hauteur: 0.085,
    epaisseurPlanche: 0.012,
    couleur: 0xd9b48a,
  }),

  /** Panier du joueur, posé au centre du rang avant. */
  panier: Object.freeze({
    modele: 'wicker_basket_01',
  }),

  /** Paniers ronds en osier aux extrémités du rang avant (pains). */
  corbeille: Object.freeze({
    modele: 'wicker_basket_02',
    /** Seulement le panier (le modèle contient aussi son couvercle, posé à côté). */
    element: 'wicker_basket_02_base',
    articles: Object.freeze(['croissant', 'petit-pain']),
  }),

  /**
   * Articles dont un exemplaire s'est « échappé » sur le comptoir, devant le
   * gradin (cagettes éloignées du panier, pour ne pas les confondre avec lui).
   */
  echappes: Object.freeze(['pomme', 'poire', 'kiwi']),

  /** Objets posés sur l'étagère du fond, pour le décor. */
  etagere: Object.freeze([
    Object.freeze({ modele: 'wooden_bowl_01' }),
    Object.freeze({ modele: 'wicker_basket_02', element: 'wicker_basket_02_base' }),
  ]),

  /** Modèles du décor autour de l'étal (tonneaux, caisses, table d'appoint). */
  decor: Object.freeze([
    Object.freeze({ modele: 'wine_barrel_01', position: Object.freeze({ x: -1.45, z: -0.8 }), rotation: 0.3 }),
    Object.freeze({ modele: 'wooden_crate_02', position: Object.freeze({ x: 1.55, z: -1.0 }), rotation: 1.4 }),
    Object.freeze({ modele: 'wooden_crate_01', position: Object.freeze({ x: 1.45, z: -0.35 }), rotation: -0.2 }),
  ]),

  dossierModeles: './ressources/modeles/',

  session: Object.freeze({
    mode: 'immersive-vr',
    typeReferentiel: 'local-floor',
    fonctionnalitesRequises: Object.freeze(['local-floor']),
    fonctionnalitesOptionnelles: Object.freeze(['hand-tracking']),
  }),

  qualite: Object.freeze({
    imagesAIgnorer: 120,
    imagesParMesure: 90,
    seuilMoyenMs: 18,
    ecartMaximalMs: 120,
  }),
});
