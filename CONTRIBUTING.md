# Contribuer à Nuit

> [!NOTE]
> Cette partie pense que vous avez suivi [Comment avoir son propre bot sur l'infra de Nuit](./README.md#comment-avoir-son-propre-bot-sur-linfra-de-nuit).
> Si ce n'est pas le cas, veuillez le suivre avant de continuer.

## Requis

-   Tout simplement la fenêtre de terminal dans le dossier `service`

## Structure des dossiers

Tout le code se trouve dans [src](./src/) :

-   Les commandes dans [commands](./src/commands/)
-   Les évènements dans [events](./src/events/)
-   Les utilitaires dans [utility](./src/utility/)
-   Enregistrer les commandes et évènements dans [deploy.js](./src/deploy.js)
-   La partie web dans [web](./src/web/)
-   Les modules utilisés pour éviter de répéter la base de données dans [modules](./src/modules/)
