import { SlashCommandBuilder, ChannelType, PermissionsBitField, MessageFlags } from 'discord.js';
import { getSupabaseClient } from '../../utility/supabase.js';

const supabase = getSupabaseClient();

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('gérer la configuration du serveur.')
        .addSubcommandGroup(group =>
            group
                .setName('logs')
                .setDescription('configuration des logs.')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('définir le salon de logs.')
                        .addChannelOption(option =>
                            option
                                .setName('salon')
                                .setDescription('le salon où envoyer les logs')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)
                        )
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // verification des permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.editReply({ 
                content: '# accès refusé\nvous n\'avez pas la permission de gérer le serveur.' 
            });
        }

        const group = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (group === 'logs') {
            if (subcommand === 'set') {
                const channel = interaction.options.getChannel('salon');

                // upsert dans supabase
                const { error } = await supabase
                    .from('guild_configs')
                    .upsert({
                        guild_id: guildId, 
                        log_channel_id: channel.id 
                    }, { onConflict: 'guild_id' });

                if (error) {
                    console.error(error);
                    return interaction.editReply({
                        content: 'une erreur est survenue lors de la sauvegarde de la configuration.' 
                    });
                }

                return interaction.editReply({
                    content: `✅ le salon de logs a été défini sur ${channel}.` 
                });
            }
        }
    }
};
