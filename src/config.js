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
    /**
     * Places possibles : une est tirée au hasard à chaque chargement, jamais
     * deux fois de suite la même. `?place=<nom>` dans l'adresse en impose
     * une (pratique pour les réglages).
     *
     * - `hauteurPrise` : hauteur de l'appareil photo lors de la prise de vue
     *   (calage du sol : trop petite, l'étal s'enfonce ; trop grande, il flotte).
     * - `rotation` : rotation de la place autour du joueur, en radians
     *   (tourne le plus beau côté de la place derrière l'étal).
     */
    places: Object.freeze([
      Object.freeze({
        nom: 'dresde',
        photoFond: './ressources/environnements/dresden_square_4k.jpg',
        eclairageHdr: './ressources/environnements/dresden_square_1k.hdr',
        hauteurPrise: 1.7,
        rotation: 0.4,
      }),
      Object.freeze({
        nom: 'ulm',
        photoFond: './ressources/environnements/ulmer_muenster_4k.jpg',
        eclairageHdr: './ressources/environnements/ulmer_muenster_1k.hdr',
        hauteurPrise: 1.7,
        rotation: 0,
      }),
      Object.freeze({
        nom: 'venise',
        photoFond: './ressources/environnements/venetian_crossroads_4k.jpg',
        eclairageHdr: './ressources/environnements/venetian_crossroads_1k.hdr',
        hauteurPrise: 1.7,
        rotation: 0,
      }),
      Object.freeze({
        nom: 'furstenstein',
        photoFond: './ressources/environnements/furstenstein_4k.jpg',
        eclairageHdr: './ressources/environnements/furstenstein_1k.hdr',
        hauteurPrise: 1.7,
        rotation: 0,
      }),
      Object.freeze({
        nom: 'rome',
        photoFond: './ressources/environnements/piazza_martin_lutero_4k.jpg',
        eclairageHdr: './ressources/environnements/piazza_martin_lutero_1k.hdr',
        hauteurPrise: 1.7,
        rotation: 0,
      }),
    ]),
    /** Clé du navigateur qui retient la dernière place affichée. */
    cleDernierePlace: 'market.dernierePlace',
    /** Rayon approximatif de la place. */
    rayonPiece: 40,
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
    visee: Object.freeze({ x: 0, y: 1.03, z: -0.85 }),
    champDeVision: 66,
  }),

  /** Étal : comptoir, structure et auvent. */
  etal: Object.freeze({
    /** Distance entre le joueur et le bord avant du comptoir. */
    distanceComptoir: 0.38,
    /** Nombre de cagettes : 6 au rang arrière, 4 au rang avant (un rayon plus riche en montre autant, au hasard). */
    nombreCagettes: 10,
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
    /** Marge autour du panier où un article lâché compte quand même (généreuse). */
    margeDepose: 0.05,
    /** Un article lâché à plus de cette hauteur au-dessus du bord n'y tombe pas. */
    hauteurDepose: 0.3,
    /** Épaisseur du fond du panier : les articles se posent dessus. */
    epaisseurFond: 0.02,
    /**
     * Places des articles dans le panier (décalages depuis le centre du fond),
     * dans l'ordre d'arrivée : deux rangées de trois, puis une seconde couche
     * décalée posée par-dessus. Leur nombre fixe la contenance du panier : la
     * liste ne demande jamais plus d'exemplaires au total.
     */
    places: Object.freeze([
      Object.freeze({ x: -0.1, y: 0, z: -0.055 }),
      Object.freeze({ x: 0.1, y: 0, z: 0.055 }),
      Object.freeze({ x: 0, y: 0, z: -0.055 }),
      Object.freeze({ x: -0.1, y: 0, z: 0.055 }),
      Object.freeze({ x: 0.1, y: 0, z: -0.055 }),
      Object.freeze({ x: 0, y: 0, z: 0.055 }),
      Object.freeze({ x: -0.05, y: 0.06, z: 0 }),
      Object.freeze({ x: 0.05, y: 0.06, z: 0 }),
      Object.freeze({ x: -0.13, y: 0.06, z: 0 }),
      Object.freeze({ x: 0.13, y: 0.06, z: 0 }),
      Object.freeze({ x: 0, y: 0.06, z: -0.06 }),
      Object.freeze({ x: 0, y: 0.06, z: 0.06 }),
    ]),
  }),

  /** Bouton « Rejouer », affiché au-dessus du panier une fois la liste complète. */
  bouton: Object.freeze({
    largeur: 0.24,
    profondeur: 0.12,
    hauteur: 0.03,
    /** Inclinaison vers le joueur, en radians (environ 45° : bien visible d'en haut). */
    inclinaison: 0.8,
    /** Marge autour du bouton dans laquelle un pincement l'active. */
    margeVisee: 0.03,
    /** Enfoncement visuel lors de l'appui, et sa durée. */
    enfoncement: 0.008,
    dureeAppui: 180,
    /** Hauteur au-dessus du bord du panier. */
    hauteurAuDessusPanier: 0.12,
  }),

  /** Liste de courses : nombre d'articles tirés au hasard (bornes incluses). */
  liste: Object.freeze({
    tailleMinimale: 4,
    tailleMaximale: 6,
    /** Exemplaires demandés par article : de 1 à ce nombre (sans dépasser le stock). */
    quantiteMaximale: 3,
  }),

  /**
   * Ardoise de la liste, suspendue à la traverse avant de l'auvent. Assez
   * basse pour être vue sans lever la tête (et dans l'aperçu à la souris),
   * assez haute pour ne pas cacher le rang arrière.
   */
  ardoise: Object.freeze({
    /** Surface d'ardoise (sans le cadre). */
    largeur: 0.64,
    hauteur: 0.26,
    /** Cadre en bois : largeur des montants et épaisseur. */
    largeurCadre: 0.03,
    epaisseurCadre: 0.018,
    position: Object.freeze({ x: 0, y: 1.4, z: -0.36 }),
    /** Police manuscrite « craie » (Patrick Hand, licence OFL, voir ressources/polices/). */
    police: './ressources/polices/PatrickHand-Regular.ttf',
    /** Hauteur de la traverse où sont attachées les cordelettes. */
    hauteurAccroche: 1.93,
  }),

  /**
   * Paniers ronds en osier aux extrémités du rang avant : simple décor (vides),
   * car leurs bords hauts cachaient ce qu'on y mettait.
   */
  corbeille: Object.freeze({
    modele: 'wicker_basket_02',
    /** Seulement le panier (le modèle contient aussi son couvercle, posé à côté). */
    element: 'wicker_basket_02_base',
  }),

  /**
   * Articles dont un exemplaire s'est « échappé » sur le comptoir, devant le
   * gradin (cagettes éloignées du panier, pour ne pas les confondre avec lui).
   */
  echappes: Object.freeze(['pomme', 'poire', 'kiwi', 'pomme-de-terre']),

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

  mains: Object.freeze({
    /** « mesh » : mains réalistes, modèles copiés localement (licence MIT). */
    profilAffichage: 'mesh',
    cheminModeles: './vendor/webxr-input-profiles/generic-hand/',
    /**
     * Seuils de pincement (distance pouce–index), plus tolérants que ceux de
     * Three.js (1,5 cm / 2,5 cm). L'écart entre les deux absorbe les tremblements.
     */
    pincement: Object.freeze({
      seuilFermeture: 0.025,
      seuilOuverture: 0.04,
    }),
  }),

  sons: Object.freeze({
    /**
     * Volume général (0 à 1). Crête mesurée vers -7 dB : audible sur les
     * haut-parleurs d'un portable comme dans le casque, sans saturer.
     */
    volume: 0.85,
  }),

  /** Mode « Essayer sans casque » : la souris remplace la main. */
  souris: Object.freeze({
    /** Pendant une prise, l'article survole la surface visée à cette hauteur. */
    hauteurLevee: 0.06,
  }),

  saisie: Object.freeze({
    /**
     * Distance maximale entre le point de pincement et la surface d'un article
     * pour pouvoir le saisir : zone volontairement généreuse.
     */
    rayonSaisie: 0.06,
    /** Grossissement d'un article que la main peut prendre (retour de survol). */
    grossissementSurvol: 1.12,
    /** Durée du retour d'un article à sa place, en ms. */
    dureeRetour: 700,
    /** Hauteur de l'arc décrit pendant le retour, en m. */
    hauteurArcRetour: 0.08,
  }),

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
