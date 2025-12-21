import { Events } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`En ligne ! Connecté en tant que ${client.user.tag}`);
    },
};