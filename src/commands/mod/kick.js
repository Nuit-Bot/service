import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import path from 'path';
import { fileURLToPath } from "url";
import 'dotenv/config';
import { sendLog } from '../../modules/logs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulse une personne.')
        .addUserOption(option => option
            .setName("utilisateur")
            .setDescription("L'utilisateur à expulser")
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName("raison")
            .setDescription("La raison pour expulser l'utilisateur.")
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.editReply({ content: '# Mais tu te crois pour qui?\n\nTu n\'a pas la permission pour utiliser cette commande!' });
        }

        const user = interaction.options.getUser("utilisateur");
        const reason = interaction.options.getString("raison") || 'Aucune raison fournie';

        // confirmation preparation
        const embed = new EmbedBuilder()
            .setTitle("Confirmation requise")
            .setDescription(`Voulez-vous vraiment expulser <@${user.id}> ?\n\n**Raison :** ${reason}`)
            .setColor(0xFFA500);

        const confirm = new ButtonBuilder()
            .setCustomId("confirm")
            .setLabel("Confirmer")
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);

        const cancel = new ButtonBuilder()
            .setCustomId("cancel")
            .setLabel("Annuler")
            .setEmoji('❌')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(confirm, cancel);

        const réponse = await interaction.editReply({
            embeds: [embed],
            components: [row],
            fetchReply: true
        });

        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await réponse.awaitMessageComponent({
                filter: collectorFilter,
                time: 60_000
            });

            if (confirmation.customId === "confirm") {
                await interaction.guild.members.kick(user, reason);
                await sendLog(interaction.guild, 'kick', user, interaction.user, reason);
                await confirmation.update({ content: `✅ **${user.tag}** a été expulsé.`, embeds: [], components: [] });
            } else if (confirmation.customId === "cancel") {
                await confirmation.update({ content: 'Action annulée.', embeds: [], components: [] });
            }
        } catch (e) {
            await interaction.editReply({ content: 'Temps écoulé, action annulée.', embeds: [], components: [] });
        }
    },
};