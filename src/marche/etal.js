/**
 * @file Étal de marché : comptoir en bois, poteaux, auvent rayé, étagère,
 * cagettes garnies des articles du rayon, panier du joueur, décor.
 *
 * Le joueur est assis à l'origine, face à l'étal (vers -z). Le rang avant
 * est à portée de main ; le rang arrière, surélevé, demande de se pencher
 * un peu.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { calculerEchelle } from './articles.js';
import { creerMatiere } from './matieres.js';
import { Tas } from './tas.js';

/**
 * @typedef {object} EmplacementArticle
 * @property {import('./articles.js').Article} article - Article présenté.
 * @property {THREE.Object3D[]} exemplaires - Exemplaires posés dans la cagette.
 * @property {THREE.Vector3} centre - Centre du contenant (repère de la scène).
 * @property {THREE.Group} contenant - Groupe local de la cagette.
 */

/**
 * @typedef {object} Garniture
 * @property {THREE.Group} objet3D - Cagettes et articles, à ajouter à la scène.
 * @property {Map<string, EmplacementArticle>} emplacements - Articles présentés, par identifiant.
 */

/**
 * @typedef {object} Etal
 * @property {THREE.Group} objet3D - Structure de l'étal (sans les articles), à ajouter à la scène.
 * @property {THREE.Object3D | null} panier - Panier du joueur.
 * @property {THREE.Vector3} centrePanier - Centre du fond du panier (repère de la scène).
 * @property {(articles: readonly import('./articles.js').Article[]) => Garniture} garnir
 *   Crée les cagettes garnies des articles donnés (10 au plus : jusqu'à 6 au
 *   rang arrière, 4 au rang avant). Peut être rappelée pour changer d'articles.
 */

/**
 * Construit la structure de l'étal : comptoir, auvent, panier du joueur,
 * étagère et décor. Les articles sont posés à part, par `garnir`,
 * pour pouvoir changer d'articles (de rayon, ou de partie) sans tout reconstruire.
 *
 * @param {typeof import('../config.js').CONFIG} config - Configuration globale.
 * @param {import('./modeles3D.js').BibliothequeModeles} bibliotheque - Modèles 3D chargés.
 * @returns {Etal}
 */
