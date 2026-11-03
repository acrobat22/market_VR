/**
 * @file Point d'entrée : crée les modules et les relie entre eux.
 *
 * C'est le seul endroit qui connaît tous les modules (inversion des
 * dépendances) : chaque module reçoit ici ce dont il a besoin.
 *
 * Une liste (articles et quantités) est tirée au hasard et écrite sur
 * l'ardoise ; on prend les articles de l'étal (pincement ou souris). Lâché dans
 * le panier, un article de la liste y reste ; sinon, il retourne à sa place.
 * Liste complète : mélodie, message, et « Rejouer » pour une nouvelle liste.
 */

import { Box3, Vector3 } from 'three';

import { CONFIG } from './config.js';
import { creerEnvironnement, creerRendu } from './coeur/scene.js';
import { ajouterSolOmbres, chargerAmbiance } from './coeur/ambiance.js';
import { choisirPlace } from './coeur/choixPlace.js';
import { SessionXR } from './coeur/sessionXR.js';
import { ARTICLES } from './marche/articles.js';
import { RAYONS, articlesDuRayon } from './marche/rayons.js';
import { afficherChoixRayon, rayonChoisi } from './interface/choixRayon.js';
import { BibliothequeModeles } from './marche/modeles3D.js';
import { creerMatiere, prechargerMatieres } from './marche/matieres.js';
import { construireEtal } from './marche/etal.js';
import { Ardoise, chargerPoliceCraie } from './marche/ardoise.js';
import { Mains } from './entrees/mains.js';
import { DetecteurPincement } from './entrees/detecteurPincement.js';
import { Souris } from './entrees/souris.js';
import { GestionnaireSaisie } from './jeu/saisie.js';
import { Exemplaire } from './jeu/exemplaire.js';
import { tirerListe, tirerQuantites } from './jeu/listeCourses.js';
import { Partie, libelleLigne } from './jeu/partie.js';
import { Bouton3D } from './interface/bouton3D.js';
import { dessinerFlecheRetour, dessinerLecture } from './interface/icones.js';
import { estAuDessusDuPanier } from './jeu/panier.js';
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

// Choix de l'étal sur l'accueil : changer de rayon regarnit l'étal sur place.
const listeRayons = document.getElementById('liste-rayons');
afficherChoixRayon(listeRayons, RAYONS);

// Modèles 3D communs à tous les étals (contenants et décor). Les textures du
// bois et de la toile sont préchargées en même temps, pour que l'étal
// apparaisse d'un coup, déjà texturé. Les articles sont chargés par rayon.
const bibliotheque = new BibliothequeModeles(CONFIG.dossierModeles);
await Promise.all([
  bibliotheque.charger([
    CONFIG.panier.modele,
    ...CONFIG.etagere.map((element) => element.modele),
    ...CONFIG.decor.map((element) => element.modele),
  ]),
  prechargerMatieres(CONFIG.etal.dossierTextures, [CONFIG.etal.textureBois, CONFIG.etal.textureToile]),
  // Sans la police manuscrite, l'ardoise s'écrit simplement en police système.
  chargerPoliceCraie(CONFIG.ardoise.police).catch((erreur) => {
    console.error('[main] Police de l\'ardoise non chargée, police système utilisée :', erreur);
  }),
]);

// Structure de l'étal, construite une fois ; les cagettes et les articles
// (la « garniture ») changent avec le rayon et à chaque partie.
const etal = construireEtal(CONFIG, bibliotheque);
scene.add(etal.objet3D);
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

const ardoise = new Ardoise(CONFIG.ardoise, creerMatiere({
  dossier: CONFIG.etal.dossierTextures, nom: CONFIG.etal.textureBois, repetitionX: 1, repetitionY: 0.3,
}));
scene.add(ardoise.objet3D);

// Panier : zone où un article lâché compte comme déposé (marge généreuse).
const { centrePanier } = etal;
const boitePanier = etal.panier
  ? new Box3().setFromObject(etal.panier)
  : new Box3().setFromCenterAndSize(centrePanier, new Vector3(0.38, 0.24, 0.3));
