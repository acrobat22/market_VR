/**
 * @file Point d'entrée : crée les modules et les relie entre eux.
 *
 * C'est le seul endroit qui connaît tous les modules (inversion des
 * dépendances) : chaque module reçoit ici ce dont il a besoin.
 *
 * Étape 3 (en cours) : on prend les articles de l'étal (pincement ou
 * souris) ; lâché, un article retourne doucement à sa place.
 */

import { Box3 } from 'three';

import { CONFIG } from './config.js';
import { creerEnvironnement, creerRendu } from './coeur/scene.js';
import { ajouterSolOmbres, chargerAmbiance } from './coeur/ambiance.js';
import { choisirPlace } from './coeur/choixPlace.js';
import { SessionXR } from './coeur/sessionXR.js';
import { ARTICLES } from './marche/articles.js';
import { BibliothequeModeles } from './marche/modeles3D.js';
import { prechargerMatieres } from './marche/matieres.js';
import { construireEtal } from './marche/etal.js';
import { Mains } from './entrees/mains.js';
import { DetecteurPincement } from './entrees/detecteurPincement.js';
import { Souris } from './entrees/souris.js';
import { GestionnaireSaisie } from './jeu/saisie.js';
import { Exemplaire } from './jeu/exemplaire.js';
import { ModeSansCasque } from './interface/modeSansCasque.js';
import { Sons } from './interface/sons.js';

const zoneMessage = document.getElementById('message-statut');

const { scene, camera } = creerEnvironnement(CONFIG);
const renderer = creerRendu(document.getElementById('scene'), camera);
ajouterSolOmbres(scene, CONFIG.ambiance);

/**
 * Lit la dernière place affichée, retenue par le navigateur.
 * La mémoire du navigateur peut être indisponible (navigation privée,
 * données bloquées) : on renvoie alors `null` (simple tirage au hasard).
 *
 * @returns {?string} Nom de la dernière place, ou `null`.
 */
function lireDernierePlace() {
  try {
    return localStorage.getItem(CONFIG.ambiance.cleDernierePlace);
  } catch {
    return null;
  }
}

/**
 * Retient la place affichée, pour en changer au prochain chargement.
 * Sans mémoire du navigateur, on ne retient rien (sans conséquence).
 *
 * @param {string} nom - Nom de la place affichée.
 */
function retenirPlace(nom) {
  try {
    localStorage.setItem(CONFIG.ambiance.cleDernierePlace, nom);
  } catch {
    // Mémoire indisponible : le prochain tirage pourra redonner cette place.
  }
}

// Une place différente à chaque chargement ; `?place=<nom>` en impose une.
const place = choisirPlace(CONFIG.ambiance.places, {
  nomDemande: new URLSearchParams(location.search).get('place'),
  nomPrecedent: lireDernierePlace(),
});
retenirPlace(place.nom);

/**
 * Charge la place photographiée, avec quelques nouvelles tentatives en cas
 * d'échec. Le marché reste visible sans elle (lumière d'ambiance de secours).
 *
 * @param {number} [tentativesRestantes=3] - Nombre d'essais.
 * @returns {Promise<void>}
 */
