/**
 * @file Ardoise de la liste de courses, suspendue sous l'auvent.
 *
 * Vraie ardoise d'écolier : surface d'ardoise grainée avec des traces de craie
 * mal effacée, cadre en bois (même bois que l'étal), texte écrit à la craie
 * (police manuscrite Patrick Hand, grain de craie). Le texte reste presque
 * blanc sur fond sombre et opaque (contraste ≥ 7:1). Un article dans le panier
 * est coché ✔ ET barré : l'information n'est jamais portée par la couleur seule.
 */

import * as THREE from 'three';

/** Couleurs (craie sur ardoise : contraste ≥ 9:1, même sur les traces d'effacement). */
const COULEURS = Object.freeze({
  ardoise: '#2b3532',
  craie: '#f6f6f0',
});

/** Titre écrit en haut de l'ardoise. */
const TITRE = 'Ma liste de courses';

/** Pixels du canevas par mètre d'ardoise (netteté du texte). */
const PIXELS_PAR_METRE = 1800;

/** Police « écrite à la main », chargée par `chargerPoliceCraie`. */
const NOM_POLICE = 'Patrick Hand';

/** Police de secours, si la police manuscrite n'a pas pu être chargée. */
const POLICE_SECOURS = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Nombre de colonnes d'articles (la liste compte au plus 6 articles). */
const COLONNES = 2;

/**
 * Charge la police manuscrite de l'ardoise (fichier local, licence OFL).
 * À attendre avant le premier affichage ; en cas d'échec, l'ardoise utilise
 * simplement une police système.
 *
 * @param {string} url - Adresse du fichier de police.
 * @returns {Promise<void>}
 */
export async function chargerPoliceCraie(url) {
  const police = new FontFace(NOM_POLICE, `url(${url})`);
  await police.load();
  document.fonts.add(police);
}

/**
 * @typedef {object} LigneArdoise
 * @property {string} texte - Texte de la ligne (« 2 pommes »).
 * @property {boolean} estCochee - `true` : case cochée et texte barré.
 */

/**
 * Ardoise 3D affichant la liste de courses et les articles cochés.
 */
export class Ardoise {
  /**
   * @param {typeof import('../config.js').CONFIG.ardoise} reglages - Taille et position.
   * @param {THREE.Material} matiereCadre - Bois du cadre.
   */
  constructor(reglages, matiereCadre) {
    this.canevas = document.createElement('canvas');
    this.canevas.width = Math.round(reglages.largeur * PIXELS_PAR_METRE);
    this.canevas.height = Math.round(reglages.hauteur * PIXELS_PAR_METRE);
    this.texture = new THREE.CanvasTexture(this.canevas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;

    // Surface d'ardoise et grain de la craie : tirés une seule fois, pour que
    // l'ardoise ne change pas d'aspect quand on coche un article.
    this.fond = creerSurfaceArdoise(this.canevas.width, this.canevas.height);
    this.grainCraie = creerGrainCraie(this.canevas.width, this.canevas.height);
    /** Calque où l'on écrit avant d'y appliquer le grain de la craie. */
    this.calqueCraie = document.createElement('canvas');
    this.calqueCraie.width = this.canevas.width;
    this.calqueCraie.height = this.canevas.height;

    /** Ardoise, cadre et cordelettes, à ajouter à la scène. */
    this.objet3D = new THREE.Group();
    this.objet3D.name = 'ardoise';
    this.objet3D.position.set(reglages.position.x, reglages.position.y, reglages.position.z);

    // Non éclairée : couleurs exactes, contraste garanti quelle que soit la lumière.
    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(reglages.largeur, reglages.hauteur),
      new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false }),
    );
    this.objet3D.add(surface);
    this.objet3D.add(creerCadre(reglages, matiereCadre));

    // Cordelettes : du haut du cadre jusqu'à la traverse de l'auvent.
    const hautCadre = reglages.hauteur / 2 + reglages.largeurCadre;
    const longueurCorde = reglages.hauteurAccroche - (reglages.position.y + hautCadre);
    const matiereCorde = new THREE.MeshStandardMaterial({ color: 0x6b5a45, roughness: 0.9 });
    for (const cote of [-1, 1]) {
      const corde = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, longueurCorde, 6), matiereCorde);
      corde.position.set(cote * reglages.largeur * 0.4, hautCadre + longueurCorde / 2, -0.005);
      this.objet3D.add(corde);
    }
  }

  /**
   * Écrit la liste sur l'ardoise.
   *
   * @param {readonly LigneArdoise[]} lignes - Texte et état coché de chaque ligne.
   */
  afficher(lignes) {
    this.#ecrireALaCraie((craie, largeur, hauteur) => {
      const marge = largeur * 0.05;
      craie.textAlign = 'center';
      ecrire(craie, TITRE, largeur / 2, hauteur * 0.14, Math.round(hauteur * 0.17), largeur - 2 * marge);
      craie.textAlign = 'left';

      // Articles en colonnes, de haut en bas puis de gauche à droite.
      const rangees = Math.ceil(lignes.length / COLONNES);
      const largeurColonne = (largeur - 2 * marge) / COLONNES;
      const tailleTexte = Math.round(hauteur * 0.15);
      lignes.forEach((ligne, indice) => {
        const x = marge + Math.floor(indice / rangees) * largeurColonne;
        // Écart fixe entre les rangées (3 au plus), même pour une liste courte.
        const y = hauteur * (0.38 + (indice % rangees) * 0.24);
        dessinerLigne(craie, ligne, x, y, largeurColonne * 0.95, tailleTexte);
      });
    });
  }

  /**
   * Écrit un message centré à la place de la liste (par exemple les félicitations).
   *
   * @param {string} titre - Titre, en gros (« Bravo ! »).
   * @param {readonly string[]} lignes - Une ou deux phrases sous le titre.
   */
  afficherMessage(titre, lignes) {
    this.#ecrireALaCraie((craie, largeur, hauteur) => {
      const largeurUtile = largeur * 0.9;
      craie.textAlign = 'center';
      ecrire(craie, titre, largeur / 2, hauteur * 0.3, Math.round(hauteur * 0.3), largeurUtile);
      lignes.forEach((ligne, indice) => {
        ecrire(craie, ligne, largeur / 2, hauteur * (0.62 + indice * 0.2), Math.round(hauteur * 0.13), largeurUtile);
      });
    });
  }

  /**
   * Efface l'ardoise, fait écrire le contenu, applique le grain de la craie et
   * met à jour la texture.
   *
   * @param {(craie: CanvasRenderingContext2D, largeur: number, hauteur: number) => void} ecrireContenu
   *   Écrit le contenu sur le calque de craie.
   */
  #ecrireALaCraie(ecrireContenu) {
    const { width: largeur, height: hauteur } = this.canevas;
    const craie = this.calqueCraie.getContext('2d');
    craie.clearRect(0, 0, largeur, hauteur);
    craie.fillStyle = COULEURS.craie;
    craie.strokeStyle = COULEURS.craie;
    craie.lineCap = 'round';
    craie.lineJoin = 'round';
    craie.textBaseline = 'middle';
    ecrireContenu(craie, largeur, hauteur);

    // Grain de la craie : de petits manques dans les traits.
    craie.globalCompositeOperation = 'destination-out';
    craie.drawImage(this.grainCraie, 0, 0);
    craie.globalCompositeOperation = 'source-over';

    const contexte = this.canevas.getContext('2d');
    contexte.drawImage(this.fond, 0, 0);
    contexte.drawImage(this.calqueCraie, 0, 0);
    this.texture.needsUpdate = true;
  }
}