const hauteurBordPanier = boitePanier.max.y;
const taillePanier = boitePanier.getSize(new Vector3());
/** @type {import('./jeu/panier.js').ZonePanier} */
const zonePanier = {
  centre: centrePanier,
  demiLargeur: taillePanier.x / 2 + CONFIG.panier.margeDepose,
  demiProfondeur: taillePanier.z / 2 + CONFIG.panier.margeDepose,
  hauteurMaximale: hauteurBordPanier + CONFIG.panier.hauteurDepose,
};

const saisie = new GestionnaireSaisie(CONFIG.saisie);

// État de l'étal en cours : rayon, garniture, articles saisissables, partie.
/** @type {string | null} */
let idRayon = null;
/** @type {import('./marche/etal.js').Garniture | null} */
let garniture = null;
/** @type {Exemplaire[]} */
let exemplaires = [];
/** @type {Partie | null} */
let partie = null;
/** Numéro de la dernière installation demandée (les plus anciennes sont abandonnées). */
let numeroInstallation = 0;

/**
 * Tire une nouvelle liste de courses parmi les articles de l'étal : 4 à 6
 * articles, chacun demandé de 1 à 3 fois (sans dépasser ce qui est exposé, ni
 * la contenance du panier).
 *
 * @returns {Partie}
 */
function tirerPartie() {
  const { tailleMinimale, tailleMaximale, quantiteMaximale } = CONFIG.liste;
  const articlesExposes = [...garniture.emplacements.values()].map((emplacement) => emplacement.article);
  const articles = tirerListe(articlesExposes,
    tailleMinimale + Math.floor(Math.random() * (tailleMaximale - tailleMinimale + 1)));
  return new Partie(tirerQuantites(
    articles,
    (article) => garniture.emplacements.get(article.id)?.exemplaires.length ?? 0,
    { quantiteMaximale, contenancePanier: CONFIG.panier.places.length },
  ));
}

/** Écrit la liste en cours sur l'ardoise (« 2 pommes », coché quand le compte y est). */
function afficherListe() {
  ardoise.afficher(partie.lignes.map((ligne) => ({ texte: libelleLigne(ligne), estCochee: ligne.estCochee })));
}

/**
 * Retire les cagettes et les articles de l'étal, et libère la mémoire
 * graphique des cagettes. Les articles, eux, partagent leurs géométries et
 * leurs textures avec la bibliothèque : on ne les libère pas.
 */
function demonterGarniture() {
  if (!garniture) {
    return;
  }
  for (const exemplaire of exemplaires) {
    saisie.retirerObjet(exemplaire);
    scene.remove(exemplaire.objet3D);
  }
  exemplaires = [];
  scene.remove(garniture.objet3D);
  // Seules les cagettes restent dans la garniture (les articles en ont été sortis).
  garniture.objet3D.traverse((objet) => {
    if (!objet.isMesh) {
      return;
    }
    objet.geometry.dispose();
    for (const matiere of [objet.material].flat()) {
      Object.values(matiere).filter((valeur) => valeur?.isTexture).forEach((texture) => texture.dispose());
      matiere.dispose();
    }
  });
  garniture = null;
}

/**
 * Installe l'étal d'un rayon et commence une partie. Un rayon plus riche que
 * l'étal (les fruits) en montre 10 tirés au hasard, différents à chaque partie.
 *
 * @param {string} rayon - Identifiant du rayon (voir `rayons.js`).
 * @returns {Promise<void>}
 */
