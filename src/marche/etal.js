/**
 * @file Étal de marché : comptoir en bois, poteaux, auvent rayé, étagère,
 * cagettes garnies des articles du rayon, panier du joueur, décor.
 *
 * Le joueur est assis à l'origine, face à l'étal (vers -z). Le comptoir fait
 * un arc autour de lui (voir `disposition.js`) : le panier et le rang avant
 * sont à portée de main ; le gradin, surélevé, demande au plus de se pencher
 * un peu.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { calculerEchelle } from './articles.js';
import { creerMatiere } from './matieres.js';
import { disposerEtal } from './disposition.js';
import { Tas, profilDeTriangles } from './tas.js';

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
 *   Crée les cagettes garnies des articles donnés (8 au plus : jusqu'à 6 sur
 *   le gradin, 2 au rang avant). Peut être rappelée pour changer d'articles.
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

  const avant = reglages.avantStructure;
  const arriere = reglages.arriereStructure;
  const bois = (repX, repY, teinte) => creerMatiere({
    dossier: reglages.dossierTextures, nom: reglages.textureBois, repetitionX: repX, repetitionY: repY, teinte,
  });

  groupe.add(creerComptoir(reglages, bois));
  groupe.add(creerStructure(reglages, avant, arriere, bois));
  groupe.add(creerAuvent(reglages, avant, arriere));

  // Rangs de présentation.
  const dessusComptoir = reglages.hauteur;
  const dessusGradin = reglages.hauteur + reglages.hauteurGradin;

  // Disposition « vivante » : petits écarts d'angle et de position au hasard,
  // cagettes du gradin inclinées et rehaussées.
  const auHasard = (amplitude) => (Math.random() - 0.5) * amplitude;
  const placer = (pose, hauteur) => new THREE.Vector3(
    pose.x + auHasard(reglages.desordrePosition),
    hauteur,
    pose.z + auHasard(reglages.desordrePosition),
  );

  // Panier du joueur, droit devant, posé exactement (la zone de dépôt en dépend).
  const posePanier = disposerEtal(reglages, 0, 0).panier;
  const panier = bibliotheque.creer(config.panier.modele);
  const centrePanier = new THREE.Vector3(posePanier.x, dessusComptoir, posePanier.z);
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

    // Le rang avant prend la moitié des articles, 2 au plus ; le reste va sur
    // le gradin, 6 au plus.
    const nombreAvant = Math.min(2, Math.floor(articles.length / 2));
    const rangArriere = articles.slice(0, Math.min(6, articles.length - nombreAvant));
    const rangAvant = articles.slice(rangArriere.length, rangArriere.length + nombreAvant);
    const disposition = disposerEtal(reglages, rangAvant.length, rangArriere.length);

    // Gradin : cagettes posées en long (la longueur vers le joueur), inclinées,
    // à des hauteurs variées.
    const cagetteEnLong = { ...config.cagette, largeur: config.cagette.profondeur, profondeur: config.cagette.largeur };
    disposition.rangArriere.forEach((pose, indice) => {
      const article = rangArriere[indice];
      emplacements.set(article.id, garnirCagette(garniture, cagetteEnLong, bibliotheque, article, placer(pose, dessusGradin), {
        lacet: pose.lacet + auHasard(reglages.desordreAngle),
        inclinaison: reglages.inclinaisonRangArriere,
        rehausse: reglages.rehausses[indice % reglages.rehausses.length],
      }, bois));
    });

    // Rang avant : cagettes en travers, de part et d'autre du panier.
    disposition.rangAvant.forEach((pose, indice) => {
      const article = rangAvant[indice];
      emplacements.set(article.id, garnirCagette(garniture, config.cagette, bibliotheque, article, placer(pose, dessusComptoir), {
        lacet: pose.lacet + auHasard(reglages.desordreAngle),
      }, bois));
    });
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
 * Secteur d'anneau horizontal (portion de couronne) d'une épaisseur donnée,
 * centré sur le joueur : plateau ou gradin d'un comptoir en arc.
 * Les coordonnées de texture sont en mètres (une répétition par mètre).
 *
 * @param {number} rayonInterieur - Bord tourné vers le joueur.
 * @param {number} rayonExterieur - Bord du fond.
 * @param {number} demiAngle - Demi-angle couvert, depuis l'axe -z.
 * @param {number} epaisseur - Épaisseur (vers le haut, depuis y = 0).
 * @returns {THREE.BufferGeometry}
 */
