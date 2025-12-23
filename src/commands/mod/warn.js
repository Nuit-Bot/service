import { MessageFlags, SlashCommandBuilder } from "discord.js";
import warn from "../../modules/warn.js";

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Avertis un utilisateur.')
        .addUserOption(option => option
            .setName("utilisateur")
            .setDescription("L'utilisateur à avertir")
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName("raison")
            .setDescription("La raison pour avertir l'utilisateur.")
        ),

    async execute(interaction) {
        // defer
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // variables
        const user = interaction.options.getUser("utilisateur");
        const reason = interaction.options.getString("raison");
        const userId = user.id;
        const adminId = interaction.user.id;
        const serverId = interaction.guild.id;

        // avertissement de l'utilisateur
        const result = await warn.add(userId, adminId, serverId, reason);

        if (result === 0) { // succès
            console.log(`Utilisateur ${userId} averti par ${adminId} pour la raison ${reason} dans le serveur ${serverId}`);
            interaction.editReply({ content: 'Utilisateur averti.', flags: MessageFlags.Ephemeral });
        } else { // errreur (result = code d'erreur)
            console.error(result);
            interaction.editReply({ content: 'Une erreur est survenue.', flags: MessageFlags.Ephemeral });
        }
    }
};