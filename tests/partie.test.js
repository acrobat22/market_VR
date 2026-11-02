/**
 * @file Tests de la partie (quantités cochées au fil des dépôts), du tirage
 * des quantités et du panier.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Partie, libelleLigne } from '../src/jeu/partie.js';
import { estAuDessusDuPanier } from '../src/jeu/panier.js';
import { tirerQuantites } from '../src/jeu/listeCourses.js';

const POMME = { id: 'pomme', singulier: 'pomme', pluriel: 'pommes' };
const KIWI = { id: 'kiwi', singulier: 'kiwi', pluriel: 'kiwis' };
const OIGNON = { id: 'oignon', singulier: 'oignon', pluriel: 'oignons' };

/** Liste type : 2 pommes, 1 kiwi, 3 oignons. */
const COMMANDES = [
  { article: POMME, quantite: 2 },
  { article: KIWI, quantite: 1 },
  { article: OIGNON, quantite: 3 },
];

test('une nouvelle partie n’a rien de coché', () => {
  const partie = new Partie(COMMANDES);
  assert.equal(partie.nombreDeposes, 0);
  assert.equal(partie.estTerminee, false);
  assert.ok(partie.lignes.every((ligne) => !ligne.estCochee && ligne.deposes === 0));
});

test('un article demandé une fois est coché dès le premier dépôt', () => {
  const partie = new Partie(COMMANDES);
  assert.equal(partie.deposer('kiwi'), true);
  assert.equal(partie.lignes[1].estCochee, true);
  assert.equal(partie.nombreDeposes, 1);
});

test('un article demandé deux fois n’est coché qu’au second dépôt', () => {
  const partie = new Partie(COMMANDES);
  assert.equal(partie.deposer('pomme'), true);
  assert.equal(partie.lignes[0].estCochee, false);
  assert.equal(partie.deposer('pomme'), true);
  assert.equal(partie.lignes[0].estCochee, true);
});

test('un exemplaire de trop est refusé', () => {
  const partie = new Partie(COMMANDES);
  partie.deposer('kiwi');
  assert.equal(partie.deposer('kiwi'), false);
  assert.equal(partie.nombreDeposes, 1);
});

test('un article hors liste est refusé', () => {
  const partie = new Partie(COMMANDES);
  assert.equal(partie.deposer('citron'), false);
  assert.equal(partie.nombreDeposes, 0);
});

test('la partie est terminée quand toutes les quantités sont dans le panier', () => {
  const partie = new Partie(COMMANDES);
  ['pomme', 'pomme', 'kiwi', 'oignon', 'oignon'].forEach((id) => partie.deposer(id));
  assert.equal(partie.estTerminee, false);
  partie.deposer('oignon');
  assert.equal(partie.estTerminee, true);
});

test('la liste reçue n’est pas modifiée', () => {
  const copie = structuredClone(COMMANDES);
  new Partie(COMMANDES).deposer('pomme');
  assert.deepEqual(COMMANDES, copie);
});

test('l’ardoise écrit « 1 kiwi » au singulier et « 2 pommes » au pluriel', () => {
  const partie = new Partie(COMMANDES);
  assert.equal(libelleLigne(partie.lignes[1]), '1 kiwi');
  assert.equal(libelleLigne(partie.lignes[0]), '2 pommes');
});

test('une ligne entamée indique ce qu’il reste à prendre', () => {
  const partie = new Partie(COMMANDES);
  partie.deposer('oignon');
  assert.equal(libelleLigne(partie.lignes[2]), '3 oignons (encore 2)');
  partie.deposer('oignon');
  partie.deposer('oignon');
  assert.equal(libelleLigne(partie.lignes[2]), '3 oignons');
});

/** Générateur pseudo-aléatoire reproductible (pour des tests stables). */
function generateur(graine) {
  let etat = graine;
  return () => {
    etat = (etat * 1664525 + 1013904223) % 4294967296;
    return etat / 4294967296;
  };
}

const REGLAGES_QUANTITES = { quantiteMaximale: 3, contenancePanier: 12 };

test('chaque quantité tirée est comprise entre 1 et 3', () => {
  const hasard = generateur(5);
  for (let tirage = 0; tirage < 100; tirage++) {
    for (const { quantite } of tirerQuantites([POMME, KIWI, OIGNON], () => 9, REGLAGES_QUANTITES, hasard)) {
      assert.ok(quantite >= 1 && quantite <= 3, `quantité ${quantite}`);
    }
  }
});

test('une quantité ne dépasse jamais le stock de l’étal', () => {
  const hasard = generateur(6);
  for (let tirage = 0; tirage < 100; tirage++) {
    const [commande] = tirerQuantites([POMME], () => 1, REGLAGES_QUANTITES, hasard);
    assert.equal(commande.quantite, 1);
  }
});

test('le total ne dépasse jamais la contenance du panier', () => {
  const articles = [POMME, KIWI, OIGNON, { id: 'a' }, { id: 'b' }, { id: 'c' }];
  const toujoursTrois = () => 0.99;
  const commandes = tirerQuantites(articles, () => 9, { quantiteMaximale: 3, contenancePanier: 10 }, toujoursTrois);
  assert.equal(commandes.reduce((somme, commande) => somme + commande.quantite, 0), 10);
  assert.ok(commandes.every((commande) => commande.quantite >= 1));
});

// Valeurs exactes en binaire, pour tester le bord sans erreur d'arrondi.
const ZONE = { centre: { x: 0, z: -0.5 }, demiLargeur: 0.25, demiProfondeur: 0.125, hauteurMaximale: 1.125 };

test('un article lâché au-dessus du panier y tombe', () => {
  assert.equal(estAuDessusDuPanier({ x: 0.05, y: 0.95, z: -0.45 }, ZONE), true);
});

test('le bord de la zone compte encore comme dans le panier', () => {
  assert.equal(estAuDessusDuPanier({ x: 0.25, y: 1.125, z: -0.625 }, ZONE), true);
});

test('un article lâché à côté du panier n’y tombe pas', () => {
  assert.equal(estAuDessusDuPanier({ x: 0.3, y: 0.95, z: -0.5 }, ZONE), false);
  assert.equal(estAuDessusDuPanier({ x: 0, y: 0.95, z: -0.7 }, ZONE), false);
});

test('un article lâché trop haut n’y tombe pas', () => {
  assert.equal(estAuDessusDuPanier({ x: 0, y: 1.3, z: -0.5 }, ZONE), false);
});
