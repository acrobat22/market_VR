# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)

---

## [Non publié]

### Ajouté
- 2026-11-02 — Oignon (Poly Haven) sur l'étal de légumes : 11 légumes, l'étal
  en montre 10 au hasard à chaque partie.

### Supprimé
- Rayons « Poissons » et « Pains et viennoiseries » (aucun modèle 3D CC0),
  avec la mention « Bientôt » de l'accueil ; croissants et petits pains
  retirés ; modèles inutilisés supprimés (croissant, petits pains, patate douce).
- 2026-11-02 — Étal de légumes : carotte, pomme de terre, chou, brocoli,
  concombre, aubergine, champignon, ail, courge butternut, navet (pack KIRI
  Engine « Fruit and Veg », CC0), avec plusieurs variantes par légume.
- 2026-11-02 — 15 fruits de plus (orange, mangue, pêche, prune, clémentine,
  kumquat, mangoustan, papaye, fruit de la passion, kaki, goyave, fruit du
  dragon, pomme cannelle, noix de coco, melon) : 25 fruits, l'étal en montre
  10 au hasard à chaque partie.
- Changer d'étal sur l'accueil le regarnit aussitôt, sans recharger la page ;
  « Rejouer » regarnit l'étal (nouveaux fruits) et tire une nouvelle liste.
- `outils/convertir_kiri.py` : conversion FBX → glTF des modèles KIRI avec
  Blender (matière reconstruite, rugosité et ombrage regroupés).

### Modifié
- L'étal est construit en deux temps : structure (une fois) et garniture
  (cagettes et articles, remplacée à chaque partie ou changement d'étal).
- Plus de fruit « échappé » posé devant le panier (on le croyait déjà dedans).
- 2026-11-02 — Étape 4 (début) : choix de l'étal sur la page d'accueil
  (Fruits, Légumes, Poissons, Pains et viennoiseries ; les trois derniers
  « Bientôt » tant que leurs modèles CC0 manquent). Chaque article appartient à
  un rayon ; l'étal et la liste ne contiennent que les articles du rayon choisi.
  Étal de fruits : 9 fruits, avec le litchi (Poly Haven, CC0). 4 tests de plus.

### Modifié
- Les corbeilles du bout du rang avant sont désormais vides (décor) : leurs
  bords cachaient les pains. Pains et oignons iront sur leurs propres étals.
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
