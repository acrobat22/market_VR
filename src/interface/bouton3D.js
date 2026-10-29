/**
 * @file Bouton 3D posé sur la table, toujours visible (« Annuler »,
 * « Voir le modèle »…).
 *
 * On l'active en pinçant à proximité. Retours visuels :
 *   - survol : bordure épaisse jaune pâle (en plus d'un changement de couleur) ;
 *   - appui : le bouton s'enfonce brièvement ;
 *   - inactif : texte gris et bordure pointillée, mais toujours affiché.
 *
 * Le libellé est dessiné sur un canevas : aucune police ni image externe.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Couleurs du libellé (contrastes ≥ 7:1 sur le fond sombre, voir styles/accueil.css). */
const COULEURS = Object.freeze({
  fond: '#111418',
  texteActif: '#ffffff',
  texteInactif: '#c8ccd4',
  bordureSurvol: '#ffe98a',
  bordureRepos: '#ffffff',
});

/** Résolution du canevas du libellé (rapport 2:1, comme le bouton). */
const LARGEUR_CANEVAS = 512;
const HAUTEUR_CANEVAS = 256;

/** Taille maximale du texte ; réduite automatiquement si le libellé est long. */
const TAILLE_TEXTE_MAXIMALE = 78;

/**
 * @typedef {(contexte: CanvasRenderingContext2D, centreX: number, centreY: number, couleur: string) => void} DessinIcone
 */

/**
 * Bouton 3D générique.
 */
export class Bouton3D {
  /**
   * @param {typeof import('../config.js').CONFIG.bouton} reglages - Dimensions et réglages.
   * @param {object} options
   * @param {string} options.libelle - Texte affiché.
   * @param {DessinIcone} options.dessinerIcone - Dessine l'icône à gauche du texte.
   * @param {() => void} options.surAppui - Action déclenchée par un appui sur le bouton actif.
   * @param {boolean} [options.estActif=true] - État initial.
   */
  constructor(reglages, { libelle, dessinerIcone, surAppui, estActif = true }) {
    this.reglages = reglages;
    this.libelle = libelle;
    this.dessinerIcone = dessinerIcone;
    this.surAppui = surAppui;

    this.estActif = estActif;
    this.estSurvole = false;
    /** Instant du dernier appui (pour l'animation d'enfoncement), ou `null`. */
    this.debutAppui = null;

    this.canevas = document.createElement('canvas');
    this.canevas.width = LARGEUR_CANEVAS;
    this.canevas.height = HAUTEUR_CANEVAS;
    this.texture = new THREE.CanvasTexture(this.canevas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;

    /** Groupe incliné vers le joueur, à placer sur la table. */
    this.objet3D = new THREE.Group();
    this.objet3D.name = 'bouton';
    this.objet3D.rotation.x = reglages.inclinaison;

    /** Partie mobile (socle + libellé), enfoncée lors de l'appui. */
    this.partieMobile = new THREE.Group();
    this.objet3D.add(this.partieMobile);

    const socle = new THREE.Mesh(
      new RoundedBoxGeometry(reglages.largeur, reglages.hauteur, reglages.profondeur, 3, 0.008),
      new THREE.MeshStandardMaterial({ color: 0x1b1f26, roughness: 0.5 }),
    );
    socle.castShadow = true;
    this.partieMobile.add(socle);

    // Libellé non éclairé : ses couleurs restent exactes (contraste garanti).
    const libelleMaillage = new THREE.Mesh(
      new THREE.PlaneGeometry(reglages.largeur * 0.94, reglages.profondeur * 0.9),
      new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false }),
    );
    libelleMaillage.rotation.x = -Math.PI / 2;
    libelleMaillage.position.y = reglages.hauteur / 2 + 0.0005;
    this.partieMobile.add(libelleMaillage);

    /** Boîte de visée réutilisée à chaque test. */
    this.zoneVisee = new THREE.Box3();

