import { Client, GatewayIntentBits, PermissionsBitField } from "discord.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "passport"; // Import passport
import { Strategy as DiscordStrategy } from "passport-discord-auth"; // Correct import for DiscordStrategy
import session from "express-session";
import { deployCommands, deployEvents } from "./deploy.js";
import { getDopplerClient } from "./utility/doppler.js";
import { getSupabaseClient } from "./utility/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const scopes = 'identify+guilds+applications.commands+bot'.split('+');

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

passport.use(new DiscordStrategy({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URI,
    scope: scopes
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => {
        // le profile est attaché à `req.user`
        return done(null, profile);
    });
}));

const app = express();
app.use(cors());
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// `req.user` contient le profil Discord de l'utilisateur
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(302).redirect('/auth/discord');
}

// vérifie si l'utilisateur peut accéder le panel du serveur
async function checkServerAccess(req, res, next) {
    if (req.isAuthenticated()) {
        const userGuilds = req.user.guilds;
        const ownedGuilds = userGuilds.filter(guild => guild.owner);
        const hasManageServerPermission = userGuilds.some(guild => {
            const permissions = new PermissionsBitField(BigInt(guild.permissions));
            return permissions.has(PermissionsBitField.Flags.ManageGuild);
        });
        const botGuilds = client.guilds.cache;

        const serverId = req.params.serverId;
        const botInGuild = botGuilds.has(serverId);

        if (botInGuild) {
            return next();
        }
        if (hasManageServerPermission) {
            return next();
        }
        if (ownedGuilds.some(guild => guild.id === serverId)) {
            return next();
        }

        res.status(302).redirect(`/auth/discord?guild_id=${serverId}&redirect_uri=/servers/${serverId}`);
    } else {
        res.status(302).redirect('/auth/discord');
    }
}

app.use('/', express.static('src/web'));

// Discord auth
app.get('/auth/discord', (req, res, next) => {
    const options = {};
    if (req.query.guild_id) {
        options.guild_id = req.query.guild_id;
    }
    if (req.query.redirect_uri) {
        options.redirect_uri = req.query.redirect_uri;
    }
    passport.authenticate('discord', options)(req, res, next);
});

app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/panel/');
});

app.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// recherche serveurs
app.get('/api/servers/fetch', checkAuth, async (req, res) => {
    try {
        const userGuilds = req.user.guilds;
        const ownedGuilds = userGuilds.filter(guild => guild.owner);

        const botGuilds = client.guilds.cache;

        const responseGuilds = ownedGuilds.map(guild => {
            const botInGuild = botGuilds.has(guild.id);

            return {
                ...guild,
                botInGuild
            };
        });

        res.json(responseGuilds);
    } catch (error) {
        console.error("Error fetching servers:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// panel config serveurs
app.get('/servers/:serverId', checkAuth, checkServerAccess, async (req, res) => {
    try {
        const serverId = req.params.serverId;
        const server = client.guilds.cache.get(serverId);
        if (!server) {
            return res.status(404).json({ error: 'Server not found' });
        }
        res.sendFile(path.join(__dirname, 'web/servers/index.html'));
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/servers/icon', checkAuth, checkServerAccess, async (req, res) => {
    try {
        const serverId = req.query.server_id;
        const server = client.guilds.cache.get(serverId);
        res.json({ icon: server.icon });
    } catch (error) {
        console.error('Error fetching server icon for server ' + req.query.server_id);
    };
});

app.get('/api/servers/name', checkAuth, checkServerAccess, async (req, res) => {
    try {
        const serverId = req.query.server_id;
        const server = client.guilds.cache.get(serverId);
        res.json({ name: server.name });
    } catch (error) {
        console.error('Error fetching server name for server ' + req.query.server_id);
    };
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Port " + (process.env.PORT || 3000));
});
