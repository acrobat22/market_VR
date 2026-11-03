# Faire son marché (WebXR)

Jeu de **courses au marché** en réalité virtuelle, pensé pour les
**personnes âgées**, qui fonctionne dans le navigateur du **Meta Quest 3**,
sans installation.

- On joue **assis** devant un étal, avec un seul geste : le **pincement**.
- Une **liste de courses** est tirée au hasard (« 2 pommes », « 1 citron ») ;
  on remplit son panier, puis on peut rejouer.
- Aucun chrono, aucune erreur possible ; texte en grand, sons doux.

## État d'avancement

| Étape | Contenu | État |
|---|---|---|
| 1 | Socle (projet, modules communs, tirage de la liste) | ✅ |
| 2 | Décor : place tirée au hasard parmi 5, étal garni d'objets photographiés | ✅ à valider |
| 3 | Jeu : ardoise, saisie, panier, quantités, réussite et « Rejouer » | ✅ à valider |
| 4 | Un étal par thème (fruits, légumes), choisi sur l'accueil | ✅ fruits (25) et légumes (11), 10 au hasard par partie |

## Structure

```
index.html                 Page d'accueil et bouton « Entrer en réalité virtuelle »
styles/accueil.css         Styles de la page (contraste ≥ 7:1)
serveur.py                 Serveur local sans cache
vendor/three/              Three.js 0.186.1 (copie locale, licence MIT)
vendor/webxr-input-profiles/  Modèles 3D des mains (licence MIT)
ressources/modeles/        Modèles 3D photographiés, glTF 1k (Poly Haven et KIRI Engine, CC0)
outils/convertir_kiri.py   Conversion FBX → glTF des modèles du pack KIRI (script Blender)
outils/assetlinks.modele.json  Modèle du fichier de vérification Meta (voir « Empaqueter pour le Quest »)
ressources/textures/       Bois « rough_wood », toile « rough_linen » (Poly Haven, CC0)
ressources/icones/        Icône du jeu (rendu 3D du panier) : 192, 512 et 512 « maskable »
manifest.webmanifest       Manifeste de l'application web (nom, icônes, couleurs)
ressources/polices/       Police manuscrite « Patrick Hand » de l'ardoise (licence OFL)
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
  interface/               Sons, bouton 3D, icônes, mode sans casque (repris), choix de l'étal
  marche/articles.js       Les articles vendus (rayon, noms, modèle 3D)
  marche/tas.js            Logique pure : tas d'articles en vrac dans une cagette (carte des hauteurs)
  marche/rayons.js         Les rayons (un étal par type de produit) et leurs articles
  marche/modeles3D.js      Chargement des modèles (tentatives, éléments séparables)
  marche/matieres.js       Bois et toile réalistes, préchargés
  marche/ardoise.js        Ardoise de la liste écrite à la craie, cadre en bois (cases cochées et barrées)
  marche/etal.js           L'étal : structure (comptoir, auvent, panier, décor) et garniture (cagettes, articles)
  marche/ombreContact.js   Ombre douce au pied des objets
  jeu/listeCourses.js      Logique pure : tirage de la liste et des quantités au hasard
  jeu/saisie.js            Saisie et déplacement des objets par pincement (repris de « construction »)
  jeu/exemplaire.js        Article saisissable : survol, déplacement en douceur (place ou panier)
  jeu/partie.js            Logique pure : liste en cours, quantités déposées, fin de partie, texte des lignes
  jeu/panier.js            Logique pure : un article lâché tombe-t-il dans le panier ?
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

## Tester sur le Quest avec GitHub Pages

Une fois GitHub Pages activé (Réglages du dépôt → Pages → branche `main`,
dossier racine), le jeu est servi en HTTPS à l'adresse
<https://acrobat22.github.io/market_VR/>. Il suffit de l'ouvrir dans le
navigateur du Quest : **aucun fichier de vérification n'est nécessaire** pour
jouer depuis le navigateur.

## Empaqueter pour le Quest (application installable)

Le fichier de vérification `assetlinks.json` n'est utile que pour une
application empaquetée avec Bubblewrap (Store, ou installation par `adb`) :
Meta indique qu'une application **immersive** (WebXR) ne se lance pas si cette
vérification échoue ([documentation Meta](https://developers.meta.com/vr/documentation/web/pwa-packaging/)).

1. Installer l'outil de Meta (Node.js 18 ou plus) :
   `npm install --global @meta-quest/bubblewrap-cli`
2. Dans un dossier à part (hors de ce dépôt) :
   `bubblewrap init --manifest=https://acrobat22.github.io/market_VR/manifest.webmanifest --metaquest`
   (choisir le mode « immersive » et un identifiant de paquet, par exemple
   `io.github.acrobat22.marche`, qui ne devra plus changer), puis `bubblewrap build`.
3. Relever l'empreinte SHA-256 de la clé :
   `keytool -list -v -keystore android.keystore -alias android`, puis
   `bubblewrap fingerprint add <empreinte>`, qui génère `assetlinks.json`
   (même structure que `outils/assetlinks.modele.json`).
4. Publier ce fichier **à la racine du domaine** :
   `https://acrobat22.github.io/.well-known/assetlinks.json`. Avec GitHub
   Pages, le dossier du projet (`/market_VR/`) ne convient pas : il faut un
   dépôt `acrobat22.github.io` (site personnel) contenant
   `.well-known/assetlinks.json` et un fichier vide `.nojekyll` (sans lui,
   GitHub Pages ignore les dossiers qui commencent par un point), ou un nom de
   domaine personnel.
5. Installer sur le casque (mode développeur) :
   `adb install app-release-signed.apk`, puis ouvrir l'application depuis
   « Sources inconnues ». En cas d'échec, chercher
   `TWA verification was unsuccessful` dans le journal du casque.

## Ajouter un modèle du pack KIRI

Placer le pack téléchargé à la racine (`KIRI_Asset_Pack_Fruit_and_Veg/`, ignoré par git), puis :

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
  -P outils/convertir_kiri.py -- kiri_carotte A31_Carrot A103_Carrot A134_Carrot
```

Ensuite, ajouter l'article dans `src/marche/articles.js` (rayon, noms, modèle, variantes).

## Tests

```sh
node --test
```

## Licences

- Code : [MIT](LICENSE).
- Three.js et modèles des mains : MIT (voir `vendor/`).
- Icône : rendu du jeu (panier et articles ci-dessus, Poly Haven et KIRI Engine, CC0).
- Police « Patrick Hand » (Patrick Wagesreiter) : [SIL Open Font License 1.1](ressources/polices/OFL.txt).
- Fruits et légumes « kiri_* » : pack [KIRI Engine « Fruit and Veg »](https://www.kiriengine.app/blender-addon/fruit-and-veg-asset-pack-by-kiri-engine), CC0.
  Le pack lui-même n'est pas dans le dépôt (KIRI demande de ne pas le redistribuer tel quel) : seuls les modèles convertis y sont.
- Modèles 3D, textures et places 360° : [Poly Haven](https://polyhaven.com/license), CC0 (domaine public).
