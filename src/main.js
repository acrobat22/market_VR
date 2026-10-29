/**
 * @file Point d'entrée : crée les modules et les relie entre eux.
 *
 * C'est le seul endroit qui connaît tous les modules (inversion des
 * dépendances) : chaque module reçoit ici ce dont il a besoin.
 *
 * Étape 2 : le décor (place, étal garni). Le jeu viendra à l'étape 3.
 */

import { CONFIG } from './config.js';
import { creerEnvironnement, creerRendu } from './coeur/scene.js';
import { ajouterSolOmbres, chargerAmbiance } from './coeur/ambiance.js';
import { SessionXR } from './coeur/sessionXR.js';
import { ARTICLES } from './marche/articles.js';
import { BibliothequeModeles } from './marche/modeles3D.js';
import { prechargerMatieres } from './marche/matieres.js';
import { construireEtal } from './marche/etal.js';

const zoneMessage = document.getElementById('message-statut');

const { scene, camera } = creerEnvironnement(CONFIG);
const renderer = creerRendu(document.getElementById('scene'), camera);
ajouterSolOmbres(scene, CONFIG.ambiance);

/**
 * Charge la place photographiée, avec quelques nouvelles tentatives en cas
 * d'échec. Le marché reste visible sans elle (lumière d'ambiance de secours).
 *
 * @param {number} [tentativesRestantes=3] - Nombre d'essais.
 * @returns {Promise<void>}
 */
async function chargerPlace(tentativesRestantes = 3) {
  try {
    await chargerAmbiance(scene, CONFIG.ambiance);
  } catch (erreur) {
    if (tentativesRestantes > 1) {
      await new Promise((resoudre) => setTimeout(resoudre, 500));
      return chargerPlace(tentativesRestantes - 1);
    }
    console.error('[main] Chargement de la place impossible :', erreur);
  }
}
chargerPlace();

// Tous les modèles 3D nécessaires : articles, contenants et décor.
// Les textures du bois et de la toile sont préchargées en même temps, pour
// que l'étal apparaisse d'un coup, déjà texturé.
const bibliotheque = new BibliothequeModeles(CONFIG.dossierModeles);
await Promise.all([
  bibliotheque.charger([...new Set([
    ...ARTICLES.map((article) => article.modele),
    CONFIG.panier.modele,
    CONFIG.corbeille.modele,
    ...CONFIG.etagere.map((element) => element.modele),
    ...CONFIG.decor.map((element) => element.modele),
  ])]),
  prechargerMatieres(CONFIG.etal.dossierTextures, [CONFIG.etal.textureBois, CONFIG.etal.textureToile]),
]);

const etal = construireEtal(CONFIG, bibliotheque);
scene.add(etal.objet3D);

const sessionXR = new SessionXR({
  renderer,
  bouton: document.getElementById('bouton-vr'),
  zoneMessage,
  reglages: CONFIG.session,
});
sessionXR.initialiser();

// Boucle de rendu : `setAnimationLoop` est obligatoire en WebXR.
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
