/**
 * @file Mode « Essayer sans casque » : masque la page d'accueil, laisse la
 * table en plein écran et active la souris à la place des mains.
 *
 * On revient à l'accueil avec le bouton « Revenir à l'accueil » ou la touche
 * Échap. Le mode se ferme aussi automatiquement à l'entrée en VR.
 */

/**
 * Bascule entre la page d'accueil et le mode souris.
 */
export class ModeSansCasque {
  /**
   * @param {object} elements
   * @param {HTMLElement} elements.panneauAccueil - Panneau d'accueil à masquer.
   * @param {HTMLElement} elements.barreAide - Barre d'aide affichée en mode souris.
   * @param {HTMLButtonElement} elements.boutonEssayer - Bouton « Essayer sans casque ».
   * @param {HTMLButtonElement} elements.boutonRetour - Bouton « Revenir à l'accueil ».
   * @param {{ activer(): void, desactiver(): void }} souris - Entrée souris à piloter.
   * @param {() => void} [surRetourAccueil] - Appelé quand le joueur revient à l'accueil.
   */
  constructor({ panneauAccueil, barreAide, boutonEssayer, boutonRetour }, souris, surRetourAccueil = () => {}) {
    this.panneauAccueil = panneauAccueil;
    this.barreAide = barreAide;
    this.boutonEssayer = boutonEssayer;
    this.boutonRetour = boutonRetour;
    this.souris = souris;
    this.surRetourAccueil = surRetourAccueil;
    this.estActif = false;

    this.boutonEssayer.addEventListener('click', () => this.activer());
    this.boutonRetour.addEventListener('click', () => this.desactiver());
    document.addEventListener('keydown', (evenement) => {
      if (evenement.key === 'Escape') {
        this.desactiver();
      }
    });
  }

  /** Masque l'accueil et active la souris. */
  activer() {
    if (this.estActif) {
      return;
    }
    this.estActif = true;
    this.panneauAccueil.hidden = true;
    this.barreAide.hidden = false;
    this.souris.activer();
    // Le focus suit le contenu visible (navigation au clavier).
    this.boutonRetour.focus();
  }

  /** Réaffiche l'accueil et désactive la souris. */
  desactiver() {
    if (!this.estActif) {
      return;
    }
    this.estActif = false;
    this.souris.desactiver();
    this.barreAide.hidden = true;
    this.panneauAccueil.hidden = false;
    this.boutonEssayer.focus();
    this.surRetourAccueil();
  }
}
