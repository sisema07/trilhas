// script.js - CÓDIGO COMPLETO REVISADO
// script.js - CÓDIGO COMPLETO REVISADO

let DADOS_PARQUES = [];
let ATIVIDADES_PARQUES = {};
let DETALHES_PARQUES = {}; // <-- NOVO: Variável para os detalhes dos parques
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
            
            // Simula o sucesso do check-in
            if (!estadoUsuario[parqueId]) {
                // Inicializa o estado para o parque se não existir
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
    
    video.play().catch(error => {
        setTimeout(fecharIntro, 2000);
    });

    function fecharIntro() {
        intro.classList.add('fade-out');
        setTimeout(() => {
            intro.style.display = 'none';
        }, 1000);
    }

    video.onended = fecharIntro;
    video.ontimeupdate = function() {
        if (video.currentTime >= 3 && !intro.classList.contains('fade-out')) { 
            fecharIntro();
        }
    };
}

/**
 * Carrega os botões na tela principal.
 * (*** SEÇÃO MODIFICADA ***)
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
        
        // --- INÍCIO DA MODIFICAÇÃO ---
        // Decide se usa o ícone (Font Awesome) ou a logo (PNG)
        let iconePrincipal;
        if (parque.is_premio || !parque.logo_png) {
            // Se for 'Check-ins' ou se não houver logo_png definida, usa o ícone
            iconePrincipal = `<i class="icone-parque-principal fas ${parque.icone_principal}"></i>`;
        } else {
            // Se for um parque e tiver logo_png, usa a tag <img>
            iconePrincipal = `<img src="${parque.logo_png}" alt="${parque.nome}" class="logo-parque-principal">`;
        }
        // --- FIM DA MODIFICAÇÃO ---

        // Ajustado para usar o novo nome "Check-ins" do JSON
        const nome = `<span class="nome-parque">${parque.is_premio ? parque.nome : parque.nome.replace('PE ', '')}</span>`; 

        btn.innerHTML = iconeMarca + iconePrincipal + nome;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = parque.id;
        });
        
        container.appendChild(btn);
    });
}
// (*** FIM DA SEÇÃO MODIFICADA ***)


/**
 * Exibe a área detalhada (Parque, Check-ins ou Upload).
 */
function mostrarArea(id) {
    const areaSecundaria = document.getElementById('area-secundaria');
    const parqueDetail = document.getElementById('conteudo-parque-detalhe');
    const areaPremiacao = document.getElementById('conteudo-premios');
    const areaEnvioFoto = document.getElementById('area-envio-foto');
    const titulo = document.getElementById('secundaria-titulo');

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
        
        titulo.textContent = `Enviar Foto Badge`;
        areaEnvioFoto.style.display = 'block';
        
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
 * Carrega todos os Badges.
 */
function carregarPremios() {
    const listaPremios = document.getElementById('lista-icones-premios');
    listaPremios.innerHTML = '';
    
    for (const parqueId in ATIVIDADES_PARQUES) {
        const atividades = ATIVIDADES_PARQUES[parqueId];
        
        if (!estadoUsuario[parqueId]) {
             estadoUsuario[parqueId] = atividades.reduce((acc, a) => ({ ...acc, [a.id]: false }), {});
             salvarEstado();
        }

        atividades.forEach(atividade => {
            const isConcluida = estadoUsuario[parqueId] && estadoUsuario[parqueId][atividade.id];

            const card = document.createElement('div');
            card.className = `icone-premio ${isConcluida ? 'desbloqueado' : ''}`;
            card.dataset.parqueId = parqueId;
            card.dataset.atividadeId = atividade.id;
            
            // Adicionado placeholder de imagem ilustrativa (ícone)
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

    // Listener de QR Code (Simulação)
    document.querySelectorAll('.qrcode-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Em um app real, o click chamaria a câmera. Aqui, simulamos o sucesso.
            const parqueId = this.dataset.parqueId;
            const atividadeId = this.dataset.atividadeId;
            
            // Simula o resultado de escanear o QR Code de sucesso
            const checkinUrl = `${window.location.origin}/?checkin=${parqueId}-${atividadeId}`;
            
            // Chama a função de processamento com a URL simulada
            processarCheckinQRSimulacao(checkinUrl);
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
        mostrarArea(hash);
    } else {
        document.getElementById('area-secundaria').classList.remove('aberto');
        document.getElementById('app-container').scrollIntoView();
        window.scrollTo(0, scrollPosition);
    }
}


// --- FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL ---

async function inicializarApp() {
    // 1. Registro do Service Worker e PWA Prompt
    registrarServiceWorker();
    setupPwaInstallPrompt();

    // 2. Carrega os Dados do JSON
    try {
        const response = await fetch('parques.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const dados = await response.json();
        DADOS_PARQUES = dados.DADOS_PARQUES;
        ATIVIDADES_PARQUES = dados.ATIVIDADES_PARQUES;
        
        // 3. Inicializa o App
        carregarBotoesParques();

        // 4. Processa check-in (Verifica se veio de um QR Code antes de iniciar o vídeo)
        const checkinProcessado = processarCheckinQR();
        
        if (!checkinProcessado) {
             iniciarApp(); // Inicia o vídeo de abertura se não for um check-in direto
             lidarComHash(); 
        } else {
             // Se o check-in foi processado, já deve estar na tela de Check-ins (premiacao)
             document.getElementById('video-intro').style.display = 'none';
             document.getElementById('app-container').style.display = 'flex';
             lidarComHash();
        }
        
    } catch (error) {
        // CORREÇÃO: Tratamento de erro robusto no carregamento
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('app-container').innerHTML = '<p style="text-align: center; color: red; margin-top: 50px; font-weight: bold;">ERRO DE CARREGAMENTO: Não foi possível carregar os dados. 1. Verifique o arquivo parques.json. 2. Limpe o Cache/Service Worker e Recarregue.</p>';
        document.getElementById('video-intro').style.display = 'none';
        console.error('Erro fatal ao carregar dados:', error);
    }

    // 5. Event Listeners
    document.getElementById('btn-voltar').addEventListener('click', () => {
        window.history.back();
    });
    window.addEventListener('hashchange', lidarComHash);
    
    // Listener do botão de envio de foto
    document.getElementById('btn-enviar-foto').addEventListener('click', () => {
        alert('Funcionalidade de processamento de foto será implementada aqui.');
    });
}

document.addEventListener('DOMContentLoaded', inicializarApp);