    this.#dessinerLibelle();
  }

  /**
   * Active ou désactive le bouton (il reste toujours visible).
   *
   * @param {boolean} estActif - `true` si le bouton peut être utilisé.
   */
  definirActif(estActif) {
    if (estActif !== this.estActif) {
      this.estActif = estActif;
      this.#dessinerLibelle();
    }
  }

  /**
   * Change le texte affiché (par exemple « Voir » / « Cacher »).
   *
   * @param {string} libelle - Nouveau texte.
   */
  definirLibelle(libelle) {
    if (libelle !== this.libelle) {
      this.libelle = libelle;
      this.#dessinerLibelle();
    }
  }

  /**
   * Indique si un point de pincement vise le bouton (zone élargie par une marge).
   *
   * @param {THREE.Vector3} point - Point de pincement (coordonnées de la scène).
   * @returns {boolean}
   */
  estVise(point) {
    return this.zoneVisee
      .setFromObject(this.objet3D)
      .expandByScalar(this.reglages.margeVisee)
      .containsPoint(point);
  }

  /**
   * Appui sur le bouton : animation d'enfoncement et action, si le bouton est actif.
   *
   * @param {number} temps - Instant de l'appui, en millisecondes.
   */
  appuyer(temps) {
    if (!this.estActif) {
      return;
    }
    this.debutAppui = temps;
    this.surAppui();
  }

  /**
   * Met à jour le survol et l'animation d'appui. À appeler une fois par image.
   *
   * @param {Map<XRHandedness, THREE.Vector3>} pointsDePincement - Points des mains suivies.
   * @param {number} temps - Instant courant, en millisecondes.
   */
  mettreAJour(pointsDePincement, temps) {
    const estSurvole = [...pointsDePincement.values()].some((point) => this.estVise(point));
    if (estSurvole !== this.estSurvole) {
      this.estSurvole = estSurvole;
      this.#dessinerLibelle();
    }

    // Enfoncement bref : descend puis remonte (forme en cloche, sans à-coup).
    let enfoncement = 0;
    if (this.debutAppui !== null) {
      const progression = (temps - this.debutAppui) / this.reglages.dureeAppui;
      if (progression >= 1 || progression < 0) {
        this.debutAppui = null;
      } else {
        enfoncement = Math.sin(progression * Math.PI) * this.reglages.enfoncement;
      }
    }
    this.partieMobile.position.y = -enfoncement;
  }

  /** Redessine le libellé selon l'état (actif, survolé). */
  #dessinerLibelle() {
    const contexte = this.canevas.getContext('2d');
    const marge = 14;
    const rayon = 36;

    contexte.clearRect(0, 0, LARGEUR_CANEVAS, HAUTEUR_CANEVAS);
    contexte.fillStyle = COULEURS.fond;
    contexte.beginPath();
    contexte.roundRect(marge, marge, LARGEUR_CANEVAS - 2 * marge, HAUTEUR_CANEVAS - 2 * marge, rayon);
    contexte.fill();

    // Bordure : épaisse au survol, fine au repos, pointillée si inactif.
    const survolActif = this.estSurvole && this.estActif;
    contexte.lineWidth = survolActif ? 18 : 8;
    contexte.strokeStyle = survolActif ? COULEURS.bordureSurvol : COULEURS.bordureRepos;
    contexte.setLineDash(this.estActif ? [] : [24, 18]);
    if (!this.estActif) {
      contexte.strokeStyle = COULEURS.texteInactif;
    }
    contexte.stroke();
    contexte.setLineDash([]);

    const couleurTexte = this.estActif ? COULEURS.texteActif : COULEURS.texteInactif;
    this.dessinerIcone(contexte, 110, HAUTEUR_CANEVAS / 2, couleurTexte);

    // Le texte rétrécit si nécessaire pour tenir dans le bouton.
    const debutTexte = 172;
    const largeurDisponible = LARGEUR_CANEVAS - debutTexte - 64;
    let taille = TAILLE_TEXTE_MAXIMALE;
    contexte.font = this.#police(taille);
    while (contexte.measureText(this.libelle).width > largeurDisponible && taille > 40) {
      taille -= 2;
      contexte.font = this.#police(taille);
    }
    contexte.fillStyle = couleurTexte;
    contexte.textBaseline = 'middle';
    contexte.textAlign = 'left';
    contexte.fillText(this.libelle, debutTexte, HAUTEUR_CANEVAS / 2 + 4);

    this.texture.needsUpdate = true;
  }

  /**
   * Police du libellé : sans empattement, épaisse.
   *
   * @param {number} taille - Taille en pixels.
   * @returns {string}
   */
  #police(taille) {
    return `bold ${taille}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  }
}
