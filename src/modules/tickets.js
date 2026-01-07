import { getSupabaseClient } from "../utility/supabase.js";

const supabase = getSupabaseClient();

async function send(interaction, serverId, channelId, ticketSetupId) {
    const { data: ticketCreateMessage, error: ticketCreateMessageError } = await supabase
        .from('messages')
        .select('*')
        .eq('server_id', serverId)
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

    const potentialMessage = await channel.messages.fetch(ticketCreateMessage.id);
    if (!potentialMessage) {
        // message introuvable, envoyons le
        const message = await channel.send(ticketCreateMessage.content, { embeds: ticketCreateMessage.embeds }); // TODO: ajouter boutons pour créer le ticket

        const { error: messageIdUpdateError } = await supabase
            .from('messages')
            .update({ id: ticketCreateMessage.id, content: message.content, embeds: JSON.stringify(message.embeds) })
            .eq('server_id', serverId)
            .eq('channel_id', channelId)
            .like('type', `ticket_create_${ticketSetupId}`);

        if (messageIdUpdateError) {
            console.error('Error updating message ID:', messageIdUpdateError);
        }

    } else {
        const message = potentialMessage;

        message.edit(data.content, { embeds: data.embeds }); // TODO: ajouter boutons pour créer le ticket
    }
}

export default {
    sendTicketMsg
};