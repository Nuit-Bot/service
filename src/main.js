import { Client, GatewayIntentBits, PermissionsBitField } from "discord.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord-auth";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { deployCommands, deployEvents } from "./deploy.js";
import { getDopplerClient } from "./utility/doppler.js";
import { getSupabaseClient } from "./utility/supabase.js";
import chalk from 'chalk';
chalk.level = 1;

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

const scopes = 'identify+guilds'.split('+');

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

const PgStore = connectPgSimple(session);

app.use(session({
    store: new PgStore({
        conString: process.env.DATABASE_POOLER_URL,
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 jours
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
        req.session.redirectTo = req.query.redirect_uri;
    }
    if (req.query.scope) {
        options.scope = req.query.scope.split('+');
    }
    passport.authenticate('discord', options)(req, res, next);
});

app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    const redirect = req.session.redirectTo || '/panel/';
    delete req.session.redirectTo;
    res.redirect(redirect);
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
        console.error("Erreur lors de la récupération des serveurs :", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// panel config serveurs
app.get('/servers/:serverId', checkAuth, checkServerAccess, async (req, res) => {
    try {
        const serverId = req.params.serverId;
        const server = client.guilds.cache.get(serverId);
        if (!server) {
            return res.status(404).json({ error: 'Server introuvable' });
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
        console.error('Erreur lors de la récupération de l\'icône du serveur : ' + req.query.server_id);
    };
});

app.get('/api/servers/name', checkAuth, checkServerAccess, async (req, res) => {
    try {
        const serverId = req.query.server_id;
        const server = client.guilds.cache.get(serverId);
        res.json({ name: server.name });
    } catch (error) {
        console.error('Erreur lors de la récupération du nom du serveur : ' + req.query.server_id);
    };
});

app.listen(process.env.PORT || 3000, () => {
    console.log(chalk.green("Port " + (process.env.PORT || 3000) + " ouvert avec le panel."));
});
