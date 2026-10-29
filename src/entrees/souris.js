/**
 * @file Souris en remplacement des mains, pour essayer le jeu sans casque.
 *
 * Fournit la même interface que `Mains` (début / fin de pincement, points de
 * pincement), le reste du jeu n'a donc pas besoin de savoir d'où vient le geste :
 *   - clic gauche enfoncé = pincer ;
 *   - glisser = déplacer ;
 *   - relâcher = lâcher.
 *
 * Avant la prise, le point suit la surface visée sous le curseur (table,
 * planchette, pièce…). Pendant la prise, la pièce glisse sur un plan
 * horizontal à la hauteur de son emplacement : viser le contour revient à
 * viser la bonne place, même pour une pièce en hauteur et en surplomb (sinon,
 * le rayon traverserait le contour et toucherait la planchette loin derrière).
 */

import { Plane, Raycaster, Vector2, Vector3 } from 'three';

/** Côté attribué à la souris (une seule « main »). */
const COTE_SOURIS = 'right';

/** Noms des objets que le curseur traverse (décor, aides visuelles). */
const NOMS_IGNORES = new Set(['piece', 'maquette-fantome', 'carte-progression', 'ombre-contact', 'lampe', 'ardoise']);

/**
 * Pilote le pincement à la souris sur le canevas.
 */
export class Souris {
  /**
   * @param {object} dependances
   * @param {HTMLCanvasElement} dependances.canevas - Canevas du rendu.
   * @param {import('three').Camera} dependances.camera - Caméra de l'aperçu.
   * @param {import('three').Scene} dependances.scene - Scène visée par le curseur.
   * @param {() => import('three').Object3D[]} dependances.objetsTenus - Objets à ignorer (tenus).
   * @param {import('./mains.js').EcouteursPincement} dependances.ecouteurs - Fonctions appelées lors des pincements.
   * @param {() => number | null} dependances.hauteurCible - Hauteur du centre de l'emplacement attendu
   *   (plan de glissement pendant une prise), ou `null` s'il n'y en a pas.
   * @param {{ hauteurLevee: number }} dependances.reglages - Surélévation pendant une prise, sans emplacement attendu.
   */
  constructor({ canevas, camera, scene, objetsTenus, ecouteurs, hauteurCible, reglages }) {
    this.canevas = canevas;
    this.camera = camera;
    this.scene = scene;
    this.objetsTenus = objetsTenus;
    this.ecouteurs = ecouteurs;
    this.hauteurCible = hauteurCible;
    this.reglages = reglages;
    /** Plan horizontal de glissement, réutilisé à chaque image. */
    this.planGlissement = new Plane(new Vector3(0, 1, 0), 0);

    this.estActive = false;
    this.estEnfoncee = false;
    /** Position du curseur en coordonnées normalisées (-1 à 1), ou `null` hors du canevas. */
    this.positionCurseur = null;
    this.point = new Vector3();
    this.pointEstValide = false;
    this.lanceurDeRayon = new Raycaster();

    // Fonctions liées une fois pour pouvoir retirer les écouteurs.
    this.surDeplacement = this.#surDeplacement.bind(this);
    this.surAppui = this.#surAppui.bind(this);
    this.surRelachement = this.#surRelachement.bind(this);
    this.surSortie = this.#surSortie.bind(this);
  }

  /**
   * Points de pincement à cette image (au plus un : celui de la souris).
   *
   * @returns {Map<XRHandedness, Vector3>}
   */
  get pointsDePincement() {
    return this.estActive && this.pointEstValide
      ? new Map([[COTE_SOURIS, this.point]])
      : new Map();
  }

  /** Commence à écouter la souris. */
  activer() {
    if (this.estActive) {
      return;
    }
    this.estActive = true;
    this.canevas.style.cursor = 'grab';
    this.canevas.addEventListener('pointermove', this.surDeplacement);
    this.canevas.addEventListener('pointerdown', this.surAppui);
    this.canevas.addEventListener('pointerup', this.surRelachement);
    this.canevas.addEventListener('pointercancel', this.surRelachement);
    this.canevas.addEventListener('pointerleave', this.surSortie);
  }

