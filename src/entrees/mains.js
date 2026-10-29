/**
 * @file Suivi et affichage des mains du joueur (WebXR Hand Input), et
 * signalement des pincements.
 *
 * À chaque image, la distance entre le bout du pouce et le bout de l'index
 * est transmise au détecteur de pincement de la main ; les débuts et fins de
 * pincement sont signalés aux écouteurs fournis à la construction.
 *
 * Documentation : https://www.w3.org/TR/webxr-hand-input-1/
 */

import { Vector3 } from 'three';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

import { EVENEMENT_PINCEMENT } from './detecteurPincement.js';

/** Nombre de mains suivies par WebXR (gauche et droite). */
const NOMBRE_DE_MAINS = 2;

/** Noms des articulations utilisées, définis par la spécification WebXR Hand Input. */
const ARTICULATION_POUCE = 'thumb-tip';
const ARTICULATION_INDEX = 'index-finger-tip';

/**
 * @typedef {object} EcouteursPincement
 * @property {(cote: XRHandedness, point: Vector3, options?: { centrer?: boolean }) => void} surDebutPincement
 *   Appelé quand une main commence à pincer, avec le point de pincement.
 *   `centrer` (souris) : l'objet saisi se centre sur le point.
 * @property {(cote: XRHandedness) => void} surFinPincement
 *   Appelé quand une main relâche (ou n'est plus suivie).
 */

/**
 * @typedef {object} EtatMain
 * @property {import('three').XRHandSpace} main - Objet Three.js de la main.
 * @property {XRHandedness | null} cote - « left » ou « right », connu après connexion.
 * @property {boolean} estConnectee - `true` tant que le casque suit cette main.
 * @property {{ mettreAJour(distance: number | null): string | null }} detecteur - Détecteur de pincement.
 * @property {Vector3} pointDePincement - Milieu entre pouce et index (coordonnées de la scène).
 * @property {boolean} pointEstValide - `true` si le point a été mesuré à cette image.
 */

/**
 * Ajoute les deux mains suivies à la scène et signale leurs pincements.
 */
export class Mains {
  /**
   * @param {import('three').WebGLRenderer} renderer - Moteur de rendu (avec `xr.enabled`).
   * @param {import('three').Scene} scene - Scène où afficher les mains.
   * @param {typeof import('../config.js').CONFIG.mains} reglages - Profil d'affichage et chemin des modèles.
   * @param {() => { mettreAJour(distance: number | null): string | null }} creerDetecteur
   *   Fabrique d'un détecteur de pincement (un par main).
   * @param {EcouteursPincement} ecouteurs - Fonctions appelées lors des pincements.
   */
  constructor(renderer, scene, reglages, creerDetecteur, ecouteurs) {
    this.ecouteurs = ecouteurs;

    /** @type {EtatMain[]} */
    this.etatsMains = [];

    // Les modèles de mains sont servis depuis le projet (aucun CDN externe).
    const fabriqueDeModeles = new XRHandModelFactory().setPath(reglages.cheminModeles);

    for (let indice = 0; indice < NOMBRE_DE_MAINS; indice++) {
      const main = renderer.xr.getHand(indice);
      main.add(fabriqueDeModeles.createHandModel(main, reglages.profilAffichage));

      /** @type {EtatMain} */
      const etat = {
        main,
        cote: null,
        estConnectee: false,
        detecteur: creerDetecteur(),
        pointDePincement: new Vector3(),
        pointEstValide: false,
      };

      main.addEventListener('connected', (evenement) => {
        // Une manette déclenche aussi « connected » : on ne garde que les mains.
        if (evenement.data.hand) {
          etat.cote = evenement.data.handedness;
          etat.estConnectee = true;
        }
      });
      main.addEventListener('disconnected', () => {
        // Le côté est conservé : la fin de pincement éventuelle sera signalée
        // à la prochaine image par `mettreAJour`.
        etat.estConnectee = false;
      });

      scene.add(main);
      this.etatsMains.push(etat);
    }
  }

  /**
   * Points de pincement des mains suivies à cette image, par côté.
   *
   * @returns {Map<XRHandedness, Vector3>}
   */
  get pointsDePincement() {
    const points = new Map();
    for (const etat of this.etatsMains) {
      if (etat.pointEstValide) {
        points.set(etat.cote, etat.pointDePincement);
      }
    }
    return points;
  }

  /**
   * Mesure la distance pouce–index de chaque main et signale les changements
   * de pincement. À appeler une fois par image, avant la logique de saisie.
   */
  mettreAJour() {
    for (const etat of this.etatsMains) {
      const distance = this.#mesurerPincement(etat);
      const evenement = etat.detecteur.mettreAJour(distance);

      if (evenement === EVENEMENT_PINCEMENT.DEBUT) {
        this.ecouteurs.surDebutPincement(etat.cote, etat.pointDePincement);
      } else if (evenement === EVENEMENT_PINCEMENT.FIN) {
        this.ecouteurs.surFinPincement(etat.cote);
      }
    }
  }

  /**
   * Calcule la distance pouce–index et le point de pincement d'une main.
   *
   * @param {EtatMain} etat - État de la main à mesurer (son point est mis à jour).
   * @returns {number | null} Distance en mètres, ou `null` si la main n'est pas suivie.
   */
  #mesurerPincement(etat) {
    etat.pointEstValide = false;
    if (!etat.estConnectee) {
      return null;
    }

    const pouce = etat.main.joints[ARTICULATION_POUCE];
    const index = etat.main.joints[ARTICULATION_INDEX];
    // Three.js rend une articulation invisible quand le casque ne la voit plus.
    if (!pouce?.visible || !index?.visible) {
      return null;
    }

    const positionPouce = pouce.getWorldPosition(new Vector3());
    const positionIndex = index.getWorldPosition(new Vector3());
    etat.pointDePincement.copy(positionPouce).add(positionIndex).multiplyScalar(0.5);
    etat.pointEstValide = true;

    return positionPouce.distanceTo(positionIndex);
  }
}
