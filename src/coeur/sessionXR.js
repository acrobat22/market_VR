/**
 * @file Gestion de la session WebXR : vérification de la prise en charge,
 * démarrage et fin de la session immersive, état du bouton d'entrée.
 *
 * Documentation : https://developer.mozilla.org/fr/docs/Web/API/WebXR_Device_API
 */

/** Textes affichés au joueur (français uniquement, messages positifs). */
const TEXTES = Object.freeze({
  boutonEntrer: 'Entrer en réalité virtuelle',
  boutonPatienter: 'Démarrage…',
  boutonIndisponible: 'Réalité virtuelle indisponible',
  verification: 'Vérification du casque…',
  pret: 'Tout est prêt. Appuyez sur le bouton pour commencer.',
  nonSecurise: 'Cette page doit être ouverte via une adresse sécurisée (https ou localhost).',
  nonDisponible: 'La réalité virtuelle n’est pas disponible ici. Ouvrez cette page dans le navigateur du casque Meta Quest.',
  echecDemarrage: 'Le démarrage n’a pas abouti. Vous pouvez réessayer en appuyant de nouveau sur le bouton.',
  finSession: 'À bientôt ! Vous pouvez revenir quand vous voulez.',
});

/**
 * Pilote l'entrée et la sortie du mode réalité virtuelle.
 */
export class SessionXR {
  /**
   * @param {object} options
   * @param {import('three').WebGLRenderer} options.renderer - Moteur de rendu (avec `xr.enabled`).
   * @param {HTMLButtonElement} options.bouton - Bouton « Entrer en réalité virtuelle ».
   * @param {HTMLElement} options.zoneMessage - Zone de statut lue par les lecteurs d'écran.
   * @param {typeof import('../config.js').CONFIG.session} options.reglages - Réglages de session.
   */
  constructor({ renderer, bouton, zoneMessage, reglages }) {
    this.renderer = renderer;
    this.bouton = bouton;
    this.zoneMessage = zoneMessage;
    this.reglages = reglages;
    /** @type {XRSession | null} */
    this.sessionActive = null;

    this.renderer.xr.setReferenceSpaceType(this.reglages.typeReferentiel);
    this.bouton.addEventListener('click', () => this.demarrer());

    // Un casque (ou un émulateur) peut devenir disponible après le chargement :
    // on refait la vérification à chaque changement d'appareil.
    // https://developer.mozilla.org/en-US/docs/Web/API/XRSystem/devicechange_event
    if ('xr' in navigator) {
      navigator.xr.addEventListener('devicechange', () => {
        if (!this.sessionActive) {
          this.initialiser();
        }
      });
    }
  }

  /**
   * Vérifie que le navigateur peut lancer une session immersive et met à jour
   * le bouton en conséquence.
   *
   * @returns {Promise<boolean>} `true` si la réalité virtuelle est disponible.
   */
  async initialiser() {
    this.#desactiverBouton(TEXTES.verification);

    // WebXR n'est exposé que dans un contexte sécurisé (HTTPS ou localhost).
    if (!window.isSecureContext) {
      this.#signalerIndisponible(TEXTES.nonSecurise);
      return false;
    }

    const estDisponible = await this.#verifierPriseEnCharge();
    if (!estDisponible) {
      this.#signalerIndisponible(TEXTES.nonDisponible);
      return false;
    }

    this.#activerBouton();
    this.#afficherMessage(TEXTES.pret);
    return true;
  }

  /**
   * Démarre la session immersive. Doit être appelée depuis un geste de
   * l'utilisateur (clic), comme l'exige la spécification WebXR.
   *
   * @returns {Promise<void>}
   */
  async demarrer() {
    if (this.sessionActive) {
      return;
    }
    this.#desactiverBouton(TEXTES.boutonPatienter);

    try {
      const session = await navigator.xr.requestSession(this.reglages.mode, {
        requiredFeatures: [...this.reglages.fonctionnalitesRequises],
        optionalFeatures: [...this.reglages.fonctionnalitesOptionnelles],
      });
      session.addEventListener('end', () => this.#surFinSession());
      await this.renderer.xr.setSession(session);
      this.sessionActive = session;
    } catch (erreur) {
      console.error('[SessionXR.demarrer] Échec du démarrage de la session WebXR :', erreur);
      this.#activerBouton();
      this.#afficherMessage(TEXTES.echecDemarrage);
    }
  }

  /**
   * Ferme la session immersive (retour à la page d'accueil).
   * Documentation : https://developer.mozilla.org/fr/docs/Web/API/XRSession/end
   *
   * @returns {Promise<void>}
   */
  async terminer() {
    if (!this.sessionActive) {
      return;
    }
    try {
      await this.sessionActive.end();
    } catch (erreur) {
      console.error('[SessionXR.terminer] Fermeture de la session impossible :', erreur);
    }
  }

  /**
   * Interroge le navigateur sur la prise en charge du mode immersif.
   *
   * @returns {Promise<boolean>}
   */
  async #verifierPriseEnCharge() {
    if (!('xr' in navigator)) {
      return false;
    }
    try {
      return await navigator.xr.isSessionSupported(this.reglages.mode);
    } catch (erreur) {
      console.error('[SessionXR.verifierPriseEnCharge] Vérification impossible :', erreur);
      return false;
    }
  }

  /** Remet la page dans son état initial quand le joueur quitte la VR. */
  #surFinSession() {
    this.sessionActive = null;
    this.#activerBouton();
    this.#afficherMessage(TEXTES.finSession);
  }

  /** Rend le bouton cliquable avec son libellé normal. */
  #activerBouton() {
    this.bouton.disabled = false;
    this.bouton.removeAttribute('aria-busy');
    this.bouton.textContent = TEXTES.boutonEntrer;
  }

  /**
   * Rend le bouton inactif en expliquant pourquoi.
   *
   * @param {string} libelle - Texte affiché sur le bouton pendant l'attente.
   */
  #desactiverBouton(libelle) {
    this.bouton.disabled = true;
    this.bouton.setAttribute('aria-busy', 'true');
    this.bouton.textContent = libelle;
  }

  /**
   * Laisse le bouton inactif (sans état d'attente) et explique pourquoi.
   *
   * @param {string} explication - Raison affichée dans la zone de statut.
   */
  #signalerIndisponible(explication) {
    this.#desactiverBouton(TEXTES.boutonIndisponible);
    this.bouton.removeAttribute('aria-busy');
    this.#afficherMessage(explication);
  }

  /**
   * Affiche un message dans la zone de statut (annoncée par les lecteurs d'écran).
   *
   * @param {string} texte - Message à afficher.
   */
  #afficherMessage(texte) {
    this.zoneMessage.textContent = texte;
  }
}
