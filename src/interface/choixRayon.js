/**
 * @file Choix de l'étal sur la page d'accueil : une grande carte à bouton
 * radio par rayon. Un rayon pas encore prêt est affiché « Bientôt », non
 * sélectionnable.
 */

/** Nom du groupe de boutons radio. */
const NOM_GROUPE = 'rayon';

/**
 * Affiche les cartes des rayons et coche le premier rayon disponible.
 *
 * @param {HTMLElement} conteneur - Élément qui reçoit les cartes.
 * @param {readonly import('../marche/rayons.js').Rayon[]} rayons - Rayons du marché.
 */
export function afficherChoixRayon(conteneur, rayons) {
  const premierDisponible = rayons.find((rayon) => rayon.disponible);
  conteneur.replaceChildren(...rayons.map((rayon) => {
    const carte = document.createElement('label');
    carte.className = 'carte-modele';

    const choix = document.createElement('input');
    choix.type = 'radio';
    choix.name = NOM_GROUPE;
    choix.value = rayon.id;
    choix.className = 'visuellement-cache';
    choix.checked = rayon === premierDisponible;
    choix.disabled = !rayon.disponible;

    const nom = document.createElement('span');
    nom.className = 'carte-modele-nom';
    nom.textContent = rayon.nom;
    carte.append(choix, nom);

    if (!rayon.disponible) {
      const mention = document.createElement('span');
      mention.id = `bientot-${rayon.id}`;
      mention.className = 'carte-modele-pieces';
      mention.textContent = 'Bientôt';
      choix.setAttribute('aria-describedby', mention.id);
      carte.append(mention);
    }
    return carte;
  }));
}

/**
 * Rayon actuellement coché.
 *
 * @param {HTMLElement} conteneur - Élément qui contient les cartes.
 * @returns {string | null} Identifiant du rayon, ou `null` si aucun n'est coché.
 */
export function rayonChoisi(conteneur) {
  return conteneur.querySelector(`input[name="${NOM_GROUPE}"]:checked`)?.value ?? null;
}
