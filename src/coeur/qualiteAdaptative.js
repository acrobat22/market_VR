/**
 * @file Surveillance de la fluidité de l'affichage.
 *
 * Si les images arrivent trop lentement en moyenne, le surveillant le
 * signale : l'appelant baisse alors la qualité d'un cran (ombres moins
 * fines, puis sans ombres projetées). Un affichage saccadé en VR est
 * inconfortable, surtout pour un public sensible.
 *
 * Logique pure (sans Three.js), testable avec `node --test`.
 */

/**
 * Mesure l'écart moyen entre images et signale les lenteurs persistantes.
 */
export class SurveillantFluidite {
  /** @type {number | null} */
  #tempsPrecedent = null;
  #imagesIgnorees = 0;
  #somme = 0;
  #nombre = 0;

  /**
   * @param {object} reglages
   * @param {number} reglages.imagesAIgnorer - Images ignorées au départ (chargement, compilation).
   * @param {number} reglages.imagesParMesure - Nombre d'écarts moyennés avant de juger.
   * @param {number} reglages.seuilMoyenMs - Écart moyen au-delà duquel l'affichage est jugé lent.
   * @param {number} reglages.ecartMaximalMs - Écart au-delà duquel une image est une pause, pas une lenteur.
   */
  constructor(reglages) {
    this.reglages = reglages;
  }

  /**
   * Enregistre l'instant d'une image.
   *
   * @param {number} temps - Instant de l'image, en millisecondes.
   * @returns {boolean} `true` si la qualité doit baisser d'un cran.
   */
  enregistrerImage(temps) {
    const precedent = this.#tempsPrecedent;
    this.#tempsPrecedent = temps;
    if (precedent === null) {
      return false;
    }
    if (this.#imagesIgnorees < this.reglages.imagesAIgnorer) {
      this.#imagesIgnorees++;
      return false;
    }

    const ecart = temps - precedent;
    // Une très longue pause (onglet caché, chargement) ne dit rien de la fluidité.
    if (ecart <= 0 || ecart > this.reglages.ecartMaximalMs) {
      return false;
    }
    this.#somme += ecart;
    this.#nombre++;
    if (this.#nombre < this.reglages.imagesParMesure) {
      return false;
    }

    const estLent = this.#somme / this.#nombre > this.reglages.seuilMoyenMs;
    this.#somme = 0;
    this.#nombre = 0;
    return estLent;
  }

  /** Repart de zéro (par exemple au démarrage d'une session VR). */
  reinitialiser() {
    this.#tempsPrecedent = null;
    this.#imagesIgnorees = 0;
    this.#somme = 0;
    this.#nombre = 0;
  }
}
