/**
 * @file Tests des sons doux, avec un faux contexte Web Audio (aucun son réel).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Sons } from '../src/interface/sons.js';

/** Réglages de test. */
const REGLAGES = { volume: 0.3 };

/**
 * Faux paramètre audio : enregistre les valeurs programmées.
 *
 * @returns {object}
 */
function creerParametre() {
  return {
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  };
}

/**
 * Faux contexte Web Audio qui compte les notes jouées.
 *
 * @returns {{ contexte: object, notes: number[], etat: { reprises: number } }}
 */
function creerFauxContexte() {
  const notes = [];
  const etat = { reprises: 0 };
  const noeud = () => ({ connect() { return this; }, gain: creerParametre(), frequency: creerParametre() });
  const contexte = {
    currentTime: 0,
    state: 'suspended',
    destination: {},
    resume() {
      etat.reprises++;
      this.state = 'running';
      return Promise.resolve();
    },
    createGain: noeud,
    createBiquadFilter: () => ({ ...noeud(), type: 'lowpass', Q: creerParametre() }),
    createOscillator() {
      const oscillateur = {
        ...noeud(),
        type: 'sine',
        start() { notes.push(oscillateur.frequency.value); },
        stop() {},
      };
      oscillateur.frequency.setValueAtTime = (valeur) => { oscillateur.frequency.value = valeur; };
      return oscillateur;
    },
  };
  return { contexte, notes, etat };
}

test('aucun contexte audio n’est créé avant le premier geste', () => {
  let creations = 0;
  const sons = new Sons(REGLAGES, () => { creations++; return creerFauxContexte().contexte; });
  sons.jouerSaisie();
  assert.equal(creations, 0);
});

test('le premier geste crée et réveille le contexte audio', () => {
  const faux = creerFauxContexte();
  const sons = new Sons(REGLAGES, () => faux.contexte);
  sons.reveiller();
  assert.equal(faux.etat.reprises, 1);
  sons.jouerSaisie();
  assert.ok(faux.notes.length >= 1);
});

test('chaque événement joue au moins une note', () => {
  const faux = creerFauxContexte();
  const sons = new Sons(REGLAGES, () => faux.contexte);
  sons.reveiller();
  sons.jouerSaisie();
  const apresSaisie = faux.notes.length;
  sons.jouerAccrochage();
  const apresAccrochage = faux.notes.length;
  sons.jouerReussite();
  assert.ok(apresSaisie >= 1);
  assert.ok(apresAccrochage > apresSaisie);
  // La mélodie de réussite compte plusieurs notes montantes.
  const melodie = faux.notes.slice(apresAccrochage);
  assert.ok(melodie.length >= 3);
  assert.deepEqual([...melodie].sort((a, b) => a - b), melodie);
});

test('les sons coupés ne jouent rien', () => {
  const faux = creerFauxContexte();
  const sons = new Sons(REGLAGES, () => faux.contexte);
  sons.reveiller();
  sons.definirActifs(false);
  sons.jouerSaisie();
  sons.jouerAccrochage();
  sons.jouerReussite();
  assert.equal(faux.notes.length, 0);
  sons.definirActifs(true);
  sons.jouerSaisie();
  assert.ok(faux.notes.length >= 1);
});

test('aucune note n’est trop aiguë (confort auditif)', () => {
  const faux = creerFauxContexte();
  const sons = new Sons(REGLAGES, () => faux.contexte);
  sons.reveiller();
  sons.jouerSaisie();
  sons.jouerAccrochage();
  sons.jouerReussite();
  assert.ok(faux.notes.every((frequence) => frequence <= 1000), faux.notes.join(', '));
});

test('sans Web Audio dans le navigateur, le jeu continue sans son', () => {
  const sons = new Sons(REGLAGES, () => { throw new Error('Web Audio indisponible'); });
  assert.doesNotThrow(() => {
    sons.reveiller();
    sons.jouerReussite();
  });
});
