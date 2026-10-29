/**
 * @file Détection du pincement (pouce + index) à partir de la distance entre
 * le bout du pouce et le bout de l'index.
 *
 * Logique pure, sans dépendance à Three.js ni à WebXR : testable avec
 * `node --test`, sans casque.
 *
 * Deux seuils distincts (hystérésis) évitent qu'un léger tremblement des
 * doigts ne fasse lâcher la brique :
 *   - le pincement commence quand la distance passe sous `seuilFermeture` ;
 *   - il ne se termine que lorsqu'elle dépasse `seuilOuverture`.
 */

/** Événements renvoyés par {@link DetecteurPincement#mettreAJour}. */
export const EVENEMENT_PINCEMENT = Object.freeze({
  DEBUT: 'debut',
  FIN: 'fin',
});

/**
 * Suit l'état de pincement d'une seule main.
 */
export class DetecteurPincement {
  /** @type {number} */
  #seuilFermeture;
  /** @type {number} */
  #seuilOuverture;
  /** @type {boolean} */
  #estPince = false;

  /**
   * @param {object} seuils - Seuils en mètres.
   * @param {number} seuils.seuilFermeture - Distance en dessous de laquelle (ou égale) le pincement commence.
   * @param {number} seuils.seuilOuverture - Distance au-delà de laquelle le pincement se termine.
   * @throws {RangeError} Si les seuils ne sont pas des nombres positifs avec fermeture < ouverture.
   */
  constructor({ seuilFermeture, seuilOuverture }) {
    const seuilsValides = Number.isFinite(seuilFermeture)
      && Number.isFinite(seuilOuverture)
      && seuilFermeture > 0
      && seuilFermeture < seuilOuverture;
    if (!seuilsValides) {
      throw new RangeError(
        `Seuils de pincement invalides (fermeture : ${seuilFermeture}, ouverture : ${seuilOuverture}). `
        + 'Attendu : deux nombres positifs avec fermeture < ouverture.',
      );
    }
    this.#seuilFermeture = seuilFermeture;
    this.#seuilOuverture = seuilOuverture;
  }

  /** @returns {boolean} `true` si la main est en train de pincer. */
  get estPince() {
    return this.#estPince;
  }

  /**
   * Met à jour l'état avec la distance mesurée à cette image.
   *
   * @param {number | null} distance - Distance pouce–index en mètres,
   *   ou `null` si la main n'est plus suivie par le casque.
   * @returns {'debut' | 'fin' | null} L'événement déclenché, ou `null` si l'état ne change pas.
   */
  mettreAJour(distance) {
    // Main perdue de vue : on relâche, la brique reste simplement où elle est.
    if (distance === null) {
      return this.#estPince ? this.#terminer() : null;
    }

    if (!this.#estPince && distance <= this.#seuilFermeture) {
      this.#estPince = true;
      return EVENEMENT_PINCEMENT.DEBUT;
    }

    if (this.#estPince && distance > this.#seuilOuverture) {
      return this.#terminer();
    }

    return null;
  }

  /**
   * Passe à l'état « relâché ».
   *
   * @returns {'fin'}
   */
  #terminer() {
    this.#estPince = false;
    return EVENEMENT_PINCEMENT.FIN;
  }
}