async function installerEtal(rayon) {
  const numero = ++numeroInstallation;
  const articlesRayon = articlesDuRayon(ARTICLES, rayon);
  // Tous les modèles du rayon sont chargés une fois pour toutes.
  await bibliotheque.charger(articlesRayon.map((article) => article.modele));
  if (numero !== numeroInstallation) {
    // Un autre rayon a été choisi pendant le chargement.
    return;
  }
  const articles = tirerListe(articlesRayon, Math.min(CONFIG.etal.nombreCagettes, articlesRayon.length));

  demonterGarniture();
  garniture = etal.garnir(articles);
  scene.add(garniture.objet3D);
  // Positions à jour avant de sortir les articles de leurs cagettes.
  scene.updateMatrixWorld();
  exemplaires = [...garniture.emplacements.values()].flatMap(({ article, exemplaires: objets }) =>
    objets.map((objet) => new Exemplaire(objet, article.id, scene, CONFIG.saisie)));
  for (const exemplaire of exemplaires) {
    saisie.ajouterObjet(exemplaire);
  }

  idRayon = rayon;
  partie = tirerPartie();
  afficherListe();
  afficherBoutonsFinDePartie(false);
}

/**
 * Lâché au-dessus du panier, un article de la liste y entre et se coche ;
 * sinon (hors liste, déjà coché, ou lâché ailleurs), il retourne à sa place.
 *
 * @param {Exemplaire} exemplaire - Article qui vient d'être lâché.
 */
function surArticleLache(exemplaire) {
  const centre = new Box3().setFromObject(exemplaire.objet3D).getCenter(new Vector3());
  if (!estAuDessusDuPanier(centre, zonePanier) || !partie.deposer(exemplaire.idArticle)) {
    exemplaire.renvoyer(tempsCourant);
    return;
  }
  const { places } = CONFIG.panier;
  const place = places[(partie.nombreDeposes - 1) % places.length];
  const appui = new Vector3(
    centrePanier.x + place.x,
    centrePanier.y + CONFIG.panier.epaisseurFond + place.y,
    centrePanier.z + place.z,
  );
  exemplaire.estDansPanier = true;
  exemplaire.deplacerVers(exemplaire.positionPourPoserSur(appui), tempsCourant);
  if (partie.estTerminee) {
    // Liste complète : mélodie, félicitations, « Rejouer » et « Accueil ».
    sons.jouerReussite();
    ardoise.afficherMessage('Bravo !', [
      'Pincez « Rejouer » pour une nouvelle liste,',
      'ou « Accueil » pour changer d’étal.',
    ]);
    afficherBoutonsFinDePartie(true);
  } else {
    sons.jouerAccrochage();
    afficherListe();
  }
}

// « Rejouer » et « Accueil » : n'apparaissent qu'une fois la liste complète,
// côte à côte au-dessus du panier.
const boutonRejouer = new Bouton3D(CONFIG.bouton, {
  libelle: 'Rejouer',
  dessinerIcone: dessinerLecture,
  surAppui: () => commencerNouvellePartie(),
});
const boutonAccueil = new Bouton3D(CONFIG.bouton, {
  libelle: 'Accueil',
  dessinerIcone: dessinerFlecheRetour,
  surAppui: () => revenirAAccueil(),
});
const boutonsFinDePartie = [boutonRejouer, boutonAccueil];
const decalageBouton = (CONFIG.bouton.largeur + CONFIG.bouton.ecartEntreBoutons) / 2;
boutonsFinDePartie.forEach((bouton, indice) => {
  const sens = indice === 0 ? -1 : 1;
  bouton.objet3D.position.set(
    centrePanier.x + sens * decalageBouton,
    hauteurBordPanier + CONFIG.bouton.hauteurAuDessusPanier,
    centrePanier.z,
  );
  bouton.objet3D.visible = false;
  scene.add(bouton.objet3D);
});

/**
 * Affiche ou cache les boutons de fin de partie.
 *
 * @param {boolean} estVisible
 */
function afficherBoutonsFinDePartie(estVisible) {
  for (const bouton of boutonsFinDePartie) {
    bouton.objet3D.visible = estVisible;
  }
}

