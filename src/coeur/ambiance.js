/**
 * @file Pièce réelle autour du joueur.
 *
 * - Une photo panoramique (JPG) est projetée sur un dôme dont le bas est
 *   aplati en sol (`GroundedSkybox`) : le parquet de la photo devient le sol
 *   sous la table, à la bonne échelle.
 * - La version HDR de la même pièce éclaire la scène (reflets réalistes).
 * - Un sol invisible reçoit les ombres et les dessine sur le parquet photo.
 *
 * Exemple officiel : https://threejs.org/examples/#webgl_materials_envmaps_groundprojected
 */

import * as THREE from 'three';
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

/**
 * Ajoute à la scène le sol qui reçoit les ombres (visible tout de suite,
 * même avant le chargement de la photo).
 *
 * @param {THREE.Scene} scene - Scène à compléter.
 * @param {typeof import('../config.js').CONFIG.ambiance} reglages - Réglages de l'ambiance.
 */
export function ajouterSolOmbres(scene, reglages) {
  const sol = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    // Invisible sauf là où une ombre tombe.
    new THREE.ShadowMaterial({ opacity: reglages.opaciteOmbreSol }),
  );
  sol.rotation.x = -Math.PI / 2;
  sol.position.y = 0.001;
  sol.receiveShadow = true;
  sol.name = 'sol-ombres';
  scene.add(sol);
}

/**
 * Charge la photo de la pièce et son éclairage HDR, puis les applique.
 * En cas d'échec, la scène garde sa couleur de secours (le jeu reste jouable).
 *
 * @param {THREE.Scene} scene - Scène à habiller.
 * @param {typeof import('../config.js').CONFIG.ambiance} reglages - Réglages de l'ambiance.
 * @param {typeof import('../config.js').CONFIG.ambiance.places[number]} place - Place à afficher.
 * @returns {Promise<void>}
 */
export async function chargerAmbiance(scene, reglages, place) {
  const [photo, eclairage] = await Promise.all([
    new THREE.TextureLoader().loadAsync(place.photoFond),
    new HDRLoader().loadAsync(place.eclairageHdr),
  ]);

  // Éclairage : la pièce HDR sert d'environnement (reflets et lumière ambiante).
  eclairage.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = eclairage;
  scene.environmentIntensity = reglages.intensiteEnvironnement;
  scene.environmentRotation.y = place.rotation;

  // Décor : la photo (déjà retouchée façon photo) est affichée telle quelle.
  photo.colorSpace = THREE.SRGBColorSpace;
  photo.mapping = THREE.EquirectangularReflectionMapping;
  photo.anisotropy = 4;
  const piece = new GroundedSkybox(photo, place.hauteurPrise, reglages.rayonPiece);
  // Évite d'appliquer deux fois le rendu « appareil photo ».
  piece.material.toneMapped = false;
  // Le sol de la photo est à -hauteur : on le ramène au niveau du sol réel.
  piece.position.y = place.hauteurPrise - 0.01;
  piece.rotation.y = place.rotation;
  piece.name = 'piece';
  scene.add(piece);
  scene.background = null;
}