export function construireEtal(config, bibliotheque) {
  const reglages = config.etal;
  const groupe = new THREE.Group();
  groupe.name = 'etal';

  const avant = -reglages.distanceComptoir;
  const arriere = avant - reglages.profondeur;
  const bois = (repX, repY, teinte) => creerMatiere({
    dossier: reglages.dossierTextures, nom: reglages.textureBois, repetitionX: repX, repetitionY: repY, teinte,
  });

  groupe.add(creerComptoir(reglages, avant, arriere, bois));
  groupe.add(creerStructure(reglages, avant, arriere, bois));
  groupe.add(creerAuvent(reglages, avant, arriere));

  // Rangs de présentation.
  const dessusComptoir = reglages.hauteur;
  const dessusGradin = reglages.hauteur + reglages.hauteurGradin;
  const zRangAvant = avant - 0.05 - config.cagette.profondeur / 2;
  const zRangArriere = arriere + reglages.profondeurGradin / 2;

  // Disposition « vivante » : rangs en léger arc tourné vers le joueur, petits
  // écarts d'angle et de position, cagettes du fond inclinées et rehaussées.
  const pose = (centre, extra) => {
    const lacetVersJoueur = Math.atan2(-centre.x, -centre.z) * reglages.orientationVersJoueur;
    return { lacet: lacetVersJoueur + (Math.random() - 0.5) * reglages.desordreAngle, ...extra };
  };
  const enArc = (x, z) => new THREE.Vector3(
    x + (Math.random() - 0.5) * reglages.desordrePosition,
    0,
    z + reglages.courbureRangs * x * x + (Math.random() - 0.5) * reglages.desordrePosition,
  );

  // Rang avant : 2 cagettes, panier du joueur, 2 cagettes.
  const largeurPanier = 0.42;
  const largeurs = [config.cagette.largeur, config.cagette.largeur, largeurPanier,
    config.cagette.largeur, config.cagette.largeur];
  const positionsX = repartirLargeurs(largeurs, 0.03);

  // Panier du joueur, au centre du rang avant.
  const panier = bibliotheque.creer(config.panier.modele);
  const centrePanier = new THREE.Vector3(positionsX[2], dessusComptoir, zRangAvant);
  if (panier) {
    panier.position.copy(centrePanier);
    panier.name = 'panier';
    groupe.add(panier);
  }

  // Étagère du fond : quelques objets de décor.
  const zEtagere = arriere + 0.1;
  repartir(config.etagere.length, 0.35, 0.25).forEach((x, indice) => {
    const objet = bibliotheque.creer(config.etagere[indice].modele, config.etagere[indice].element);
    if (objet) {
      poserSur(objet, new THREE.Vector3(x, reglages.hauteurEtagere + 0.02, zEtagere));
      groupe.add(objet);
    }
  });

  // Décor autour : tonneau, caisses.
  for (const { modele, position, rotation } of config.decor) {
    const objet = bibliotheque.creer(modele);
    if (objet) {
      objet.rotation.y = rotation;
      poserSur(objet, new THREE.Vector3(position.x, 0, position.z));
      groupe.add(objet);
    }
  }

  /** @type {Etal['garnir']} */
  const garnir = (articles) => {
    const garniture = new THREE.Group();
    garniture.name = 'garniture';
    const emplacements = new Map();

    // Le rang avant (à portée de main) prend la moitié des articles, 4 au plus ;
    // le reste va au rang arrière, 6 au plus.
    const nombreAvant = Math.min(4, Math.floor(articles.length / 2));
    const rangArriere = articles.slice(0, Math.min(6, articles.length - nombreAvant));
    const rangAvant = articles.slice(rangArriere.length, rangArriere.length + nombreAvant);

    // Rang arrière : cagettes sur le gradin, inclinées, à des hauteurs variées.
    repartir(rangArriere.length, config.cagette.largeur, 0.03).forEach((x, indice) => {
      const centre = enArc(x, zRangArriere).setY(dessusGradin);
      const extra = {
        inclinaison: reglages.inclinaisonRangArriere,
        rehausse: reglages.rehausses[indice % reglages.rehausses.length],
      };
      emplacements.set(rangArriere[indice].id,
        garnirCagette(garniture, config, bibliotheque, rangArriere[indice], centre, pose(centre, extra), bois));
    });

    // Rang avant : cagettes de part et d'autre du panier.
    [0, 1, 3, 4].slice(0, rangAvant.length).forEach((position, indice) => {
      const article = rangAvant[indice];
      const centre = enArc(positionsX[position], zRangAvant).setY(dessusComptoir);
      emplacements.set(article.id,
        garnirCagette(garniture, config, bibliotheque, article, centre, pose(centre, {}), bois));
    });

    // Quelques fruits « échappés », couchés sur le comptoir devant le rang arrière.
    const zEchappes = arriere + reglages.profondeurGradin + 0.03;
    for (const id of config.echappes) {
      const emplacement = emplacements.get(id);
      // Pas d'échappé devant le panier : on le croirait déjà dans le panier.
      const devantPanier = emplacement && Math.abs(emplacement.centre.x - centrePanier.x) < largeurPanier / 2 + 0.05;
      if (emplacement && !devantPanier) {
        const objet = poserEchappe(garniture, bibliotheque, emplacement.article, new THREE.Vector3(
          emplacement.centre.x + (Math.random() - 0.5) * 0.1,
          dessusComptoir,
          zEchappes + (Math.random() - 0.5) * 0.03,
        ));
        if (objet) {
          emplacement.exemplaires.push(objet);
        }
      }
    }
    return { objet3D: garniture, emplacements };
  };

  return { objet3D: groupe, panier, centrePanier, garnir };
}