function creerSecteur(rayonInterieur, rayonExterieur, demiAngle, epaisseur) {
  // Dans le plan de la forme, (x, y) devient (x, -z) une fois couché :
  // l'angle depuis -z vers +x correspond à l'angle π/2 - angle depuis +x.
  const debut = Math.PI / 2 - demiAngle;
  const fin = Math.PI / 2 + demiAngle;
  const forme = new THREE.Shape();
  forme.moveTo(rayonExterieur * Math.cos(debut), rayonExterieur * Math.sin(debut));
  forme.absarc(0, 0, rayonExterieur, debut, fin, false);
  forme.lineTo(rayonInterieur * Math.cos(fin), rayonInterieur * Math.sin(fin));
  forme.absarc(0, 0, rayonInterieur, fin, debut, true);
  forme.closePath();
  return new THREE.ExtrudeGeometry(forme, { depth: epaisseur, bevelEnabled: false, curveSegments: 48 })
    .rotateX(-Math.PI / 2);
}

/**
 * Comptoir en arc autour du joueur : plateau, gradin du fond, ceinture de
 * planches sous le bord avant (les jambes du joueur passent dessous), pieds.
 *
 * @param {typeof import('../config.js').CONFIG.etal} reglages - Réglages de l'étal.
 * @param {(repX: number, repY: number, teinte?: number) => THREE.Material} bois - Fabrique de matière bois.
 * @returns {THREE.Group}
 */
