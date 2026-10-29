/**
 * @file Saisie, déplacement et relâchement des objets par pincement.
 *
 * Ce module ne connaît ni WebXR ni le détecteur de pincement : il reçoit
 * simplement « telle main pince ici », « telle main relâche » et, à chaque
 * image, la position des points de pincement.
 */

import { Box3, Vector3 } from 'three';

/**
 * @typedef {object} ObjetSaisissable
 * @property {import('three').Object3D} objet3D - Objet déplacé dans la scène.
 * @property {(estSurvole: boolean) => void} definirSurvol - Affiche ou masque le retour visuel de survol.
 */

/**
 * @typedef {object} Prise
 * @property {ObjetSaisissable} objet - Objet tenu.
 * @property {Vector3} decalage - Écart entre le point de pincement et l'objet au moment de la saisie.
 */

/**
 * Gère quels objets sont tenus par quelle main.
 */
export class GestionnaireSaisie {
  /**
   * @param {{ rayonSaisie: number }} reglages - Rayon de saisie.
   */
  constructor(reglages) {
    this.rayonSaisie = reglages.rayonSaisie;

    /** @type {ObjetSaisissable[]} */
    this.objets = [];

    /**
     * Objets actuellement tenus, par côté de main.
     * @type {Map<XRHandedness, Prise>}
     */
    this.prises = new Map();

    /** Boîte englobante réutilisée pour éviter des allocations à chaque image. */
    this.boiteTemporaire = new Box3();
  }

  /**
   * Rend un objet saisissable.
   *
   * @param {ObjetSaisissable} objet - Objet à ajouter.
   */
  ajouterObjet(objet) {
    if (!this.objets.includes(objet)) {
      this.objets.push(objet);
    }
  }

  /**
   * Rend un objet non saisissable (par exemple un article déposé dans le panier).
   * S'il était tenu, il est relâché.
   *
   * @param {ObjetSaisissable} objet - Objet à retirer.
   */
  retirerObjet(objet) {
    this.objets = this.objets.filter((objetConnu) => objetConnu !== objet);
    for (const [cote, prise] of this.prises) {
      if (prise.objet === objet) {
        this.prises.delete(cote);
      }
    }
    objet.definirSurvol(false);
  }

  /**
   * Une main commence à pincer : elle saisit l'objet libre le plus proche,
   * s'il est à portée.
   *
   * @param {XRHandedness} cote - Main qui pince.
   * @param {Vector3} point - Point de pincement (coordonnées de la scène).
   * @param {{ centrer?: boolean }} [options] - `centrer` : l'objet se centre sur
   *   le point (utile à la souris) au lieu de garder l'écart de la prise.
   * @returns {boolean} `true` si un objet a été saisi.
   */
  saisir(cote, point, { centrer = false } = {}) {
    const objet = this.#trouverObjetLibreLePlusProche(point);
    if (!objet) {
      return false;
    }
    // Le décalage évite que l'objet « saute » pour se centrer sur les doigts.
    const decalage = centrer ? new Vector3() : objet.objet3D.position.clone().sub(point);
    this.prises.set(cote, { objet, decalage });
    return true;
  }

  /**
   * Indique si un objet est actuellement tenu par une main.
   *
   * @param {ObjetSaisissable} objet - Objet à tester.
   * @returns {boolean}
   */
  estTenu(objet) {
    return [...this.prises.values()].some((prise) => prise.objet === objet);
  }

  /**
   * Objets 3D actuellement tenus (par exemple pour que le curseur les traverse).
   *
   * @returns {import('three').Object3D[]}
   */
  objetsTenus() {
    return [...this.prises.values()].map((prise) => prise.objet.objet3D);
  }

  /**
   * Une main relâche : l'objet reste là où il a été lâché.
   *
   * @param {XRHandedness} cote - Main qui relâche.
   * @returns {ObjetSaisissable | null} L'objet lâché, ou `null` si la main ne tenait rien.
   */
  relacher(cote) {
    const prise = this.prises.get(cote);
    this.prises.delete(cote);
    return prise ? prise.objet : null;
  }

  /**
   * Déplace les objets tenus et met à jour le halo de survol.
   * À appeler une fois par image.
   *
   * @param {Map<XRHandedness, Vector3>} pointsDePincement - Points des mains suivies.
   */
  mettreAJour(pointsDePincement) {
    for (const [cote, prise] of this.prises) {
      const point = pointsDePincement.get(cote);
      if (point) {
        prise.objet.objet3D.position.copy(point).add(prise.decalage);
      }
    }

    const objetsSurvoles = new Set([...this.prises.values()].map((prise) => prise.objet));
    for (const [cote, point] of pointsDePincement) {
      if (!this.prises.has(cote)) {
        const objet = this.#trouverObjetLibreLePlusProche(point);
        if (objet) {
          objetsSurvoles.add(objet);
        }
      }
    }
    for (const objet of this.objets) {
      objet.definirSurvol(objetsSurvoles.has(objet));
    }
  }

  /**
   * Cherche l'objet non tenu dont la surface est la plus proche du point,
   * dans la limite du rayon de saisie.
   *
   * @param {Vector3} point - Point de pincement.
   * @returns {ObjetSaisissable | null}
   */
  #trouverObjetLibreLePlusProche(point) {
    const objetsTenus = new Set([...this.prises.values()].map((prise) => prise.objet));
    let objetLePlusProche = null;
    let distanceLaPlusCourte = this.rayonSaisie;

    for (const objet of this.objets) {
      if (objetsTenus.has(objet)) {
        continue;
      }
      // Distance à la surface (0 si le point est à l'intérieur de l'objet).
      const distance = this.boiteTemporaire.setFromObject(objet.objet3D).distanceToPoint(point);
      if (distance <= distanceLaPlusCourte) {
        distanceLaPlusCourte = distance;
        objetLePlusProche = objet;
      }
    }
    return objetLePlusProche;
  }
}
