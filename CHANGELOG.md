# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)

---

## [Non publié]

### Ajouté
- 2026-11-02 — Quantités : chaque article de la liste est demandé de 1 à 3 fois
  (sans dépasser le stock de l'étal ni les 12 places du panier) ; l'ardoise
  écrit « 1 citron », « 2 pommes », et « 2 pommes (encore 1) » en cours.
- 2026-11-02 — Étape 3c (jeu) : liste complète → mélodie, « Bravo ! » sur
  l'ardoise et bouton « Rejouer » au-dessus du panier ; rejouer remet les
  articles à leur place et tire une nouvelle liste (aussi au retour à l'accueil
  et à la sortie de la VR). 6 tests de plus (62 au total).
- 2026-10-29 — Ardoise réaliste : surface d'ardoise grainée avec traces de
  craie mal effacée, cadre en bois 3D (bois de l'étal), texte écrit à la craie
  en police manuscrite « Patrick Hand » (OFL, copiée dans `ressources/polices/`),
  cases et coches tracées à la main. Contraste du texte toujours ≥ 7:1.
- 2026-10-29 — Étape 3b (jeu) : liste de 4 à 6 articles tirée au hasard et
  écrite sur une ardoise suspendue sous l'auvent ; un article de la liste
  lâché au-dessus du panier s'y pose et se coche (case ✔ et nom barré, son
  doux) ; tout autre article retourne à sa place. 10 tests de plus (56 au total).

### Corrigé
- 2026-10-29 — Souris : l'article tenu suit la surface sous le curseur au lieu
  d'un plan horizontal qui le faisait flotter devant le panier (dépôt
  impossible, article grossi, citrons sous leur cagette).
- Ardoise remontée (elle masquait le rang arrière), caméra de l'aperçu relevée ;
  avocat ramené à une taille réaliste.
- 2026-10-29 — Étape 3a (jeu) : page d'accueil complète (« Comment jouer »,
  sons doux + « Écouter », « Essayer sans casque ») ; on prend les articles de
  l'étal par pincement ou à la souris (l'article survolé grossit un peu) ;
  lâché, un article retourne doucement à sa place en décrivant un arc.
- 2026-10-29 — Fonds aléatoires : 4 nouvelles places 360° (Ulm, Venise,
  Fürstenstein, Rome ; Poly Haven CC0) en plus de Dresde. Une place est tirée
  au hasard à chaque chargement, jamais deux fois de suite la même (dernière
  place retenue par le navigateur). Paramètre `?place=<nom>` pour imposer une
  place lors des réglages. 7 tests de plus (46 au total).
- 2026-10-29 — Étape 2 (décor) : place de Dresde (panorama 360°, Poly Haven
  CC0) ; étal construit par le code (comptoir en planches, gradin, poteaux,
  auvent rayé rouge et crème avec lambrequin festonné, étagère) ; 12 articles
  photographiés (Poly Haven CC0) dans 10 cagettes et 2 corbeilles ; panier du
  joueur ; tonneau et caisses autour ; soleil voilé avec ombres douces et
  lumière d'ambiance de secours.
- Disposition non linéaire des denrées : rangs en arc, cagettes du fond
  inclinées et rehaussées sur des cales, tas bombés, fruits « échappés ».
- Chargement robuste : 3 tentatives pour les modèles et la place, textures
  préchargées avant la construction de l'étal.
- 2026-10-29 — Étape 1 (socle) : projet créé, modules communs repris de
  « Construction en blocs » (session VR, mains, pincement, souris, sons,
  qualité adaptative, serveur sans cache), tirage au hasard de la liste de
  courses. 39 tests `node --test`.
