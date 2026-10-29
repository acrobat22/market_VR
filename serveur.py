"""Serveur local de développement, sans cache navigateur.

Identique à ``python3 -m http.server``, mais chaque réponse demande au
navigateur de revérifier le fichier (``Cache-Control: no-cache``) : les
modifications du code sont visibles au simple rechargement de la page,
y compris dans le navigateur du Meta Quest.

Utilisation :
    python3 serveur.py          # port 8000
    python3 serveur.py 8080     # autre port

Le serveur n'écoute que sur ``localhost`` (pas sur le réseau local).
Pour le casque, utiliser ``adb reverse tcp:8000 tcp:8000`` (voir README).
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT_PAR_DEFAUT = 8000
ADRESSE = "127.0.0.1"


class GestionnaireSansCache(SimpleHTTPRequestHandler):
    """Sert les fichiers du projet en interdisant la réutilisation sans vérification."""

    def end_headers(self) -> None:
        """Ajoute les en-têtes anti-cache avant de terminer l'en-tête HTTP."""
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def lire_port(arguments: list[str]) -> int:
    """Lit le port demandé sur la ligne de commande.

    Args:
        arguments: Arguments de la ligne de commande (sans le nom du script).

    Returns:
        Le port à utiliser.

    Raises:
        ValueError: Si le port n'est pas un entier entre 1 et 65535.
    """
    if not arguments:
        return PORT_PAR_DEFAUT
    if not arguments[0].isdigit():
        raise ValueError(f"le port doit être un nombre entier (reçu : « {arguments[0]} »)")
    port = int(arguments[0])
    if not 1 <= port <= 65535:
        raise ValueError(f"le port doit être compris entre 1 et 65535 (reçu : {port})")
    return port


def main() -> int:
    """Démarre le serveur sur le dossier du projet.

    Returns:
        Le code de sortie du programme (0 si tout s'est bien passé).
    """
    try:
        port = lire_port(sys.argv[1:])
    except ValueError as erreur:
        print(f"Erreur : port invalide, {erreur}.", file=sys.stderr)
        return 1

    # Sert toujours le dossier du projet, quel que soit le dossier courant.
    dossier_projet = Path(__file__).resolve().parent
    gestionnaire = partial(GestionnaireSansCache, directory=str(dossier_projet))

    try:
        serveur = ThreadingHTTPServer((ADRESSE, port), gestionnaire)
    except OSError as erreur:
        print(
            f"Erreur : impossible d'ouvrir le port {port} ({erreur.strerror}). "
            "Un autre serveur l'utilise peut-être : arrêtez-le ou choisissez un autre port.",
            file=sys.stderr,
        )
        return 1

    print(f"Serveur prêt : http://localhost:{port}  (Ctrl + C pour arrêter)")
    with serveur:
        try:
            serveur.serve_forever()
        except KeyboardInterrupt:
            print("\nServeur arrêté.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