  /** Arrête d'écouter la souris (en relâchant une éventuelle prise). */
  desactiver() {
    if (!this.estActive) {
      return;
    }
    this.#terminerPincement();
    this.estActive = false;
    this.positionCurseur = null;
    this.pointEstValide = false;
    this.canevas.style.cursor = '';
    this.canevas.removeEventListener('pointermove', this.surDeplacement);
    this.canevas.removeEventListener('pointerdown', this.surAppui);
    this.canevas.removeEventListener('pointerup', this.surRelachement);
    this.canevas.removeEventListener('pointercancel', this.surRelachement);
    this.canevas.removeEventListener('pointerleave', this.surSortie);
  }

  /**
   * Recalcule le point visé (les objets bougent même si la souris est immobile).
   * À appeler une fois par image, avant la logique de saisie.
   */
  mettreAJour() {
    this.pointEstValide = false;
    if (!this.estActive || this.positionCurseur === null) {
      return;
    }
    this.lanceurDeRayon.setFromCamera(this.positionCurseur, this.camera);

    // Pendant une prise : glissement à la hauteur de l'emplacement attendu.
    const hauteur = this.estEnfoncee ? this.hauteurCible() : null;
    if (hauteur !== null) {
      this.planGlissement.constant = -hauteur;
      this.pointEstValide = this.lanceurDeRayon.ray.intersectPlane(this.planGlissement, this.point) !== null;
      return;
    }

    const ignores = new Set(this.objetsTenus());
    const impact = this.lanceurDeRayon
      .intersectObject(this.scene, true)
      .find((intersection) => !this.#estIgnore(intersection.object, ignores));
    if (!impact) {
      return;
    }
    this.point.copy(impact.point);
    if (this.estEnfoncee) {
      this.point.y += this.reglages.hauteurLevee;
    }
    this.pointEstValide = true;
  }

  /**
   * Indique si un objet (ou l'un de ses parents) doit être traversé par le curseur.
   *
   * @param {import('three').Object3D} objet - Objet touché.
   * @param {Set<import('three').Object3D>} ignores - Objets tenus.
   * @returns {boolean}
   */
  #estIgnore(objet, ignores) {
    for (let courant = objet; courant; courant = courant.parent) {
      if (ignores.has(courant) || NOMS_IGNORES.has(courant.name) || !courant.visible) {
        return true;
      }
    }
    return false;
  }

  /**
   * Mémorise la position du curseur en coordonnées normalisées.
   *
   * @param {PointerEvent} evenement - Événement de pointeur.
   */
  #surDeplacement(evenement) {
    const rectangle = this.canevas.getBoundingClientRect();
    this.positionCurseur = new Vector2(
      ((evenement.clientX - rectangle.left) / rectangle.width) * 2 - 1,
      -((evenement.clientY - rectangle.top) / rectangle.height) * 2 + 1,
    );
  }

  /**
   * Clic gauche enfoncé : début de pincement au point visé.
   *
   * @param {PointerEvent} evenement - Événement de pointeur.
   */
  #surAppui(evenement) {
    if (evenement.button !== 0) {
      return;
    }
    this.#surDeplacement(evenement);
    this.mettreAJour();
    if (!this.pointEstValide) {
      return;
    }
    // Garde le relâchement même si le curseur sort du canevas.
    this.canevas.setPointerCapture(evenement.pointerId);
    this.estEnfoncee = true;
    this.canevas.style.cursor = 'grabbing';
    // La pièce se centre sur le curseur : aucun décalage dû au point de prise.
    this.ecouteurs.surDebutPincement(COTE_SOURIS, this.point, { centrer: true });
  }

  /**
   * Clic relâché : fin de pincement.
   *
   * @param {PointerEvent} evenement - Événement de pointeur.
   */
  #surRelachement(evenement) {
    if (this.canevas.hasPointerCapture(evenement.pointerId)) {
      this.canevas.releasePointerCapture(evenement.pointerId);
    }
    this.#terminerPincement();
  }

  /** Curseur sorti du canevas : plus de point visé (sauf pendant une prise). */
  #surSortie() {
    if (!this.estEnfoncee) {
      this.positionCurseur = null;
    }
  }

  /** Signale la fin d'un pincement en cours, s'il y en a un. */
  #terminerPincement() {
    if (!this.estEnfoncee) {
      return;
    }
    this.estEnfoncee = false;
    this.canevas.style.cursor = 'grab';
    this.ecouteurs.surFinPincement(COTE_SOURIS);
  }
}
