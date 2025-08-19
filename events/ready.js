import { Events } from 'discord.js';

export default {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`👍 Connecté en tant que ${client.user.tag}.`);
	},
};
