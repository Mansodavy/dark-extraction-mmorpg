# Dark-Extraction-MMORPG — Project Plan

> **Fork de Reldens v4.0.0-beta.39.8** vers un **Dark Fantasy Extraction Shooter** top-down 2D.  
> Vision : des raids à haut risque dans des zones corrompues, du loot à extraire, une progression stash-based, et un gameplay shooter avec visée à la souris.

---

## 1. Architecture source analysée (Reldens)

### Stack technique
| Couche | Technologie |
|--------|-------------|
| Serveur | Node.js ≥20, Colyseus 0.16 (WebSocket), P2.js (physique) |
| Client | Phaser 3 (renderer), Parcel 2 (bundling) |
| Stockage | MySQL/MariaDB (Knex/Objection/MikroORM/Prisma) |
| Config | DB-driven (`config` table) + `.env` (`RELDENS_*`) |
| Événements | `@reldens/utils` EventsManagerSingleton (pattern emit/emitSync) |

### Organisation du code
```
lib/
├── {feature}/
│   ├── client/          # Code Phaser / UI
│   ├── server/          # Rooms Colyseus, logique, entités
│   ├── constants.js       # Constantes partagées
│   └── schemas/           # Schémas d'état Colyseus (si applicable)
├── game/
│   ├── server/manager.js  # ServerManager (orchestrateur)
│   └── client/game-manager.js  # GameManager (client-side)
├── world/server/          # P2world, collisions, pathfinding
├── rooms/server/          # RoomScene (room de jeu), RoomLogin
└── actions/server/        # Combat, skills, PvE/PvP

theme/default/             # Assets, CSS, HTML, son
migrations/                # Schéma SQL + mises à jour
```

### Modules disponibles (23 features)
`game`, `rooms`, `world`, `config`, `features`, `actions`, `inventory`, `respawn`, `rewards`, `scores`, `teams`, `users`, `chat`, `audio`, `prediction`, `admin`, `firebase`, `ads`, `import`, `objects`, `snippets`, `bundlers`.

---

## 2. Modules critiques pour Dark-Extraction-MMORPG

| Module | Rôle actuel | Rôle cible (Extraction) | Impact |
|--------|-------------|------------------------|--------|
| **Actions** | Skills, combat PvE/PvP, `TypePhysicalAttack` avec bullets | Système d'**armes** (projectiles, munitions, rechargement, recul, line of sight) | 🔥 Critique |
| **Rooms** | Scènes, transitions, `RoomScene` | Zones de **raid** (lobby → raid → extraction), points de sortie, timers de raid | 🔥 Critique |
| **Objects** | Ennemis, drops, coffres, NPC | Mobs dark fantasy, **coffres de loot**, **points d'extraction** (objets interactifs), ressources | 🔥 Critique |
| **Inventory** | Items, équipement, consommables | **Loadout** avant raid, inventaire temporaire en raid, **stash** persistant | 🔥 Critique |
| **Rewards** | Drop tables, distribution | **Loot tables** avec rarity, distribution conditionnelle (extraction réussie) | 🔥 Critique |
| **World** | P2.js physique, collisions, pathfinding | Cover, collisions projectiles, zones d'effet, LoS | Haut |
| **Users/Players** | Stats, joueurs, auth, progression | Progression **stash-based** (pas de leveling), stats persistantes hors raid | Haut |
| **Respawn** | Respawn joueur / ennemi | Respawn mobs en raid, **système de mort = retour au lobby avec perte de loot** | Haut |
| **Teams** | Groupes / clans | **Squads** (1-3 joueurs) pour raids en équipe | Haut |
| **Scores** | Leaderboards | **Classements** par valeur extraite, survie, raids réussis | Moyen |
| **Chat** | Global, room, privé | Communication **squad** + proximité | Moyen |
| **Audio** | Musique, SFX | Ambiance dark, sons d'armes, alertes extraction | Moyen |
| **Game** | Orchestration, config | Adapter la config par défaut, écrans (lobby, sélection de raid) | Haut |
| **Admin** | Panel admin | Gérer les loot tables, équilibrage des armes | Bas |

---

## 3. Roadmap V1 — « Première extraction »

### Vision V1
Un joueur peut :
1. Se connecter, choisir un loadout depuis son stash.
2. Rejoindre une zone de raid (1 carte).
3. Se déplacer en **WASD** + viser/tirer à la **souris** (click gauche).
4. Combattre des ennemis (mêlée + armes à distance), ouvrir des coffres, ramasser du loot.
5. Atteindre un **point d'extraction** pour sauvegarder son loot dans son stash.
6. S'il meurt en raid, il perd tout le loot non extrait et retourne au lobby.

### Milestones

#### M1 — Core Shooter (semaines 1-2)
**Objectif** : le joueur contrôle son personnage comme un shooter top-down avec des armes.
- [ ] Input : visée à la souris (rotation du sprite), tir au click gauche.
- [ ] Système d'armes : cadence de tir, munitions, rechargement (R), projectiles physiques.
- [ ] Skills → Armes : refactor `TypePhysicalAttack` pour supporter des armes avec balles, portée, dégâts, recul.
- [ ] Client : nouveau sprite joueur (dark fantasy), animations de tir, muzzle flash, impacts.
- [ ] UI : crosshair, ammo counter, barre de vie stylisée dark fantasy.
- [ ] Stats : simplifier `hp` + `stamina` (sprint). Pas de leveling.

