# AVP Blood Arena — relance technique + Alien_base

Ce dépôt public vient d'être initialisé depuis un README vide. La version historique **0.30 Galerie du Circuit** est identifiée dans les anciennes pièces jointes ChatGPT, mais les octets HTML et la ZIP de sources n'ont pas pu être matérialisés pour import. **Le contenu de ce dépôt n'est donc pas cette version originale.**

La relance technique livre :
- un match tactique jouable 24×14 cases, 9 factions, Nexus à récupérer, plaquage, passe, capacités, score, fin de match, IA locale et mode 2 joueurs locaux ;
- un codex consultable de 68 entités chargées depuis le snapshot Alien_base ;
- 18 profils de sport : 4 retrouvés dans des extraits vérifiés de la v0.30, 14 autres reconstructions provisoires (non certifiées) ;
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

## Archives de l'ensemble des jeux — v0.2

Depuis le dépôt privé Alien_base (pipeline `node scripts/export-blood-arena.mjs`), le jeu public embarque désormais `data/cross-game-references.json` : 158 cartes AVP Hunt/Hive TCG et 129 dossiers d'armes Tantalus **à vérifier**. Le codex filtre séparément les références principales, les cartes TCG et les dossiers de recherche ; aucun de ces imports ne devient automatiquement une unité jouable ou un objet officiellement certifié.

## Correctif de provenance (audit v0.3)

La reconstruction possède 18 profils, **4 directement vérifiés dans les extraits indexés du HTML v0.30** et **14 provisoires**, inventoriés pour maintenir un match jouable. Les valeurs provisoires n'ont pas été présentées comme exactes. Le code affiche « PROFIL PROVISOIRE » pour ces unités. L'archive originale v0.30 doit toujours être restaurée pour tester les modes et la fidélité visuelle.

## Synchronisation Alien_base unifiée (2026-11-01)

Le jeu inclut désormais `data/alien-base.unified-blood.json`, un **snapshot public hors ligne** généré depuis l'exporteur `Alien_base/scripts/export-blood-arena-public.mjs` (PR Alien_base #20, dépendante des PR #8 et #4). Il référence **7 rattachements prudents** à des identités communes et **11 cas sans preuve suffisante** parmi les 18 profils. Les valeurs HP/MOB/ARM et les règles du sport **ne sont pas importées comme statistiques universelles**.

L'interface « SYNCHRO ALIEN_BASE » permet de vérifier chaque rattachement, sa source et les cas à documenter. Lancer `npm test` valide le snapshot, les identifiants et la provenance. Le fichier de la base privée n'est **jamais chargé depuis un navigateur**.

### Restauration de la version historique 0.36

Le fichier `AVP_Blood_Arena_v0_36_JOUABLE.html` (16 545 313 octets, 23 066 lignes) a été **repéré** dans la bibliothèque du projet, mais ses octets complets ne sont pas accessibles depuis cet environnement. Il n'est **pas** intégré au dépôt et ce site reste une relance technique, distincte du jeu historique. Pour une restauration ultérieure depuis une copie locale autorisée et intégrale :

```bash
node scripts/restore-original.mjs /chemin/AVP_Blood_Arena_v0_36_JOUABLE.html
npm test
```

Le script refuse les copies tronquées et produit `play/v0.36/index.html` et une attestation SHA-256. Le répertoire `play/v0.36` ne doit être publié que lorsque l'original intégral a passé les vérifications. Aucune version 0.36 en ligne n'est prétendue par ce dépôt.

### Hébergement

Le projet Vercel existant `avp-blood-arena` est déjà lié au dépôt GitHub sous l'équipe `darknigthmares-projects`. Un lien Git n'est pas un déploiement : seule une build en état `READY` et une vérification du domaine confirmeront une mise en ligne.

## Référentiel unifié v2 — instantané du 2 novembre 2026

Le volet **REGISTRE UNIFIÉ V2** ajoute **494 notices documentaires** depuis la branche revue d'Alien_base (#21 → #22 → #24 et PR de pont Blood Arena), sur **652 identités**, dont **158 cartes TCG** consultables séparément. Le moteur conserve le catalogue v1 de 68 notices et son gameplay inchangé. La synchronisation est une **prévisualisation issue de PR encore ouvertes**, pas une fusion confirmée dans `Alien_base/main`.

L'instantané `data/alien-base.registry-index.json` ne contient que les IDs, noms, catégories et classifications : **pas de secrets, pas de provenance privée, pas de statistiques, pas d'import de capacités ou d'actifs**. Les sept correspondances du roster restent validées et onze profils demeurent en attente ; `data/alien-base.unified-blood.json` conserve les preuves et sa SHA Git blob d'origine. Les scripts `npm test` vérifient les empreintes partagées et l'absence d'effet automatique sur les 18 profils et leurs sauvegardes.

Les mises à jour connexes Hive Ascension (#23) restent parallèles à la chaîne Apex (#24) et nécessiteront une réconciliation distincte avant fusion. La version originale 0.36 n'est toujours pas restaurée.
