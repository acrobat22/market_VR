# Faire son marché (WebXR)

Jeu de **courses au marché** en réalité virtuelle, pensé pour les
**personnes âgées**, qui fonctionne dans le navigateur du **Meta Quest 3**,
sans installation.

- On joue **assis** devant un étal, avec un seul geste : le **pincement**.
- Une **liste de courses** est tirée au hasard ; on remplit son panier.
- Aucun chrono, aucune erreur possible ; texte en grand, sons doux.

Le contexte complet, les décisions et l'état d'avancement sont dans
[CONTEXTE.md](CONTEXTE.md).

## État d'avancement

| Étape | Contenu | État |
|---|---|---|
| 1 | Socle (projet, modules communs, tirage de la liste) | ✅ |
| 2 | Décor : place tirée au hasard parmi 5, étal garni d'objets photographiés | ✅ à valider |
| 3 | Jeu : ardoise, saisie, panier, articles cochés, réussite | en cours : saisie et retour à la place faits |

## Structure

```
index.html                 Page d'accueil et bouton « Entrer en réalité virtuelle »
styles/accueil.css         Styles de la page (contraste ≥ 7:1)
serveur.py                 Serveur local sans cache
vendor/three/              Three.js 0.186.1 (copie locale, licence MIT)
vendor/webxr-input-profiles/  Modèles 3D des mains (licence MIT)
ressources/modeles/        Modèles 3D photographiés, glTF 1k (Poly Haven, CC0)
ressources/textures/       Bois « rough_wood », toile « rough_linen » (Poly Haven, CC0)
ressources/environnements/ 5 places 360° : Dresde, Ulm, Venise, Fürstenstein, Rome (Poly Haven, CC0)
src/
  main.js                  Crée les modules et les relie
  config.js                Tous les réglages ajustables
  coeur/scene.js           Scène, caméra, rendu, soleil voilé, lumière de secours
  coeur/ambiance.js        Place photographiée (sol projeté + éclairage HDR)
  coeur/choixPlace.js      Logique pure : choix de la place (au hasard, jamais deux fois de suite)
  coeur/sessionXR.js       Démarrage et fin de la session WebXR
  coeur/qualiteAdaptative.js       Logique pure : baisse la qualité si l'affichage ralentit
  entrees/                 Mains, détecteur de pincement, souris (repris de « construction »)
  interface/               Sons, bouton 3D, icônes, mode sans casque (repris)
  marche/articles.js       Les 12 articles vendus et leurs modèles 3D
  marche/modeles3D.js      Chargement des modèles (tentatives, éléments séparables)
  marche/matieres.js       Bois et toile réalistes, préchargés
  marche/etal.js           L'étal : comptoir, auvent, cagettes, corbeilles, panier, décor
  marche/ombreContact.js   Ombre douce au pied des objets
  jeu/listeCourses.js      Logique pure : tirage de la liste au hasard
  jeu/saisie.js            Saisie et déplacement des objets par pincement (repris de « construction »)
  jeu/exemplaire.js        Article saisissable : survol, retour en douceur à sa place
  jeu/mouvement.js         Logique pure : adoucissement et interpolation des mouvements
tests/                     Tests des fonctions pures (node --test)
```

## Lancer le projet en local

```sh
python3 serveur.py          # port 8000 (ou : python3 serveur.py 8080)
```

Ouvrir ensuite <http://localhost:8000>. Pour tester sur le Quest :
`adb reverse tcp:8000 tcp:8000`, puis <http://localhost:8000> dans le
navigateur du casque (suivi des mains activé).

Une place différente est affichée à chaque chargement. Pour en imposer une
(réglages de `hauteurPrise` et `rotation` dans `src/config.js`), ajouter
`?place=` à l'adresse : `dresde`, `ulm`, `venise`, `furstenstein` ou `rome`,
par exemple <http://localhost:8000/?place=venise>.

## Tests

```sh
node --test
```

## Licences

- Code : [MIT](LICENSE).
- Three.js et modèles des mains : MIT (voir `vendor/`).
- Modèles 3D, textures et places 360° : [Poly Haven](https://polyhaven.com/license), CC0 (domaine public).
