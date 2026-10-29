/**
 * @file Exemplaire d'un article : un fruit (ou un pain) de l'étal que l'on
 * peut prendre ; lâché, il va doucement dans le panier ou retourne à sa place.
 *
 * Respecte l'interface `ObjetSaisissable` de `saisie.js`.
 */

import { Box3, Quaternion, Vector3 } from 'three';

import { adoucir, interpoler } from './mouvement.js';

/**
 * Un objet de l'étal, saisissable, avec sa place d'origine.
 */
export class Exemplaire {
  /**
   * L'objet est rattaché directement à la scène (sans changer sa place à
   * l'écran) : sa position devient celle de la scène, ce qu'attend la saisie,
   * même s'il reposait dans une cagette inclinée.
   *
   * @param {import('three').Object3D} objet3D - Objet posé dans sa cagette ou sur le comptoir.
   * @param {string} idArticle - Identifiant de l'article (voir `articles.js`).
   * @param {import('three').Scene} scene - Scène qui accueille l'objet.
   * @param {typeof import('../config.js').CONFIG.saisie} reglages - Survol et retour.
   */
  constructor(objet3D, idArticle, scene, reglages) {
    scene.attach(objet3D);
    this.objet3D = objet3D;
    this.idArticle = idArticle;
    this.reglages = reglages;

    /** Place d'origine, dans le repère de la scène. */
    this.positionOrigine = objet3D.position.clone();
    this.orientationOrigine = objet3D.quaternion.clone();
    this.echelleOrigine = objet3D.scale.clone();

    /**
     * Déplacement en cours (retour à sa place ou arrivée dans le panier), ou `null`.
     * @type {{ debut: number, position: Vector3, orientation: Quaternion, arrivee: Vector3 } | null}
     */
    this.retour = null;

    /** `true` une fois l'article accepté dans le panier (il n'en bouge plus). */
    this.estDansPanier = false;
  }

  /**
   * Retour visuel de survol : l'objet grossit un peu quand la main peut le prendre.
   *
   * @param {boolean} estSurvole - `true` si une main peut le saisir.
   */
  definirSurvol(estSurvole) {
    this.objet3D.scale.copy(this.echelleOrigine).multiplyScalar(estSurvole ? this.reglages.grossissementSurvol : 1);
  }

  /**
   * Lance le retour en douceur vers la place d'origine.
   *
   * @param {number} temps - Instant courant, en ms.
   */
  renvoyer(temps) {
    this.deplacerVers(this.positionOrigine, temps);
  }

  /**
   * Lance un déplacement en douceur (en arc) vers une position ; l'objet
   * reprend en chemin son orientation d'origine.
   *
   * @param {Vector3} arrivee - Position d'arrivée (repère de la scène).
   * @param {number} temps - Instant courant, en ms.
   */
  deplacerVers(arrivee, temps) {
    this.retour = {
      debut: temps,
      position: this.objet3D.position.clone(),
      orientation: this.objet3D.quaternion.clone(),
      arrivee: arrivee.clone(),
    };
  }

  /**
   * Position à donner à l'objet (dans son orientation d'origine) pour que le
   * centre de sa base repose sur un point : les modèles n'ont pas tous leur
   * origine au même endroit (base ou centre).
   *
   * @param {Vector3} point - Point d'appui, par exemple le fond du panier.
   * @returns {Vector3}
   */
  positionPourPoserSur(point) {
    const positionActuelle = this.objet3D.position.clone();
    const orientationActuelle = this.objet3D.quaternion.clone();
    this.objet3D.position.set(0, 0, 0);
    this.objet3D.quaternion.copy(this.orientationOrigine);
    const boite = new Box3().setFromObject(this.objet3D);
    this.objet3D.position.copy(positionActuelle);
    this.objet3D.quaternion.copy(orientationActuelle);
    const centre = boite.getCenter(new Vector3());
    return new Vector3(point.x - centre.x, point.y - boite.min.y, point.z - centre.z);
  }

  /**
   * Fait avancer le déplacement en cours. À appeler une fois par image.
   *
   * @param {number} temps - Instant courant, en ms.
   * @returns {boolean} `true` à l'image où l'objet arrive (à sa place ou dans le panier).
   */
  mettreAJour(temps) {
    if (!this.retour) {
      return false;
    }
    const progression = adoucir((temps - this.retour.debut) / this.reglages.dureeRetour);
    const point = interpoler(this.retour.position, this.retour.arrivee, progression);
    // Trajet en arc : l'objet remonte un peu, puis redescend à sa place.
    const arc = Math.sin(progression * Math.PI) * this.reglages.hauteurArcRetour;
    this.objet3D.position.set(point.x, point.y + arc, point.z);
    this.objet3D.quaternion.slerpQuaternions(this.retour.orientation, this.orientationOrigine, progression);
    if (progression < 1) {
      return false;
    }
    this.retour = null;
    return true;
  }
}
