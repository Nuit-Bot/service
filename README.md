# Nuit

Un bot multi-fonctions pour Discord.

## Comment avoir son propre bot sur l'infra de Nuit?

En premier, il vous faudra plusieurs choses :
[Git](https://git-scm.com) : Permettra de cloner ce repo (https://github.com/Nuit-Bot/service)
[NodeJS](https://nodejs.org/fr/download) : Permettra d'exécuter le bot

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

```DISCORD_TOKEN=<votre token ici>
DISCORD_CLIENT_ID=<votre client ID ici>
```

Ces deux valeurs se trouvent dans la page de développeurs de votre bot Discord.

### 3. Préparer l'environnement

Dans votre fenêtre de terminal, tapez la commande :
`npm install`
Ceci va installer tout ce que Nuit a besoin pour fonctionner.

### 4. Exécuter le bot

Pour démarrer le bot, tapez la commande :
`npm start`

Et voilà ! Votre bot est en ligne !

## Comment contribuer

Suivez [CONTRIBUTING.md](./CONTRIBUTING.md)
