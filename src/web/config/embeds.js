(function() {
    // état
    const state = {
        content: '',
        embeds: [] // tableau d'objets embed
    };

    // éléments dom
    const inputContent = document.getElementById('input-content');
    const embedsList = document.getElementById('embeds-list');
    const previewContent = document.getElementById('preview-content');
    const previewEmbedsContainer = document.getElementById('preview-embeds-container');
    const channelSelect = document.getElementById('message-send-channel');
    const sendBtn = document.getElementById('message-send-btn');
    const container = document.getElementById('embeds-container');

    const updateSendBtn = () => {
        if (!sendBtn || !channelSelect) return;
        const hasContent = state.content.trim() !== '' || state.embeds.some(e => 
            e.title || e.description || e.authorName || e.image || e.thumbnail || e.footerText
        );
        sendBtn.disabled = channelSelect.value === 'none' || !hasContent;
    };

    // chargement des salons
    if (container && channelSelect) {
        const serverId = container.dataset.serverId;
        fetch(`/api/servers/${serverId}/channels`)
            .then(res => res.json())
            .then(channels => {
                channels.forEach(channel => {
                    const option = document.createElement('option');
                    option.value = channel.id;
                    option.textContent = `#${channel.name}`;
                    channelSelect.appendChild(option);
                });
            })
            .catch(err => console.error('erreur lors de la récupération des salons :', err));

        channelSelect.addEventListener('change', updateSendBtn);
        updateSendBtn();

        sendBtn.addEventListener('click', async () => {
            const serverId = container.dataset.serverId;
            const channelId = channelSelect.value;

            if (channelId === 'none') return;

            sendBtn.disabled = true;
            const originalText = sendBtn.textContent;
            sendBtn.textContent = 'Envoi...';

            try {
                const response = await fetch('/api/embeds/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        serverId,
                        channelId,
                        content: state.content,
                        embeds: state.embeds
                    })
                });

                if (response.ok) {
                    sendBtn.textContent = 'Envoyé !';
                    setTimeout(() => {
                        sendBtn.textContent = originalText;
                        updateSendBtn();
                    }, 2000);
                } else {
                    const error = await response.json();
                    alert('Erreur : ' + (error.error || 'Impossible d\'envoyer le message'));
                    sendBtn.textContent = originalText;
                    updateSendBtn();
                }
            } catch (err) {
                console.error('erreur lors de l\'envoi :', err);
                alert('Erreur lors de l\'envoi');
                sendBtn.textContent = originalText;
                updateSendBtn();
            }
        });
    }

    // chargement initial
    if (inputContent) {
        inputContent.addEventListener('input', (e) => {
            state.content = e.target.value;
            renderPreview();
        });
    }

    // rendre la fonction addEmbed disponible globalement pour le bouton onclick
    window.addEmbed = function() {
        const embedId = Date.now();
        const embedData = {
            id: embedId,
            authorName: '', authorUrl: '', authorIcon: '',
            title: '', titleUrl: '', description: '', color: '#5865F2',
            image: '', thumbnail: '',
            footerText: '', footerIcon: '', timestamp: false
        };
        state.embeds.push(embedData);
        renderEmbedEditor(embedData, state.embeds.length - 1);
        renderPreview();
    };

    // rendre la fonction deleteEmbed disponible globalement
    window.deleteEmbed = function(index) {
        state.embeds.splice(index, 1);
        // re-rendre tous les éditeurs pour mettre à jour les indices
        embedsList.innerHTML = '';
        state.embeds.forEach((embed, idx) => renderEmbedEditor(embed, idx));
        renderPreview();
    };

    // rendre la fonction toggleSection disponible globalement
    window.toggleSection = function(header) {
        const content = header.nextElementSibling;
        content.classList.toggle('hidden');
        header.classList.toggle('active');
    };

    // rendre un seul éditeur d'embed
    function renderEmbedEditor(data, index) {
        const editor = document.createElement('div');
        editor.className = 'embed-editor';
        editor.innerHTML = `
            <div class="embed-header">
                <h2>Embed ${index + 1}</h2>
                <button class="btn btn-danger" onclick="deleteEmbed(${index})" title="Supprimer">
                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
            
            <!-- Sections -->
            <div class="section">
                <div class="section-header" onclick="toggleSection(this)">Auteur</div>
                <div class="section-content hidden">
                    <div class="form-group">
                        <label>Nom de l'auteur</label>
                        <input type="text" data-field="authorName" value="${data.authorName}">
                    </div>
                    <div class="form-group">
                        <label>URL du profil</label>
                        <input type="text" data-field="authorUrl" value="${data.authorUrl}">
                    </div>
                    <div class="form-group">
                        <label>URL de l'icône de l'auteur</label>
                        <input type="text" data-field="authorIcon" value="${data.authorIcon}">
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-header active" onclick="toggleSection(this)">Corps</div>
                <div class="section-content">
                    <div class="form-group">
                        <label>Titre</label>
                        <input type="text" data-field="title" value="${data.title}">
                    </div>
                    <div class="form-group">
                        <label>URL du titre</label>
                        <input type="text" data-field="titleUrl" value="${data.titleUrl}">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea data-field="description" rows="6">${data.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Couleur (Hex)</label>
                        <input type="color" data-field="color" value="${data.color}" style="width: 100%; height: 40px; padding: 0; background: none; border: none;">
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-header" onclick="toggleSection(this)">Images</div>
                <div class="section-content hidden">
                    <div class="form-group">
                        <label>URL de l'image</label>
                        <input type="text" data-field="image" value="${data.image}">
                    </div>
                    <div class="form-group">
                        <label>URL de la miniature</label>
                        <input type="text" data-field="thumbnail" value="${data.thumbnail}">
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-header" onclick="toggleSection(this)">Pied de page</div>
                <div class="section-content hidden">
                    <div class="form-group">
                        <label>Texte du pied de page</label>
                        <input type="text" data-field="footerText" value="${data.footerText}">
                    </div>
                    <div class="form-group">
                        <label>URL de l'icône du pied de page</label>
                        <input type="text" data-field="footerIcon" value="${data.footerIcon}">
                    </div>
                    <div class="form-group">
                        <label>Horodatage</label>
                        <input type="checkbox" data-field="timestamp" ${data.timestamp ? 'checked' : ''}> Afficher l'horodatage
                    </div>
                </div>
            </div>
        `;

        // attacher des écouteurs aux entrées dans cet éditeur
        const inputs = editor.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const field = e.target.dataset.field;
                if (field) {
                    if (input.type === 'checkbox') {
                        state.embeds[index][field] = input.checked;
                    } else {
                        state.embeds[index][field] = e.target.value;
                    }
                    renderPreview();
                }
            });
        });

        embedsList.appendChild(editor);
    }

    function renderPreview() {
        // rendre le contenu du message
        previewContent.innerHTML = parseMarkdown(state.content);

        // rendre les embeds
        previewEmbedsContainer.innerHTML = '';
        state.embeds.forEach(embed => {
            const hasEmbedContent = embed.title || embed.description || embed.authorName || embed.image || embed.thumbnail || embed.footerText;
            if (!hasEmbedContent) return;

            const el = document.createElement('div');
            el.className = 'discord-embed';
            el.style.borderLeftColor = embed.color;

            let authorHtml = '';
            if (embed.authorName) {
                const icon = embed.authorIcon ? `<img src="${embed.authorIcon}" style="display:block;">` : '';
                const name = embed.authorUrl 
                    ? `<a href="${embed.authorUrl}" target="_blank">${embed.authorName}</a>`
                    : `<span>${embed.authorName}</span>`;
                authorHtml = `<div class="embed-author">${icon}${name}</div>`;
            }

            let titleHtml = '';
            if (embed.title) {
                const titleText = parseMarkdown(embed.title);
                if (embed.titleUrl) {
                    titleHtml = `<a class="embed-title" href="${embed.titleUrl}" target="_blank" style="color: #00b0f4;">${titleText}</a>`;
                } else {
                    titleHtml = `<span class="embed-title" style="color: whitesmoke;">${titleText}</span>`;
                }
            }

            let descHtml = embed.description ? `<div class="embed-description">${parseMarkdown(embed.description)}</div>` : '';
            
            let imageHtml = embed.image ? `<img class="embed-image" src="${embed.image}">` : '';
            let thumbHtml = embed.thumbnail ? `<img class="embed-thumbnail" src="${embed.thumbnail}">` : '';

            let footerHtml = '';
            if (embed.footerText || embed.timestamp) {
                let text = embed.footerText || '';
                if (embed.timestamp) {
                    if (text) text += ' • ';
                    text += "Aujourd'hui à " + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                }
                const icon = embed.footerIcon ? `<img src="${embed.footerIcon}" style="display:block;">` : '';
                footerHtml = `<div class="embed-footer">${icon}<span>${text}</span></div>`;
            }

            // construire la disposition interne
            el.innerHTML = `
                <div class="embed-grid">
                    <div class="embed-inner">
                        ${authorHtml}
                        ${titleHtml}
                        ${descHtml}
                        ${imageHtml}
                        ${footerHtml}
                    </div>
                    ${thumbHtml}
                </div>
            `;
            
            previewEmbedsContainer.appendChild(el);
        });

        updateSendBtn();
    }

    function parseMarkdown(text) {
        if (!text) return '';
        let html = text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // en-têtes et listes
        let lines = html.split('\n');
        let processedLines = lines.map(line => {
            if (line.startsWith('### ')) return '<h3>' + line.substring(4) + '</h3>';
            if (line.startsWith('## ')) return '<h2>' + line.substring(3) + '</h2>';
            if (line.startsWith('# ')) return '<h1>' + line.substring(2) + '</h1>';
            if (line.startsWith('- ') || line.startsWith('* ')) return '<li>' + line.substring(2) + '</li>';
            if (line.startsWith('> ')) return '<blockquote>' + line.substring(2) + '</blockquote>';
            return line + '<br>';
        });
        html = processedLines.join('');
        html = html.replace(/((?:<li>.*?<\/li>)+)/g, '<ul>$1</ul>');

        html = html
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<s>$1</s>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
            
        html = html.replace(/<\/h[1-3]><br>/g, (match) => match.replace('<br>', ''));
        html = html.replace(/<\/ul><br>/g, '</ul>');
        html = html.replace(/<\/blockquote><br>/g, '</blockquote>');

        return html;
    }

    function updateTime() {
        const now = new Date();
        const timeString = "Aujourd'hui à " + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const timeEl = document.getElementById('msg-timestamp');
        if(timeEl) timeEl.textContent = timeString;
        
        // re-rendre pour mettre à jour les horodatages du pied de page si actif
        if (state.embeds.some(e => e.timestamp)) {
            renderPreview();
        }
    }

    // init
    window.addEmbed(); // commencer avec un embed
    
    // Nettoyage de l'intervalle si le script est rechargé (optionnel mais bon pour la mémoire)
    if (window.embedTimer) clearInterval(window.embedTimer);
    window.embedTimer = setInterval(updateTime, 1000);
    updateTime();

})();