/**
 * Positions x centrées de `nombre` éléments de même largeur.
 *
 * @param {number} nombre - Nombre d'éléments.
 * @param {number} largeur - Largeur d'un élément.
 * @param {number} ecart - Espace entre deux éléments.
 * @returns {number[]}
 */
function repartir(nombre, largeur, ecart) {
  return repartirLargeurs(Array(nombre).fill(largeur), ecart);
}

/**
 * Positions x centrées d'éléments de largeurs différentes, alignés côte à côte.
 *
 * @param {number[]} largeurs - Largeur de chaque élément.
 * @param {number} ecart - Espace entre deux éléments.
 * @returns {number[]}
 */
function repartirLargeurs(largeurs, ecart) {
  const total = largeurs.reduce((somme, largeur) => somme + largeur, 0) + ecart * (largeurs.length - 1);
  let curseur = -total / 2;
  return largeurs.map((largeur) => {
    const centre = curseur + largeur / 2;
    curseur += largeur + ecart;
    return centre;
  });
}

/**
 * Pose un objet pour que le bas de sa boîte englobante touche le point donné.
 *
 * @param {THREE.Object3D} objet - Objet à poser.
 * @param {THREE.Vector3} point - Point de contact (centre au sol de l'objet).
 */
function poserSur(objet, point) {
  objet.position.set(0, 0, 0);
  objet.updateMatrixWorld(true);
  // Mesure précise (sommets) : un objet incliné reposerait sinon au-dessus du sol.
  const boite = new THREE.Box3().setFromObject(objet, true);
  const centre = boite.getCenter(new THREE.Vector3());
  objet.position.set(point.x - centre.x, point.y - boite.min.y, point.z - centre.z);
}

/**
 * Comptoir : plateau, gradin du fond, façade en planches verticales.
 *
 * @param {typeof import('../config.js').CONFIG.etal} reglages - Réglages de l'étal.
 * @param {number} avant - Position z du bord avant.
 * @param {number} arriere - Position z du bord arrière.
 * @param {(repX: number, repY: number, teinte?: number) => THREE.Material} bois - Fabrique de matière bois.
 * @returns {THREE.Group}
 */
function creerComptoir(reglages, avant, arriere, bois) {
  const comptoir = new THREE.Group();
  comptoir.name = 'comptoir';
  const centreZ = (avant + arriere) / 2;

  const plateau = new THREE.Mesh(
    new THREE.BoxGeometry(reglages.largeur, reglages.epaisseurPlateau, reglages.profondeur),
    bois(reglages.largeur / 0.9, reglages.profondeur / 0.9),
  );
  plateau.position.set(0, reglages.hauteur - reglages.epaisseurPlateau / 2, centreZ);
  comptoir.add(plateau);

  const gradin = new THREE.Mesh(
    new THREE.BoxGeometry(reglages.largeur - 0.06, reglages.hauteurGradin, reglages.profondeurGradin),
    bois(reglages.largeur / 0.9, 0.4, 0xe6d2b8),
  );
  gradin.position.set(0, reglages.hauteur + reglages.hauteurGradin / 2, arriere + reglages.profondeurGradin / 2);
  comptoir.add(gradin);

  // Façade : planches verticales légèrement espacées (fusionnées en une géométrie).
  const largeurPlanche = 0.13;
  const nombre = Math.floor(reglages.largeur / largeurPlanche);
  const hauteurFacade = reglages.hauteur - reglages.epaisseurPlateau - 0.02;
  const planches = [];
  for (let indice = 0; indice < nombre; indice++) {
    planches.push(new THREE.BoxGeometry(largeurPlanche - 0.008, hauteurFacade, 0.022).translate(
      -reglages.largeur / 2 + (indice + 0.5) * (reglages.largeur / nombre),
      0.02 + hauteurFacade / 2,
      avant - 0.015,
    ));
  }
  const facade = new THREE.Mesh(mergeGeometries(planches), bois(0.35, 1.2, 0xc9a07a));
  comptoir.add(facade);

  // Pieds arrière.
  for (const x of [-1, 1]) {
    const pied = new THREE.Mesh(new THREE.BoxGeometry(0.07, reglages.hauteur, 0.07), bois(0.2, 1));
    pied.position.set(x * (reglages.largeur / 2 - 0.05), reglages.hauteur / 2, arriere + 0.05);
    comptoir.add(pied);
  }

  comptoir.traverse((objet) => {
    if (objet.isMesh) {
      objet.castShadow = true;
      objet.receiveShadow = true;
    }
  });
  return comptoir;
}