async function chargerPlace(tentativesRestantes = 3) {
  try {
    await chargerAmbiance(scene, CONFIG.ambiance, place);
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
// Positions à jour avant de sortir les articles de leurs cagettes.
scene.updateMatrixWorld();

// Sons doux : le contexte audio est réveillé au premier clic sur la page
// (exigence des navigateurs), et la case « Sons doux » les active ou les coupe.
const sons = new Sons(CONFIG.sons);
const caseSons = document.getElementById('case-sons');
sons.definirActifs(caseSons.checked);
const boutonEcouter = document.getElementById('bouton-ecouter');
caseSons.addEventListener('change', () => {
  sons.definirActifs(caseSons.checked);
  // « Écouter » n'a de sens que si les sons sont activés.
  boutonEcouter.disabled = !caseSons.checked;
  sons.reveiller();
});
boutonEcouter.disabled = !caseSons.checked;
// Fait entendre la mélodie de réussite pour régler le volume avant la VR.
boutonEcouter.addEventListener('click', () => {
  sons.reveiller();
  sons.jouerReussite();
});
document.addEventListener('click', () => sons.reveiller());

// Temps de la dernière image, utilisé lors des pincements.
let tempsCourant = 0;

// Hauteur du bord du panier : à la souris, l'article tenu glisse au-dessus.
const hauteurBordPanier = etal.panier
  ? new Box3().setFromObject(etal.panier).max.y
  : etal.centrePanier.y;
/** Hauteur du plan de glissement de la souris, fixée à chaque prise. */
let hauteurGlissement = hauteurBordPanier + CONFIG.souris.hauteurLevee;

// Chaque fruit ou pain de l'étal devient saisissable.
const saisie = new GestionnaireSaisie(CONFIG.saisie);
const exemplaires = [...etal.emplacements.values()].flatMap(({ article, exemplaires: objets }) =>
  objets.map((objet) => new Exemplaire(objet, article.id, scene, CONFIG.saisie)));
for (const exemplaire of exemplaires) {
  saisie.ajouterObjet(exemplaire);
}

/**
 * Réactions aux pincements, partagées par les mains (VR) et la souris (sans casque).
 * @type {import('./entrees/mains.js').EcouteursPincement}
 */
const ecouteursPincement = {
  surDebutPincement: (cote, point, options) => {
    if (saisie.saisir(cote, point, options)) {
      sons.jouerSaisie();
      // À la souris, l'article glisse au-dessus du panier ET de sa cagette :
      // sinon un article posé plus haut que le panier plongerait sous sa cagette.
      const hautArticle = new Box3().setFromObject(saisie.prises.get(cote).objet.objet3D).max.y;
      hauteurGlissement = Math.max(hauteurBordPanier, hautArticle) + CONFIG.souris.hauteurLevee;
    }
  },
  surFinPincement: (cote) => {
    const exemplaire = saisie.relacher(cote);
    if (exemplaire) {
      // Pendant son retour, l'article ne peut pas être repris.
      saisie.retirerObjet(exemplaire);
      exemplaire.renvoyer(tempsCourant);
    }
  },
};

const mains = new Mains(
  renderer,
  scene,
  CONFIG.mains,
  () => new DetecteurPincement(CONFIG.mains.pincement),
  ecouteursPincement,
);

const souris = new Souris({
  canevas: renderer.domElement,
  camera,
  scene,
  objetsTenus: () => saisie.objetsTenus(),
  ecouteurs: ecouteursPincement,
  hauteurCible: () => hauteurGlissement,
  reglages: CONFIG.souris,
});

const modeSansCasque = new ModeSansCasque({
  panneauAccueil: document.querySelector('.panneau'),
  barreAide: document.getElementById('barre-aide'),
  boutonEssayer: document.getElementById('bouton-souris'),
  boutonRetour: document.getElementById('bouton-retour'),
}, souris);

const sessionXR = new SessionXR({
  renderer,
  bouton: document.getElementById('bouton-vr'),
  zoneMessage,
  reglages: CONFIG.session,
});
sessionXR.initialiser();
// En VR, ce sont les mains qui comptent : la souris est mise de côté.
renderer.xr.addEventListener('sessionstart', () => modeSansCasque.desactiver());

// Boucle de rendu : `setAnimationLoop` est obligatoire en WebXR
// (elle suit la fréquence d'affichage du casque).
renderer.setAnimationLoop((temps) => {
  tempsCourant = temps;
  mains.mettreAJour();
  souris.mettreAJour();
  const pointsDePincement = new Map([...mains.pointsDePincement, ...souris.pointsDePincement]);
  saisie.mettreAJour(pointsDePincement);
  for (const exemplaire of exemplaires) {
    // Revenu à sa place : l'article peut de nouveau être pris.
    if (exemplaire.mettreAJour(temps)) {
      saisie.ajouterObjet(exemplaire);
    }
  }
  renderer.render(scene, camera);
});
