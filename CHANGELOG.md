# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)

---

## [Non publié]

### Ajouté
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
