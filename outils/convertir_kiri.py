"""Convertit des modèles du pack KIRI Engine « Fruit and Veg » (FBX) en glTF.

Usage (Blender en ligne de commande, depuis la racine du projet) :

    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \\
        -P outils/convertir_kiri.py -- <nom_sortie> <modèle> [<modèle> ...]

Exemple :

    ... -- kiri_carotte A31_Carrot A103_Carrot A134_Carrot

Chaque <modèle> est le début d'un nom de fichier du niveau « Mid » du pack
(``A31_Carrot`` → ``A31_Carrot_mid.fbx``). Tous les modèles donnés sont
regroupés dans ``ressources/modeles/<nom_sortie>/<nom_sortie>.gltf`` : chacun
y devient un élément nommé (``A31_Carrot``…), que le jeu alterne dans une
cagette (voir ``elements`` dans ``src/marche/articles.js``).

Les FBX du pack ne référencent pas correctement leurs textures : la matière
est reconstruite à partir des images (couleur, relief, rugosité, ombrage).
La rugosité et l'ombrage sont regroupés dans une seule image, comme l'attend
glTF (rouge = ombrage, vert = rugosité, bleu = métal, ici 0).
"""

import sys
from pathlib import Path

import bpy
import numpy as np

RACINE = Path(__file__).resolve().parent.parent
DOSSIER_KIRI = RACINE / "KIRI_Asset_Pack_Fruit_and_Veg" / "KIRI_Asset_Pack_Fruit_and_Veg" / "KIRI_Asset_Pack_Fruit_and_Veg_Mid"
DOSSIER_SORTIE = RACINE / "ressources" / "modeles"
SUFFIXE = "_mid"


def erreur(message: str) -> None:
    """Affiche une erreur claire sur la sortie d'erreur et arrête Blender."""
    print(f"[convertir_kiri] ERREUR : {message}", file=sys.stderr)
    sys.exit(1)


def charger_image(chemin: Path, couleur: bool) -> bpy.types.Image:
    """Charge une image ; `couleur` = False pour les données (relief, rugosité…)."""
    if not chemin.exists():
        erreur(f"texture introuvable : {chemin}")
    image = bpy.data.images.load(str(chemin))
    image.colorspace_settings.name = "sRGB" if couleur else "Non-Color"
    return image


def creer_image_orm(nom: str, ombrage: bpy.types.Image, rugosite: bpy.types.Image, dossier: Path) -> bpy.types.Image:
    """Regroupe ombrage (R) et rugosité (G) dans une image JPEG, métal (B) à 0."""
    largeur, hauteur = rugosite.size
    if tuple(ombrage.size) != (largeur, hauteur):
        ombrage.scale(largeur, hauteur)
    pixels_ombrage = np.array(ombrage.pixels[:], dtype=np.float32).reshape(-1, 4)
    pixels_rugosite = np.array(rugosite.pixels[:], dtype=np.float32).reshape(-1, 4)
    orm = np.zeros_like(pixels_rugosite)
    orm[:, 0] = pixels_ombrage[:, 0]
    orm[:, 1] = pixels_rugosite[:, 0]
    orm[:, 3] = 1.0

    image = bpy.data.images.new(f"{nom}_orm", largeur, hauteur)
    image.colorspace_settings.name = "Non-Color"
    image.pixels[:] = orm.ravel()
    image.filepath_raw = str(dossier / f"{nom}_orm.jpg")
    image.file_format = "JPEG"
    image.save()
    return image


