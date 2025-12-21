import { Events, MessageFlags } from 'discord.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Aucune commande trouvée avec le nom : ${interaction.commandName}.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: '# Oups !\n\nUne erreur est survenue lors de l\'exécution de cette commande !',
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.reply({
                    content: '# Oups !\n\nUne erreur est survenue lors de l\'exécution de cette commande !',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
};