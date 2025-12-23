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

export default { add };