function creerComptoir(reglages, bois) {
  const comptoir = new THREE.Group();
  comptoir.name = 'comptoir';
  const { rayonInterieur, rayonExterieur, angleComptoir } = reglages;

  // Plateau et gradin : texture répétée tous les 90 cm (coordonnées en mètres).
  const plateau = new THREE.Mesh(
    creerSecteur(rayonInterieur, rayonExterieur, angleComptoir, reglages.epaisseurPlateau),
    bois(1 / 0.9, 1 / 0.9),
  );
  plateau.position.y = reglages.hauteur - reglages.epaisseurPlateau;
  comptoir.add(plateau);

  const gradin = new THREE.Mesh(
    creerSecteur(reglages.rayonGradin, rayonExterieur - 0.02, reglages.angleGradin, reglages.hauteurGradin),
    bois(1 / 0.9, 1 / 0.9, 0xe6d2b8),
  );
  gradin.position.y = reglages.hauteur;
  comptoir.add(gradin);

  // Ceinture : planches verticales sous le bord avant, chacune tournée vers le joueur.
  const largeurPlanche = 0.13;
  const hauteurCeinture = 0.12;
  const longueurArc = 2 * angleComptoir * (rayonInterieur + 0.015);
  const nombre = Math.max(1, Math.floor(longueurArc / largeurPlanche));
  const planches = [];
  for (let indice = 0; indice < nombre; indice++) {
    const angle = -angleComptoir + (indice + 0.5) * (2 * angleComptoir / nombre);
    const rayon = rayonInterieur + 0.015;
    planches.push(new THREE.BoxGeometry(largeurPlanche * (rayon / rayonInterieur) - 0.008, hauteurCeinture, 0.022)
      .rotateY(-angle)
      .translate(rayon * Math.sin(angle), reglages.hauteur - reglages.epaisseurPlateau - hauteurCeinture / 2, -rayon * Math.cos(angle)));
  }
  comptoir.add(new THREE.Mesh(mergeGeometries(planches), bois(0.35, 0.2, 0xc9a07a)));

  // Pieds : aux deux bouts et le long du bord du fond.
  const hauteurPied = reglages.hauteur - reglages.epaisseurPlateau;
  const pieds = [
    // Aux bouts, au milieu de la largeur : loin des jambes du joueur.
    ...[-1, 1].map((cote) => ({ rayon: (rayonInterieur + rayonExterieur) / 2, angle: cote * (angleComptoir - 0.1) })),
    ...[-1, -1 / 3, 1 / 3, 1].map((part) => ({ rayon: rayonExterieur - 0.05, angle: part * (angleComptoir - 0.06) })),
  ];
  for (const { rayon, angle } of pieds) {
    const pied = new THREE.Mesh(new THREE.BoxGeometry(0.06, hauteurPied, 0.06), bois(0.2, 1));
    pied.position.set(rayon * Math.sin(angle), hauteurPied / 2, -rayon * Math.cos(angle));
    pied.rotation.y = -angle;
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
 * @param {typeof import('../config.js').CONFIG.cagette} cagette - Dimensions et teinte de la cagette
 *   (largeur : côté parallèle au comptoir ; profondeur : côté tourné vers le joueur).
 * @param {import('./modeles3D.js').BibliothequeModeles} bibliotheque - Modèles 3D.
 * @param {import('./articles.js').Article} article - Article présenté.
 * @param {THREE.Vector3} centre - Centre du dessous de la cagette (repère de la scène).
 * @param {PoseContenant} pose - Inclinaison, rotation, rehausse.
 * @param {(repX: number, repY: number, teinte?: number) => THREE.Material} bois - Fabrique de matière bois.
 * @returns {EmplacementArticle}
 */
function garnirCagette(groupe, cagette, bibliotheque, article, centre, pose, bois) {
  const { largeur, profondeur, hauteur, epaisseurPlanche: e, couleur } = cagette;
  const contenant = poserContenant(groupe, centre, { largeur, profondeur }, pose, bois);
  const morceaux = [
    // Fond à claire-voie : trois lattes.
    ...[-1, 0, 1].map((rang) => new THREE.BoxGeometry(largeur, e, profondeur / 3.6).translate(0, e / 2, rang * profondeur / 3)),
    // Côtés avant et arrière (planche pleine), côtés gauche et droit (montants).
    new THREE.BoxGeometry(largeur, hauteur * 0.7, e).translate(0, hauteur * 0.35 + e, profondeur / 2 - e / 2),
    new THREE.BoxGeometry(largeur, hauteur * 0.7, e).translate(0, hauteur * 0.35 + e, -profondeur / 2 + e / 2),
    new THREE.BoxGeometry(e, hauteur, profondeur).translate(largeur / 2 - e / 2, hauteur / 2, 0),
    new THREE.BoxGeometry(e, hauteur, profondeur).translate(-largeur / 2 + e / 2, hauteur / 2, 0),
  ];
  const maillage = new THREE.Mesh(mergeGeometries(morceaux), bois(0.3, 0.3, couleur));
  maillage.castShadow = true;
  maillage.receiveShadow = true;
  maillage.name = `cagette-${article.id}`;
  contenant.add(maillage);

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

/** Triangles de chaque modèle, relevés une fois (article et élément → triangles). */
const trianglesModeles = new Map();

/**
 * Triangles de la surface d'un modèle, dans son propre repère (avant échelle
 * et rotation des exemplaires).
 *
 * @param {THREE.Object3D} objet - Copie neuve du modèle.
 * @returns {Float32Array} Sommets à la suite, trois par triangle : x, y, z…
 */
function trianglesDuModele(objet) {
  const triangles = [];
  const sommet = new THREE.Vector3();
  objet.updateMatrixWorld(true);
  const versObjet = objet.matrixWorld.clone().invert();
  objet.traverse((maillage) => {
    if (!maillage.isMesh) {
      return;
    }
    const matrice = versObjet.clone().multiply(maillage.matrixWorld);
    const positions = maillage.geometry.attributes.position;
    const index = maillage.geometry.index;
    const nombre = index ? index.count : positions.count;
    for (let rang = 0; rang < nombre; rang++) {
      sommet.fromBufferAttribute(positions, index ? index.getX(rang) : rang).applyMatrix4(matrice);
      triangles.push(sommet.x, sommet.y, sommet.z);
    }
  });
  return new Float32Array(triangles);
}

/**
 * Profil d'un exemplaire dans son orientation définitive (échelle, inclinaison
 * et lacet déjà appliqués à `objet`, sans position), pour le tas.
 *
 * @param {THREE.Object3D} objet - Exemplaire.
 * @param {Float32Array} pointsLocaux - Triangles du modèle (`trianglesDuModele`).
 * @returns {import('./tas.js').ProfilArticle}
 */
function profilExemplaire(objet, pointsLocaux) {
  objet.updateMatrix();
  const e = objet.matrix.elements;
  const points = new Float32Array(pointsLocaux.length);
  for (let i = 0; i < pointsLocaux.length; i += 3) {
    const [x, y, z] = [pointsLocaux[i], pointsLocaux[i + 1], pointsLocaux[i + 2]];
    points[i] = e[0] * x + e[4] * y + e[8] * z;
    points[i + 1] = e[1] * x + e[5] * y + e[9] * z;
    points[i + 2] = e[2] * x + e[6] * y + e[10] * z;
  }
  return profilDeTriangles(points);
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
    const element = elements[exemplaires.length % elements.length];
    const objet = bibliotheque.creer(article.modele, element);
    if (!objet) {
      break;
    }
    const cle = `${article.id}|${element ?? ''}`;
    if (!trianglesModeles.has(cle)) {
      trianglesModeles.set(cle, trianglesDuModele(objet));
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
    objet.rotation.y = lacet;
    // Vraie forme de l'exemplaire tourné : il se pose au contact de ses voisins.
    const profil = profilExemplaire(objet, trianglesModeles.get(cle));
    const place = tas.deposer(
      profil,
      Math.random,
      hauteurFond + Math.max(interieur.hauteur * REMPLISSAGE_MAXIMAL, profil.hauteur * APPUI_GROS_ARTICLES),
    );
    if (!place) {
      // Pas de place assez basse : on réessaie avec une autre orientation.
      echecs += 1;
      continue;
    }
    echecs = 0;
    // Centre de la boîte englobante en (x, z), point le plus bas à `bas` : comme le profil.
    poserSur(objet, new THREE.Vector3(place.x, place.bas, place.z));
    objet.name = `article-${article.id}`;
    objet.userData.article = article.id;
    contenant.add(objet);
    exemplaires.push(objet);
  }
  return exemplaires;
}
