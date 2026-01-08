import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, ThreadAutoArchiveDuration } from "discord.js";
import { getSupabaseClient } from "../utility/supabase.js";

const supabase = getSupabaseClient();

async function send(interaction, serverId, channelId, ticketSetupId) {
    const { data: ticketCreateMessage, error: ticketCreateMessageError } = await supabase
        .from('messages')
        .select('*')
        .eq('guild_id', serverId)
        .eq('channel_id', channelId)
        .like('type', `ticket_create_${ticketSetupId}`)
        .single();

    if (ticketCreateMessageError) {
        console.error('Error fetching ticket create message:', ticketCreateMessageError);
        return;
    }

    if (!ticketCreateMessage) { console.error('Ticket create message not found'); return; }

    const channel = await interaction.guild.channels.fetch(channelId);
    if (!channel) {
        console.error('Channel not found');
        return;
    }

    const ticketCreateButton = new ButtonBuilder()
        .setCustomId(`ticket_create_${ticketSetupId}`)
        .setLabel('Créer un ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫');

    const row = new ActionRowBuilder()
        .addComponents(ticketCreateButton);

    try {
        const potentialMessage = await channel.messages.fetch(ticketCreateMessage.id);

        const message = potentialMessage;

        await message.edit({
            content: ticketCreateMessage.content,
            embeds: typeof ticketCreateMessage.embeds === 'string' ? JSON.parse(ticketCreateMessage.embeds) : ticketCreateMessage.embeds,
            components: [row]
        });

    } catch (error) {
        // message introuvable, envoyons le
        const message = await channel.send({
            content: ticketCreateMessage.content,
            embeds: typeof ticketCreateMessage.embeds === 'string' ? JSON.parse(ticketCreateMessage.embeds) : ticketCreateMessage.embeds,
            components: [row]
        });

        const { error: messageIdUpdateError } = await supabase
            .from('messages')
            .update({ id: message.id, content: message.content, embeds: JSON.stringify(message.embeds) })
            .eq('guild_id', serverId)
            .eq('channel_id', channelId)
            .like('type', `ticket_create_${ticketSetupId}`);

        if (messageIdUpdateError) {
            console.error('Error updating message ID:', messageIdUpdateError);
        }

        interaction.editReply({ content: `Message envoyé dans <#${message.channelId}>` });
    }
}

async function create(interaction, serverId, channelId, ticketSetupId) {
    const channel = interaction.guild.channels.fetch(channelId);

    if (!channel) {
        console.error('Channel not found');
        return;
    }

    const { data: ticketOpenMessage, error: ticketOpenMessageError } = await supabase
        .from('messages')
        .select('*')
        .eq('guild_id', serverId)
        .eq('channel_id', channelId)
        .like('type', `ticket_open_${ticketSetupId}`)
        .single();

    if (ticketOpenMessageError) {
        if (ticketOpenMessageError.code = 'PGRST116') {
            console.error('Impossible de trouver le message de ticket ouvert');
            return;
        }
        console.error('Error while looking for open ticket message : ', ticketOpenMessageError);
        return;
    }

    const thread = await channel.threads.create({
        name: `ticket-${interaction.user.username}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
        reason: `Ticket ouvert par ${interaction.user.username}`,
        message: {
            content: ticketOpenMessage.content,
            embeds: JSON.parse(ticketOpenMessage.embeds)
        },
        type: ChannelType.PrivateThread
    });

    interaction.editReply({ content: `Votre ticket a été ouvert dans le fil <#${thread.id}>` });
}

export default {
    send,
    create
};