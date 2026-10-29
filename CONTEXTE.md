# CONTEXTE.md — Faire son marché : jeu de courses pour Meta Quest 3 (WebXR)

> Document de reprise de projet. À donner à l'assistant au début de chaque
> session dans VS Code. Il résume tout ce qui a été décidé et fait jusqu'ici.

## 1. Objectif du projet

Un jeu de **courses au marché** en réalité virtuelle, pour des **personnes
âgées**, dans le navigateur du **Meta Quest 3** (WebXR), sans installation.

Le joueur, **assis** devant un étal, reçoit une **liste de courses tirée au
hasard** et **remplit son panier** en prenant les articles demandés.

Projet frère de « Construction en blocs » (`../construction`), dont il reprend
les briques techniques et les règles d'accessibilité.

## 2. Décisions validées

| Sujet | Décision |
|---|---|
| Public | Personnes âgées, **assises**, avec le **Meta Quest 3** |
| Technologie | WebXR + Three.js 0.186.1, **sans compilation** (modules ES, *import map*, `vendor/`) |
| Entrée | **Suivi des mains**, un seul geste : le **pincement** ; **mode sans casque** à la souris pour tester |
| Graphisme | **Réaliste et très détaillé** : objets **photographiés** (photogrammétrie Poly Haven, CC0), à l'échelle réelle |
| Décor | **5 places 360°** (Poly Haven, CC0) : Dresde « dresden_square », Ulm « ulmer_muenster », Venise « venetian_crossroads », Fürstenstein « furstenstein », Rome « piazza_martin_lutero ». **Tirée au hasard à chaque chargement, jamais deux fois de suite** (dernière place retenue par `localStorage`) ; `?place=<nom>` en impose une pour les réglages — décidé le 2026-10-29 |
| Étal | Construit par le code (comptoir, poteaux, auvent rayé rouge et crème, étagère) avec bois et toile CC0, garni des modèles photographiés |
| Rangement des denrées | **Pas linéaire** : rangs en léger arc tourné vers le joueur, petits écarts d'angle et de position, cagettes du fond **inclinées** et **rehaussées** à des hauteurs variées, fruits en **tas bombés**, quelques fruits « échappés » sur le comptoir |
| Liste de courses | **Tirée au hasard** à chaque partie (4 à 6 articles, jamais de doublon) |
| Accessibilité | Mêmes règles que « construction » : gros texte, contraste ≥ 7:1 (texte sur panneau sombre opaque), pas de chrono, pas d'échec, sons doux désactivables, information jamais portée par la couleur seule |
| Langue | Français uniquement |
| Licence | MIT (titulaire « P ») pour le code ; ressources Poly Haven en CC0 |

## 3. Ce qui est fait (étapes 1 et 2)

**Étape 1 — Socle** ✅
- Dossier `market/`, dépôt git publié sur GitHub : `git@github.com:acrobat22/market_VR.git`
  (premier commit `2dd8045` sur `main`, le 2026-10-29).
- Modules repris de `construction` (branche `main`) : `coeur/sessionXR.js`,
  `coeur/qualiteAdaptative.js`, `coeur/ambiance.js`, `entrees/` (mains,
  détecteur de pincement, souris), `interface/` (sons, bouton 3D, icônes,
  mode sans casque), `marche/ombreContact.js`, `jeu/mouvement.js` (ex
  `accrochage.js` : adoucissement et interpolation), `serveur.py`, `vendor/`.
- `jeu/listeCourses.js` : tirage au hasard (Fisher-Yates, hasard injectable), testé.

**Étape 2 — Décor** ✅ (à valider à l'œil par l'utilisatrice)
- `marche/articles.js` : **12 articles** (pommes, poires, citrons, citrons verts,
  kiwis, avocats, grenades, bananes, patates douces, oignons, croissants,
  petits pains), chacun lié à son modèle 3D.
- `marche/modeles3D.js` : chargement glTF avec **3 tentatives** en cas d'échec,
  copies partagées, et **éléments séparables** (certains modèles sont des
  compositions : tas de 5 poires, 3 petits pains, panier + couvercle, régime +
  4 bananes isolées).
- `marche/matieres.js` : bois et toile réalistes (couleur, relief, rugosité),
  images chargées une fois, **préchargées** avant la construction de l'étal.
- `marche/etal.js` : comptoir (planches de façade), gradin, 4 poteaux, auvent
  rayé creusé avec lambrequin festonné, étagère du fond (bol, corbeille),
  **10 cagettes** en planches + **2 corbeilles** en osier (pains), panier du
  joueur au centre du rang avant, tonneau et caisses autour.
- `coeur/scene.js` : soleil voilé avec ombres douces + **lumière d'ambiance de
  secours** (la scène reste lisible si la photo de la place ne charge pas).
- La place est chargée avec 3 tentatives (`main.js`).

