// script.js - CÓDIGO COMPLETO REVISADO

let DADOS_PARQUES = [];
let ATIVIDADES_PARQUES = {};
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

// Lógica do Prompt de Instalação (Mostra uma mensagem amigável para instalar o PWA)
function setupPwaInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Previne o prompt padrão do Chrome
        e.preventDefault();
        // Salva o evento para ser disparado depois
        deferredPrompt = e;
        
        // Se o usuário nunca foi solicitado e não está instalado, mostra a mensagem
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

/**
 * Funções para simular a chegada do usuário via QR Code (URL externa).
 * Exemplo de URL no QR Code: https://seurepositorio.github.io/?checkin=ibitipoca-janela
 * * Se o usuário escanear e cair nesta URL, o script irá:
 * 1. Desbloquear o badge.
 * 2. Redirecionar para a Área de Check-ins (Badges).
 */
function processarCheckinQR() {
    const urlParams = new URLSearchParams(window.location.search);
    const checkin = urlParams.get('checkin');

    if (checkin) {
        const [parqueId, atividadeId] = checkin.split('-');
        
        if (parqueId && atividadeId) {
            
            // Simula o sucesso do check-in
            if (estadoUsuario[parqueId] && !estadoUsuario[parqueId][atividadeId]) {
                estadoUsuario[parqueId][atividadeId] = true;
                salvarEstado();
                alert(`Badge "${atividadeId}" desbloqueado em ${parqueId}! Vá para a área de Check-ins para enviar sua foto.`);
                
            } else if (!estadoUsuario[parqueId]) {
                 // Caso o estado não exista (usuário novo), inicializa e salva
                 if (ATIVIDADES_PARQUES[parqueId]) {
                    estadoUsuario[parqueId] = ATIVIDADES_PARQUES[parqueId].reduce((acc, a) => ({ ...acc, [a.id]: false }), {});
                    estadoUsuario[parqueId][atividadeId] = true;
                    salvarEstado();
                    alert(`Bem-vindo ao app! Badge "${atividadeId}" desbloqueado. Envie sua foto!`);
                 }
            } else {
                 alert(`Badge "${atividadeId}" já estava desbloqueado!`);
            }
            
            // Limpa a URL e redireciona para a área de Check-ins
            window.history.replaceState({}, document.title, window.location.pathname);
            window.location.hash = 'premiacao';
            return true;
        }
    }
    return false;
}


// --- FUNÇÕES DE NAVEGAÇÃO E EXIBIÇÃO ---

/**
 * Exibe a área detalhada do Parque ou a Área de Check-ins.
 */
function mostrarArea(id) {
    const areaSecundaria = document.getElementById('area-secundaria');
    const parqueDetail = document.getElementById('conteudo-parque-detalhe');
    const areaPremiacao = document.getElementById('conteudo-premios');
    const areaEnvioFoto = document.getElementById('area-envio-foto'); // Nova área
    const titulo = document.getElementById('secundaria-titulo');

    // Oculta todas as áreas de conteúdo da área secundária
    parqueDetail.style.display = 'none';
    areaPremiacao.style.display = 'none';
    areaEnvioFoto.style.display = 'none';

    scrollPosition = window.pageYOffset;
    areaSecundaria.classList.add('aberto');
    
    if (id === 'premiacao') {
        titulo.textContent = 'Check-ins';
        areaPremiacao.style.display = 'block';
        carregarPremios(); 
    } else if (id.startsWith('upload-')) {
        // Fluxo de upload de foto
        const [,, parqueId, atividadeId] = id.split('-'); // Espera 'upload-parqueId-atividadeId'
        
        titulo.textContent = `Enviar Foto (${atividadeId})`;
        areaEnvioFoto.style.display = 'block';
        
        // Simulação de lógica de upload: (Você desenvolverá isso no futuro)
        document.getElementById('badge-upload-titulo').textContent = `Enviar Foto para Badge: ${parqueId.toUpperCase()} - ${atividadeId.toUpperCase()}`;
    
    } else {
        const parque = DADOS_PARQUES.find(p => p.id === id);
        if (!parque) return;

        titulo.textContent = parque.nome;
        parqueDetail.style.display = 'block';

        document.getElementById('parque-imagem').style.backgroundImage = parque.imagem;
        document.getElementById('parque-descricao').textContent = parque.descricao || `Bem-vindo ao ${parque.nome}! Prepare-se para explorar e completar as atividades gamificadas!`;

        carregarAtividades(parque);
    }
    areaSecundaria.scrollTo(0, 0);
}

/**
 * Carrega todos os Badges (apagados ou desbloqueados) na área de Check-ins.
 */
function carregarPremios() {
    const listaPremios = document.getElementById('lista-icones-premios');
    listaPremios.innerHTML = '';
    let totalBadges = 0;

    for (const parqueId in ATIVIDADES_PARQUES) {
        const atividades = ATIVIDADES_PARQUES[parqueId];
        
        if (!estadoUsuario[parqueId]) {
             estadoUsuario[parqueId] = atividades.reduce((acc, a) => ({ ...acc, [a.id]: false }), {});
             salvarEstado();
        }

        atividades.forEach(atividade => {
            totalBadges++;
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
            
            // Torna o badge desbloqueado clicável para ir à área de upload
            if (isConcluida) {
                 card.addEventListener('click', () => {
                    window.location.hash = `upload-${parqueId}-${atividade.id}`;
                 });
            }
        });
    }
}


/**
 * Lida com a mudança do hash da URL.
 */
function lidarComHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        mostrarArea(hash);
    } else {
        document.getElementById('area-secundaria').classList.remove('aberto');
        document.getElementById('app-container').scrollIntoView();
        window.scrollTo(0, scrollPosition);
    }
}


// --- FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL ---

async function inicializarApp() {
    // 1. Registro do Service Worker (para PWA/Offline)
    registrarServiceWorker();
    setupPwaInstallPrompt(); // Configura o prompt de instalação

    // 2. Carrega os Dados do JSON
    try {
        const response = await fetch('parques.json');
        const dados = await response.json();
        DADOS_PARQUES = dados.DADOS_PARQUES;
        ATIVIDADES_PARQUES = dados.ATIVIDADES_PARQUES;

        // 3. Processa check-in de QR Code (se houver na URL)
        const checkinProcessado = processarCheckinQR();
        
        // 4. Inicializa o App
        carregarBotoesParques();

        if (!checkinProcessado) {
             iniciarApp(); // Inicia o vídeo de abertura se não for um check-in direto
             lidarComHash(); // Lida com a URL atual
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados ou inicializar:', error);
        document.getElementById('app-container').innerHTML = '<p style="text-align: center; color: red;">Não foi possível carregar os dados dos parques. Verifique sua conexão ou se o arquivo parques.json está correto.</p>';
        document.getElementById('video-intro').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
    }

    // 5. Event Listeners (Mantidos no JS, escondidos no CSS)
    document.getElementById('btn-voltar').addEventListener('click', () => {
        window.history.back();
    });
    window.addEventListener('hashchange', lidarComHash);

    // Adicionar listener ao botão de envio de foto (futura implementação)
    document.getElementById('btn-enviar-foto').addEventListener('click', () => {
        alert('Funcionalidade de processamento de foto será implementada aqui.');
    });
}

document.addEventListener('DOMContentLoaded', inicializarApp);
