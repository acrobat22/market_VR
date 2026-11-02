/**
 * @file Choix de l'étal sur la page d'accueil : une grande carte à bouton
 * radio par rayon.
 */

/** Nom du groupe de boutons radio. */
const NOM_GROUPE = 'rayon';

/**
 * Affiche les cartes des rayons et coche le premier.
 *
 * @param {HTMLElement} conteneur - Élément qui reçoit les cartes.
 * @param {readonly import('../marche/rayons.js').Rayon[]} rayons - Rayons du marché.
 */
export function afficherChoixRayon(conteneur, rayons) {
  conteneur.replaceChildren(...rayons.map((rayon) => {
    const carte = document.createElement('label');
    carte.className = 'carte-modele';

    const choix = document.createElement('input');
    choix.type = 'radio';
    choix.name = NOM_GROUPE;
    choix.value = rayon.id;
    choix.className = 'visuellement-cache';
    choix.checked = rayon === rayons[0];

    const nom = document.createElement('span');
    nom.className = 'carte-modele-nom';
    nom.textContent = rayon.nom;
    carte.append(choix, nom);
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
