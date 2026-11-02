/**
 * @file Tas d'articles dans un contenant, construit article par article.
 *
 * Logique pure (sans Three.js), testable avec `node --test`. Le fond du
 * contenant est découpé en petites cases dont on retient la hauteur (carte des
 * hauteurs). Chaque article, assimilé à un ovoïde, est lâché à un endroit tiré
 * au hasard et descend jusqu'à toucher ce qui est déjà là : il se cale dans
 * les creux entre ses voisins, comme dans un vrai tas, sans moteur physique.
 */

/**
 * @typedef {object} FormeArticle
 * @property {number} demiLongueur - Demi-dimension selon l'axe x de l'article (avant rotation).
 * @property {number} demiLargeur - Demi-dimension selon l'axe z de l'article (avant rotation).
 * @property {number} demiHauteur - Demi-hauteur.
 * @property {number} lacet - Rotation autour de la verticale, en radians (comme `rotation.y` de Three.js).
 */

/**
 * @typedef {object} Place
 * @property {number} x - Centre de l'article, dans le repère du contenant.
 * @property {number} z - Centre de l'article, dans le repère du contenant.
 * @property {number} bas - Hauteur du dessous de l'article.
 */

/** Taille d'une case de la carte des hauteurs, en mètres. */
const PAS_CARTE = 0.005;

/** Nombre d'emplacements essayés par article (le meilleur est gardé). */
const ESSAIS = 24;

/**
 * Préférence pour le centre : un emplacement au bord « coûte » cette fraction
 * de la hauteur de l'article. Les creux passent avant, mais à hauteur égale le
 * centre l'emporte : le tas est bombé. Elle diminue avec la taille de
 * l'article et disparaît quand il couvre un quart du fond : un gros article
 * au centre empêcherait d'en loger un second à côté.
 */
const PREFERENCE_CENTRE = 0.5;

/**
 * Tas d'articles dans un contenant rectangulaire centré sur l'origine.
 */
export class Tas {
  /**
   * @param {object} contenant
   * @param {number} contenant.largeur - Largeur intérieure (axe x).
   * @param {number} contenant.profondeur - Profondeur intérieure (axe z).
   * @param {number} contenant.hauteurFond - Hauteur du dessus du fond.
   */
  constructor({ largeur, profondeur, hauteurFond }) {
    this.largeur = largeur;
    this.profondeur = profondeur;
    this.colonnes = Math.max(1, Math.round(largeur / PAS_CARTE));
    this.rangees = Math.max(1, Math.round(profondeur / PAS_CARTE));
    /** Hauteur de chaque case (au départ : le fond). */
    this.hauteurs = new Float64Array(this.colonnes * this.rangees).fill(hauteurFond);
  }

  /**
   * Choisit où poser un article : plusieurs emplacements tirés au hasard,
   * et le plus bas est gardé (les creux se remplissent d'abord), avec une
   * légère préférence pour le centre (le tas est bombé). L'article est ajouté
   * au tas, sauf s'il devrait être posé trop haut (le contenant est plein).
   *
   * @param {FormeArticle} forme - Dimensions et orientation de l'article.
   * @param {() => number} [hasard=Math.random] - Renvoie un nombre dans [0, 1[.
   * @param {number} [basMaximal=Infinity] - Hauteur maximale du dessous de l'article.
   * @returns {Place | null} Place de l'article, ou `null` s'il n'y a plus de place assez basse.
   */
  deposer(forme, hasard = Math.random, basMaximal = Infinity) {
    const { x: etendueX, z: etendueZ } = etendueAuSol(forme);
    // Le centre reste assez loin des bords pour que l'article tienne dedans.
    const jeuX = Math.max(0, this.largeur / 2 - etendueX);
    const jeuZ = Math.max(0, this.profondeur / 2 - etendueZ);
    const surfaceArticle = Math.PI * forme.demiLongueur * forme.demiLargeur;
    const preference = PREFERENCE_CENTRE * Math.max(0, 1 - 4 * surfaceArticle / (this.largeur * this.profondeur));
    let meilleure = null;
    for (let essai = 0; essai < ESSAIS; essai++) {
      const x = jeuX * (2 * hasard() - 1);
      const z = jeuZ * (2 * hasard() - 1);
      const centre = this.#hauteurAuRepos(x, z, forme);
      // Distance au centre, de 0 (centre) à 1 (bord), dans chaque direction.
      const eloignement = ((jeuX > 0 ? (x / jeuX) ** 2 : 0) + (jeuZ > 0 ? (z / jeuZ) ** 2 : 0)) / 2;
      const cout = centre + preference * forme.demiHauteur * 2 * eloignement;
      if (!meilleure || cout < meilleure.cout) {
        meilleure = { x, z, centre, cout };
      }
    }
    const bas = meilleure.centre - forme.demiHauteur;
    if (bas > basMaximal) {
      return null;
    }
    this.#poser(meilleure.x, meilleure.z, meilleure.centre, forme);
    return { x: meilleure.x, z: meilleure.z, bas };
  }