/**
 * Structure : quatre poteaux, traverses, étagère du fond.
 *
 * @param {typeof import('../config.js').CONFIG.etal} reglages - Réglages de l'étal.
 * @param {number} avant - Position z du bord avant.
 * @param {number} arriere - Position z du bord arrière.
 * @param {(repX: number, repY: number, teinte?: number) => THREE.Material} bois - Fabrique de matière bois.
 * @returns {THREE.Group}
 */
function creerStructure(reglages, avant, arriere, bois) {
  const structure = new THREE.Group();
  structure.name = 'structure';
  const xPoteau = reglages.largeur / 2 + reglages.rayonPoteau;
  const matierePoteau = bois(0.5, 3, 0xb08868);

  const poteaux = [
    { x: -xPoteau, z: avant + 0.02, hauteur: reglages.hauteurAvant },
    { x: xPoteau, z: avant + 0.02, hauteur: reglages.hauteurAvant },
    { x: -xPoteau, z: arriere, hauteur: reglages.hauteurArriere },
    { x: xPoteau, z: arriere, hauteur: reglages.hauteurArriere },
  ];
  for (const { x, z, hauteur } of poteaux) {
    const poteau = new THREE.Mesh(
      new THREE.CylinderGeometry(reglages.rayonPoteau * 0.9, reglages.rayonPoteau, hauteur, 14),
      matierePoteau,
    );
    poteau.position.set(x, hauteur / 2, z);
    structure.add(poteau);
  }

  // Traverses hautes (avant et arrière), un peu sous le sommet des poteaux.
  for (const { z, hauteur } of [{ z: avant + 0.02, hauteur: reglages.hauteurAvant }, { z: arriere, hauteur: reglages.hauteurArriere }]) {
    const traverse = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, reglages.largeur + 0.3, 12).rotateZ(Math.PI / 2),
      matierePoteau,
    );
    traverse.position.set(0, hauteur - 0.12, z);
    structure.add(traverse);
  }

  // Étagère du fond, entre les poteaux arrière.
  const etagere = new THREE.Mesh(
    new THREE.BoxGeometry(reglages.largeur, 0.03, 0.22),
    bois(reglages.largeur / 0.9, 0.3, 0xd8c0a0),
  );
  etagere.position.set(0, reglages.hauteurEtagere, arriere + 0.1);
  structure.add(etagere);

  structure.traverse((objet) => {
    if (objet.isMesh) {
      objet.castShadow = true;
      objet.receiveShadow = true;
    }
  });
  return structure;
}

/**
 * Dessine la toile rayée de l'auvent (rayures dans le sens de la pente) et,
 * pour le lambrequin, son bord festonné (transparence).
 *
 * @param {string[]} couleurs - Deux couleurs CSS en alternance.
 * @param {number} nombreRayures - Nombre de rayures sur la largeur.
 * @param {boolean} avecFestons - Découper des festons en bas (lambrequin).
 * @returns {THREE.CanvasTexture}
 */
