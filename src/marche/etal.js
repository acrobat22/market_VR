/**
 * @file Étal de marché : comptoir en bois, poteaux, auvent rayé, étagère,
 * cagettes garnies des articles du rayon, corbeilles décoratives, panier du
 * joueur, décor.
 *
 * Le joueur est assis à l'origine, face à l'étal (vers -z). Le rang avant
 * est à portée de main ; le rang arrière, surélevé, demande de se pencher
 * un peu.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { creerMatiere } from './matieres.js';

/**
 * @typedef {object} EmplacementArticle
 * @property {import('./articles.js').Article} article - Article présenté.
 * @property {THREE.Object3D[]} exemplaires - Exemplaires posés dans la cagette.
 * @property {THREE.Vector3} centre - Centre du contenant (repère de la scène).
 * @property {THREE.Group} contenant - Groupe local de la cagette.
 */

/**
 * @typedef {object} Etal
 * @property {THREE.Group} objet3D - Tout l'étal, à ajouter à la scène.
 * @property {Map<string, EmplacementArticle>} emplacements - Articles présentés, par identifiant.
 * @property {THREE.Object3D | null} panier - Panier du joueur.
 * @property {THREE.Vector3} centrePanier - Centre du fond du panier (repère de la scène).
 */

/**
 * Construit l'étal complet.
 *
 * @param {typeof import('../config.js').CONFIG} config - Configuration globale.
 * @param {import('./modeles3D.js').BibliothequeModeles} bibliotheque - Modèles 3D chargés.
 * @param {readonly import('./articles.js').Article[]} articles - Articles du rayon (10 au plus :
 *   jusqu'à 6 au rang arrière, 4 au rang avant).
 * @returns {Etal}
 */
export function construireEtal(config, bibliotheque, articles) {
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

  const emplacements = new Map();
  // Le rang avant (à portée de main) prend la moitié des articles, 4 au plus ;
  // le reste va au rang arrière, 6 au plus.
  const nombreAvant = Math.min(4, Math.floor(articles.length / 2));
  const rangArriere = articles.slice(0, Math.min(6, articles.length - nombreAvant));
  const rangAvant = articles.slice(rangArriere.length, rangArriere.length + nombreAvant);

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

  // Rang arrière : 6 cagettes sur le gradin, inclinées, à des hauteurs variées.
  repartir(rangArriere.length, config.cagette.largeur, 0.03).forEach((x, indice) => {
    const centre = enArc(x, zRangArriere).setY(dessusGradin);
    const extra = {
      inclinaison: reglages.inclinaisonRangArriere,
      rehausse: reglages.rehausses[indice % reglages.rehausses.length],
    };
    emplacements.set(rangArriere[indice].id,
      garnirCagette(groupe, config, bibliotheque, rangArriere[indice], centre, pose(centre, extra), bois));
  });

  // Rang avant : corbeille, 2 cagettes, panier du joueur, 2 cagettes, corbeille.
  const largeurPanier = 0.42;
  const largeurCorbeille = 0.24;
  const largeurs = [largeurCorbeille, config.cagette.largeur, config.cagette.largeur, largeurPanier,
    config.cagette.largeur, config.cagette.largeur, largeurCorbeille];
  const positionsX = repartirLargeurs(largeurs, 0.03);
  for (const position of [0, 6]) {
    const centre = enArc(positionsX[position], zRangAvant).setY(dessusComptoir);
    poserCorbeille(groupe, config, bibliotheque, centre, pose(centre, { inclinaison: 0.12 }), bois);
  }
  [1, 2, 4, 5].slice(0, rangAvant.length).forEach((position, indice) => {
    const article = rangAvant[indice];
    const centre = enArc(positionsX[position], zRangAvant).setY(dessusComptoir);
    emplacements.set(article.id,
      garnirCagette(groupe, config, bibliotheque, article, centre, pose(centre, {}), bois));
  });

  // Quelques fruits « échappés », couchés sur le comptoir devant le rang arrière.
  const zEchappes = arriere + reglages.profondeurGradin + 0.03;
  for (const id of config.echappes) {
    const emplacement = emplacements.get(id);
    if (emplacement) {
      const objet = poserEchappe(groupe, bibliotheque, emplacement.article, new THREE.Vector3(
        emplacement.centre.x + (Math.random() - 0.5) * 0.1,
        dessusComptoir,
        zEchappes + (Math.random() - 0.5) * 0.03,
      ));
      if (objet) {
        emplacement.exemplaires.push(objet);
      }
    }
  }

  // Panier du joueur, au centre du rang avant.
  const panier = bibliotheque.creer(config.panier.modele);
  const centrePanier = new THREE.Vector3(positionsX[3], dessusComptoir, zRangAvant);
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

  return { objet3D: groupe, emplacements, panier, centrePanier };
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
  const boite = new THREE.Box3().setFromObject(objet);
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

  const interieur = { largeur: largeur - 2 * e, profondeur: profondeur - 2 * e };
  const exemplaires = remplir(contenant, bibliotheque, article, interieur, e);
  contenant.updateWorldMatrix(true, false);
  return { article, exemplaires, centre: contenant.localToWorld(new THREE.Vector3(0, hauteur / 2, 0)), contenant };
}

