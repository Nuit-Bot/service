const serverId = window.location.pathname.split('/')[2];
const serverIcon = document.getElementById('serverInfo').querySelector('img');
const serverName = document.getElementById('serverInfo').querySelector('h3');
const sidebar = document.getElementById('sidebar');

if (!(new URL(window.location.href).searchParams.get('config')) != '') {
    const url = new URL(window.location.href);
    url.searchParams.set('config', 'moderation');
    window.history.pushState({}, '', url.toString());
}

fetch('/api/servers/icon?server_id=' + serverId)
    .then(response => response.json())
    .then(data => {
        if (data.icon) {
            serverIcon.setAttribute("src", `https://cdn.discordapp.com/icons/${serverId}/${data.icon}.webp?size=64&quality=lossless`);
            serverIcon.setAttribute("alt", serverName.textContent);
        } else {
            serverIcon.setAttribute("src", `https://ui-avatars.com/api/?name=${encodeURIComponent(serverName.textContent)}&background=00000000&color=fff&size=80`);
            serverIcon.setAttribute("alt", serverName.textContent);
        }
    })
    .catch(error => {
        console.error('Erreur lors de la récupération de l\'icône du serveur :', error);
    });

fetch('/api/servers/name?server_id=' + serverId)
    .then(response => response.json())
    .then(data => {
        document.title = data.name + ' - Nuit';
        serverName.textContent = data.name;
    })
    .catch(error => {
        console.error('Erreur lors de la récupération du nom du serveur :', error);
    });

function loadContent() {
    const config = new URL(window.location.href).searchParams.get('config');
    if (config) {
        document.getElementById(config).classList.add('active');

        fetch("/config/" + config + ".html")
            .then(response => response.text())
            .then(html => {
                const contentDiv = document.getElementById('content');
                contentDiv.innerHTML = html.replace(/__SERVER_ID__/g, serverId); // remplacer l'espace reserve par l'identifiant du serveur
                
                const scriptElements = contentDiv.querySelectorAll('script');
                scriptElements.forEach(script => {
                    const newScript = document.createElement('script');
                    if (script.src) {
                        newScript.src = script.src;
                    } else {
                        newScript.textContent = script.textContent;
                    }
                    contentDiv.appendChild(newScript);
                    script.remove(); // nettoyer le script inactif
                });
            })
            .catch(error => {
                console.error('Erreur lors du chargement du contenu :', error);
            });

    }
}

for (const element of sidebar.children) {
    if (element.classList.contains('sidebar_item')) {
        element.addEventListener('click', () => {
            const url = new URL(window.location.href);
            url.searchParams.set('config', element.id);
            window.history.pushState({}, '', url.toString());
        });
    }
}

loadContent();