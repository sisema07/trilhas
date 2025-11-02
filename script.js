// script.js - CÓDIGO COMPLETO REVISADO (Correção de Sintaxe e Fluxo)

let DADOS_PARQUES = [];
let ATIVIDADES_PARQUES = {};
let DETALHES_PARQUES = {}; // Variável para os detalhes dos parques
let estadoUsuario = JSON.parse(localStorage.getItem('trilhasDeMinasStatus')) || {};
let scrollPosition = 0;
let deferredPrompt; // Variável para o prompt de instalação do PWA

function salvarEstado() {
    localStorage.setItem('trilhasDeMinasStatus', JSON.stringify(estadoUsuario));
}

// --- PWA/OFFLINE: Service Worker Registration e Instalação ---

function registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registrado: ', reg))
            .catch(err => console.error('Erro ao registrar Service Worker: ', err));
    }
}

function setupPwaInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Mostra o prompt se ainda não estiver instalado e não tiver sido fechado antes.
        if (!window.matchMedia('(display-mode: standalone)').matches && localStorage.getItem('pwa_prompt_shown') !== 'true') {
            document.getElementById('install-prompt').style.display = 'block';
        }
    });

    document.getElementById('install-btn').addEventListener('click', () => {
        document.getElementById('install-prompt').style.display = 'none';
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                console.log('Escolha do usuário:', choiceResult.outcome);
                localStorage.setItem('pwa_prompt_shown', 'true');
                deferredPrompt = null;
            });
        }
    });

    document.getElementById('close-prompt').addEventListener('click', () => {
        document.getElementById('install-prompt').style.display = 'none';
        localStorage.setItem('pwa_prompt_shown', 'true');
    });
}

// --- FLUXO DE CHECK-IN VIA QR CODE ---

function processarCheckinQR() {
    const urlParams = new URLSearchParams(window.location.search);
    const checkin = urlParams.get('checkin');

    if (checkin) {
        const [parqueId, atividadeId] = checkin.split('-');
        
        if (parqueId && atividadeId && ATIVIDADES_PARQUES[parqueId]) {
            
            // Inicializa o estado para o parque e garante que a atividade exista
            if (!estadoUsuario[parqueId]) {
                estadoUsuario[parqueId] = ATIVIDADES_PARQUES[parqueId].reduce((acc, a) => ({ ...acc, [a.id]: false }), {});
            }
            
            let mensagem = `Badge "${atividadeId.toUpperCase()}" desbloqueado em ${parqueId.toUpperCase()}! `;

            if (!estadoUsuario[parqueId][atividadeId]) {
                estadoUsuario[parqueId][atividadeId] = true;
                salvarEstado();
                mensagem += 'Vá para a área de Check-ins para enviar sua foto.';
            } else {
                mensagem = `Badge "${atividadeId.toUpperCase()}" já estava desbloqueado!`;
            }

            alert(mensagem);
            
            // Limpa a URL e redireciona para a área de Check-ins
            window.history.replaceState({}, document.title, window.location.pathname);
            window.location.hash = 'premiacao';
            return true;
        }
    }
    return false;
}


// --- FUNÇÕES DE UX E NAVEGAÇÃO ---

/**
 * Inicia o vídeo e a lógica de transição.
 */
function iniciarApp() {
    const intro = document.getElementById('video-intro');
    const video = document.getElementById('intro-video-element');
    
    document.getElementById('app-container').style.display = 'flex';
    
    // Tenta dar play no vídeo
    video.play().catch(error => {
        console.error("Erro ao tentar play automático no vídeo:", error);
        setTimeout(fecharIntro, 200); // Se falhar, fecha rápido
    });

    function fecharIntro() {
        intro.classList.add('fade-out');
        setTimeout(() => {
            intro.style.display = 'none';
            // Chama a hash APÓS o vídeo estar fechado
            lidarComHash(); 
        }, 1000);
    }

    // Fecha a introdução após o fim do vídeo
    video.onended = fecharIntro;
}

/**
 * Carrega os botões na tela principal.
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
        
        // Decide se usa o ícone (Font Awesome) ou a logo (PNG)
        let iconePrincipal;
        if (parque.is_premio || !parque.logo_png) {
            iconePrincipal = `<i class="icone-parque-principal fas ${parque.icone_principal}"></i>`;
        } else {
            iconePrincipal = `<img src="${parque.logo_png}" alt="${parque.nome}" class="logo-parque-principal">`;
        }

        const nome = `<span class="nome-parque">${parque.is_premio ? parque.nome : parque.nome.replace('PE ', '')}</span>`; 

        btn.innerHTML = iconeMarca + iconePrincipal + nome;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = parque.id;
        });
        
        container.appendChild(btn);
    });
}

/**
 * Exibe a área detalhada (Parque, Check-ins, Upload), e define o botão ativo na página do parque.
 */
