/**
 * @file Exemplaire d'un article : un fruit (ou un pain) de l'étal que l'on
 * peut prendre, et qui retourne doucement à sa place quand on le lâche.
 *
 * Respecte l'interface `ObjetSaisissable` de `saisie.js`.
 */

import { Quaternion } from 'three';

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
     * Retour en cours vers la place d'origine, ou `null`.
     * @type {{ debut: number, position: import('three').Vector3, orientation: Quaternion } | null}
     */
    this.retour = null;
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
    this.retour = {
      debut: temps,
      position: this.objet3D.position.clone(),
      orientation: this.objet3D.quaternion.clone(),
    };
  }

  /**
   * Fait avancer le retour. À appeler une fois par image.
   *
   * @param {number} temps - Instant courant, en ms.
   * @returns {boolean} `true` à l'image où l'objet retrouve sa place.
   */
  mettreAJour(temps) {
    if (!this.retour) {
      return false;
    }
    const progression = adoucir((temps - this.retour.debut) / this.reglages.dureeRetour);
    const point = interpoler(this.retour.position, this.positionOrigine, progression);
    // Trajet en arc : l'objet remonte un peu, puis redescend dans sa cagette.
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
