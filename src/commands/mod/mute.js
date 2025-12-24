import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { sendLog } from '../../modules/logs.js';

export default {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Gérer les exclusions temporaires (Timeouts).')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Rendre muet un utilisateur temporairement.')
                .addUserOption(option => option.setName('utilisateur').setDescription('L\'utilisateur à rendre muet').setRequired(true))
                .addStringOption(option => option.setName('duree').setDescription('Durée (ex: 10m, 1h, 1d)').setRequired(true))
                .addStringOption(option => option.setName('raison').setDescription('Raison du mute').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Rendre la parole à un utilisateur.')
                .addUserOption(option => option.setName('utilisateur').setDescription('L\'utilisateur à unmute').setRequired(true))
                .addStringOption(option => option.setName('raison').setDescription('Raison du unmute').setRequired(false))
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // vérification des permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.editReply({
                content: '# Accès refusé\nTu n\'as pas la permission de gérer les membres (Timeout).'
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('utilisateur');
        const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.editReply({ content: 'Impossible de trouver ce membre sur le serveur.' });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply({ content: 'Tu ne peux pas gérer ce membre car il est supérieur ou égal à toi.' });
        }

        let ms = null;
        let durationInput = '';

        if (subcommand === 'add') {
            durationInput = interaction.options.getString('duree');
            ms = parseDuration(durationInput);

            if (!ms || ms > 28 * 24 * 60 * 60 * 1000) {
                return interaction.editReply({ content: 'Durée invalide. Utilise `10m`, `1h`, `1d` (max 28j).' });
            }
        } else if (subcommand === 'remove' && !member.isCommunicationDisabled()) {
            return interaction.editReply({ content: 'Ce membre n\'est pas muet.' });
        }

        // préparation de la confirmation
        const actionText = subcommand === 'add' ? `rendre muet pour **${durationInput}**` : 'rendre la parole à';
        const embed = new EmbedBuilder()
            .setTitle("Confirmation requise")
            .setDescription(`Voulez-vous vraiment ${actionText} <@${targetUser.id}> ?\n\n**Raison :** ${reason}`)
            .setColor(subcommand === 'add' ? 0xFFA500 : 0x00FF00);

        const confirm = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirmer')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);

        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Annuler')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(confirm, cancel);

        const réponse = await interaction.editReply({
            embeds: [embed],
            components: [row]
        });

        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await réponse.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            if (confirmation.customId === 'confirm') {
                if (subcommand === 'add') {
                    await member.timeout(ms, reason);
                    await sendLog(interaction.guild, 'mute', targetUser, interaction.user, reason, durationInput);
                    await confirmation.update({ content: `✅ **${targetUser.tag}** a été rendu muet.`, embeds: [], components: [] });
                } else {
                    await member.timeout(null, reason);
                    await sendLog(interaction.guild, 'unmute', targetUser, interaction.user, reason);
                    await confirmation.update({ content: `🔊 La parole a été rendue à **${targetUser.tag}**.`, embeds: [], components: [] });
                }
            } else {
                await confirmation.update({ content: 'Action annulée.', embeds: [], components: [] });
            }
        } catch (e) {
            console.error(e);

            await interaction.editReply({ content: 'Temps écoulé, action annulée.', embeds: [], components: [] });
        }
    }
};

function parseDuration(str) {
    if (!str) return null;
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}
