import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { deployCommands, deployEvents } from "./deploy.js";
import { getDopplerClient } from "./utility/doppler.js";
import { getSupabaseClient } from "./utility/supabase.js";

const doppler = await getDopplerClient();
const supabase = getSupabaseClient();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Map();

deployCommands(client);
deployEvents(client);

client.login(process.env.DISCORD_TOKEN);