function mostrarArea(id, action = 'info') { 
    const areaSecundaria = document.getElementById('area-secundaria');
    const parqueDetail = document.getElementById('conteudo-parque-detalhe');
    const areaPremiacao = document.getElementById('conteudo-premios');
    const areaEnvioFoto = document.getElementById('area-envio-foto');
    const titulo = document.getElementById('secundaria-titulo');

    // Esconde todas as áreas de conteúdo
    parqueDetail.style.display = 'none';
    areaPremiacao.style.display = 'none';
    areaEnvioFoto.style.display = 'none';

    scrollPosition = window.pageYOffset;
    areaSecundaria.classList.add('aberto');
    
    // --- LÓGICA DA PÁGINA SECUNDÁRIA ---
    if (id === 'premiacao') {
        titulo.textContent = 'Check-ins';
        areaPremiacao.style.display = 'block';
        carregarPremios(); 
    } else if (id.startsWith('upload-')) {
        // Lógica de upload
        const [,, parqueId, atividadeId] = id.split('-');
        
        titulo.textContent = `Enviar Foto Badge`;
        areaEnvioFoto.style.display = 'block';
        
        document.getElementById('badge-upload-titulo').textContent = `Enviar Foto para Badge: ${parqueId.toUpperCase()} - ${atividadeId.toUpperCase()}`;
    
    } else {
        // --- Lógica da Página de Detalhes do Parque ---
        const parque = DADOS_PARQUES.find(p => p.id === id);
        const detalhes = DETALHES_PARQUES[id];
        
        if (!parque || !detalhes) return;

        titulo.textContent = parque.nome;
        parqueDetail.style.display = 'block';
        
        // --- 1. CONFIGURA IMAGEM (entradas/+id.png) ---
        document.getElementById('park-main-image').src = `entradas/${parque.id}.png`;
        
        // --- 2. CONFIGURA LOCALIZAÇÃO ---
        const locationLink = document.getElementById('park-location-link');
        locationLink.href = detalhes.map_link || '#'; 
        
        // --- 3. CONFIGURA BOTÕES E ÁREA DE CONTEÚDO ---
        const contentArea = document.getElementById('dynamic-content-area');
        const buttons = document.querySelectorAll('.action-button');
        
        // Remove a classe 'active' de todos os botões e aplica no atual
        buttons.forEach(btn => btn.classList.remove('active'));
        const activeButton = document.querySelector(`.action-button[data-action="${action}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Carrega o conteúdo dinâmico baseado na ação
        if (action === 'info') {
            contentArea.innerHTML = `<h3>Informações Gerais</h3><p>${detalhes.info_content}</p>`;
        } else if (action === 'quiz') {
            // NOVO: Renderiza a tela do Quiz
            contentArea.innerHTML = `<h3>Quiz do Parque</h3><p>O Quiz será construído aqui! O parque tem ${detalhes.quiz.length} pergunta(s).</p>`;
            // LOGICA DO QUIZ SERÁ ADICIONADA AQUI NO PRÓXIMO PASSO
        } else if (action === 'activities') {
            // NOVO: Renderiza a lista de atividades
            carregarConteudoAtividades(parque, contentArea);
        }

        // --- 4. Adiciona Listeners aos Botões de Ação (Apenas uma vez) ---
        if (!document.getElementById('info-button').dataset.listenerAdded) {
            document.querySelectorAll('.action-button').forEach(btn => {
                btn.dataset.listenerAdded = true; 
                btn.addEventListener('click', function() {
                    const newAction = this.dataset.action;
                    window.location.hash = `${parque.id}-${newAction}`;
                });
            });
        }
    }
    areaSecundaria.scrollTo(0, 0);
}

/** * Carrega todos os Badges.
 */
function carregarPremios() {
    const listaPremios = document.getElementById('lista-icones-premios');
    listaPremios.innerHTML = '';
    
    for (const parqueId in ATIVIDADES_PARQUES) {
        const atividades = ATIVIDADES_PARQUES[parqueId];
        
        if (!estadoUsuario[parqueId]) {
             // Garante que o estado do parque exista no estadoUsuario
             estadoUsuario[parqueId] = atividades.reduce((acc, a) => ({ ...acc, [a.id]: false }), {});
             salvarEstado();
        }

        atividades.forEach(atividade => {
            const isConcluida = estadoUsuario[parqueId] && estadoUsuario[parqueId][atividade.id];

            const card = document.createElement('div');
            card.className = `icone-premio ${isConcluida ? 'desbloqueado' : ''}`;
            card.dataset.parqueId = parqueId;
            card.dataset.atividadeId = atividade.id;
            
            card.innerHTML = `
                <i class="fas ${atividade.icone}"></i>
                <span>${atividade.nome}</span>
            `;
            listaPremios.appendChild(card);
            
            // Badge desbloqueado é clicável
            if (isConcluida) {
                 card.addEventListener('click', () => {
                    window.location.hash = `upload-${parqueId}-${atividade.id}`;
                 });
            }
        });
    }
}

/**
 * Carrega e exibe a lista de atividades (Badge) de um parque específico.
 * @param {object} parque - Objeto do parque (DADOS_PARQUES)
 * @param {HTMLElement} container - O elemento onde o conteúdo deve ser injetado (a #dynamic-content-area)
 */
function carregarConteudoAtividades(parque, container) {
    const atividades = ATIVIDADES_PARQUES[parque.id] || [];
    const detalhes = DETALHES_PARQUES[parque.id] || {};
    
    let html = `
        <h3>Atividades Gamificadas</h3>
        <p class="badge-description">${detalhes.badge_descricao || 'Instruções para os badges deste parque.'}</p>
        <div id="lista-atividades-dinamica" class="atividades-grid">
    `;

    if (atividades.length === 0) {
        html += '<p style="text-align: center; margin-top: 20px;">Nenhuma atividade cadastrada para este parque.</p>';
    } else {
        atividades.forEach(atividade => {
            const desbloqueado = estadoUsuario[parque.id] && estadoUsuario[parque.id][atividade.id] ? 'desbloqueado' : '';
            const badgeId = `${parque.id}-${atividade.id}`;
            
            html += `
                <div class="icone-premio ${desbloqueado}" data-badge-id="${badgeId}">
                    <i class="fas ${atividade.icone}"></i>
                    <span>${atividade.nome}</span>
                </div>
            `;
        });
    }

    html += '</div>';
    container.innerHTML = html; 

    // Adiciona listener para cliques nos ícones (para compartilhar/upload)
    document.querySelectorAll('#lista-atividades-dinamica .icone-premio.desbloqueado').forEach(icone => {
        icone.addEventListener('click', (event) => {
            const badgeId = event.currentTarget.dataset.badgeId;
            window.location.hash = `upload-${badgeId}`;
        });
    });
}
function processarCheckinQRSimulacao(urlSimulada) {
    const urlParams = new URLSearchParams(urlSimulada.split('?')[1]);
    const checkin = urlParams.get('checkin');

    if (checkin) {
        const [parqueId, atividadeId] = checkin.split('-');
        
        if (parqueId && atividadeId) {
            if (!estadoUsuario[parqueId]) {
                 estadoUsuario[parqueId] = ATIVIDADES_PARQUES[parqueId].reduce((acc, a) => ({ ...acc, [a.id]: false }), {});
            }
            
            if (!estadoUsuario[parqueId][atividadeId]) {
                estadoUsuario[parqueId][atividadeId] = true;
                salvarEstado();
                alert(`Simulação: Badge "${atividadeId}" desbloqueado!`);
            } else {
                 alert(`Simulação: Badge "${atividadeId}" já estava desbloqueado!`);
            }

            // Atualiza a UI do parque imediatamente
            mostrarArea(parqueId);
            
            // Depois do check-in, vai para a tela de Check-ins (Badges)
            window.location.hash = 'premiacao';
        }
    }
}


function lidarComHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        const parts = hash.split('-');
        const id = parts[0];
        const action = parts.length > 1 ? parts[1] : 'info'; 
        mostrarArea(id, action);
    } else {
        document.getElementById('area-secundaria').classList.remove('aberto');
    }
}

// --- FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL ---
async function inicializarApp() {
    // 1. Registro do Service Worker e PWA Prompt
    registrarServiceWorker();
    setupPwaInstallPrompt();

    // 2. Carrega os Dados do JSON
    try {
        // Carrega parques.json
        const responseParques = await fetch('parques.json');
        const dadosParques = await responseParques.json();
        DADOS_PARQUES = dadosParques.DADOS_PARQUES;
        ATIVIDADES_PARQUES = dadosParques.ATIVIDADES_PARQUES;
        
        // --- Carrega park_details.json ---
        const responseDetails = await fetch('park_details.json');
        DETALHES_PARQUES = await responseDetails.json();
        // ----------------------------------------
                
        // 3. Inicializa o App
        carregarBotoesParques();

        // 4. Processa check-in
        const checkinProcessado = processarCheckinQR();
        
        document.getElementById('app-container').style.display = 'flex';
        
        if (!checkinProcessado) {
             iniciarApp(); // Inicia o vídeo de abertura
        } else {
             // Se o check-in foi processado, pulamos o vídeo e vamos para a hash
             document.getElementById('video-intro').style.display = 'none';
             lidarComHash();
        }
        
    } catch (error) {
        // Tratamento de erro robusto no carregamento
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('app-container').innerHTML = '<p style="text-align: center; color: red; margin-top: 50px; font-weight: bold;">ERRO DE CARREGAMENTO: Não foi possível carregar os dados. Verifique a sintaxe de parques.json e park_details.json.</p>';
        document.getElementById('video-intro').style.display = 'none';
        console.error('Erro fatal ao carregar dados:', error);
    }

    // 5. Event Listeners
    document.getElementById('btn-voltar').addEventListener('click', () => {
        // Lógica para fechar a segunda página/voltar
        if (window.location.hash) {
            window.history.back();
        } else {
            document.getElementById('area-secundaria').classList.remove('aberto');
        }
    });
    window.addEventListener('hashchange', lidarComHash);
    
    // Listener do botão de envio de foto
    document.getElementById('btn-enviar-foto').addEventListener('click', () => {
        alert('Funcionalidade de processamento de foto será implementada aqui.');
    });
}

document.addEventListener('DOMContentLoaded', inicializarApp);
