const joinedServers = document.getElementById('joined_servers');
const unjoinedServers = document.getElementById('unjoined_servers');
const serverTemplate = document.getElementById('server');

function fetchGuilds() {
    fetch('/api/servers/fetch', { redirect: 'manual' })
        .then(response => {
            if (response.type === 'opaqueredirect' || response.status === 302) {
                window.location.href = '/auth/discord';
                return null;
            }
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!data) return;
            data.forEach(guild => {
                const server = serverTemplate.content.cloneNode(true);
                const btn = server.querySelector('button');
                btn.querySelector('.server__name').textContent = guild.name;
                btn.setAttribute("data-id", guild.id);
                const icon = btn.querySelector('.server__icon');
                if (guild.icon) {
                    icon.setAttribute("src", `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=80&quality=lossless`);
                } else {
                    icon.setAttribute("src", `https://ui-avatars.com/api/?name=${encodeURIComponent(guild.name)}&background=00000000&color=fff&size=80`);
                }
                icon.setAttribute("alt", guild.name);
                if (guild.botInGuild) {
                    btn.addEventListener('click', () => {
                        window.location.href = `/servers/${guild.id}`;
                    });
                    joinedServers.appendChild(server);
                } else {
                    btn.addEventListener('click', () => {
                        window.location.href = `/auth/discord?guild_id=${guild.id}&redirect_uri=/servers/${guild.id}`;
                    });
                    unjoinedServers.appendChild(server);
                }
            });
            document.getElementById("loading_text").style.display = "none";
        })
        .catch(error => {
            console.error('Error fetching guilds:', error);
        });
}

fetchGuilds();