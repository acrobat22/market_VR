/**
 * @file Chargement des modèles 3D photographiés (glTF, Poly Haven, CC0).
 *
 * Chaque modèle est chargé une seule fois ; les exemplaires posés dans la
 * scène sont des copies qui partagent la géométrie et les textures (peu de
 * mémoire, même pour une cagette pleine).
 */

import { Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Nombre de tentatives de chargement d'un modèle avant d'abandonner. */
const TENTATIVES = 3;

/** Délai avant une nouvelle tentative (multiplié par le numéro d'essai), en ms. */
const DELAI_REPRISE = 400;

/**
 * Bibliothèque de modèles prêts à être copiés.
 */
export class BibliothequeModeles {
  /**
   * @param {string} dossier - Dossier des modèles (ex. « ./ressources/modeles/ »).
   */
  constructor(dossier) {
    this.dossier = dossier;
    this.chargeur = new GLTFLoader();
    /** @type {Map<string, import('three').Object3D>} Modèles chargés, par nom. */
    this.modeles = new Map();
  }

  /**
   * Charge des modèles (en parallèle). Un modèle introuvable est signalé
   * dans la console et ignoré : le reste du marché s'affiche quand même.
   *
   * @param {string[]} noms - Noms des dossiers de modèles.
   * @returns {Promise<void>}
   */
  async charger(noms) {
    await Promise.all(noms.map(async (nom) => {
      try {
        const gltf = await this.#chargerAvecReprises(`${this.dossier}${nom}/${nom}.gltf`);
        gltf.scene.traverse((objet) => {
          if (objet.isMesh) {
            objet.castShadow = true;
            objet.receiveShadow = true;
          }
        });
        this.modeles.set(nom, gltf.scene);
      } catch (erreur) {
        console.error(`[BibliothequeModeles] Modèle « ${nom} » non chargé :`, erreur);
      }
    }));
  }

  /**
   * Charge un fichier glTF, en réessayant après un court délai en cas d'échec
   * (connexion Wi-Fi capricieuse, serveur momentanément occupé).
   *
   * @param {string} url - Adresse du fichier glTF.
   * @returns {Promise<import('three/addons/loaders/GLTFLoader.js').GLTF>}
   */
  async #chargerAvecReprises(url) {
    let derniereErreur;
    for (let essai = 1; essai <= TENTATIVES; essai++) {
      try {
        return await this.chargeur.loadAsync(url);
      } catch (erreur) {
        derniereErreur = erreur;
        await new Promise((resoudre) => setTimeout(resoudre, DELAI_REPRISE * essai));
      }
    }
    throw derniereErreur;
  }

  /**
   * Crée un exemplaire d'un modèle (géométrie et textures partagées).
   *
   * Certains modèles sont des compositions (un tas de poires, trois petits
   * pains, un panier et son couvercle posé à côté) : `nomElement` permet de
   * n'en prendre qu'un élément, recentré à l'origine.
   *
   * @param {string} nom - Nom du modèle.
   * @param {string} [nomElement] - Nom d'un élément du modèle (sinon, le modèle entier).
   * @returns {import('three').Object3D | null} Copie, ou `null` si le modèle (ou l'élément) n'existe pas.
   */
  creer(nom, nomElement) {
    const modele = this.modeles.get(nom);
    if (!modele) {
      return null;
    }
    if (!nomElement) {
      return modele.clone(true);
    }
    const element = modele.getObjectByName(nomElement);
    if (!element) {
      console.error(`[BibliothequeModeles] Élément « ${nomElement} » absent du modèle « ${nom} ».`);
      return null;
    }
    // L'élément est placé dans un groupe, sans son décalage d'origine.
    const copie = element.clone(true);
    copie.position.set(0, 0, 0);
    const groupe = new Group();
    groupe.add(copie);
    return groupe;
  }
}