def groupe_sortie_gltf() -> bpy.types.NodeTree:
    """Groupe de nœuds « glTF Material Output » : l'export glTF y lit l'ombrage."""
    groupe = bpy.data.node_groups.get("glTF Material Output")
    if groupe is None:
        groupe = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
        groupe.interface.new_socket("Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    return groupe


def reconstruire_matiere(objet: bpy.types.Object, nom: str, dossier_temporaire: Path) -> None:
    """Remplace la matière de l'objet par une matière PBR reliée aux images du pack."""
    textures = DOSSIER_KIRI / "Textures"
    base = f"{nom}{SUFFIXE}"
    couleur = charger_image(textures / f"{base}_albedo.jpg", couleur=True)
    relief = charger_image(textures / f"{base}_normal.png", couleur=False)
    rugosite = charger_image(textures / f"{base}_roughness.png", couleur=False)
    ombrage = charger_image(textures / f"{base}_ao.png", couleur=False)
    orm = creer_image_orm(nom, ombrage, rugosite, dossier_temporaire)

    matiere = bpy.data.materials.new(nom)
    matiere.use_nodes = True
    # Faces arrière masquées : objets pleins, moins de travail pour le casque.
    matiere.use_backface_culling = True
    noeuds = matiere.node_tree.nodes
    liens = matiere.node_tree.links
    principe = noeuds["Principled BSDF"]
    principe.inputs["Metallic"].default_value = 0.0

    noeud_couleur = noeuds.new("ShaderNodeTexImage")
    noeud_couleur.image = couleur
    liens.new(noeud_couleur.outputs["Color"], principe.inputs["Base Color"])

    noeud_relief = noeuds.new("ShaderNodeTexImage")
    noeud_relief.image = relief
    carte_relief = noeuds.new("ShaderNodeNormalMap")
    liens.new(noeud_relief.outputs["Color"], carte_relief.inputs["Color"])
    liens.new(carte_relief.outputs["Normal"], principe.inputs["Normal"])

    noeud_orm = noeuds.new("ShaderNodeTexImage")
    noeud_orm.image = orm
    separation = noeuds.new("ShaderNodeSeparateColor")
    liens.new(noeud_orm.outputs["Color"], separation.inputs["Color"])
    liens.new(separation.outputs["Green"], principe.inputs["Roughness"])
    sortie_gltf = noeuds.new("ShaderNodeGroup")
    sortie_gltf.node_tree = groupe_sortie_gltf()
    liens.new(separation.outputs["Red"], sortie_gltf.inputs["Occlusion"])

    objet.data.materials.clear()
    objet.data.materials.append(matiere)


def importer(nom: str, dossier_temporaire: Path) -> bpy.types.Object:
    """Importe un modèle du pack, le renomme et lui donne sa matière."""
    chemin = DOSSIER_KIRI / "Models" / f"{nom}{SUFFIXE}.fbx"
    if not chemin.exists():
        erreur(f"modèle introuvable : {chemin}")
    avant = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=str(chemin))
    maillages = [objet for objet in set(bpy.data.objects) - avant if objet.type == "MESH"]
    if len(maillages) != 1:
        erreur(f"{chemin.name} : un seul maillage attendu, {len(maillages)} trouvé(s)")
    objet = maillages[0]
    objet.name = nom
    objet.data.name = nom
    reconstruire_matiere(objet, nom, dossier_temporaire)
    return objet


def main() -> None:
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if len(arguments) < 2:
        erreur("usage : -- <nom_sortie> <modèle> [<modèle> ...]")
    nom_sortie, modeles = arguments[0], arguments[1:]
    if not DOSSIER_KIRI.exists():
        erreur(f"pack KIRI introuvable : {DOSSIER_KIRI}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    dossier = DOSSIER_SORTIE / nom_sortie
    dossier_temporaire = dossier / "orm-temporaire"
    dossier_temporaire.mkdir(parents=True, exist_ok=True)

    for nom in modeles:
        importer(nom, dossier_temporaire)
    # Ne garder que les maillages (l'import FBX peut ajouter des objets vides).
    for objet in list(bpy.data.objects):
        if objet.type != "MESH":
            bpy.data.objects.remove(objet)

    bpy.ops.export_scene.gltf(
        filepath=str(dossier / f"{nom_sortie}.gltf"),
        export_format="GLTF_SEPARATE",
        export_texture_dir="textures",
        export_image_format="JPEG",
        export_jpeg_quality=90,
        export_yup=True,
    )
    for fichier in dossier_temporaire.iterdir():
        fichier.unlink()
    dossier_temporaire.rmdir()
    print(f"[convertir_kiri] {nom_sortie} : {len(modeles)} modèle(s) exporté(s) dans {dossier}")


main()
