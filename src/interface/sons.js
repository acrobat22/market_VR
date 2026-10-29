/**
 * @file Sons doux, créés par le navigateur (Web Audio), sans fichier audio.
 *
 * Trois sons courts accompagnent les gestes, jamais de voix ni de son
 * d'erreur :
 *   - saisie : un « toc » léger ;
 *   - accrochage : un « clic » plastique suivi d'une note ronde ;
 *   - réussite : une courte mélodie montante.
 * Les fréquences restent graves à médiums (≤ 1 000 Hz) : les aigus sont
 * moins bien perçus avec l'âge et peuvent être désagréables.
 *
 * Le contexte audio n'est créé qu'au premier geste de l'utilisateur
 * (exigence des navigateurs pour la lecture automatique).
 *
 * Documentation : https://developer.mozilla.org/fr/docs/Web/API/Web_Audio_API
 */

/** Notes de la mélodie de réussite (do, mi, sol, do : accord parfait montant). */
const MELODIE_REUSSITE = Object.freeze([261.63, 329.63, 392.0, 523.25]);

/** Écart entre deux notes de la mélodie, en secondes. */
const ECART_NOTES = 0.16;

/**
 * Joue les sons doux du jeu.
 */
export class Sons {
  /** @type {AudioContext | null} */
  #contexte = null;
  /** @type {GainNode | null} Volume général. */
  #volumeGeneral = null;
  #estIndisponible = false;

  /**
   * @param {{ volume: number }} reglages - Volume général (0 à 1).
   * @param {() => AudioContext} [creerContexte] - Fabrique du contexte audio (remplaçable en test).
   */
  constructor(reglages, creerContexte = () => new AudioContext()) {
    this.reglages = reglages;
    this.creerContexte = creerContexte;
    this.estActif = true;
  }

  /**
   * Active ou coupe les sons.
   *
   * @param {boolean} estActif - `true` pour entendre les sons.
   */
  definirActifs(estActif) {
    this.estActif = estActif;
  }

  /**
   * Crée (si besoin) et réveille le contexte audio. À appeler depuis un geste
   * de l'utilisateur (clic sur un bouton de la page).
   */
  reveiller() {
    const contexte = this.#obtenirContexte();
    if (contexte && contexte.state !== 'running') {
      contexte.resume().catch((erreur) => console.error('[Sons.reveiller] Reprise audio impossible :', erreur));
    }
  }

  /** « Toc » léger : une brique est saisie (ou un bouton est pressé). */
  jouerSaisie() {
    this.#jouerNote({ frequence: 330, type: 'triangle', duree: 0.18, volume: 0.5 });
  }

  /** « Clic » plastique puis note ronde : une brique s'accroche à sa place. */
  jouerAccrochage() {
    this.#jouerNote({ frequence: 880, type: 'square', duree: 0.03, volume: 0.15, filtre: 1800 });
    this.#jouerNote({ frequence: 523.25, type: 'sine', duree: 0.25, volume: 0.6, decalage: 0.03 });
  }

  /** Mélodie montante : le modèle est terminé. */
  jouerReussite() {
    MELODIE_REUSSITE.forEach((frequence, indice) => {
      this.#jouerNote({ frequence, type: 'triangle', duree: 0.4, volume: 0.55, decalage: indice * ECART_NOTES });
    });
  }

  /**
   * Retourne le contexte audio, créé au premier appel. En cas d'échec, le jeu
   * continue simplement sans son.
   *
   * @returns {AudioContext | null}
   */
  #obtenirContexte() {
    if (this.#contexte || this.#estIndisponible) {
      return this.#contexte;
    }
    try {
      this.#contexte = this.creerContexte();
      this.#volumeGeneral = this.#contexte.createGain();
      this.#volumeGeneral.gain.value = this.reglages.volume;
      this.#volumeGeneral.connect(this.#contexte.destination);
    } catch (erreur) {
      console.error('[Sons] Audio indisponible, le jeu continue sans son :', erreur);
      this.#estIndisponible = true;
      this.#contexte = null;
    }
    return this.#contexte;
  }

  /**
   * Joue une note brève avec une enveloppe douce (attaque rapide, extinction
   * progressive, sans claquement).
   *
   * @param {object} note
   * @param {number} note.frequence - Fréquence en hertz.
   * @param {OscillatorType} note.type - Forme d'onde (« sine », « triangle »…).
   * @param {number} note.duree - Durée en secondes.
   * @param {number} note.volume - Volume relatif (0 à 1).
   * @param {number} [note.decalage=0] - Départ différé, en secondes.
   * @param {number} [note.filtre] - Coupure des aigus au-delà de cette fréquence.
   */
  #jouerNote({ frequence, type, duree, volume, decalage = 0, filtre }) {
    // Pas de contexte avant le premier geste : on ne joue rien.
    if (!this.estActif || !this.#contexte) {
      return;
    }
    const contexte = this.#contexte;
    const debut = contexte.currentTime + decalage;
    const fin = debut + duree;

    const oscillateur = contexte.createOscillator();
    oscillateur.type = type;
    oscillateur.frequency.setValueAtTime(frequence, debut);

    const enveloppe = contexte.createGain();
    enveloppe.gain.setValueAtTime(0.0001, debut);
    enveloppe.gain.linearRampToValueAtTime(volume, debut + 0.01);
    enveloppe.gain.exponentialRampToValueAtTime(0.0001, fin);

    let sortie = oscillateur.connect(enveloppe);
    if (filtre) {
      const passeBas = contexte.createBiquadFilter();
      passeBas.type = 'lowpass';
      passeBas.frequency.setValueAtTime(filtre, debut);
      sortie = sortie.connect(passeBas);
    }
    sortie.connect(this.#volumeGeneral);

    oscillateur.start(debut);
    oscillateur.stop(fin + 0.02);
  }
}
