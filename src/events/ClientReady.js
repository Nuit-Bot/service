import { Events } from 'discord.js';
import chalk from 'chalk';

export default {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`${chalk.green('En ligne !')}
${chalk.green('-   Utilisateur :')} ${client.user.tag}
${chalk.green('-   ID :')} ${client.user.id}
${chalk.green('-   Serveurs :')} ${client.guilds.cache.size}
${chalk.green('-   Commandes :')} ${client.commands.size}`);
    },
};