/**
 * Corbeille ronde en osier, vide, pour le décor.
 *
 * @param {THREE.Group} groupe - Groupe de l'étal.
 * @param {typeof import('../config.js').CONFIG} config - Configuration globale.
 * @param {import('./modeles3D.js').BibliothequeModeles} bibliotheque - Modèles 3D.
 * @param {THREE.Vector3} centre - Centre du dessous de la corbeille (repère de la scène).
 * @param {PoseContenant} pose - Inclinaison, rotation, rehausse.
 * @param {(repX: number, repY: number, teinte?: number) => THREE.Material} bois - Fabrique de matière bois.
 */
function poserCorbeille(groupe, config, bibliotheque, centre, pose, bois) {
  const contenant = poserContenant(groupe, centre, { largeur: 0.22, profondeur: 0.22 }, pose, bois);
  const corbeille = bibliotheque.creer(config.corbeille.modele, config.corbeille.element);
  if (corbeille) {
    poserSur(corbeille, new THREE.Vector3());
    corbeille.name = 'corbeille';
    contenant.add(corbeille);
  }
}

/** Nombre maximal de couches d'exemplaires dans un contenant. */
const COUCHES_MAXIMALES = 2;

/** Écart relatif entre exemplaires voisins (moins de 1 = légèrement serrés). */
const SERRAGE = 0.95;

/** Au-delà de ce rapport longueur / largeur, un article est « allongé ». */
const RAPPORT_ALLONGE = 1.3;

/**
 * Remplit un contenant d'exemplaires d'un article, en tas bombé : la couche
 * du dessus est plus petite et centrée, avec un léger désordre. Les articles
 * ronds sont tournés au hasard ; les allongés sont alignés dans le sens qui
 * rentre le mieux.
 *
 * @param {THREE.Group} contenant - Groupe local du contenant (origine au centre du fond).
 * @param {import('./modeles3D.js').BibliothequeModeles} bibliotheque - Modèles 3D.
 * @param {import('./articles.js').Article} article - Article à exposer.
 * @param {{ largeur: number, profondeur: number }} interieur - Dimensions utiles du contenant.
 * @param {number} hauteurFond - Hauteur du dessus du fond, dans le repère du contenant.
 * @returns {THREE.Object3D[]}
 */
function remplir(contenant, bibliotheque, article, interieur, hauteurFond) {
  const elements = article.elements ?? [undefined];
  const reference = bibliotheque.creer(article.modele, elements[0]);
  if (!reference) {
    return [];
  }
  const echelle = article.echelle ?? 1;
  const taille = new THREE.Box3().setFromObject(reference).getSize(new THREE.Vector3()).multiplyScalar(echelle);
  const estAllonge = Math.max(taille.x, taille.z) / Math.min(taille.x, taille.z) > RAPPORT_ALLONGE;

  // Pour un article allongé, on garde l'orientation (0 ou 90°) qui en loge le plus.
  const grille = (largeurX, largeurZ) => ({
    colonnes: Math.max(1, Math.floor(interieur.largeur / (largeurX * SERRAGE))),
    rangees: Math.max(1, Math.floor(interieur.profondeur / (largeurZ * SERRAGE))),
  });
  const droite = grille(taille.x, taille.z);
  const tournee = grille(taille.z, taille.x);
  const tourner = estAllonge && tournee.colonnes * tournee.rangees > droite.colonnes * droite.rangees;
  const base = tourner ? tournee : droite;
  const pas = {
    x: interieur.largeur / base.colonnes,
    z: interieur.profondeur / base.rangees,
  };

  // Places de chaque couche : la couche supérieure a une colonne et une rangée
  // de moins, décalée d'une demi-case (comme un vrai tas de fruits).
  const places = [];
  for (let couche = 0; couche < COUCHES_MAXIMALES; couche++) {
    const colonnes = Math.max(1, base.colonnes - couche);
    const rangees = Math.max(1, base.rangees - couche);
    for (let rangee = 0; rangee < rangees; rangee++) {
      for (let colonne = 0; colonne < colonnes; colonne++) {
        places.push({
          x: (colonne - (colonnes - 1) / 2) * pas.x,
          z: (rangee - (rangees - 1) / 2) * pas.z,
          y: hauteurFond + couche * taille.y * 0.72,
        });
      }
    }
  }

  const exemplaires = [];
  const quantite = Math.min(article.quantite, places.length);
  for (let indice = 0; indice < quantite; indice++) {
    const place = places[indice];
    const objet = bibliotheque.creer(article.modele, elements[indice % elements.length]);
    objet.scale.setScalar(echelle);
    const lacet = estAllonge
      ? (tourner ? Math.PI / 2 : 0) + (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.35
      : Math.random() * Math.PI * 2;
    objet.rotation.set((Math.random() - 0.5) * 0.3, lacet, (Math.random() - 0.5) * 0.3);
    poserSur(objet, new THREE.Vector3(
      place.x + (Math.random() - 0.5) * pas.x * 0.18,
      place.y,
      place.z + (Math.random() - 0.5) * pas.z * 0.18,
    ));
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
  objet.scale.setScalar(article.echelle ?? 1);
  objet.rotation.set(Math.PI / 2 * 0.9, Math.random() * Math.PI * 2, 0.2);
  poserSur(objet, point);
  objet.name = `article-${article.id}`;
  objet.userData.article = article.id;
  groupe.add(objet);
  return objet;
}
