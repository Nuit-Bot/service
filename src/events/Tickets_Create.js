import { Events, MessageFlags } from 'discord.js';
import tickets from '../modules/tickets.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith('ticket_create_')) return;

        const customId = interaction.customId;

        const splitCustomId = customId.split('_');
        const ticketSetupId = splitCustomId[2];

        await tickets.create(interaction, interaction.guildId, interaction.channelId, ticketSetupId);
    },
};