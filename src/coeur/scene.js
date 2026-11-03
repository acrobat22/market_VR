/**
 * @file Création de la scène, de la caméra, du moteur de rendu et de la
 * lumière du jour (ciel couvert, ombres douces sous l'étal).
 *
 * Le rendu des couleurs imite un appareil photo (`NeutralToneMapping`).
 */

import * as THREE from 'three';

/**
 * Crée la scène, la caméra et la lumière du jour.
 *
 * @param {typeof import('../config.js').CONFIG} config - Configuration globale.
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera }}
 */
export function creerEnvironnement(config) {
  const scene = new THREE.Scene();
  // Couleur de secours, remplacée par la photo de la place une fois chargée.
  scene.background = new THREE.Color(config.ambiance.couleurSecours);

  const camera = new THREE.PerspectiveCamera(
    config.camera.champDeVision,
    window.innerWidth / window.innerHeight,
    0.05,
    100,
  );
  // Position utilisée pour l'aperçu hors VR ; en VR, le casque la remplace.
  const { position, visee } = config.camera;
  camera.position.set(position.x, position.y, position.z);
  camera.lookAt(visee.x, visee.y, visee.z);

  scene.add(...creerSoleil(config.soleil, config.etal));
  // Lumière d'ambiance douce, toujours présente : la scène reste lisible même
  // si la photo de la place (qui éclaire aussi) n'a pas pu être chargée.
  scene.add(new THREE.HemisphereLight(config.ciel.couleurHaut, config.ciel.couleurBas, config.ciel.intensite));
  return { scene, camera };
}

/**
 * Crée le moteur de rendu (ombres, rendu photographique), l'insère dans la
 * page et l'adapte à la taille de la fenêtre.
 *
 * @param {HTMLElement} conteneur - Élément de la page qui reçoit le canevas.
 * @param {THREE.PerspectiveCamera} camera - Caméra à réajuster au redimensionnement.
 * @returns {THREE.WebGLRenderer}
 */
export function creerRendu(conteneur, camera) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  // `PCFShadowMap` (par défaut) adoucit les bords selon `shadow.radius`.
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  // Le canevas est un aperçu décoratif : on le décrit pour les lecteurs d'écran.
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Aperçu de la scène : un étal de marché sur une place pavée');
  conteneur.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return renderer;
}

/**
 * Lumière du jour : un « soleil » voilé qui donne des ombres douces, limitées
 * à la zone de l'étal pour ménager le casque.
 *
 * @param {typeof import('../config.js').CONFIG.soleil} reglages - Réglages du soleil.
 * @param {typeof import('../config.js').CONFIG.etal} reglagesEtal - Position de l'étal (cible).
 * @returns {THREE.Object3D[]} Lumière et sa cible, à ajouter à la scène.
 */
function creerSoleil(reglages, reglagesEtal) {
  const soleil = new THREE.DirectionalLight(reglages.couleur, reglages.intensite);
  soleil.position.set(reglages.position.x, reglages.position.y, reglages.position.z);
  soleil.target.position.set(0, reglagesEtal.hauteur, -(reglagesEtal.rayonInterieur + reglagesEtal.rayonExterieur) / 2);
  soleil.castShadow = true;
  const ombre = soleil.shadow;
  ombre.mapSize.set(reglages.resolutionOmbre, reglages.resolutionOmbre);
  ombre.radius = reglages.flouOmbre;
  ombre.camera.left = -reglages.etendueOmbre;
  ombre.camera.right = reglages.etendueOmbre;
  ombre.camera.top = reglages.etendueOmbre;
  ombre.camera.bottom = -reglages.etendueOmbre;
  ombre.camera.near = 0.5;
  ombre.camera.far = 10;
  ombre.bias = -0.0004;
  ombre.normalBias = 0.02;
  return [soleil, soleil.target];
}