  /**
   * Hauteur du centre de l'article posé en (x, z) : il descend jusqu'à ce que
   * son dessous touche le tas en un point.
   *
   * @param {number} x - Centre de l'article.
   * @param {number} z - Centre de l'article.
   * @param {FormeArticle} forme - Dimensions et orientation.
   * @returns {number}
   */
  #hauteurAuRepos(x, z, forme) {
    let centre = -Infinity;
    this.#parcourirEmpreinte(x, z, forme, (indice, epaisseur) => {
      centre = Math.max(centre, this.hauteurs[indice] + epaisseur);
    });
    return centre;
  }

  /**
   * Ajoute l'article au tas : la carte des hauteurs suit son dessus.
   *
   * @param {number} x - Centre de l'article.
   * @param {number} z - Centre de l'article.
   * @param {number} centre - Hauteur du centre de l'article.
   * @param {FormeArticle} forme - Dimensions et orientation.
   */
  #poser(x, z, centre, forme) {
    this.#parcourirEmpreinte(x, z, forme, (indice, epaisseur) => {
      this.hauteurs[indice] = Math.max(this.hauteurs[indice], centre + epaisseur);
    });
  }

  /**
   * Appelle `visiter` pour chaque case sous l'article, avec la demi-épaisseur
   * de l'ovoïde à cet endroit (maximale au centre, nulle au bord).
   *
   * @param {number} x - Centre de l'article.
   * @param {number} z - Centre de l'article.
   * @param {FormeArticle} forme - Dimensions et orientation.
   * @param {(indice: number, epaisseur: number) => void} visiter - Appelée pour chaque case.
   */
  #parcourirEmpreinte(x, z, forme, visiter) {
    const { x: etendueX, z: etendueZ } = etendueAuSol(forme);
    const cosinus = Math.cos(forme.lacet);
    const sinus = Math.sin(forme.lacet);
    const premiereColonne = Math.max(0, Math.floor((x - etendueX + this.largeur / 2) / PAS_CARTE));
    const derniereColonne = Math.min(this.colonnes - 1, Math.floor((x + etendueX + this.largeur / 2) / PAS_CARTE));
    const premiereRangee = Math.max(0, Math.floor((z - etendueZ + this.profondeur / 2) / PAS_CARTE));
    const derniereRangee = Math.min(this.rangees - 1, Math.floor((z + etendueZ + this.profondeur / 2) / PAS_CARTE));
    for (let rangee = premiereRangee; rangee <= derniereRangee; rangee++) {
      const dz = (rangee + 0.5) * PAS_CARTE - this.profondeur / 2 - z;
      for (let colonne = premiereColonne; colonne <= derniereColonne; colonne++) {
        const dx = (colonne + 0.5) * PAS_CARTE - this.largeur / 2 - x;
        // Coordonnées dans les axes de l'article (rotation inverse du lacet).
        const u = (dx * cosinus - dz * sinus) / forme.demiLongueur;
        const v = (dx * sinus + dz * cosinus) / forme.demiLargeur;
        const distance = u * u + v * v;
        if (distance < 1) {
          visiter(rangee * this.colonnes + colonne, forme.demiHauteur * Math.sqrt(1 - distance));
        }
      }
    }
  }
}

/**
 * Demi-étendue au sol (selon x et z) d'un article tourné de son lacet.
 *
 * @param {FormeArticle} forme - Dimensions et orientation.
 * @returns {{ x: number, z: number }}
 */
function etendueAuSol({ demiLongueur, demiLargeur, lacet }) {
  const cosinus = Math.cos(lacet);
  const sinus = Math.sin(lacet);
  return {
    x: Math.hypot(demiLongueur * cosinus, demiLargeur * sinus),
    z: Math.hypot(demiLongueur * sinus, demiLargeur * cosinus),
  };
}
