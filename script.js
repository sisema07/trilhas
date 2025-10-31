// script.js - CÓDIGO COMPLETO REVISADO (IDÊNTICO À ÚLTIMA VERSÃO FUNCIONAL)

// VARIÁVEIS GLOBAIS (Serão preenchidas após o fetch)
let DADOS_PARQUES = [];
let ATIVIDADES_PARQUES = {};
let estadoUsuario = JSON.parse(localStorage.getItem('trilhasDeMinasStatus')) || {};
let scrollPosition = 0; // Armazena a posição do scroll antes de abrir a área secundária

function salvarEstado() {
    localStorage.setItem('trilhasDeMinasStatus', JSON.stringify(estadoUsuario));
}

// --- PWA/OFFLINE: Service Worker Registration ---
function registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registrado: ', reg))
            .catch(err => console.error('Erro ao registrar Service Worker: ', err));
    }
}

// --- FUNÇÕES DE UX E NAVEGAÇÃO ---

/**
 * Inicia o vídeo e a lógica de transição.
 */
function iniciarApp() {
    const intro = document.getElementById('video-intro');
    const video = document.getElementById('intro-video-element');

    // Reprodução do vídeo
    video.play().catch(error => {
        console.warn("Reprodução automática bloqueada. Iniciando app após 2s.");
        setTimeout(fecharIntro, 2000);
    });

    // Função para fechar a introdução
    function fecharIntro() {
        intro.classList.add('fade-out');
        document.getElementById('app-container').style.display = 'flex'; // Exibe o app
        setTimeout(() => {
            intro.style.display = 'none';
        }, 1000); // 1s (tempo da transição CSS)
    }

    // Evento de 'ended' ou 'timeupdate'
    video.onended = fecharIntro;
    video.ontimeupdate = function() {
        // Tempo de transição de 3 segundos
        if (video.currentTime >= 3 && !intro.classList.contains('fade-out')) { 
            fecharIntro(); // Garante o fechamento após 3s se estiver sendo reproduzido
        }
    };
}

/**
 * Carrega os botões (incluindo Premiação) no grid.
 */
function carregarBotoesParques() {
    const container = document.getElementById('botoes-parques');
    container.innerHTML = '';
    
    DADOS_PARQUES.forEach(parque => {
        const btn = document.createElement('a');
        btn.href = `#${parque.id}`;
        btn.className = 'botao-parque';
        btn.dataset.parqueId = parque.id;

        if (parque.is_premio) {
            btn.id = 'btn-premiacao';
        }
        
        const iconeMarca = `<i class="icone-parque fas ${parque.icone_fundo}"></i>`;
        const iconePrincipal = `<i class="icone-parque-principal fas ${parque.icone_principal}"></i>`;
        const nome = `<span class="nome-parque">${parque.nome.replace('PE ', '')}</span>`;

        btn.innerHTML = iconeMarca + iconePrincipal + nome;
        
        // Adiciona evento para mudar o hash da URL
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = parque.id; // Isso dispara o evento 'hashchange'
        });
        
        container.appendChild(btn);
    });
}

/**
 * Exibe a área detalhada do Parque ou a Área de Premiação baseada no ID.
 */
function mostrarArea(id) {
    const areaSecundaria = document.getElementById('area-secundaria');
    const parqueDetail = document.getElementById('conteudo-parque-detalhe');
    const areaPremiacao = document.getElementById('conteudo-premios');
    const titulo = document.getElementById('secundaria-titulo');

    // Salva a posição do scroll da página principal
    scrollPosition = window.pageYOffset;
    
    areaSecundaria.classList.add('aberto');
    
    if (id === 'premiacao') {
        titulo.textContent = 'Área de Premiação';
        parqueDetail.style.display = 'none';
        areaPremiacao.style.display = 'block';
        carregarPremios(); 
    } else {
        const parque = DADOS_PARQUES.find(p => p.id === id);
        if (!parque) return;

        titulo.textContent = parque.nome;
        parqueDetail.style.display = 'block';
        areaPremiacao.style.display = 'none';

        // Preenche detalhes do parque
        document.getElementById('parque-imagem').style.backgroundImage = parque.imagem;
        document.getElementById('parque-descricao').textContent = parque.descricao || `Bem-vindo ao ${parque.nome}! Prepare-se para explorar e completar as atividades gamificadas!`;

        carregarAtividades(parque);
        areaSecundaria.scrollTo(0, 0); // Garante que a área secundária comece no topo
    }
}

/**
 * Carrega todos os ícones de atividades (apagados ou desbloqueados) na área de prêmios.
 */
function carregarPremios() {
    const listaPremios = document.getElementById('lista-icones-premios');
    listaPremios.innerHTML = '';
    let totalAtividades = 0;
    let concluidasCount = 0;

    for (const parqueId in ATIVIDADES_PARQUES) {
        const atividades = ATIVIDADES_PARQUES[parqueId];
        
        if (!estadoUsuario[parqueId]) {
             estadoUsuario[parqueId] = atividades.reduce((acc, a) => ({ ...acc, [a.id]: false }), {});
             salvarEstado();
        }

        atividades.forEach(atividade => {
            totalAtividades++;
            const isConcluida = estadoUsuario[parqueId] && estadoUsuario[parqueId][atividade.id];
            
            if (isConcluida) {
                concluidasCount++;
            }

            const card = document.createElement('div');
            card.className = `icone-premio ${isConcluida ? 'desbloqueado' : ''}`;

            card.innerHTML = `
                <i class="fas ${atividade.icone}"></i>
                <span>${atividade.nome}</span>
            `;
            listaPremios.appendChild(card);
        });
    }

    const msg = document.getElementById('msg-sem-premios');
    if (totalAtividades === 0 || concluidasCount === 0) {
        msg.style.display = 'block';
    } else {
        msg.style.display = 'none';
    }
}