**Fonds aléatoires** ✅ (branche `fonctionnalite/fonds-aleatoires`, réglages à valider à l'œil)
- `coeur/choixPlace.js` : choix de la place (imposée par `?place=`, sinon au
  hasard en écartant la précédente), testé.
- `config.js` → `ambiance.places` : chaque place a sa photo, son HDR, sa
  `hauteurPrise` (calage du sol) et sa `rotation`. Les 4 nouvelles places sont
  à **1,7 m / rotation 0** par défaut : **à ajuster** avec `?place=<nom>`.
- **46 tests** `node --test` passent.

## 4. Disposition (joueur assis à l'origine, face à -z)

```
        ┌──── auvent rayé rouge et crème ────┐
        │  étagère du fond : bol, corbeille   │
        │ [c][c][c][c][c][c]  ← rang arrière : gradin, inclinées, rehaussées
        │ (o)[c][c](PANIER)[c][c](o)  ← rang avant ; (o) = corbeilles de pains
        └─────────── comptoir (1,90 m) ──────┘
 tonneau                               caisses empilées
```

- Comptoir : bord avant à 0,38 m du joueur, 0,62 m de profondeur, 0,74 m de haut.
- Rang avant ≈ 0,5 m (à portée de main) ; rang arrière ≈ 0,75 m (se pencher un peu).
- Tous les réglages sont dans `src/config.js` (sections `etal`, `cagette`,
  `corbeille`, `echappes`, `etagere`, `decor`, `camera`, `soleil`, `ciel`).

## 5. Prochaine étape : le jeu (étape 3) — à proposer avant de coder

Plan envisagé (à présenter et faire valider) :
1. **Ardoise** à l'étal (texte blanc sur fond ardoise, très gros) avec la liste
   tirée au hasard ; chaque article coché quand il est dans le panier
   (coche ✔ + texte barré, jamais la couleur seule).
2. **Saisie** d'un exemplaire (pincement en VR, clic-glisser à la souris),
   comme dans « construction » (`saisie.js` à reprendre et adapter : objets 3D
   quelconques au lieu de briques).
3. **Dépose dans le panier** : article de la liste → il reste dans le panier,
   coché, son doux ; article hors liste → il **revient doucement** à sa place
   (pas d'échec).
4. **Réussite** quand tout est coché : mélodie, message, « Rejouer » (nouvelle liste).
5. Page d'accueil : « Essayer sans casque », sons doux + « Écouter »
   (reprendre `index.html` / `main.js` de `construction`).

## 6. Points à vérifier / limites connues

- **Chrome sans affichage** (outil de capture) charge mal les ressources et
  produit très peu d'images : faux défauts possibles (bois ou fruits blancs,
  fondus incomplets). Toujours confirmer dans un vrai navigateur.
- **Poires blanches** vues sur une capture : probablement une texture glTF non
  chargée (les tentatives réessaient le modèle entier, pas une texture isolée
  en échec). À vérifier dans Chrome.
- **Bois très clair** au soleil sur une vue de trois quarts : à vérifier.
- Poids des ressources : ~55 Mo dans le dépôt (modèles 29 Mo en 1k, 5 places
  ~4 Mo chacune), mais une seule place téléchargée par chargement. Fluidité en casque à
  mesurer (ombres, nombre d'objets).

## 7. Autres places 360° libres de droits (CC0, Poly Haven), si besoin

Déjà utilisées : `ulmer_muenster` (Ulm), `venetian_crossroads` (Venise),
`furstenstein` (cour et château), `piazza_martin_lutero` (Rome).
Encore disponibles : `palermo_sidewalk` (ruelle fleurie ensoleillée), `schadowplatz`, `round_platform`.
La place Stanislas de Nancy n'existe qu'en **bande panoramique** (pas de 360°
complet) : « Nancy Place Stanislas panoramic August 2021 », MartinD, CC BY-SA 4.0
(citer l'auteur ; l'image modifiée reste CC BY-SA). Écartée pour l'instant.

## 8. Préférences de collaboration (à respecter)

- **Ne rien implémenter sans accord explicite** : proposer d'abord, attendre la validation.
- Répondre et commenter le code **en français de France** ; JSDoc, noms lisibles.
- **Une branche par fonctionnalité** (`fonctionnalite/…`) ; fusion dans `main`
  seulement après validation.
- **Aucun `git push` sans demande** (remote : `git@github.com:acrobat22/market_VR.git`).
- Changements minimaux et ciblés ; pas de fonctionnalité non demandée.
- Pour chaque problème : proposer l'approche optimale / pragmatique / architecturale, avec une recommandation.
- Tenir à jour `README.md`, `CHANGELOG.md` et ce `CONTEXTE.md`.
- Vérifier la documentation officielle avant d'utiliser une API ; le dire en cas de doute.

## 9. Commandes utiles

```sh
python3 serveur.py      # serveur local sans cache (http://localhost:8000)
node --test             # tests des fonctions pures
```

Après une modification : `Cmd + Maj + R` dans Chrome.