#### M2 — Système de Raid & Extraction (semaines 3-4)
**Objectif** : créer la boucle de raid (lobby → raid → extraction/mort).
- [ ] Nouveau type de room : `RaidRoom` (hérite de `RoomScene`), avec timer de raid.
- [ ] Points d'extraction : nouvel objet `ExtractionObject` interactif. Timer d'extraction (ex: 15s). Broadcast d'alerte aux autres joueurs.
- [ ] Système de mort en raid : si `hp` ≤ 0, le joueur devient spectateur ou retourne lobby. Perte de l'inventaire temporaire.
- [ ] Système de `stash` persistant : nouvelle table `stash`, API CRUD. L'inventaire en raid est temporaire et seul le stash est persistant.
- [ ] Loadout : avant de rejoindre un raid, le joueur choisit 1 arme + 1 consommable depuis son stash.
- [ ] Respawn mobs : ajuster `EnemyObject` pour respawn dans les zones de raid uniquement.

#### M3 — Économie & Loot (semaines 5-6)
**Objectif** : le loot a du sens, de la valeur, et une progression.
- [ ] Loot tables : définir des tables par rarity (`common`, `rare`, `epic`, `legendary`). Modifier `RewardsDropsProcessor`.
- [ ] Coffres de loot : nouvel objet `LootChestObject` avec animations d'ouverture, timer, et drops aléatoires.
- [ ] Ressources : minerai, herbes, etc. (ramassage instantané, ajout à l'inventaire temporaire).
- [ ] Stash UI : interface client pour consulter/organiser le stash, équiper le loadout.
- [ ] Équilibrage : config DB des armes (dégâts, cadence, chargeur, portée) et des mobs (HP, vitesse, aggro).

#### M4 — Polish Dark Fantasy (semaines 7-8)
**Objectif** : ambiance et fiabilité.
- [ ] Thème visuel : remplacer les assets par défaut (tileset dark, sprites ennemis, armes, particules).
- [ ] Audio : musique ambiante dark, SFX armes, alertes extraction.
- [ ] UI/UX : écran titre, lobby, écran de mort, leaderboard, style dark fantasy.
- [ ] Chat de proximité : réduire la portée du chat room à la distance.
- [ ] Équilibrage & tests : corriger les bugs, ajuster les valeurs.

---

## 4. Fichiers à modifier / créer

### 4.1 M1 — Core Shooter

#### Input & Mouvement (client)
```
lib/game/client/scene-dynamic.js
    ├── setupKeyboardAndPointerEvents()    → ajouter mouse move pour angle, pointerdown pour tir
    ├── movePlayerByPressedButtons()       → WASD uniquement, retirer tap-movement par défaut
    ├── executePointerDownAction()         → distinguer tir (click gauche) vs mouvement
    └── executeKeyDownBehavior()           → ajouter reload (R), interaction (E)

lib/game/client/game-manager.js
    ├── setupCustomClientPlugin()          → plugin pour crosshair
    └── new methods : getMouseAngle(), updateCrosshair()
```

#### Système d'armes (serveur + client)
```
lib/actions/server/skills/type-physical-attack.js
    ├── onHit() / executeBullets()         → étendre pour supporter munitions, rechargement, recul
    └── removeBullet()                     → déjà OK, vérifier collisions avec le monde (cover)

lib/actions/server/skills/type-attack.js
    └── runSkillLogic()                    → broadcast animation de tir (act: weaponKey_atk)

lib/actions/server/battle.js
    ├── runBattle()                        → ajouter cooldown par arme
    └── battleTimer                        → timer d'engagement (aggro)

lib/actions/server/pve.js
    └── runBattle()                        → ajuster pour les armes à distance (line of sight, range)
```

#### Nouveaux fichiers M1
```
lib/actions/server/weapons/
    ├── weapon-definition.js               # Classe de base arme (key, dmg, fireRate, magSize, reloadTime, range)
    ├── weapon-registry.js               # Charge les armes depuis la DB (nouvelle table `weapons`)
    └── weapon-manager.js                # Gère munitions, rechargement, cooldown par joueur

lib/game/client/weapons/
    ├── weapon-renderer.js               # Muzzle flash, balles visuelles, impacts
    └── crosshair-manager.js             # Crosshair dynamique
```

#### Schéma DB M1 (nouvelle table)
```sql
CREATE TABLE weapons (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    damage INT UNSIGNED NOT NULL,
    fire_rate INT UNSIGNED NOT NULL,       -- ms entre chaque tir
    magazine_size INT UNSIGNED NOT NULL,
    reload_time INT UNSIGNED NOT NULL,     -- ms
    projectile_speed INT UNSIGNED NOT NULL,
    range INT UNSIGNED NOT NULL,
    affected_stat VARCHAR(255) NOT NULL,   -- 'hp'
    customData TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 M2 — Raid & Extraction

#### Rooms & Scènes
```
lib/rooms/server/scene.js
    ├── onCreate()                         → ajouter `raidTimer`, `extractionZones`
    ├── onJoin()                             → vérifier loadout, initialiser inventaire temporaire
    └── onDispose()                          → forcer extraction / perte de loot si timer écoulé

lib/rooms/server/manager.js
    └── loadRooms()                          → charger les rooms marquées comme `type = 'raid'`
```

#### Nouveaux objets
```
lib/objects/server/object/type/extraction-object.js
    ├── onHit() / interact()               → démarrer timer d'extraction (15s), broadcast alerte
    └── completeExtraction()               → transférer inventaire temporaire → stash, kick joueur

lib/objects/server/object/type/loot-chest-object.js
    ├── interact()                         → animation d'ouverture, drop loot selon table
    └── randomLoot()                       → appeler RewardsDropsProcessor
```

#### Inventaire / Stash
```
lib/inventory/server/plugin.js
    └── setup()                            → hook pour séparer inventaire temporaire vs stash

lib/inventory/server/models-manager.js
    └── ajouter gestion `stash` + `loadout`
```

#### Nouveaux fichiers M2
```
lib/raid/                                  # NOUVEAU MODULE ? Ou intégrer à Rooms/Objects
    ├── server/raid-manager.js
    ├── server/extraction-manager.js
    └── client/raid-ui.js

lib/users/server/stash-manager.js          # Gestion persistante du stash
lib/users/server/loadout-validator.js      # Validation du loadout avant raid
```

#### Schéma DB M2
```sql
CREATE TABLE stash (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    player_id INT UNSIGNED NOT NULL,
    item_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    UNIQUE KEY player_item (player_id, item_id)
);

CREATE TABLE loadout (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    player_id INT UNSIGNED NOT NULL UNIQUE,
    weapon_key VARCHAR(255),
    secondary_key VARCHAR(255),
    consumable_key VARCHAR(255),
    armor_key VARCHAR(255)
);

ALTER TABLE rooms ADD COLUMN room_type ENUM('scene','raid','lobby') DEFAULT 'scene';
```

### 4.3 M3 — Économie & Loot

#### Rewards / Drops
```
lib/rewards/server/rewards-drops-processor.js
    └── processDrops()                     → intégrer rarity weights, tier de zone

lib/rewards/server/rewards-drops-mapper.js
    └── mapByDrops()                       → ajouter colonne `rarity` et `zone_tier`
```

#### Objects
```
lib/objects/server/object/type/loot-chest-object.js
    └── setup()                            → lier à une loot table spécifique

lib/objects/server/object/type/enemy-object.js
    └── onBattleEnd()                      → dropper selon loot table de l'ennemi
```

#### Admin / Config
```
lib/admin/server/                          # Ajouter CRUD pour `weapons`, `loot_tables`, `stash`
```

### 4.4 M4 — Polish

#### Thème & UI
```
theme/default/assets/                      # Remplacer sprites, tilesets, particules
theme/default/css/styles.scss              # Thème sombre, couleurs #1a1a1a, #8b0000, #c0a040
theme/default/index.html                   # Titre, favicon, meta

lib/game/client/user-interface.js          # Adapter barres de vie, inventaire, crosshair
lib/game/client/scene-dynamic.js           # Ambiance (fog of war, lumières)
```

#### Audio
```
lib/audio/server/plugin.js                 # Ajouter musique d'ambiance par type de room (raid)
```

---

## 5. Risques & Mitigation

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Colyseus state sync async avec projectiles rapides | Moyen | Haut | Limiter la vitesse des projectiles, utiliser hitscan pour armes rapides, client-side prediction pour visuels. |
| P2.js performance avec 50+ projectiles simultanés | Moyen | Haut | Pooling de bullets, destruction rapide, limite de corps physiques. |
| Inventaire temporaire vs stash complexe à synchroniser | Moyen | Haut | Tests unitaires sur les transitions (extraction, mort, déconnexion). |
| Camera-follow & visée à la souris en conflit | Faible | Moyen | Découpler la caméra du sprite : caméra follow doux + sprite orienté vers souris. |
| Parcel bundling avec nouveaux assets | Faible | Moyen | Tester `reldens buildSkeleton` régulièrement. |

---

## 6. Prochaines étapes immédiates

1. **Créer le fork** sur GitHub (renommer `reldens` → `dark-extraction-mmorpg`).
2. **Modifier `package.json`** : nom, description, version initiale `0.1.0-alpha`.
3. **Créer une branche `m1-core-shooter`**.
4. **Commencer par `lib/game/client/scene-dynamic.js`** : implémenter la rotation du joueur vers la souris et le tir au click.
5. **Créer la table `weapons`** et la classe `WeaponManager` côté serveur.

---

*Plan généré par analyse du repo Reldens. Ne pas modifier ce fichier manuellement sans mise à jour de la date.*
