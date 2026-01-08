import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';
import tickets from '../../modules/tickets.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tickets-message-creer')
        .setDescription('Envoie le message de création de ticket dans le salon.'),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await tickets.send(interaction, interaction.guildId, interaction.channelId, 1);
    },
};