/**
 * Retour à la page d'accueil : en VR, la session est fermée ; sans casque, le
 * mode souris est quitté. Dans les deux cas, une nouvelle partie se prépare
 * (écouteur « sessionend » ou retour du mode sans casque).
 */
function revenirAAccueil() {
  if (renderer.xr.isPresenting) {
    sessionXR.terminer();
  } else {
    modeSansCasque.desactiver();
  }
}

/** Nouvelle partie sur le même étal : il est regarni, et une nouvelle liste est tirée. */
function commencerNouvellePartie() {
  installerEtal(idRayon).catch((erreur) => console.error('[main] Nouvelle partie impossible :', erreur));
}

// Changer de rayon sur l'accueil regarnit l'étal aussitôt.
listeRayons.addEventListener('change', () => {
  installerEtal(rayonChoisi(listeRayons)).catch((erreur) => {
    console.error('[main] Changement d\'étal impossible :', erreur);
  });
});
await installerEtal(rayonChoisi(listeRayons));

/**
 * Réactions aux pincements, partagées par les mains (VR) et la souris (sans casque).
 * @type {import('./entrees/mains.js').EcouteursPincement}
 */
const ecouteursPincement = {
  surDebutPincement: (cote, point, options) => {
    // Un pincement sur un bouton de fin de partie (s'il est affiché) l'active ;
    // ailleurs, il saisit un article.
    const boutonVise = boutonsFinDePartie.find((bouton) => bouton.objet3D.visible && bouton.estVise(point));
    if (boutonVise) {
      boutonVise.appuyer(tempsCourant);
      sons.jouerSaisie();
    } else if (saisie.saisir(cote, point, options)) {
      sons.jouerSaisie();
    }
  },
  surFinPincement: (cote) => {
    const exemplaire = saisie.relacher(cote);
    if (exemplaire) {
      // Pendant son déplacement, l'article ne peut pas être repris.
      saisie.retirerObjet(exemplaire);
      surArticleLache(exemplaire);
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
  // Pas de plan de glissement : l'article tenu suit la surface sous le curseur
  // (cagettes, comptoir, fond du panier), à sa vraie distance. Au-dessus du
  // panier, il est donc vraiment au-dessus du panier.
  hauteurCible: () => null,
  reglages: CONFIG.souris,
});

const modeSansCasque = new ModeSansCasque({
  panneauAccueil: document.querySelector('.panneau'),
  barreAide: document.getElementById('barre-aide'),
  boutonEssayer: document.getElementById('bouton-souris'),
  boutonRetour: document.getElementById('bouton-retour'),
}, souris, () => commencerNouvellePartie());

const sessionXR = new SessionXR({
  renderer,
  bouton: document.getElementById('bouton-vr'),
  zoneMessage,
  reglages: CONFIG.session,
});
sessionXR.initialiser();
// En VR, ce sont les mains qui comptent : la souris est mise de côté.
renderer.xr.addEventListener('sessionstart', () => modeSansCasque.desactiver());
// Retour à l'accueil après la VR : la prochaine partie repart de zéro.
renderer.xr.addEventListener('sessionend', () => commencerNouvellePartie());

// Boucle de rendu : `setAnimationLoop` est obligatoire en WebXR
// (elle suit la fréquence d'affichage du casque).
renderer.setAnimationLoop((temps) => {
  tempsCourant = temps;
  mains.mettreAJour();
  souris.mettreAJour();
  const pointsDePincement = new Map([...mains.pointsDePincement, ...souris.pointsDePincement]);
  saisie.mettreAJour(pointsDePincement);
  for (const bouton of boutonsFinDePartie) {
    bouton.mettreAJour(pointsDePincement, temps);
  }
  for (const exemplaire of exemplaires) {
    // Revenu à sa place : l'article peut de nouveau être pris. Dans le panier, il y reste.
    if (exemplaire.mettreAJour(temps) && !exemplaire.estDansPanier) {
      saisie.ajouterObjet(exemplaire);
    }
  }
  renderer.render(scene, camera);
});
