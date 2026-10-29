/**
 * @file Ombre de contact : tache sombre et floue au pied d'un objet posé.
 *
 * Elle imite l'occultation ambiante (assombrissement là où deux surfaces se
 * touchent), trop coûteuse à calculer en VR. Le dégradé est dessiné une seule
 * fois sur un canevas et partagé par toutes les ombres.
 */

import * as THREE from 'three';

/** Texture de dégradé partagée, créée à la première utilisation. */
let textureDegrade = null;

/**
 * Crée (une seule fois) la texture : un rectangle aux bords très adoucis.
 *
 * @returns {THREE.CanvasTexture}
 */
function obtenirTextureDegrade() {
  if (textureDegrade) {
    return textureDegrade;
  }
  const taille = 128;
  const canevas = document.createElement('canvas');
  canevas.width = taille;
  canevas.height = taille;
  const contexte = canevas.getContext('2d');
  // Un carré noir flouté donne une ombre rectangulaire aux coins arrondis.
  contexte.filter = `blur(${taille * 0.1}px)`;
  contexte.fillStyle = '#000';
  const marge = taille * 0.22;
  contexte.fillRect(marge, marge, taille - 2 * marge, taille - 2 * marge);
  textureDegrade = new THREE.CanvasTexture(canevas);
  return textureDegrade;
}

/**
 * Crée une ombre de contact horizontale, centrée sur l'origine.
 *
 * @param {number} largeur - Largeur de l'objet (x).
 * @param {number} profondeur - Profondeur de l'objet (z).
 * @param {typeof import('../config.js').CONFIG.ombreContact} reglages - Débord et opacité.
 * @returns {THREE.Mesh}
 */
export function creerOmbreContact(largeur, profondeur, reglages) {
  const ombre = new THREE.Mesh(
    new THREE.PlaneGeometry(largeur * reglages.debord, profondeur * reglages.debord),
    new THREE.MeshBasicMaterial({
      map: obtenirTextureDegrade(),
      transparent: true,
      opacity: reglages.opacite,
      depthWrite: false,
      // Évite le scintillement avec la surface juste en dessous.
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  ombre.rotation.x = -Math.PI / 2;
  ombre.name = 'ombre-contact';
  return ombre;
}
