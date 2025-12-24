import { EmbedBuilder } from 'discord.js';
import { getSupabaseClient } from '../utility/supabase.js';

const supabase = getSupabaseClient();

/**
 * envoie un log de modération dans le salon configuré.
 * @param {Guild} guild - l'objet guild discord.
 * @param {string} action - le type d'action (ban, kick, mute, warn, unban).
 * @param {User} target - l'utilisateur ciblé.
 * @param {User} moderator - le modérateur qui a fait l'action.
 * @param {string} reason - la raison de l'action.
 * @param {string|null} duration - la durée (pour les mutes/timeouts), optionnel.
 */
export async function sendLog(guild, action, target, moderator, reason, duration = null) {
    try {
        // récupérer la config du serveur
        const { data: config, error } = await supabase
            .from('guild_configs')
            .select('log_channel_id')
            .eq('guild_id', guild.id)
            .single();

        if (error || !config || !config.log_channel_id) {
            return; // pas de config ou erreur, on ne fait rien
        }

        const logChannel = await guild.channels.fetch(config.log_channel_id).catch(() => null);
        if (!logChannel) return;

        // définition des couleurs et titres selon l'action
        let color = 0x808080; // gris par défaut
        let title = 'Action de Modération';

        switch (action) {
            case 'ban':
                color = 0xFF0000; // rouge
                title = '🔨 Bannissement';
                break;
            case 'kick':
                color = 0xFFA500; // orange
                title = '👢 Expulsion';
                break;
            case 'mute':
                color = 0xFFFF00; // jaune
                title = 'kai Muet (Timeout)';
                break;
            case 'unmute':
                color = 0x00FF00; // vert
                title = '🔊 Parole rendue';
                break;
            case 'warn':
                color = 0xFFA500; // orange
                title = '⚠️ Avertissement';
                break;
            case 'unban':
                color = 0x00FF00; // vert
                title = '🔓 Débannissement';
                break;
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: 'Utilisateur', value: `${target.tag} (<@${target.id}>)`, inline: true },
                { name: 'Modérateur', value: `${moderator.tag} (<@${moderator.id}>)`, inline: true },
                { name: 'Raison', value: reason || 'Aucune raison', inline: false }
            )
            .setTimestamp();

        if (duration) {
            embed.addFields({ name: 'Durée', value: duration, inline: true });
        }

        await logChannel.send({ embeds: [embed] });

    } catch (err) {
        console.error("erreur lors de l'envoi du log:", err);
    }
}
