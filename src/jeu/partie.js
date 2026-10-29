/**
 * @file Partie en cours : la liste de courses et les articles déjà cochés.
 *
 * Logique pure (sans Three.js), testable avec `node --test`.
 */

/**
 * @typedef {object} LigneListe
 * @property {import('../marche/articles.js').Article} article - Article demandé.
 * @property {boolean} estCochee - `true` une fois l'article dans le panier.
 */

/**
 * Suit l'avancement d'une liste de courses (un exemplaire par article).
 */
export class Partie {
  /**
   * @param {readonly import('../marche/articles.js').Article[]} articles - Liste tirée au hasard.
   */
  constructor(articles) {
    /** @type {LigneListe[]} */
    this.lignes = articles.map((article) => ({ article, estCochee: false }));
  }

  /**
   * Un article arrive dans le panier : il est coché s'il est sur la liste et
   * pas encore coché. Sinon, il est refusé (il retournera à sa place).
   *
   * @param {string} idArticle - Identifiant de l'article déposé.
   * @returns {boolean} `true` si l'article est accepté (et donc coché).
   */
  deposer(idArticle) {
    const ligne = this.lignes.find((ligneListe) => ligneListe.article.id === idArticle && !ligneListe.estCochee);
    if (!ligne) {
      return false;
    }
    ligne.estCochee = true;
    return true;
  }

  /** Nombre d'articles déjà dans le panier. */
  get nombreCochees() {
    return this.lignes.filter((ligne) => ligne.estCochee).length;
  }

  /** `true` quand tous les articles de la liste sont dans le panier. */
  get estTerminee() {
    return this.lignes.every((ligne) => ligne.estCochee);
  }
}
