// script.js - CÓDIGO COMPLETO E CORRIGIDO

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

function setupPwaInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
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
        
        if (parqueId && atividadeId) {
            
            // Lógica de desbloqueio de Badge (simplificada)
            const atividadeExiste = ATIVIDADES_PARQUES[parqueId] && ATIVIDADES_PARQUES[parqueId].find(a => a.id === atividadeId);

            if (atividadeExiste) {
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
    }
    return false;
}


// --- FUNÇÕES DE NAVEGAÇÃO E EXIBIÇÃO (CarregarAtividades e simularLeituraQR omitidas para concisão) ---

/**
 * Inicia o vídeo e a lógica de transição.
 */
function iniciarApp() {
    const intro = document.getElementById('video-intro');
    const video = document.getElementById('intro-video-element');
    
    document.getElementById('app-container').style.display = 'flex'; // Garante que o app-container esteja visível
    
    // Reprodução do vídeo
    video.play().catch(error => {
        console.warn("Reprodução automática bloqueada. Iniciando app após 2s.");
        setTimeout(fecharIntro, 2000);
    });

    function fecharIntro() {
        intro.classList.add('fade-out');
        setTimeout(() => {
            intro.style.display = 'none';
        }, 1000); // 1s (tempo da transição CSS)
    }

    video.onended = fecharIntro;
    video.ontimeupdate = function() {
        if (video.currentTime >= 3 && !intro.classList.contains('fade-out')) { 
            fecharIntro();
        }
    };
}


/**
 * Carrega os botões (incluindo Check-ins) no grid. (Omitida para concisão)
 * (Função idêntica à última versão, usa DADOS_PARQUES)
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
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = parque.id;
        });
        
        container.appendChild(btn);
    });
}


/**
 * Carrega todos os Badges (apagados ou desbloqueados) na área de Check-ins. (Omitida para concisão)
 * (Função idêntica à última versão, usa ATIVIDADES_PARQUES)
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
            
            if (isConcluida) {
                 card.addEventListener('click', () => {
                    window.location.hash = `upload-${parqueId}-${atividade.id}`;
                 });
            }
        });
    }
}


/**
 * Exibe a área detalhada do Parque ou a Área de Check-ins.
 */
function mostrarArea(id) {
    const areaSecundaria = document.getElementById('area-secundaria');
    const parqueDetail = document.getElementById('conteudo-parque-detalhe');
    const areaPremiacao = document.getElementById('conteudo-premios');
    const areaEnvioFoto = document.getElementById('area-envio-foto');
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
        const [,, parqueId, atividadeId] = id.split('-');
        
        titulo.textContent = `Enviar Foto (${atividadeId.toUpperCase()})`;
        areaEnvioFoto.style.display = 'block';
        
        document.getElementById('badge-upload-titulo').textContent = `Enviar Foto para Badge: ${parqueId.toUpperCase()} - ${atividadeId.toUpperCase()}`;
    
    } else {
        const parque = DADOS_PARQUES.find(p => p.id === id);
        if (!parque) return;

        titulo.textContent = parque.nome;
        parqueDetail.style.display = 'block';

        document.getElementById('parque-imagem').style.backgroundImage = parque.imagem;
        document.getElementById('parque-descricao').textContent = parque.descricao || `Bem-vindo ao ${parque.nome}! Prepare-se para explorar e completar as atividades gamificadas!`;

        // Você precisará da função carregarAtividades aqui, que está no JS anterior.
        // carregarAtividades(parque); 
    }
    areaSecundaria.scrollTo(0, 0);
}


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
        
        // Verifica se o JSON foi carregado, se não lança erro (Isso previne a mensagem que você viu)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const dados = await response.json();
        DADOS_PARQUES = dados.DADOS_PARQUES;
        ATIVIDADES_PARQUES = dados.ATIVIDADES_PARQUES;
        
        // 3. Carrega Botoes antes de verificar o Checkin, para que a navegação funcione
        carregarBotoesParques();

        // 4. Processa check-in de QR Code (se houver na URL)
        const checkinProcessado = processarCheckinQR();
        
        // 5. Inicia o App (vídeo) e navega
        if (!checkinProcessado) {
             iniciarApp(); // Inicia o vídeo de abertura se não for um check-in direto
             lidarComHash(); // Lida com a URL atual
        }
        
    } catch (error) {
        console.error('Erro fatal ao carregar dados:', error);
        // Exibe o erro somente no app-container para não quebrar o layout
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('app-container').innerHTML = '<p style="text-align: center; color: red; margin-top: 50px;">ERRO FATAL: Não foi possível carregar os dados. Limpe o cache/Service Worker e tente novamente.</p>';
        document.getElementById('video-intro').style.display = 'none';
        
    }

    // 6. Event Listeners
    document.getElementById('btn-voltar').addEventListener('click', () => {
        window.history.back();
    });
    window.addEventListener('hashchange', lidarComHash);
}

document.addEventListener('DOMContentLoaded', inicializarApp);
