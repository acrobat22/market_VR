/**
 * @file Partie en cours : la liste de courses, les quantités demandées et les
 * exemplaires déjà dans le panier.
 *
 * Logique pure (sans Three.js), testable avec `node --test`.
 */

/**
 * @typedef {object} LigneListe
 * @property {import('../marche/articles.js').Article} article - Article demandé.
 * @property {number} quantite - Nombre d'exemplaires demandés.
 * @property {number} deposes - Nombre d'exemplaires déjà dans le panier.
 * @property {boolean} estCochee - `true` une fois la quantité atteinte.
 */

/**
 * Suit l'avancement d'une liste de courses.
 */
export class Partie {
  /**
   * @param {readonly import('./listeCourses.js').Commande<import('../marche/articles.js').Article>[]} commandes
   *   Articles et quantités tirés au hasard.
   */
  constructor(commandes) {
    /** @type {LigneListe[]} */
    this.lignes = commandes.map(({ article, quantite }) => ({ article, quantite, deposes: 0, estCochee: false }));
  }

  /**
   * Un exemplaire arrive dans le panier : il est accepté si son article est
   * sur la liste et que la quantité n'est pas encore atteinte. Sinon, il est
   * refusé (il retournera à sa place).
   *
   * @param {string} idArticle - Identifiant de l'article déposé.
   * @returns {boolean} `true` si l'exemplaire est accepté.
   */
  deposer(idArticle) {
    const ligne = this.lignes.find((ligneListe) => ligneListe.article.id === idArticle && !ligneListe.estCochee);
    if (!ligne) {
      return false;
    }
    ligne.deposes += 1;
    ligne.estCochee = ligne.deposes >= ligne.quantite;
    return true;
  }

  /** Nombre d'exemplaires déjà dans le panier (toutes lignes confondues). */
  get nombreDeposes() {
    return this.lignes.reduce((somme, ligne) => somme + ligne.deposes, 0);
  }

  /** `true` quand toutes les quantités de la liste sont dans le panier. */
  get estTerminee() {
    return this.lignes.every((ligne) => ligne.estCochee);
  }
}

/**
 * Texte d'une ligne de l'ardoise : « 1 citron », « 2 pommes », et ce qu'il
 * reste à prendre quand la ligne est entamée (« 2 pommes (encore 1) »).
 *
 * @param {LigneListe} ligne - Ligne de la liste.
 * @returns {string}
 */
export function libelleLigne(ligne) {
  const { article, quantite, deposes } = ligne;
  const texte = `${quantite} ${quantite > 1 ? article.pluriel : article.singulier}`;
  const reste = quantite - deposes;
  return deposes > 0 && reste > 0 ? `${texte} (encore ${reste})` : texte;
}