/**
 * Carrega a lista de atividades para o parque selecionado.
 */
function carregarAtividades(parque) {
    const lista = document.getElementById('lista-atividades');
    lista.innerHTML = '';
    const atividades = ATIVIDADES_PARQUES[parque.id] || [];

    if (!estadoUsuario[parque.id]) {
        estadoUsuario[parque.id] = atividades.reduce((acc, a) => ({ ...acc, [a.id]: false }), {});
        salvarEstado();
    }

    atividades.forEach(atividade => {
        const isConcluida = estadoUsuario[parque.id] && estadoUsuario[parque.id][atividade.id];
        const card = document.createElement('div');
        card.className = 'atividade-card';
        card.dataset.atividadeId = atividade.id;

        const statusClass = isConcluida ? 'concluida' : '';
        const statusIcon = isConcluida ? '<i class="fas fa-check"></i>' : '<i class="fas fa-lock"></i>';
        
        card.innerHTML = `
            <div class="atividade-info">
                <div class="atividade-nome">${atividade.nome}</div>
                <div class="atividade-descricao">Leia o QR Code para registrar sua presença.</div>
            </div>
            <button class="qrcode-btn" data-parque-id="${parque.id}" data-atividade-id="${atividade.id}" ${isConcluida ? 'disabled' : ''}>
                ${isConcluida ? 'Concluído' : 'Ler QR Code'}
            </button>
            <div class="atividade-status ${statusClass}" id="status-${parque.id}-${atividade.id}">
                ${statusIcon}
            </div>
        `;
        lista.appendChild(card);
    });
    
    if (atividades.length === 0) {
         lista.innerHTML = '<p style="color: #666; font-style: italic;">Informações de atividades não disponíveis. Em breve!</p>';
    }

    // Adicionar listener aos botões QR Code
    document.querySelectorAll('.qrcode-btn').forEach(button => {
        button.addEventListener('click', function() {
            simularLeituraQR(this.dataset.parqueId, this.dataset.atividadeId);
        });
    });
}

/**
 * Simula a leitura de um QR Code e o desbloqueio da atividade.
 */
function simularLeituraQR(parqueId, atividadeId) {
    // A simulação de sucesso é mantida. Em um ambiente real, esta função faria o acesso à câmera.
    const chaveEsperada = `${parqueId}-${atividadeId}-sucesso`; 
    const chaveLida = chaveEsperada; // Simulação de leitura bem-sucedida

    if (chaveLida === chaveEsperada) {
        if (estadoUsuario[parqueId] && !estadoUsuario[parqueId][atividadeId]) {
            estadoUsuario[parqueId][atividadeId] = true;
            salvarEstado();
            
            // Atualiza a interface (melhoria de UX)
            const statusDiv = document.getElementById(`status-${parqueId}-${atividadeId}`);
            const qrcodeBtn = document.querySelector(`.qrcode-btn[data-parque-id="${parqueId}"][data-atividade-id="${atividadeId}"]`);
            
            if (statusDiv) {
                statusDiv.classList.add('concluida');
                statusDiv.innerHTML = '<i class="fas fa-check"></i>';
            }
            if (qrcodeBtn) {
                qrcodeBtn.textContent = 'Concluído';
                qrcodeBtn.disabled = true;
            }

            alert(`Parabéns! Atividade concluída! Ícone de conquista desbloqueado!`);

        } else if (estadoUsuario[parqueId] && estadoUsuario[parqueId][atividadeId]) {
            alert('Esta atividade já foi concluída!');
        }
    } else {
        alert('Chave inválida. Tente novamente no local da atividade!');
    }
}

// --- CONTROLE DE NAVEGAÇÃO E HASH ---

/**
 * Lida com a mudança do hash da URL.
 */
function lidarComHash() {
    const hash = window.location.hash.substring(1); // Remove o '#'
    if (hash) {
        mostrarArea(hash);
    } else {
        // Se o hash estiver vazio (página principal)
        document.getElementById('area-secundaria').classList.remove('aberto');
        document.getElementById('app-container').scrollIntoView();
        window.scrollTo(0, scrollPosition); // Volta para a posição anterior do scroll
    }
}

// --- FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL ---

async function inicializarApp() {
    // 1. Registro do Service Worker (para PWA/Offline)
    registrarServiceWorker();

    // 2. Carrega os Dados do JSON
    try {
        const response = await fetch('parques.json');
        const dados = await response.json();
        DADOS_PARQUES = dados.DADOS_PARQUES;
        ATIVIDADES_PARQUES = dados.ATIVIDADES_PARQUES;

        // 3. Inicializa o App
        carregarBotoesParques();
        iniciarApp();
        lidarComHash(); // Lida com a URL atual

    } catch (error) {
        console.error('Erro ao carregar dados ou inicializar:', error);
        // Exibe um erro amigável se o fetch falhar
        document.getElementById('app-container').innerHTML = '<p style="text-align: center; color: red;">Não foi possível carregar os dados dos parques. Verifique sua conexão ou se o arquivo parques.json está correto.</p>';
        document.getElementById('video-intro').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
    }

    // 4. Event Listeners
    // O botão no HTML foi escondido, mas a função de voltar no histórico é mantida aqui.
    document.getElementById('btn-voltar').addEventListener('click', () => {
        window.history.back(); // Usa a API de histórico do navegador
    });

    // 5. Listener para o botão Voltar do Navegador (incluindo swipe no mobile)
    window.addEventListener('hashchange', lidarComHash);
}

// ------------------
// INICIALIZAÇÃO
// ------------------
document.addEventListener('DOMContentLoaded', inicializarApp);
