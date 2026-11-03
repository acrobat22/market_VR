/**
 * @file Tas d'articles dans un contenant, construit article par article.
 *
 * Logique pure (sans Three.js), testable avec `node --test`. Le fond du
 * contenant est découpé en petites cases dont on retient la hauteur (carte des
 * hauteurs). Chaque article est décrit par sa vraie forme, relevée sur son
 * modèle 3D (hauteur de son dessous et de son dessus dans chaque case). Il est
 * lâché à un endroit tiré au hasard et descend jusqu'à toucher ce qui est déjà
 * là : il se cale dans les creux entre ses voisins, comme dans un vrai tas,
 * sans moteur physique et sans flotter au-dessus d'eux.
 */

/**
 * @typedef {object} ProfilArticle
 * Forme d'un article dans son orientation définitive, sur une grille de cases
 * centrée sur sa boîte englobante (vue de dessus).
 * @property {number} colonnes - Nombre de cases selon x.
 * @property {number} rangees - Nombre de cases selon z.
 * @property {Float64Array} dessous - Hauteur du dessous de l'article dans chaque case,
 *   au-dessus de son point le plus bas (`Infinity` : case vide).
 * @property {Float64Array} dessus - Hauteur du dessus de l'article dans chaque case,
 *   au-dessus de son point le plus bas (`-Infinity` : case vide).
 * @property {number} hauteur - Hauteur totale de l'article.
 */

/**
 * @typedef {object} Place
 * @property {number} x - Centre de la boîte englobante de l'article, dans le repère du contenant.
 * @property {number} z - Centre de la boîte englobante de l'article, dans le repère du contenant.
 * @property {number} bas - Hauteur du point le plus bas de l'article.
 */

