import { getSupabaseClient } from "../utility/supabase.js";

const supabase = getSupabaseClient();

/*
Ajouter un avertissement à un utilisateur
*/
async function add(userId, adminId, serverId, message) {
    // vérifier que les valeurs requises existent toutes
    // note : message n'est PAS requis, le message sera "Pas de message" si rien est donné
    if (!userId || !serverId || !adminId) {
        return;
    }

    // ajouter ceci à la table supabase
    const { error: addError } = await supabase
        .from('warns')
        .insert({
            user_id: userId,
            admin_id: adminId,
            server_id: serverId,
            message: message || 'Pas de message'
        });

    // vérification d'erreurs
    if (addError) {
        console.error(addError);
        return addError.code;
    }

    // TODO: lorsque les logs seront rajoutés, rajouter les avertissements dedans

    // succès
    return 0;
}

/*
Supprimer un avertissement à un utilisateur
*/
async function remove(userId, serverId, id) {
    // vérifier que les valeurs requises existent toutes
    if (!userId || !serverId || !id) {
        return;
    }

    // supprimer ceci de la table supabase
    const { error: removeError } = await supabase
        .from('warns')
        .delete()
        .eq('user_id', userId)
        .eq('server_id', serverId)
        .eq('id', id)
        .single();

    if (removeError) {
        console.error(removeError);
        return removeError.code;
    }

    // TODO: lorsque les logs seront rajoutés, rajouter la suppression d'avertissements dedans

    // succès
    return 0;
}

/*
Lister les avertissements d'un utilisateur
*/
async function list(userId, serverId) {
    // vérifier que les valeurs requises existent
    if (!userId || !serverId) {
        return;
    }

    // lister ceci de la table supabase
    const { data: warns, error: listError } = await supabase
        .from('warns')
        .select('*')
        .eq('user_id', userId)
        .eq('server_id', serverId)
        .order('id', { ascending: false });

    if (listError) {
        console.error(listError);
        return listError.code;
    }

    // succès
    return warns;
}

export default {
    add,
    remove,
    list
};