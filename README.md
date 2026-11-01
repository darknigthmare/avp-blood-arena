# AVP Blood Arena — relance technique + Alien_base

Ce dépôt public vient d'être initialisé depuis un README vide. La version historique **0.30 Galerie du Circuit** est identifiée dans les anciennes pièces jointes ChatGPT, mais les octets HTML et la ZIP de sources n'ont pas pu être matérialisés pour import. **Le contenu de ce dépôt n'est donc pas cette version originale.**

La relance technique livre :
- un match tactique jouable 24×14 cases, 9 factions, Nexus à récupérer, plaquage, passe, capacités, score, fin de match, IA locale et mode 2 joueurs locaux ;
- un codex consultable de 68 entités chargées depuis le snapshot Alien_base ;
- 16 profils de stats recopiés depuis des fragments indexés de la v0.30, sans prétendre contenir les autres profils ;
- 3 factions avec profils provisoires explicitement marqués, à remplacer dès récupération des sources originales ;
- une progression locale de matchs et victoires, et un mode tactile/souris.

## Architecture

- \`data/alien-base.snapshot.json\` : export versionné du dépôt privé \`darknigthmare/alien_base\`.
- \`data/blood-arena.profiles.json\` : extraction **partielle** des profils v0.30, séparée des faits de lore.
- \`game.js\` : moteur autonome de relance, sans dépendances externes. Le catalogue s'affiche en lecture seule.
- \`index.html\` + \`style.css\` : interface et terrain.
- \`scripts/check.mjs\` : vérifie intégrité des références et statut de l'extraction.

**Synchronisation** : modifier les références dans Alien_base, lancer \`node scripts/export-snapshot.mjs\` de l'autre dépôt en ciblant \`data/alien-base.snapshot.json\`, puis créer une PR ici avec le fichier versionné. Ne jamais embarquer de token du dépôt privé sur le site public. La sync automatique GitHub nécessite un secret de lecture explicitement configuré ; elle n'est pas activée à tort.

## État / fidélité

Le moteur de relance est un **prototype distinct** de Blood Arena 0.30, et non une reproduction 1:1. Ne sont pas encore restaurés : tous les assets des 7 planches, collections, 3 campagnes, neuf modes de jeu et textes détaillés de la 0.30, corrections, animations et source du moteur original. La restauration exacte dépend de la ZIP \`AVP_Blood_Arena_v0_30_Jeu_et_Sources.zip\` ou du HTML brut.

Fan game non officiel. Alien et Predator appartiennent à leurs ayants droit. Ne pas employer de visuels officiels sans droits.
