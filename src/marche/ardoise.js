/**
 * @file Ardoise de la liste de courses, suspendue sous l'auvent.
 *
 * Texte blanc « craie » sur fond ardoise sombre et opaque (contraste ≥ 7:1),
 * dans un cadre en bois. Un article dans le panier est coché ✔ ET barré :
 * l'information n'est jamais portée par la couleur seule.
 */

import * as THREE from 'three';

/** Couleurs (blanc sur ardoise : contraste ≈ 13:1). */
const COULEURS = Object.freeze({
  cadre: '#7a5230',
  fond: '#263330',
  craie: '#ffffff',
});

/** Titre écrit en haut de l'ardoise. */
const TITRE = 'Ma liste de courses';

/** Pixels du canevas par mètre d'ardoise (netteté du texte). */
const PIXELS_PAR_METRE = 1800;

/** Police lisible, présente sur tous les systèmes. */
const POLICE = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Nombre de colonnes d'articles (la liste compte au plus 6 articles). */
const COLONNES = 2;

/**
 * Ardoise 3D affichant la liste de courses et les articles cochés.
 */
export class Ardoise {
  /**
   * @param {typeof import('../config.js').CONFIG.ardoise} reglages - Taille et position.
   */
  constructor(reglages) {
    this.canevas = document.createElement('canvas');
    this.canevas.width = Math.round(reglages.largeur * PIXELS_PAR_METRE);
    this.canevas.height = Math.round(reglages.hauteur * PIXELS_PAR_METRE);
    this.texture = new THREE.CanvasTexture(this.canevas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;

    /** Ardoise et ses deux cordelettes, à ajouter à la scène. */
    this.objet3D = new THREE.Group();
    this.objet3D.name = 'ardoise';
    this.objet3D.position.set(reglages.position.x, reglages.position.y, reglages.position.z);

    // Non éclairée : couleurs exactes, contraste garanti quelle que soit la lumière.
    const planche = new THREE.Mesh(
      new THREE.PlaneGeometry(reglages.largeur, reglages.hauteur),
      new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false }),
    );
    this.objet3D.add(planche);

    // Cordelettes : du haut de l'ardoise jusqu'à la traverse de l'auvent.
    const longueurCorde = reglages.hauteurAccroche - (reglages.position.y + reglages.hauteur / 2);
    const matiereCorde = new THREE.MeshStandardMaterial({ color: 0x6b5a45, roughness: 0.9 });
    for (const cote of [-1, 1]) {
      const corde = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, longueurCorde, 6), matiereCorde);
      corde.position.set(cote * reglages.largeur * 0.4, reglages.hauteur / 2 + longueurCorde / 2, 0);
      this.objet3D.add(corde);
    }
  }

  /**
   * Écrit la liste sur l'ardoise.
   *
   * @param {readonly import('../jeu/partie.js').LigneListe[]} lignes - Articles et état coché.
   */
  afficher(lignes) {
    const contexte = this.#dessinerFond();
    const { width: largeur, height: hauteur } = this.canevas;
    const marge = largeur * 0.06;

    contexte.fillStyle = COULEURS.craie;
    contexte.font = `bold ${Math.round(hauteur * 0.13)}px ${POLICE}`;
    contexte.textAlign = 'center';
    contexte.fillText(TITRE, largeur / 2, hauteur * 0.17, largeur - 2 * marge);
    contexte.textAlign = 'left';

    // Articles en colonnes, de haut en bas puis de gauche à droite.
    const rangees = Math.ceil(lignes.length / COLONNES);
    const largeurColonne = (largeur - 2 * marge) / COLONNES;
    // Écart fixe entre les rangées (3 au plus), même pour une liste courte.
    const haut = hauteur * 0.39;
    const pasVertical = hauteur * 0.215;
    const tailleTexte = Math.round(hauteur * 0.11);
    lignes.forEach((ligne, indice) => {
      const x = marge + Math.floor(indice / rangees) * largeurColonne;
      const y = haut + (indice % rangees) * pasVertical;
      this.#dessinerLigne(contexte, ligne, x, y, largeurColonne * 0.94, tailleTexte);
    });
    this.texture.needsUpdate = true;
  }

  /**
   * Dessine une ligne : case (cochée ou vide) puis nom de l'article (barré si coché).
   *
   * @param {CanvasRenderingContext2D} contexte - Contexte de dessin.
   * @param {import('../jeu/partie.js').LigneListe} ligne - Article et état.
   * @param {number} x - Abscisse du bord gauche.
   * @param {number} y - Ordonnée du milieu de la ligne.
   * @param {number} largeurMaximale - Largeur disponible.
   * @param {number} tailleTexte - Taille du texte, en pixels.
   */
  #dessinerLigne(contexte, ligne, x, y, largeurMaximale, tailleTexte) {
    const cote = tailleTexte * 0.8;
    contexte.strokeStyle = COULEURS.craie;
    contexte.lineCap = 'round';
    contexte.lineJoin = 'round';

    // Case : carré vide, et coche ✔ tracée (pas un caractère de police).
    contexte.lineWidth = tailleTexte * 0.07;
    contexte.strokeRect(x, y - cote / 2, cote, cote);
    if (ligne.estCochee) {
      contexte.lineWidth = tailleTexte * 0.13;
      contexte.beginPath();
      contexte.moveTo(x + cote * 0.15, y);
      contexte.lineTo(x + cote * 0.42, y + cote * 0.32);
      contexte.lineTo(x + cote * 0.95, y - cote * 0.55);
      contexte.stroke();
    }

    const xTexte = x + cote * 1.45;
    const largeurTexte = largeurMaximale - (xTexte - x);
    contexte.fillStyle = COULEURS.craie;
    contexte.font = `bold ${tailleTexte}px ${POLICE}`;
    contexte.fillText(ligne.article.nom, xTexte, y, largeurTexte);

    // Article dans le panier : nom barré, en plus de la coche.
    if (ligne.estCochee) {
      const longueur = Math.min(contexte.measureText(ligne.article.nom).width, largeurTexte);
      contexte.lineWidth = tailleTexte * 0.08;
      contexte.beginPath();
      contexte.moveTo(xTexte - tailleTexte * 0.1, y);
      contexte.lineTo(xTexte + longueur + tailleTexte * 0.1, y);
      contexte.stroke();
    }
  }

  /**
   * Efface l'ardoise et dessine son fond : cadre en bois et surface d'ardoise.
   *
   * @returns {CanvasRenderingContext2D}
   */
  #dessinerFond() {
    const contexte = this.canevas.getContext('2d');
    const { width: largeur, height: hauteur } = this.canevas;
    const epaisseurCadre = hauteur * 0.05;
    contexte.fillStyle = COULEURS.cadre;
    contexte.fillRect(0, 0, largeur, hauteur);
    contexte.fillStyle = COULEURS.fond;
    contexte.fillRect(epaisseurCadre, epaisseurCadre, largeur - 2 * epaisseurCadre, hauteur - 2 * epaisseurCadre);
    contexte.textBaseline = 'middle';
    return contexte;
  }
}
