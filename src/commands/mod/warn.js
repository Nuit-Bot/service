import { MessageFlags, SlashCommandBuilder } from "discord.js";
import warn from "../../modules/warn.js";
import { sendLog } from '../../modules/logs.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Avertis un utilisateur ou gérer les avertissements.')
        .addSubcommand(subcommand => subcommand
            .setName('add')
            .setDescription('Avertis un utilisateur.')
            .addUserOption(option => option
                .setName("utilisateur")
                .setDescription("L'utilisateur à avertir")
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName("raison")
                .setDescription("La raison pour laquelle l'utilisateur est averti.")
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName('remove')
            .setDescription('Supprime un avertissement d\'un utilisateur.')
            .addUserOption(option => option
                .setName("utilisateur")
                .setDescription("L'utilisateur dont l\'avertissement doit être supprimé")
                .setRequired(true)
            )
            .addIntegerOption(option => option
                .setName("avertissement")
                .setDescription("L\'identifiant de l\'avertissement à supprimer")
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName('list')
            .setDescription('Liste les avertissements d\'un utilisateur.')
            .addUserOption(option => option
                .setName("utilisateur")
                .setDescription("L\'utilisateur dont les avertissements doivent être listés")
                .setRequired(true)
            )
        ),

    async execute(interaction) {
        // defer
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (interaction.member.permissions.has('ManageGuild') === false) {
            interaction.editReply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', flags: MessageFlags.Ephemeral });
            return;
        }

        // variables
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser("utilisateur");
        const reason = interaction.options.getString("raison");
        const userId = user.id;
        const adminId = interaction.user.id;
        const serverId = interaction.guild.id;
        const warnId = interaction.options.getInteger("avertissement");

        const targetMember = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (targetMember) {
            if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.editReply("# Mince, alors !\n\nL'utilisateur a un rôle supérieur ou égal au bot, il ne peut pas être averti.");
            }
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.editReply("# Mince, alors !\n\nTu ne peux pas avertir ce membre car il est supérieur ou égal à toi.");
            }
        }

        if (subcommand === 'add') {
            // avertissement de l\'utilisateur
            const result = await warn.add(userId, adminId, serverId, reason);

            if (result === 0) { // succès
                console.log(`Utilisateur ${userId} averti par ${adminId} pour la raison ${reason} dans le serveur ${serverId}`);
                await sendLog(interaction.guild, 'warn', user, interaction.user, reason);
                interaction.editReply({ content: 'Utilisateur averti.', flags: MessageFlags.Ephemeral });
            } else { // errreur (result = code d\'erreur)
                console.error(result);
                interaction.editReply({ content: 'Une erreur est survenue.', flags: MessageFlags.Ephemeral });
            }
        } else if (subcommand === 'remove') {
            // suppression de l\'avertissement de l\'utilisateur
            const result = await warn.remove(userId, serverId, warnId);

            if (result === 0) { // succès
                console.log(`Avertissement supprimé pour l\'utilisateur ${userId} par ${adminId} dans le serveur ${serverId}`);
                // note: on ne loggue pas encore la suppression de warn via sendLog car sendLog ne gère pas 'unwarn' explicitement dans le switch, mais on pourrait l'ajouter
                interaction.editReply({ content: 'Avertissement supprimé', flags: MessageFlags.Ephemeral });
            } else { // errreur (result = code d\'erreur)
                console.error(result);
                interaction.editReply({ content: 'Une erreur est survenue.', flags: MessageFlags.Ephemeral });
            }
        } else if (subcommand === 'list') {
            // liste des avertissements de l\'utilisateur
            const warnings = await warn.list(userId, serverId);

            if (!Array.isArray(warnings) || warnings.length === 0) { // aucun avertissement ou erreur
                console.log(`Aucun avertissement (ou erreur) pour l\'utilisateur ${userId} dans le serveur ${serverId}`);
                interaction.editReply({ content: 'Aucun avertissement pour cet utilisateur.', flags: MessageFlags.Ephemeral });
            } else {
                interaction.editReply({
                    content: `Avertissements de ${user.toString()}:\n${warnings.map(w => {
                        const dateVal = w.created_at;
                        const dateObj = new Date(dateVal);

                        const dateStr = !isNaN(dateObj.getTime())
                            ? `<t:${Math.floor(dateObj.getTime() / 1000)}:f>`
                            : 'Date inconnue';

                        return `- ID: ${w.id}, Raison: ${w.message || 'Aucune'}, Modérateur: <@${w.admin_id}>, Date: ${dateStr}`;
                    }).join('\n')}`,
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