function creerToileRayee(couleurs, nombreRayures, avecFestons) {
  const canevas = document.createElement('canvas');
  canevas.width = 1024;
  canevas.height = avecFestons ? 256 : 512;
  const contexte = canevas.getContext('2d');
  const largeurRayure = canevas.width / nombreRayures;
  for (let indice = 0; indice < nombreRayures; indice++) {
    contexte.fillStyle = couleurs[indice % 2];
    contexte.fillRect(indice * largeurRayure, 0, largeurRayure + 1, canevas.height);
  }
  if (avecFestons) {
    // Un feston (demi-cercle) par rayure, découpé en bas de la bande.
    contexte.globalCompositeOperation = 'destination-out';
    const rayon = largeurRayure / 2;
    for (let indice = 0; indice < nombreRayures; indice++) {
      contexte.beginPath();
      contexte.ellipse((indice + 0.5) * largeurRayure, canevas.height, rayon, rayon * 0.9, 0, Math.PI, 0);
      contexte.fill();
    }
    contexte.globalCompositeOperation = 'source-over';
  }
  const texture = new THREE.CanvasTexture(canevas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Auvent en toile rayée, légèrement creusé, avec un lambrequin festonné à l'avant.
 *
 * @param {typeof import('../config.js').CONFIG.etal} reglages - Réglages de l'étal.
 * @param {number} avant - Position z du bord avant du comptoir.
 * @param {number} arriere - Position z du bord arrière.
 * @returns {THREE.Group}
 */
function creerAuvent(reglages, avant, arriere) {
  const auvent = new THREE.Group();
  auvent.name = 'auvent';
  const largeur = reglages.largeur + 0.35;
  const zAvant = avant + reglages.debordAuvent;
  const yAvant = reglages.hauteurAvant - 0.05;
  const yArriere = reglages.hauteurArriere + 0.02;

  // Grain du tissu (relief et rugosité du lin), la couleur venant des rayures.
  const lin = creerMatiere({
    dossier: reglages.dossierTextures, nom: reglages.textureToile, repetitionX: 4, repetitionY: 3, cote: THREE.DoubleSide,
  });
  const matiereToile = lin.clone();
  matiereToile.map = creerToileRayee(reglages.couleursRayures, reglages.nombreRayures, false);
  matiereToile.color.set(0xffffff);
  matiereToile.roughness = 1;

  // Toile : plan tendu de l'arrière à l'avant, creusé au milieu (poids du tissu).
  const segmentsLargeur = 24;
  const segmentsLongueur = 12;
  const geometrie = new THREE.PlaneGeometry(largeur, 1, segmentsLargeur, segmentsLongueur);
  const positions = geometrie.getAttribute('position');
  for (let indice = 0; indice < positions.count; indice++) {
    const u = positions.getX(indice) / largeur + 0.5;
    const v = positions.getY(indice) + 0.5;
    const creux = Math.sin(v * Math.PI) * 0.06 + Math.sin(u * Math.PI * segmentsLargeur / 3) ** 2 * 0.008;
    positions.setXYZ(
      indice,
      positions.getX(indice),
      yArriere + (yAvant - yArriere) * v - creux,
      arriere + (zAvant - arriere) * v,
    );
  }
  geometrie.computeVertexNormals();
  const toile = new THREE.Mesh(geometrie, matiereToile);
  toile.castShadow = true;
  toile.receiveShadow = true;
  auvent.add(toile);

  // Lambrequin festonné qui pend à l'avant.
  const matiereLambrequin = matiereToile.clone();
  matiereLambrequin.map = creerToileRayee(reglages.couleursRayures, reglages.nombreRayures, true);
  matiereLambrequin.alphaTest = 0.5;
  const lambrequin = new THREE.Mesh(new THREE.PlaneGeometry(largeur, 0.2), matiereLambrequin);
  lambrequin.position.set(0, yAvant - 0.1, zAvant);
  lambrequin.castShadow = true;
  auvent.add(lambrequin);
  return auvent;
}

/**
 * @typedef {object} PoseContenant
 * @property {number} [inclinaison=0] - Inclinaison vers le joueur, en radians (bord avant plus bas).
 * @property {number} [lacet=0] - Rotation autour de la verticale, en radians.
 * @property {number} [rehausse=0] - Hauteur de la cale posée dessous, en mètres.
 */

/**
 * Crée le groupe d'un contenant posé et orienté : son contenu suit son
 * inclinaison et sa rotation. Ajoute la cale (rehausse) et le coin qui
 * soutient l'arrière d'un contenant incliné.
 *
 * @param {THREE.Group} groupe - Groupe de l'étal.
 * @param {THREE.Vector3} centre - Centre du dessous du contenant, posé à plat (repère de la scène).
 * @param {{ largeur: number, profondeur: number }} empreinte - Dimensions au sol du contenant.
 * @param {PoseContenant} pose - Inclinaison, rotation, rehausse.
 * @param {(repX: number, repY: number, teinte?: number) => THREE.Material} bois - Fabrique de matière bois.
 * @returns {THREE.Group} Groupe local du contenant (origine au centre de son fond).
 */
function poserContenant(groupe, centre, empreinte, { inclinaison = 0, lacet = 0, rehausse = 0 }, bois) {
  const support = new THREE.Group();
  support.position.copy(centre);
  support.rotation.y = lacet;
  groupe.add(support);

  const elevation = rehausse + (empreinte.profondeur / 2) * Math.sin(inclinaison);
  if (rehausse > 0) {
    const cale = new THREE.Mesh(
      new THREE.BoxGeometry(empreinte.largeur * 0.9, rehausse, empreinte.profondeur * 0.9),
      bois(0.3, 0.2, 0xb08868),
    );
    cale.position.y = rehausse / 2;
    support.add(cale);
  }
  if (inclinaison > 0) {
    // Coin de bois sous l'arrière, pour que le contenant incliné repose sur quelque chose.
    const hauteurCoin = empreinte.profondeur * Math.sin(inclinaison);
    const coin = new THREE.Mesh(
      new THREE.BoxGeometry(empreinte.largeur * 0.8, hauteurCoin, 0.04),
      bois(0.3, 0.1, 0xb08868),
    );
    coin.position.set(0, rehausse + hauteurCoin / 2, -empreinte.profondeur / 2 + 0.03);
    support.add(coin);
  }
  support.traverse((objet) => {
    if (objet.isMesh) {
      objet.castShadow = true;
      objet.receiveShadow = true;
    }
  });

  const contenant = new THREE.Group();
  contenant.position.y = elevation;
  contenant.rotation.x = inclinaison;
  support.add(contenant);
  return contenant;
}

/**
 * Cagette en planches (fond à claire-voie, quatre côtés), garnie d'exemplaires
 * en tas bombé.
 *
 * @param {THREE.Group} groupe - Groupe de l'étal.
 * @param {typeof import('../config.js').CONFIG} config - Configuration globale.
 * @param {import('./modeles3D.js').BibliothequeModeles} bibliotheque - Modèles 3D.
 * @param {import('./articles.js').Article} article - Article présenté.
 * @param {THREE.Vector3} centre - Centre du dessous de la cagette (repère de la scène).
 * @param {PoseContenant} pose - Inclinaison, rotation, rehausse.
 * @param {(repX: number, repY: number, teinte?: number) => THREE.Material} bois - Fabrique de matière bois.
 * @returns {EmplacementArticle}
 */
function garnirCagette(groupe, config, bibliotheque, article, centre, pose, bois) {
  const { largeur, profondeur, hauteur, epaisseurPlanche: e, couleur } = config.cagette;
  const contenant = poserContenant(groupe, centre, { largeur, profondeur }, pose, bois);
  const morceaux = [
    // Fond à claire-voie : trois lattes.
    ...[-1, 0, 1].map((rang) => new THREE.BoxGeometry(largeur, e, profondeur / 3.6).translate(0, e / 2, rang * profondeur / 3)),
    // Côtés longs (planche pleine) et côtés courts (montants).
    new THREE.BoxGeometry(largeur, hauteur * 0.7, e).translate(0, hauteur * 0.35 + e, profondeur / 2 - e / 2),
    new THREE.BoxGeometry(largeur, hauteur * 0.7, e).translate(0, hauteur * 0.35 + e, -profondeur / 2 + e / 2),
    new THREE.BoxGeometry(e, hauteur, profondeur).translate(largeur / 2 - e / 2, hauteur / 2, 0),
    new THREE.BoxGeometry(e, hauteur, profondeur).translate(-largeur / 2 + e / 2, hauteur / 2, 0),
  ];
  const cagette = new THREE.Mesh(mergeGeometries(morceaux), bois(0.3, 0.3, couleur));
  cagette.castShadow = true;
  cagette.receiveShadow = true;
  cagette.name = `cagette-${article.id}`;
  contenant.add(cagette);

  const interieur = { largeur: largeur - 2 * e, profondeur: profondeur - 2 * e, hauteur };
  const exemplaires = remplir(contenant, bibliotheque, article, interieur, e);
  contenant.updateWorldMatrix(true, false);
  return { article, exemplaires, centre: contenant.localToWorld(new THREE.Vector3(0, hauteur / 2, 0)), contenant };
}

/** Échelle de chaque article, calculée une fois (identifiant → échelle). */
const echellesArticles = new Map();

/**
 * Échelle à donner aux exemplaires d'un article pour qu'ils mesurent sa
 * taille réelle (`article.taille`), quelle que soit l'échelle du scan.
 *
 * @param {import('./modeles3D.js').BibliothequeModeles} bibliotheque - Modèles 3D.
 * @param {import('./articles.js').Article} article - Article à mesurer.
 * @returns {number}
 */
function echelleArticle(bibliotheque, article) {
  if (!echellesArticles.has(article.id)) {
    const dimensions = (article.elements ?? [undefined]).map((element) => {
      const objet = bibliotheque.creer(article.modele, element);
      if (!objet) {
        return 0;
      }
      const taille = new THREE.Box3().setFromObject(objet).getSize(new THREE.Vector3());
      return Math.max(taille.x, taille.y, taille.z);
    });
    echellesArticles.set(article.id, calculerEchelle(article.taille, dimensions));
  }
  return echellesArticles.get(article.id);
}

/** Au-delà de ce rapport longueur / largeur, un article est « allongé ». */
const RAPPORT_ALLONGE = 1.3;

/**
 * Un contenant est plein quand le dessous d'un nouvel exemplaire dépasserait
 * cette fraction de la hauteur de ses bords : le tas reste bombé sans déborder.
 * Un gros article (chou, courge) peut toutefois s'appuyer sur un autre jusqu'à
 * cette fraction de sa propre hauteur.
 */
const REMPLISSAGE_MAXIMAL = 0.6;
const APPUI_GROS_ARTICLES = 0.8;

/** Inclinaison au hasard (de part et d'autre), en radians : ronds et allongés. */
const INCLINAISON_RONDS = 0.35;
const INCLINAISON_ALLONGES = 0.12;

/**
 * Désordre de l'orientation des articles allongés autour de la longueur du
 * contenant (de part et d'autre), en radians : environ 35°, ils se croisent un
 * peu. Réduit à 17° pour les très longs (plus de la moitié du contenant), sans
 * quoi un second n'aurait plus la place de se loger à côté du premier.
 */
const DESORDRE_ALLONGES = 0.6;
const DESORDRE_TRES_LONGS = 0.3;

/** Après ce nombre d'essais ratés de suite (posés trop haut), le contenant est plein. */
const ECHECS_CONTENANT_PLEIN = 5;

/**
 * Remplit un contenant d'exemplaires d'un article, en vrai tas : chaque
 * exemplaire, tourné au hasard (les allongés à peu près dans la longueur,
 * parfois croisés), est lâché à un endroit tiré au hasard et se pose sur ce
 * qui est déjà là (voir `tas.js`), jusqu'à ce que le contenant soit plein
 * ou que la quantité de l'article soit atteinte.
 *
 * @param {THREE.Group} contenant - Groupe local du contenant (origine au centre du fond).
 * @param {import('./modeles3D.js').BibliothequeModeles} bibliotheque - Modèles 3D.
 * @param {import('./articles.js').Article} article - Article à exposer.
 * @param {{ largeur: number, profondeur: number, hauteur: number }} interieur - Dimensions utiles
 *   du contenant (hauteur : celle de ses bords).
 * @param {number} hauteurFond - Hauteur du dessus du fond, dans le repère du contenant.
 * @returns {THREE.Object3D[]}
 */
function remplir(contenant, bibliotheque, article, interieur, hauteurFond) {
  const elements = article.elements ?? [undefined];
  const echelle = echelleArticle(bibliotheque, article);
  const tas = new Tas({ largeur: interieur.largeur, profondeur: interieur.profondeur, hauteurFond });
  const taille = new THREE.Vector3();

  const exemplaires = [];
  let echecs = 0;
  while (exemplaires.length < article.quantite && echecs < ECHECS_CONTENANT_PLEIN) {
    const objet = bibliotheque.creer(article.modele, elements[exemplaires.length % elements.length]);
    if (!objet) {
      break;
    }
    objet.scale.setScalar(echelle);

    // Dimensions de l'exemplaire incliné, avant de le tourner autour de la verticale.
    new THREE.Box3().setFromObject(objet).getSize(taille);
    const estAllonge = Math.max(taille.x, taille.z) / Math.min(taille.x, taille.z) > RAPPORT_ALLONGE;
    const inclinaison = estAllonge ? INCLINAISON_ALLONGES : INCLINAISON_RONDS;
    // Ordre « YXZ » : l'inclinaison est propre à l'exemplaire, le lacet vient ensuite.
    objet.rotation.set((Math.random() - 0.5) * 2 * inclinaison, 0, (Math.random() - 0.5) * 2 * inclinaison, 'YXZ');
    objet.updateMatrixWorld(true);
    // Mesure précise (sommets) : la boîte d'un objet incliné serait sinon gonflée.
    new THREE.Box3().setFromObject(objet, true).getSize(taille);

    // Ronds : n'importe quel sens. Allongés : à peu près dans la longueur du contenant.
    const desordre = Math.max(taille.x, taille.z) > interieur.largeur / 2 ? DESORDRE_TRES_LONGS : DESORDRE_ALLONGES;
    const lacet = estAllonge
      ? (taille.x >= taille.z ? 0 : Math.PI / 2) + (Math.random() < 0.5 ? 0 : Math.PI)
        + (Math.random() - 0.5) * 2 * desordre
      : Math.random() * Math.PI * 2;
    const place = tas.deposer({
      demiLongueur: taille.x / 2,
      demiLargeur: taille.z / 2,
      demiHauteur: taille.y / 2,
      lacet,
    }, Math.random, hauteurFond + Math.max(interieur.hauteur * REMPLISSAGE_MAXIMAL, taille.y * APPUI_GROS_ARTICLES));
    if (!place) {
      // Pas de place assez basse : on réessaie avec une autre orientation.
      echecs += 1;
      continue;
    }
    echecs = 0;
    objet.rotation.y = lacet;
    poserSur(objet, new THREE.Vector3(place.x, place.bas, place.z));
    objet.name = `article-${article.id}`;
    objet.userData.article = article.id;
    contenant.add(objet);
    exemplaires.push(objet);
  }
  return exemplaires;
}

/**
 * Pose un exemplaire « échappé » de son contenant, couché sur le comptoir.
 *
 * @param {THREE.Group} groupe - Groupe de l'étal.
 * @param {import('./modeles3D.js').BibliothequeModeles} bibliotheque - Modèles 3D.
 * @param {import('./articles.js').Article} article - Article concerné.
 * @param {THREE.Vector3} point - Point du comptoir où il repose.
 * @returns {THREE.Object3D | null}
 */
function poserEchappe(groupe, bibliotheque, article, point) {
  const objet = bibliotheque.creer(article.modele, article.elements?.[0]);
  if (!objet) {
    return null;
  }
  objet.scale.setScalar(echelleArticle(bibliotheque, article));
  objet.rotation.set(Math.PI / 2 * 0.9, Math.random() * Math.PI * 2, 0.2);
  poserSur(objet, point);
  objet.name = `article-${article.id}`;
  objet.userData.article = article.id;
  groupe.add(objet);
  return objet;
}