/**
 * Écrit un texte à la craie : le contour épaissit le trait fin de la police
 * manuscrite, comme une craie appuyée.
 *
 * @param {CanvasRenderingContext2D} contexte - Contexte de dessin.
 * @param {string} texte - Texte à écrire.
 * @param {number} x - Abscisse (selon l'alignement du contexte).
 * @param {number} y - Ordonnée du milieu du texte.
 * @param {number} taille - Taille du texte, en pixels.
 * @param {number} largeurMaximale - Largeur disponible (le texte est resserré au-delà).
 */
function ecrire(contexte, texte, x, y, taille, largeurMaximale) {
  contexte.font = `${taille}px "${NOM_POLICE}", ${POLICE_SECOURS}`;
  contexte.lineWidth = taille * 0.045;
  contexte.fillText(texte, x, y, largeurMaximale);
  contexte.strokeText(texte, x, y, largeurMaximale);
}

/**
 * Dessine une ligne : case tracée à la main (cochée ou vide), puis texte
 * (barré si coché).
 *
 * @param {CanvasRenderingContext2D} contexte - Contexte de dessin.
 * @param {LigneArdoise} ligne - Texte et état coché.
 * @param {number} x - Abscisse du bord gauche.
 * @param {number} y - Ordonnée du milieu de la ligne.
 * @param {number} largeurMaximale - Largeur disponible.
 * @param {number} tailleTexte - Taille du texte, en pixels.
 */
function dessinerLigne(contexte, ligne, x, y, largeurMaximale, tailleTexte) {
  const cote = tailleTexte * 0.62;
  const haut = y - cote / 2;

  // Case : carré légèrement irrégulier, comme tracé à la main.
  contexte.lineWidth = tailleTexte * 0.06;
  contexte.beginPath();
  contexte.moveTo(x, haut + cote * 0.03);
  contexte.lineTo(x + cote * 1.02, haut);
  contexte.lineTo(x + cote, haut + cote * 1.03);
  contexte.lineTo(x - cote * 0.02, haut + cote);
  contexte.closePath();
  contexte.stroke();

  // Coche ✔ tracée (pas un caractère de police), qui déborde un peu de la case.
  if (ligne.estCochee) {
    contexte.lineWidth = tailleTexte * 0.1;
    contexte.beginPath();
    contexte.moveTo(x + cote * 0.12, y);
    contexte.lineTo(x + cote * 0.42, y + cote * 0.38);
    contexte.lineTo(x + cote * 1.1, y - cote * 0.7);
    contexte.stroke();
  }

  const xTexte = x + cote * 1.6;
  const largeurTexte = largeurMaximale - (xTexte - x);
  ecrire(contexte, ligne.texte, xTexte, y, tailleTexte, largeurTexte);

  // Article dans le panier : nom barré d'un trait à main levée, en plus de la coche.
  if (ligne.estCochee) {
    const longueur = Math.min(contexte.measureText(ligne.texte).width, largeurTexte);
    contexte.lineWidth = tailleTexte * 0.07;
    contexte.beginPath();
    contexte.moveTo(xTexte - tailleTexte * 0.1, y + tailleTexte * 0.04);
    contexte.lineTo(xTexte + longueur + tailleTexte * 0.1, y - tailleTexte * 0.04);
    contexte.stroke();
  }
}