/** Taille d'une case de la carte des hauteurs, en mètres. */
export const PAS_CARTE = 0.005;

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
 * Relève le profil d'un article à partir des triangles de sa surface, déjà
 * placés dans son orientation définitive (seule leur position compte, pas
 * l'origine). La surface est lue au centre de chaque case, comme par un
 * rayon vertical : le dessous et le dessus y sont exacts, même sur les flancs
 * arrondis d'un petit fruit, où la hauteur change beaucoup d'un bord de la
 * case à l'autre.
 *
 * @param {ArrayLike<number>} triangles - Sommets à la suite, trois par triangle :
 *   x, y, z, x, y, z, x, y, z…
 * @returns {ProfilArticle}
 */
export function profilDeTriangles(triangles) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < triangles.length; i += 3) {
    minX = Math.min(minX, triangles[i]); maxX = Math.max(maxX, triangles[i]);
    minY = Math.min(minY, triangles[i + 1]); maxY = Math.max(maxY, triangles[i + 1]);
    minZ = Math.min(minZ, triangles[i + 2]); maxZ = Math.max(maxZ, triangles[i + 2]);
  }
  const colonnes = Math.max(1, Math.ceil((maxX - minX) / PAS_CARTE));
  const rangees = Math.max(1, Math.ceil((maxZ - minZ) / PAS_CARTE));
  // La grille est centrée sur la boîte englobante.
  const origineX = (minX + maxX) / 2 - colonnes * PAS_CARTE / 2;
  const origineZ = (minZ + maxZ) / 2 - rangees * PAS_CARTE / 2;
  const dessous = new Float64Array(colonnes * rangees).fill(Infinity);
  const dessus = new Float64Array(colonnes * rangees).fill(-Infinity);

  for (let i = 0; i + 8 < triangles.length; i += 9) {
    const ax = triangles[i], ay = triangles[i + 1], az = triangles[i + 2];
    const bx = triangles[i + 3], by = triangles[i + 4], bz = triangles[i + 5];
    const cx = triangles[i + 6], cy = triangles[i + 7], cz = triangles[i + 8];
    // Aire (vue de dessus) : un triangle vertical ne coupe aucun rayon vertical.
    const aire = (bx - ax) * (cz - az) - (cx - ax) * (bz - az);
    if (Math.abs(aire) < 1e-14) {
      continue;
    }
    // Centres de cases compris dans le triangle, vu de dessus.
    const premiereColonne = Math.max(0, Math.ceil((Math.min(ax, bx, cx) - origineX) / PAS_CARTE - 0.5));
    const derniereColonne = Math.min(colonnes - 1, Math.floor((Math.max(ax, bx, cx) - origineX) / PAS_CARTE - 0.5));
    const premiereRangee = Math.max(0, Math.ceil((Math.min(az, bz, cz) - origineZ) / PAS_CARTE - 0.5));
    const derniereRangee = Math.min(rangees - 1, Math.floor((Math.max(az, bz, cz) - origineZ) / PAS_CARTE - 0.5));
    for (let rangee = premiereRangee; rangee <= derniereRangee; rangee++) {
      const z = origineZ + (rangee + 0.5) * PAS_CARTE;
      for (let colonne = premiereColonne; colonne <= derniereColonne; colonne++) {
        const x = origineX + (colonne + 0.5) * PAS_CARTE;
        // Coordonnées barycentriques du centre de la case.
        const poidsB = ((x - ax) * (cz - az) - (cx - ax) * (z - az)) / aire;
        const poidsC = ((bx - ax) * (z - az) - (x - ax) * (bz - az)) / aire;
        const poidsA = 1 - poidsB - poidsC;
        if (poidsA < -1e-9 || poidsB < -1e-9 || poidsC < -1e-9) {
          continue;
        }
        const hauteur = poidsA * ay + poidsB * by + poidsC * cy - minY;
        const indice = rangee * colonnes + colonne;
        dessous[indice] = Math.min(dessous[indice], hauteur);
        dessus[indice] = Math.max(dessus[indice], hauteur);
      }
    }
  }

  // Article plus fin qu'une case (aucun centre touché) : une seule case, toute sa hauteur.
  if (!dessous.some(Number.isFinite)) {
    const centre = (rangees >> 1) * colonnes + (colonnes >> 1);
    dessous[centre] = 0;
    dessus[centre] = maxY - minY;
  }
  return { colonnes, rangees, dessous, dessus, hauteur: maxY - minY };
}

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
   * @param {ProfilArticle} profil - Forme de l'article (voir `profilDeTriangles`).
   * @param {() => number} [hasard=Math.random] - Renvoie un nombre dans [0, 1[.
   * @param {number} [basMaximal=Infinity] - Hauteur maximale du dessous de l'article.
   * @returns {Place | null} Place de l'article, ou `null` s'il n'y a plus de place assez basse.
   */
  deposer(profil, hasard = Math.random, basMaximal = Infinity) {
    // Décalages (en cases) possibles pour que l'article tienne dans le contenant ;
    // un article plus grand que le contenant est centré.
    const jeuColonnes = this.colonnes - profil.colonnes;
    const jeuRangees = this.rangees - profil.rangees;
    const surfaceArticle = profil.colonnes * profil.rangees * (Math.PI / 4);
    const preference = PREFERENCE_CENTRE * Math.max(0, 1 - 4 * surfaceArticle / (this.colonnes * this.rangees));
    let meilleure = null;
    for (let essai = 0; essai < ESSAIS; essai++) {
      const premiereColonne = jeuColonnes > 0 ? Math.floor(hasard() * (jeuColonnes + 1)) : Math.round(jeuColonnes / 2);
      const premiereRangee = jeuRangees > 0 ? Math.floor(hasard() * (jeuRangees + 1)) : Math.round(jeuRangees / 2);
      const bas = this.#basAuRepos(premiereColonne, premiereRangee, profil);
      // Distance au centre, de 0 (centre) à 1 (bord), dans chaque direction.
      const eloignement = ((jeuColonnes > 0 ? (2 * premiereColonne / jeuColonnes - 1) ** 2 : 0)
        + (jeuRangees > 0 ? (2 * premiereRangee / jeuRangees - 1) ** 2 : 0)) / 2;
      const cout = bas + preference * profil.hauteur * eloignement;
      if (!meilleure || cout < meilleure.cout) {
        meilleure = { premiereColonne, premiereRangee, bas, cout };
      }
    }
    if (meilleure.bas > basMaximal) {
      return null;
    }
    this.#poser(meilleure.premiereColonne, meilleure.premiereRangee, meilleure.bas, profil);
    return {
      x: (meilleure.premiereColonne + profil.colonnes / 2) * PAS_CARTE - this.largeur / 2,
      z: (meilleure.premiereRangee + profil.rangees / 2) * PAS_CARTE - this.profondeur / 2,
      bas: meilleure.bas,
    };
  }

  /**
   * Hauteur du point le plus bas de l'article posé à partir de la case donnée :
   * il descend jusqu'à ce que son dessous touche le tas en un point.
   *
   * @param {number} premiereColonne - Case du tas sous la première colonne de l'article.
   * @param {number} premiereRangee - Case du tas sous la première rangée de l'article.
   * @param {ProfilArticle} profil - Forme de l'article.
   * @returns {number}
   */
  #basAuRepos(premiereColonne, premiereRangee, profil) {
    let bas = -Infinity;
    this.#parcourirEmpreinte(premiereColonne, premiereRangee, profil, (indiceTas, indiceArticle) => {
      bas = Math.max(bas, this.hauteurs[indiceTas] - profil.dessous[indiceArticle]);
    });
    return bas;
  }

  /**
   * Ajoute l'article au tas : la carte des hauteurs suit son dessus.
   *
   * @param {number} premiereColonne - Case du tas sous la première colonne de l'article.
   * @param {number} premiereRangee - Case du tas sous la première rangée de l'article.
   * @param {number} bas - Hauteur du point le plus bas de l'article.
   * @param {ProfilArticle} profil - Forme de l'article.
   */
  #poser(premiereColonne, premiereRangee, bas, profil) {
    this.#parcourirEmpreinte(premiereColonne, premiereRangee, profil, (indiceTas, indiceArticle) => {
      this.hauteurs[indiceTas] = Math.max(this.hauteurs[indiceTas], bas + profil.dessus[indiceArticle]);
    });
  }

  /**
   * Appelle `visiter` pour chaque case occupée par l'article et située dans le contenant.
   *
   * @param {number} premiereColonne - Case du tas sous la première colonne de l'article.
   * @param {number} premiereRangee - Case du tas sous la première rangée de l'article.
   * @param {ProfilArticle} profil - Forme de l'article.
   * @param {(indiceTas: number, indiceArticle: number) => void} visiter - Appelée pour chaque case.
   */
  #parcourirEmpreinte(premiereColonne, premiereRangee, profil, visiter) {
    for (let rangee = 0; rangee < profil.rangees; rangee++) {
      const rangeeTas = premiereRangee + rangee;
      if (rangeeTas < 0 || rangeeTas >= this.rangees) {
        continue;
      }
      for (let colonne = 0; colonne < profil.colonnes; colonne++) {
        const colonneTas = premiereColonne + colonne;
        const indiceArticle = rangee * profil.colonnes + colonne;
        if (colonneTas < 0 || colonneTas >= this.colonnes || profil.dessous[indiceArticle] === Infinity) {
          continue;
        }
        visiter(rangeeTas * this.colonnes + colonneTas, indiceArticle);
      }
    }
  }
}
