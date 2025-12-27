# Nuit

Un bot multi-fonctions pour Discord.

## Comment avoir son propre bot sur l'infra de Nuit?

En premier, il vous faudra plusieurs choses :

-   [Git](https://git-scm.com) : Permettra de cloner ce repo (https://github.com/Nuit-Bot/service)
-   [NodeJS](https://nodejs.org/fr/download) : Permettra d'exécuter le bot

### 1. Cloner le repo

Ouvrez le terminal de votre ordinateur :

-   `Invite de commandes`/`Powershell` sur Windows
-   `Terminal` sur MacOS
-   Dépend de la distribution sur Linux

Ensuite, tapez la commande suivante :
`git clone https://github.com/Nuit-Bot/service.git`

puis
`cd service`

### 2. Préparer le bot

Ouvrez [Discord Developers](https://discord.com/developers/applications) et créez un bot.

> [!NOTE]
> Si vous ne savez pas faire, suivez **uniquement l'étape 1** de [ce lien](https://discord.com/developers/docs/quick-start/getting-started#step-1-creating-an-app).

Ensuite, créez un fichier `.env` dans le dossier `service` et remplissez-le avec :

```
DISCORD_TOKEN=<votre token ici>
DISCORD_CLIENT_ID=<votre client ID ici>
```

Ces deux valeurs se trouvent dans la page de développeurs de votre bot Discord.

### 3. Préparer la base de données

Tout dans Nuit tiens sur une base de données [Supabase](https://supabase.com), donc il faudra vous en procurer une pour utiliser le bot.

En premier, il faudra rajouter ceci au `.env` :

```
SUPABASE_URL=<votre URL ici>
SUPABASE_ANON_KEY=<votre clé ici>
DATABASE_URL=<votre URL ici>
```

Remplacez l'URL par celle qui vous est proposée pas Supabase (se termine par `.supabase.co` (et pas .com !))
Et votre clé devrait se trouver juste en dessous.

L'URL de votre base de données Supabase se trouve en haut de votre écran en cliquant `Connect` puis en copiant le texte à droite du popup.

> [!NOTE]
> Si vous ne savez pas faire, suivez [ce lien](https://supabase.com/docs/guides/database/connecting-to-postgres#direct-connection)

Sachant que il y a plusieurs tables à créer avec des colonnes spécifiques, nous ferons un programme qui automatisera ceci plus tard.

### 4. Préparer l'environnement

Dans votre fenêtre de terminal, tapez la commande :
`npm install`
Ceci va installer tout ce que Nuit a besoin pour fonctionner.

### 5. Exécuter le bot

Pour démarrer le bot, tapez la commande :
`npm start`

Et voilà ! Votre bot est en ligne !

## Comment contribuer

Suivez [CONTRIBUTING.md](./CONTRIBUTING.md)