/**
 * Surface d'une ardoise usée : fond mat, grain de la pierre et traces de
 * craie mal effacée (passages d'éponge). Les traces restent très légères pour
 * garder le contraste du texte.
 *
 * @param {number} largeur - Largeur, en pixels.
 * @param {number} hauteur - Hauteur, en pixels.
 * @returns {HTMLCanvasElement}
 */
function creerSurfaceArdoise(largeur, hauteur) {
  const canevas = document.createElement('canvas');
  canevas.width = largeur;
  canevas.height = hauteur;
  const contexte = canevas.getContext('2d');
  contexte.fillStyle = COULEURS.ardoise;
  contexte.fillRect(0, 0, largeur, hauteur);

  // Traces d'effacement : larges taches de craie très diluée.
  for (let indice = 0; indice < 9; indice++) {
    const x = Math.random() * largeur;
    const y = Math.random() * hauteur;
    const rayon = (0.15 + Math.random() * 0.25) * largeur;
    const tache = contexte.createRadialGradient(x, y, 0, x, y, rayon);
    tache.addColorStop(0, 'rgba(255, 255, 255, 0.045)');
    tache.addColorStop(1, 'rgba(255, 255, 255, 0)');
    contexte.save();
    // Taches étirées dans le sens du geste d'effacement.
    contexte.translate(x, y);
    contexte.scale(1, 0.45);
    contexte.translate(-x, -y);
    contexte.fillStyle = tache;
    contexte.fillRect(0, 0, largeur, hauteur / 0.45);
    contexte.restore();
  }

  // Grain de la pierre : points un peu plus clairs ou plus sombres.
  for (let indice = 0; indice < (largeur * hauteur) / 30; indice++) {
    contexte.fillStyle = Math.random() < 0.5 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.12)';
    contexte.fillRect(Math.random() * largeur, Math.random() * hauteur, 2, 2);
  }
  return canevas;
}

/**
 * Masque de grain de la craie : petits points qui seront retirés des traits.
 *
 * @param {number} largeur - Largeur, en pixels.
 * @param {number} hauteur - Hauteur, en pixels.
 * @returns {HTMLCanvasElement}
 */
function creerGrainCraie(largeur, hauteur) {
  const canevas = document.createElement('canvas');
  canevas.width = largeur;
  canevas.height = hauteur;
  const contexte = canevas.getContext('2d');
  for (let indice = 0; indice < (largeur * hauteur) / 14; indice++) {
    contexte.fillStyle = `rgba(0, 0, 0, ${0.25 + Math.random() * 0.45})`;
    const taille = 1 + Math.random() * 2;
    contexte.fillRect(Math.random() * largeur, Math.random() * hauteur, taille, taille);
  }
  return canevas;
}

/**
 * Cadre en bois autour de l'ardoise : quatre montants et un fond, un peu en
 * relief devant la surface (l'ardoise paraît enchâssée).
 *
 * @param {typeof import('../config.js').CONFIG.ardoise} reglages - Taille de l'ardoise et du cadre.
 * @param {THREE.Material} matiere - Bois du cadre.
 * @returns {THREE.Group}
 */
function creerCadre(reglages, matiere) {
  const cadre = new THREE.Group();
  const { largeur, hauteur, largeurCadre: bord, epaisseurCadre: epaisseur } = reglages;
  const montants = [
    // Haut et bas : toute la largeur, coins compris.
    { l: largeur + 2 * bord, h: bord, x: 0, y: (hauteur + bord) / 2 },
    { l: largeur + 2 * bord, h: bord, x: 0, y: -(hauteur + bord) / 2 },
    // Côtés.
    { l: bord, h: hauteur, x: -(largeur + bord) / 2, y: 0 },
    { l: bord, h: hauteur, x: (largeur + bord) / 2, y: 0 },
  ];
  for (const { l, h, x, y } of montants) {
    const montant = new THREE.Mesh(new THREE.BoxGeometry(l, h, epaisseur), matiere);
    // Le cadre dépasse de 4 mm devant la surface.
    montant.position.set(x, y, 0.004 - epaisseur / 2);
    montant.castShadow = true;
    cadre.add(montant);
  }
  // Fond : dos de l'ardoise, vu de derrière ou de biais.
  const dos = new THREE.Mesh(new THREE.BoxGeometry(largeur, hauteur, 0.006), matiere);
  dos.position.z = -0.0035;
  cadre.add(dos);
  return cadre;
}
