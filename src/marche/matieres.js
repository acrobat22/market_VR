/**
 * @file Matières réalistes (bois, toile) à partir des textures Poly Haven (CC0) :
 * couleur, relief et rugosité, répétées à la bonne échelle.
 *
 * Chaque image n'est chargée qu'une fois. Les matériaux en reçoivent des
 * copies (même image, répétition propre) : quand l'image arrive, toutes les
 * copies sont prévenues pour être envoyées à la carte graphique.
 */

import * as THREE from 'three';

/**
 * @typedef {object} ImageCommune
 * @property {THREE.Texture} texture - Texture d'origine (chargée une fois).
 * @property {THREE.Texture[]} copies - Copies à prévenir quand l'image arrive.
 * @property {boolean} estChargee - `true` une fois l'image disponible.
 * @property {Promise<void>} promesse - Résolue quand l'image est chargée (ou en échec).
 */

/** @type {Map<string, ImageCommune>} Images déjà demandées, par chemin. */
const cache = new Map();

/**
 * Charge (une fois) une image de texture.
 *
 * @param {string} chemin - Adresse de l'image.
 * @param {THREE.ColorSpace} espace - `SRGBColorSpace` pour la couleur, `NoColorSpace` sinon.
 * @returns {ImageCommune}
 */
function chargerImage(chemin, espace) {
  if (!cache.has(chemin)) {
    const commune = { texture: null, copies: [], estChargee: false, promesse: null };
    commune.promesse = new Promise((resoudre) => {
      commune.texture = new THREE.TextureLoader().load(
        chemin,
        () => {
          commune.estChargee = true;
          commune.copies.forEach((copie) => { copie.needsUpdate = true; });
          resoudre();
        },
        undefined,
        (erreur) => {
          console.error(`[matieres] Texture « ${chemin} » non chargée :`, erreur);
          resoudre();
        },
      );
    });
    commune.texture.colorSpace = espace;
    commune.texture.wrapS = THREE.RepeatWrapping;
    commune.texture.wrapT = THREE.RepeatWrapping;
    commune.texture.anisotropy = 8;
    cache.set(chemin, commune);
  }
  return cache.get(chemin);
}

/**
 * Précharge les trois images de textures, pour construire ensuite les
 * matériaux sans « surgissement » du bois. Les erreurs sont déjà signalées
 * dans la console : la promesse se résout quand même.
 *
 * @param {string} dossier - Dossier des textures, terminé par « / ».
 * @param {string[]} noms - Noms des textures Poly Haven.
 * @returns {Promise<void>}
 */
export async function prechargerMatieres(dossier, noms) {
  const attentes = [];
  for (const nom of noms) {
    const base = `${dossier}${nom}/${nom}`;
    for (const [carte, espace] of [['diff', THREE.SRGBColorSpace], ['nor_gl', THREE.NoColorSpace], ['rough', THREE.NoColorSpace]]) {
      const commune = chargerImage(`${base}_${carte}_1k.jpg`, espace);
      attentes.push(commune.promesse);
    }
  }
  await Promise.all(attentes);
}

/**
 * Copie d'une image commune avec sa propre répétition.
 *
 * @param {ImageCommune} commune - Image partagée.
 * @param {number} repetitionX - Répétitions horizontales.
 * @param {number} repetitionY - Répétitions verticales.
 * @returns {THREE.Texture}
 */
function copier(commune, repetitionX, repetitionY) {
  const copie = commune.texture.clone();
  copie.repeat.set(repetitionX, repetitionY);
  if (commune.estChargee) {
    copie.needsUpdate = true;
  } else {
    commune.copies.push(copie);
  }
  return copie;
}

/**
 * Crée un matériau réaliste répété à l'échelle voulue.
 *
 * @param {object} options
 * @param {string} options.dossier - Dossier des textures, terminé par « / ».
 * @param {string} options.nom - Nom de la texture Poly Haven (ex. « rough_wood »).
 * @param {number} options.repetitionX - Nombre de répétitions horizontales.
 * @param {number} options.repetitionY - Nombre de répétitions verticales.
 * @param {number} [options.teinte=0xffffff] - Teinte multipliée par la texture.
 * @param {THREE.Side} [options.cote=THREE.FrontSide] - Faces dessinées.
 * @returns {THREE.MeshStandardMaterial}
 */
export function creerMatiere({ dossier, nom, repetitionX, repetitionY, teinte = 0xffffff, cote = THREE.FrontSide }) {
  const base = `${dossier}${nom}/${nom}`;
  return new THREE.MeshStandardMaterial({
    color: teinte,
    map: copier(chargerImage(`${base}_diff_1k.jpg`, THREE.SRGBColorSpace), repetitionX, repetitionY),
    normalMap: copier(chargerImage(`${base}_nor_gl_1k.jpg`, THREE.NoColorSpace), repetitionX, repetitionY),
    roughnessMap: copier(chargerImage(`${base}_rough_1k.jpg`, THREE.NoColorSpace), repetitionX, repetitionY),
    side: cote,
  });
}
