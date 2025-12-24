import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, PermissionsBitField, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Révoque le bannissement d\'un utilisateur.')
        .addStringOption(option => 
            option.setName('userid')
                .setDescription('L\'ID de l\'utilisateur à débannir')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('raison')
                .setDescription('Raison du débannissement')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // verification permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.editReply({ 
                content: '# Accès refusé\nTu n\'as pas la permission de débannir des membres.'
            });
        }

        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

        // simple verification si l'id ressemble a un id
        if (!/^\d{17,20}$/.test(userId)) {
            return interaction.editReply({ content: 'ID utilisateur invalide.' });
        }

        // preparation de la confirmation
        const embed = new EmbedBuilder()
            .setTitle("Confirmation requise")
            .setDescription(`Voulez-vous vraiment débannir l'utilisateur **${userId}** ?\n\n**Raison :** ${reason}`)
            .setColor(0x00FF00);

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
                try {
                    // on essaie de debannir
                    await interaction.guild.members.unban(userId, reason);
                    await confirmation.update({ 
                        content: `✅ L'utilisateur **${userId}** a été débanni.`, 
                        embeds: [], 
                        components: [] 
                    });
                } catch (error) {
                    console.error(error);
                    if (error.code === 10026) { // unknown ban
                        await confirmation.update({ 
                            content: 'Cet utilisateur n\'est pas banni.', 
                            embeds: [], 
                            components: [] 
                        });
                    } else {
                        await confirmation.update({ 
                            content: 'Impossible de débannir cet utilisateur. Vérifie l\'ID et mes permissions.', 
                            embeds: [], 
                            components: [] 
                        });
                    }
                }
            } else {
                await confirmation.update({ content: 'Action annulée.', embeds: [], components: [] });
            }
        } catch {
            await interaction.editReply({ content: 'Temps écoulé, action annulée.', embeds: [], components: [] });
        }
    }
};

