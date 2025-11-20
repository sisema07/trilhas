// script.js - CÓDIGO COMPLETO COM AJUSTES (1, 3, 4, 6) + AJUSTE FINO DE POSICIONAMENTO + UI DE COMPARTILHAMENTO + CORREÇÃO DO VÍDEO

let DADOS_PARQUES = [];
let ATIVIDADES_PARQUES = {};
let DETALHES_PARQUES = {}; 
let DADOS_FAUNA = {}; 

let estadoUsuario = JSON.parse(localStorage.getItem('trilhasDeMinasStatus')) || {};
let scrollPosition = 0;
let deferredPrompt; 

// NOVAS VARIÁVEIS PARA O CANVAS DE COMPARTILHAMENTO
let passportTemplateImage = new Image();
let stampImage = new Image();
let userPhoto = new Image();
let canvasContext = null;

// AJUSTE: Caminho para o novo template 9:16 (ex: 'images/story_template.png')
// Certifique-se de que este arquivo exista no seu projeto.
passportTemplateImage.src = 'images/story_template.png'; 

// Variáveis de estado do Quiz
let currentQuizData = null; 
let currentQuizIndex = 0;   
let quizScore = 0;          

// Configuração dos Ranks Globais
const RANKS_GLOBAIS = [
    { percent: 30, id: 'rank_30', nome: 'Explorador de Minas', img: 'badges/rank_30.png', desc: 'Você deu os primeiros passos nas montanhas!' },
    { percent: 60, id: 'rank_60', nome: 'Andarilho Real', img: 'badges/rank_60.png', desc: 'Suas botas já conhecem a poeira da história.' },
    { percent: 90, id: 'rank_90', nome: 'Guardião do Espinhaço', img: 'badges/rank_90.png', desc: 'As serras de Minas reverenciam sua jornada.' },
    { percent: 100, id: 'rank_100', nome: 'Lenda das Gerais', img: 'badges/rank_100.png', desc: 'Você zerou Minas Gerais. Sua história será contada!' }
];

// Imagem do Certificado (Você precisará criar esta imagem!)
let certificateTemplateImage = new Image();
certificateTemplateImage.src = 'images/certificate_template.png';

// --- BLOQUEIO DE DOWNLOAD/COMPARTILHAMENTO NATIVO ---
// Bloquear menu de contexto (download/compartilhamento nativo)
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('contextmenu', function(e) {
        // VERIFICAÇÃO MAIS ESPECÍFICA - evita bloquear elementos do vídeo
        const isVideoElement = e.target.closest('#video-intro') || 
                              e.target.tagName === 'VIDEO' || 
                              e.target.id === 'intro-video-element';
        
        // PERMITE o menu de contexto para o vídeo
        if (isVideoElement) {
            return; // Não bloqueia, permite menu normal
        }
        
        // Verifica se o clique foi em uma imagem de badge ou fauna
        if (e.target.closest('.icone-premio') || 
            e.target.closest('.fauna-grid-item') || 
            e.target.closest('.activity-grid-item') ||
            e.target.classList.contains('badge-custom-img')) {
            e.preventDefault();
            
            // Se for fauna, abre o modal correspondente
            const faunaItem = e.target.closest('.fauna-grid-item');
            if (faunaItem && faunaItem.classList.contains('desbloqueado')) {
                const parqueId = faunaItem.dataset.parqueId;
                const index = parseInt(faunaItem.dataset.index);
                window.abrirModalFauna(parqueId, index);
            }
            
            // Se for badge, abre modal de preview
            const badgeItem = e.target.closest('.icone-premio');
            if (badgeItem && badgeItem.classList.contains('desbloqueado') && 
                !badgeItem.id.includes('conhecimento')) {
                const parqueId = badgeItem.dataset.parqueId;
                const atividadeId = badgeItem.dataset.atividadeId;
                abrirModalBadgePreview(parqueId, atividadeId);
            }
        }
    });
});

// Nova função para modal de preview de badges
function abrirModalBadgePreview(parqueId, atividadeId) {
    const atividade = ATIVIDADES_PARQUES[parqueId]?.find(a => a.id === atividadeId);
    const parque = DADOS_PARQUES.find(p => p.id === parqueId);
    
    if (!atividade || !parque) return;

    const modal = document.getElementById('fauna-modal');
    const modalBody = document.getElementById('fauna-modal-body');
    if (!modal || !modalBody) return;

    const imagePath = atividade.imagem_png;
    const fileName = `${atividade.nome.toLowerCase().replace(/\s/g, '_')}_${parqueId}.png`;

    const downloadFunction = (path, name) => {
        const link = document.createElement('a');
        link.href = path;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    modalBody.innerHTML = `
        <h4>${atividade.nome} - ${parque.nome}</h4>
        <img src="${imagePath}" alt="${atividade.nome}" style="max-width: 100%; height: auto; border-radius: 10px; margin-bottom: 15px;">
        
        <a href="#" id="btn-badge-download" class="download-icon-fauna" title="Baixar imagem">
            <i class="fas fa-arrow-down"></i>
        </a>
        
        <p><strong>Parque:</strong> ${parque.nome}</p>
        <p><strong>Atividade:</strong> ${atividade.nome}</p>
        ${atividade.descricao_curta ? `<p><strong>Descrição:</strong> ${atividade.descricao_curta}</p>` : ''}
    `;

    document.getElementById('btn-badge-download').addEventListener('click', (e) => {
        e.preventDefault(); 
        downloadFunction(imagePath, fileName);
    });
    
    modal.classList.add('open');
    modal.style.display = 'flex';
}

// --- FUNÇÕES DE ESTADO, PWA E SERVICE WORKER ---
function salvarEstado() {
    localStorage.setItem('trilhasDeMinasStatus', JSON.stringify(estadoUsuario));
}

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

    document.getElementById('install-btn')?.addEventListener('click', () => {
        document.getElementById('install-prompt').style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuário aceitou a instalação PWA');
            } else {
                console.log('Usuário recusou a instalação PWA');
            }
            deferredPrompt = null;
            localStorage.setItem('pwa_prompt_shown', 'true');
        });
    });

    document.getElementById('close-prompt')?.addEventListener('click', () => {
        document.getElementById('install-prompt').style.display = 'none';
        localStorage.setItem('pwa_prompt_shown', 'true');
    });
}

// --- LÓGICA DO CARROSSEL ---
let currentCarouselIndex = 0;
let carouselImages = [];
let carouselInterval = null;

function setupCarousel(parqueId, images) {
    const carouselElement = document.getElementById('park-carousel');
    const dotsElement = document.getElementById('carousel-dots');
    
    if (!carouselElement || !dotsElement) return;

    carouselElement.innerHTML = '';
    dotsElement.innerHTML = '';
    
    carouselImages = images;
    currentCarouselIndex = 0;
    
    carouselImages.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Imagem do Parque ${parqueId} ${index + 1}`;
        img.className = 'carousel-image';
        carouselElement.appendChild(img);
        
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.dataset.index = index;
        dot.addEventListener('click', () => {
            showSlide(index);
            resetInterval();
        });
        dotsElement.appendChild(dot);
    });
    
    if (images.length > 1) {
        dotsElement.style.display = 'flex';
        resetInterval();
        carouselElement.removeEventListener('scroll', handleScroll);
        carouselElement.addEventListener('scroll', handleScroll);
    } else {
        dotsElement.style.display = 'none';
        carouselElement.removeEventListener('scroll', handleScroll);
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

function handleScroll() {
    const carouselElement = document.getElementById('park-carousel');
    if (!carouselElement) return;
    
    const scrollLeft = carouselElement.scrollLeft;
    const width = carouselElement.offsetWidth;
    let index = Math.round(scrollLeft / width); 
    
    if (index !== currentCarouselIndex) {
        showSlide(index, false);
        resetInterval();
    }
}

function showSlide(index, shouldScroll = true) {
    const carouselElement = document.getElementById('park-carousel');
    if (!carouselElement) return;

    const dots = document.querySelectorAll('.dot');
    
    if (index >= carouselImages.length) {
        index = 0;
    } else if (index < 0) {
        index = carouselImages.length - 1;
    }
    
    currentCarouselIndex = index;

    if (shouldScroll && carouselElement.offsetWidth > 0) {
        carouselElement.scrollTo({
            left: index * carouselElement.offsetWidth,
            behavior: 'smooth'
        });
    }

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function nextSlide() {
    showSlide(currentCarouselIndex + 1);
}

function resetInterval() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    carouselInterval = setInterval(nextSlide, 3000); 
}

// --- FLUXO PRINCIPAL DE CHECK-IN (QR CODE) ---
function processarCheckin(parqueId, atividadeId) {
    console.log(`Processando check-in: ${parqueId} - ${atividadeId}`);
    
    const atividadeExiste = ATIVIDADES_PARQUES[parqueId] && ATIVIDADES_PARQUES[parqueId].some(a => a.id === atividadeId);

    if (atividadeExiste) {
        
        if (!estadoUsuario[parqueId]) {
            estadoUsuario[parqueId] = {};
        }

        let isNewBadge = false;

        if (atividadeId === 'quiz') {
            console.warn('Tentativa de check-in em badge de quiz. Ignorado.');
            isNewBadge = false;
        } else if (!estadoUsuario[parqueId][atividadeId]) {
            estadoUsuario[parqueId][atividadeId] = true;
            salvarEstado();
            isNewBadge = true;
            console.log(`Novo badge desbloqueado: ${parqueId}-${atividadeId}`);
        } 
        
        const message = isNewBadge 
            ? "Trilhas de Minas\n\n🎉 Novo Badge desbloqueado!\nConfira na área Check-ins"
            : "Trilhas de Minas\n\nEste Badge já estava desbloqueado!\nConfira na área Check-ins";
        
        setTimeout(() => {
            alert(message);
            window.location.hash = '#premiacao';
            carregarPremios(); 
        }, 100);
        
        return true;
    } else {
        console.error(`Atividade não encontrada: ${parqueId}-${atividadeId}`);
        alert('Erro: Atividade não encontrada. Verifique o QR Code.');
        window.location.hash = ''; 
        return false;
    }
}

// --- CARREGAMENTO DE BOTÕES E PRÊMIOS ---
function carregarBotaoParque(parque) {
    const button = document.createElement('a');
    button.href = `#${parque.id}`;
    button.className = 'botao-parque';
    button.dataset.parqueId = parque.id;

    let iconContent;
    if (parque.logo_png) {
        iconContent = `<img src="${parque.logo_png}" alt="Logo ${parque.nome}" class="logo-parque-principal">`;
    } else {
        iconContent = `<i class="fas ${parque.icone_principal} icone-parque-principal"></i>`;
    }
    
    button.innerHTML = `
        <div class="icone-parque">
            <i class="fas ${parque.icone_fundo}"></i>
        </div>
        ${iconContent}
        <span class="nome-parque">${parque.nome}</span>
    `;

    if (parque.id === 'premiacao') {
        button.id = 'btn-premiacao';
    } else {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = `#${parque.id}`;
        });
    }

    return button;
}

function carregarBotoesParques() {
    const container = document.getElementById('botoes-parques');
    if (!container) return;
    
    container.innerHTML = '';
    DADOS_PARQUES.forEach(parque => {
        container.appendChild(carregarBotaoParque(parque));
    });
}

// --- Funções de Cálculo do Quiz Global ---
function getTotalQuizzes() {
    let total = 0;
    for (const parqueId in DETALHES_PARQUES) {
        if (DETALHES_PARQUES[parqueId].quiz && DETALHES_PARQUES[parqueId].quiz.length > 0) {
            total++;
        }
    }
    return total;
}

function getQuizzesConcluidos() {
    let concluidos = 0;
    for (const parqueId in DETALHES_PARQUES) {
        if (DETALHES_PARQUES[parqueId].quiz && DETALHES_PARQUES[parqueId].quiz.length > 0) {
            if (estadoUsuario[parqueId] && estadoUsuario[parqueId]['quiz'] === true) {
                concluidos++;
            }
        }
    }
    return concluidos;
}

function calcularProgressoGlobal() {
    let totalPossivel = 0;
    let totalConquistado = 0;

    // 1. Conta Badges de Atividades Normais
    for (const parqueId in ATIVIDADES_PARQUES) {
        const atividades = ATIVIDADES_PARQUES[parqueId];
        atividades.forEach(ativ => {
            if (ativ.id !== 'quiz') { // Ignora quiz se ele estiver dentro da lista de atividades
                totalPossivel++;
                if (estadoUsuario[parqueId] && estadoUsuario[parqueId][ativ.id]) {
                    totalConquistado++;
                }
            }
        });
    }

    // 2. Conta Badges de Quiz (Se existirem na lógica)
    for (const parqueId in DETALHES_PARQUES) {
        if (DETALHES_PARQUES[parqueId].quiz && DETALHES_PARQUES[parqueId].quiz.length > 0) {
            totalPossivel++;
            if (estadoUsuario[parqueId] && estadoUsuario[parqueId]['quiz']) {
                totalConquistado++;
            }
        }
    }

    if (totalPossivel === 0) return 0;
    return (totalConquistado / totalPossivel) * 100;
}

function carregarPremios() {
    const listaPremios = document.getElementById('lista-icones-premios');
    if (!listaPremios) return;

    listaPremios.innerHTML = '';
    
    // --- 1. Ranks Globais (Metagame) ---
    const progressoAtual = calcularProgressoGlobal();
    
    // Cria um cabeçalho visual para separar
    const headerRanks = document.createElement('div');
    headerRanks.style.gridColumn = "1 / -1";
    headerRanks.innerHTML = `<h4 style="margin: 20px 0 10px; color: #555; text-align: left; border-bottom: 1px solid #eee;">Conquistas Globais (${Math.floor(progressoAtual)}%)</h4>`;
    listaPremios.appendChild(headerRanks);

RANKS_GLOBAIS.forEach(rank => {
        const desbloqueado = progressoAtual >= rank.percent;
        
        const card = document.createElement('div');
        card.className = `icone-premio ${desbloqueado ? 'desbloqueado' : ''}`;
        
        // CORREÇÃO DO PISCA-PISCA AQUI:
        // 1. this.onerror=null: Impede que ele tente carregar de novo se falhar (quebra o loop)
        // 2. this.src='logo.png': Usa sua logo se não achar a imagem do rank
        card.innerHTML = `
            <img src="${rank.img}" alt="${rank.nome}" class="badge-custom-img" 
                 onerror="this.onerror=null; this.src='logo.png'; this.style.filter='grayscale(100%) opacity(0.5)';">
            <span style="font-weight:800; color:${desbloqueado ? '#d32f2f' : '#888'}">${rank.percent}%</span>
            <span>${rank.nome}</span>
        `;
        
        if (desbloqueado) {
            card.addEventListener('click', () => {
                window.location.hash = `certificate-${rank.id}`;
            });
        }
        
        listaPremios.appendChild(card);
    });

    // --- 2. Badges Normais dos Parques ---
    const headerParques = document.createElement('div');
    headerParques.style.gridColumn = "1 / -1";
    headerParques.innerHTML = `<h4 style="margin: 20px 0 10px; color: #555; text-align: left; border-bottom: 1px solid #eee;">Badges de Parques</h4>`;
    listaPremios.appendChild(headerParques);

    // ... (O RESTO DO CÓDIGO ORIGINAL QUE CARREGA OS BADGES DOS PARQUES CONTINUA AQUI IGUAL) ...
    // Copie o loop "for (const parqueId in ATIVIDADES_PARQUES)..." que você já tinha.
    for (const parqueId in ATIVIDADES_PARQUES) {
        const atividades = ATIVIDADES_PARQUES[parqueId];
        if (!estadoUsuario[parqueId]) estadoUsuario[parqueId] = {};

        atividades.forEach(atividade => {
            if (atividade.id === 'quiz') return; 
            if (typeof estadoUsuario[parqueId][atividade.id] === 'undefined') estadoUsuario[parqueId][atividade.id] = false;

            const isConcluida = estadoUsuario[parqueId][atividade.id];
            const card = document.createElement('div');
            card.className = `icone-premio ${isConcluida ? 'desbloqueado' : ''}`;
            
            let badgeContent;
            if (atividade.imagem_png) {
                badgeContent = `<img src="${atividade.imagem_png}" alt="${atividade.nome}" class="badge-custom-img">`;
            } else {
                badgeContent = `<i class="fas ${atividade.icone}"></i>`;
            }
            
            card.innerHTML = `${badgeContent}<span>${atividade.nome}</span>`;
            
            if (isConcluida) {
                 card.addEventListener('click', () => {
                    window.location.hash = `upload-${parqueId}-${atividade.id}`;
                 });
            }
            listaPremios.appendChild(card);
        });
    }
    salvarEstado();
}

function carregarConteudoPremiacao() {
    document.getElementById('conteudo-parque-detalhe').style.display = 'none';
    document.getElementById('area-envio-foto').style.display = 'none';

    const areaSecundaria = document.getElementById('area-secundaria');
    document.getElementById('secundaria-titulo').textContent = 'Seus Check-ins';

    document.getElementById('conteudo-premios').style.display = 'block';

    carregarPremios();
    
    areaSecundaria.classList.add('aberto');
    areaSecundaria.style.display = 'flex'; 
    areaSecundaria.scrollTop = 0;
}

function carregarConteudoInfo(parque, container) {
    const detalhes = DETALHES_PARQUES[parque.id] || {};
    container.innerHTML = `
        <h3>Informações Gerais</h3>
        <p>${detalhes.info_content || 'Informações detalhadas sobre o parque não disponíveis.'}</p>
        
        `;
}

function carregarConteudoFauna(parque, container) {
    const fauna = DADOS_FAUNA[parque.id] || [];
    
    let html = `
        <h3>Fauna Local</h3>
        <div id="fauna-grid-dinamica">
    `;

    if (fauna.length === 0) {
        html += '<p style="text-align: center; margin-top: 20px;">Nenhuma fauna catalogada para este parque.</p>';
    } else {
        fauna.forEach((animal, index) => {
            const imagePath = `fauna/${animal.imagem}`;
            
            html += `
                <div class="fauna-grid-item desbloqueado" data-index="${index}" data-parque-id="${parque.id}" onclick="window.abrirModalFauna('${parque.id}', ${index})">
                    <img src="${imagePath}" alt="${animal.nome}">
                    <span>${animal.nome}</span>
                </div>
            `;
        });
    }

    html += '</div>';
    container.innerHTML = html;
}

window.abrirModalFauna = function(parqueId, index) {
    const animal = DADOS_FAUNA[parqueId] && DADOS_FAUNA[parqueId][index];
    if (!animal) return;

    const modal = document.getElementById('fauna-modal');
    const modalBody = document.getElementById('fauna-modal-body');
    if (!modal || !modalBody) return;

    const imagePath = `fauna/${animal.imagem}`;
    const fileName = `${animal.nome.toLowerCase().replace(/\s/g, '_')}_${parqueId}.png`;

    const downloadFunction = (path, name) => {
        const link = document.createElement('a');
        link.href = path;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    modalBody.innerHTML = `
        <h4>${animal.nome}</h4>
        <img src="${imagePath}" alt="${animal.nome}">
        
        <a href="#" id="btn-fauna-download" class="download-icon-fauna" title="Baixar imagem">
            <i class="fas fa-arrow-down"></i>
        </a>
        
        <p><strong>Status de Conservação (IUCN):</strong> ${animal.status || 'Não Classificado'}</p>
        <p>${animal.descricao}</p>
    `;

    document.getElementById('btn-fauna-download').addEventListener('click', (e) => {
        e.preventDefault(); 
        downloadFunction(imagePath, fileName);
    });
    
    modal.classList.add('open');
    modal.style.display = 'flex';
}

window.abrirModalQr = function() {
    const modal = document.getElementById('qr-modal');
    if (!modal) return;
    modal.classList.add('open');
    modal.style.display = 'flex';
}

window.abrirModalIntro = function() {
    const modal = document.getElementById('intro-modal');
    const modalBody = document.getElementById('intro-modal-body');
    const hiddenContent = document.getElementById('badge-intro-content-hidden');
    
    if (modal && modalBody && hiddenContent) {
        modalBody.innerHTML = hiddenContent.innerHTML;
        modal.classList.add('open');
        modal.style.display = 'flex';
    }
}

window.abrirModalQuizWin = function(score, total) {
    const modal = document.getElementById('quiz-win-modal');
    const modalBody = document.getElementById('quiz-win-modal-body');
    if (!modal || !modalBody) return;
    
    const totalQuizzes = getTotalQuizzes();
    const quizzesConcluidos = getQuizzesConcluidos();
    const quizzesFaltando = totalQuizzes - quizzesConcluidos;

    let mensagemProgresso = '';
    if (quizzesFaltando > 0) {
        mensagemProgresso = `Faltam <strong>${quizzesFaltando}</strong> quiz(zes) para liberar o badge de Conhecimento!`;
    } else {
        mensagemProgresso = `<strong>Você liberou o badge de Conhecimento!</strong> Confira na área de Check-ins!`;
    }

    modalBody.innerHTML = `
        <div style="text-align: center; padding: 10px;">
            <p class="result-classification" style="color: var(--cor-secundaria);">Parabéns!</p>
            <div class="win-animation-container">
                <img src="win.gif" alt="Quiz Concluído" class="win-gif-mascote">
            </div>
            <p class="success-badge-message">Você acertou ${score} de ${total}!</p>
            <p style="margin-bottom: 20px;">${mensagemProgresso}</p>
            <button class="action-button active" onclick="fecharModais(); window.location.hash='premiacao'">Ver Meus Badges</button>
        </div>
    `;

    modal.classList.add('open');
    modal.style.display = 'flex';
}

function fecharModais() {
    document.querySelectorAll('.modal-overlay.open').forEach(modal => {
        modal.classList.remove('open');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); 
    });
}

function configurarFechamentoModais() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', fecharModais);
    });

    ['fauna-modal', 'qr-modal', 'intro-modal', 'quiz-win-modal'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', (e) => {
            if (e.target.id === id) fecharModais();
        });
    });
}

// --- LÓGICA DO QUIZ ---
function carregarConteudoQuiz(parque, container) {
    fecharModais(); 
    
    const detalhes = DETALHES_PARQUES[parque.id] || {};
    currentQuizData = detalhes.quiz || [];
    
    const badgeQuizId = 'quiz'; 
    const isQuizCompleted = estadoUsuario[parque.id] && estadoUsuario[parque.id][badgeQuizId];
    
    if (currentQuizData.length === 0) {
        container.innerHTML = '<h3>Quiz</h3><p>Nenhum quiz disponível para este parque.</p>';
        return;
    }

    if (isQuizCompleted) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h3 style="color: var(--cor-secundaria);">Parabéns!</h3>
                <p>Você já completou o Quiz de ${parque.nome}!</p>
                <div class="win-animation-container">
                    <img src="win.gif" alt="Quiz Concluído" class="win-gif-mascote">
                </div>
                <p class="success-badge-message">Continue explorando outros parques para liberar o badge de Conhecimento!</p>
                <button class="action-button" onclick="window.location.hash = 'premiacao'">Ver Meus Badges</button>
            </div>
        `;
        return;
    }

    currentQuizIndex = 0;
    quizScore = 0;
    
    container.innerHTML = `
        <div class="quiz-header-content" style="display: block; text-align: center;">
            <h3>${detalhes.quiz_title || 'Desafio do Conhecimento'}</h3>
            </div>
        
        <div class="progress-bar-container">
            <div class="progress-bar">
                <div id="quiz-progress" style="width: 0%;"></div>
            </div>
        </div>

        <div id="quiz-question-area">
            </div>
    `;
    
    carregarProximaQuestao();
}

function carregarProximaQuestao() {
    const area = document.getElementById('quiz-question-area');
    if (!area) return;

    if (currentQuizIndex >= currentQuizData.length) {
        finalizarQuiz();
        return;
    }
    
    const questao = currentQuizData[currentQuizIndex];
    
    let optionsHtml = '';
    const alternativas = Array.isArray(questao.a) ? questao.a : [];
    
    // --- CORREÇÃO AQUI ---
    alternativas.forEach((alternativa, index) => {
        optionsHtml += `<button class="quiz-option-btn" data-index="${index}" onclick="window.selectQuizOption(${index}, this)">${alternativa}</button>`;
    });
    // ---------------------
    
    area.style.opacity = '0';
    setTimeout(() => {
        area.innerHTML = `
            <h4 style="margin-bottom: 20px;">Questão ${currentQuizIndex + 1}/${currentQuizData.length}:</h4>
            <p style="font-weight: 700; font-size: 1.1rem; text-align: center;">${questao.q}</p>
            <div class="action-buttons-container" style="flex-direction: column; gap: 10px; margin-top: 20px;">
                ${optionsHtml}
            </div>
        `;
        area.style.opacity = '1'; 
    }, 200); 
    
    atualizarBarraProgresso();
}

window.selectQuizOption = function(selectedIndex, buttonElement) {
    const buttons = document.querySelectorAll('.quiz-option-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    const questao = currentQuizData[currentQuizIndex];
    const isCorrect = selectedIndex === questao.correct;
    
    if (isCorrect) {
        buttonElement.classList.add('correct');
        quizScore++;
    } else {
        buttonElement.classList.add('incorrect');
        // Destaca a resposta correta
        document.querySelector(`.quiz-option-btn[data-index="${questao.correct}"]`)?.classList.add('correct');
    }
    
    setTimeout(() => {
        currentQuizIndex++;
        carregarProximaQuestao();
    }, 1500);
}

function atualizarBarraProgresso() {
    const quizProgress = document.getElementById('quiz-progress');
    if (!quizProgress) return;
    
    const progress = (currentQuizIndex / currentQuizData.length) * 100;
    quizProgress.style.width = `${progress}%`;
}

function finalizarQuiz() {
    const area = document.getElementById('quiz-question-area');
    const quizProgress = document.getElementById('quiz-progress');
    if (!area || !quizProgress) return;

    const total = currentQuizData.length;
    const parqueId = window.location.hash.substring(1).split('-')[0];
    const parque = DADOS_PARQUES.find(p => p.id === parqueId);
    
    if (!parque) return;

    const requiredScore = Math.ceil(total * 0.75); 
    
    if (quizScore >= requiredScore) { 
        const badgeId = 'quiz';
        
        if (!(estadoUsuario[parqueId] && estadoUsuario[parqueId][badgeId])) {
            if (!estadoUsuario[parqueId]) estadoUsuario[parqueId] = {};
            estadoUsuario[parqueId][badgeId] = true;
            salvarEstado();
        }
        
        area.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p class="result-classification" style="color: var(--cor-secundaria);">Quiz Concluído!</p>
                <p>Você acertou ${quizScore} de ${total}.</p>
            </div>
        `;
        quizProgress.style.width = '100%';

        setTimeout(() => {
            abrirModalQuizWin(quizScore, total);
        }, 500); 
        
    } else {
        let resultadoHtml = `
            <div style="text-align: center; padding: 20px;">
                <p class="result-classification" style="color: #f44336;">Tente Novamente!</p>
                <p style="margin-bottom: 20px;">Você acertou ${quizScore} de ${total}. Você precisa de ${requiredScore} acertos para ganhar o Badge.</p>
                <button class="action-button active" onclick="window.location.hash = '${parqueId}-quiz'">Reiniciar Quiz</button>
            </div>
        `;
        area.innerHTML = resultadoHtml;
        quizProgress.style.width = '100%';
    }
}

// --- CARREGAMENTO DE ATIVIDADES ---
function carregarConteudoAtividades(parque, container) {
    const atividades = ATIVIDADES_PARQUES[parque.id] || [];
    
    let html = `
        <div class="activity-instructions">
            <div class="instruction-text">
                <h3>Escaneie os QR codes</h3>
            </div>
            <div class="qr-mascote-container activity-mascote-anchor" onclick="window.abrirModalQr()">
                <img src="qr.png" alt="Mascote escaneando QR Code" class="qr-mascote-img">
            </div>
        </div>
        <hr class="separator" style="margin: 15px 0;">
        
        <div id="lista-atividades-dinamica"> 
    `;

    if (atividades.length === 0) {
        html += '<p style="text-align: center; margin-top: 20px;">Nenhuma atividade cadastrada para este parque.</p>';
    } else {
        atividades.forEach(atividade => {
            if (atividade.id === 'quiz') return;

            if (!estadoUsuario[parque.id]) estadoUsuario[parque.id] = {};
            if (typeof estadoUsuario[parque.id][atividade.id] === 'undefined') {
                estadoUsuario[parqueId][atividade.id] = false;
            }

            const isConcluida = estadoUsuario[parque.id][atividade.id];
            const desbloqueado = isConcluida ? 'desbloqueado' : ''; 
            const badgeId = `${parque.id}-${atividade.id}`;
            
            let badgeContent;
            if (atividade.imagem_png) {
                badgeContent = `<img src="${atividade.imagem_png}" alt="${atividade.nome}">`;
            } else {
                badgeContent = `<i class="fas ${atividade.icone}"></i>`;
            }
            
            const onClickAction = isConcluida ? `onclick="window.location.hash = 'upload-${parque.id}-${atividade.id}'"` : '';

            html += `
                <div class="activity-grid-item ${desbloqueado}" data-badge-id="${badgeId}" ${onClickAction}>
                    ${badgeContent}
                    <span>${atividade.nome}</span> 
                </div>
            `;
        });
    }
    salvarEstado();

    html += '</div>';
    container.innerHTML = html; 
}

// --- CARREGAMENTO DE DETALHES DO PARQUE ---
function carregarDetalhesParque(parqueId, action = 'info') {
    fecharModais(); 
    const parque = DADOS_PARQUES.find(p => p.id === parqueId);
    const detalhes = DETALHES_PARQUES[parqueId];
    
    if (!parque || !detalhes) {
        console.error('Parque ou detalhes não encontrados:', parqueId);
        window.location.hash = ''; 
        return;
    }

    document.getElementById('conteudo-premios').style.display = 'none';
    document.getElementById('area-envio-foto').style.display = 'none';

    const areaSecundaria = document.getElementById('area-secundaria');
    document.getElementById('secundaria-titulo').textContent = parque.nome;
    
    document.getElementById('map-link-icon').href = detalhes.map_link || '#';
    document.getElementById('insta-link-icon').href = detalhes.instagram_link || '#';
    
    const youtubeIcon = document.getElementById('youtube-link-icon');
    if (youtubeIcon) {
        youtubeIcon.href = detalhes.youtube_channel || '#';
        youtubeIcon.style.display = detalhes.youtube_channel ? 'flex' : 'none';
    }

    const siteIcon = document.getElementById('site-link-icon');
    if (siteIcon) {
        siteIcon.href = detalhes.site_link || '#';
        siteIcon.style.display = detalhes.site_link ? 'flex' : 'none';
    }
    
    const whatsappIcon = document.getElementById('whatsapp-link-icon');
    if (whatsappIcon) {
        whatsappIcon.href = detalhes.whatsapp ? `https://wa.me/${detalhes.whatsapp.replace(/\+/g, '')}` : '#'; 
        whatsappIcon.style.display = detalhes.whatsapp ? 'flex' : 'none';
    }

    const phoneIcon = document.getElementById('phone-link-icon');
    if (phoneIcon) {
        phoneIcon.href = detalhes.phone ? `tel:${detalhes.phone}` : '#';
        phoneIcon.style.display = detalhes.phone ? 'flex' : 'none';
    }
    
    const emailIcon = document.getElementById('email-link-icon');
    if (emailIcon) {
        emailIcon.href = detalhes.email ? `mailto:${detalhes.email}` : '#';
        emailIcon.style.display = detalhes.email ? 'flex' : 'none';
    }


    setupCarousel(parqueId, detalhes.carousel_images || []);
    
    const contentArea = document.getElementById('dynamic-content-area');
    
    document.querySelectorAll('.action-button[data-action]').forEach(btn => {
        if (btn.actionListenerSetup) {
             btn.removeEventListener('click', btn.actionListenerSetup);
        }
        
        const actionListener = (e) => {
           e.preventDefault();
           const newAction = e.target.closest('.action-button').dataset.action;
           window.location.hash = `#${parqueId}-${newAction}`; 
        };
        btn.addEventListener('click', actionListener);
        btn.actionListenerSetup = actionListener;
    });


    const actionButton = document.querySelector(`.action-button[data-action="${action}"]`);
    
    document.querySelectorAll('.action-button[data-action]').forEach(btn => btn.classList.remove('active'));
    if (actionButton) {
        actionButton.classList.add('active');
    }
        
    carregarConteudoDinamico(parque, contentArea, action);

    document.getElementById('conteudo-parque-detalhe').style.display = 'block';
    
    areaSecundaria.classList.add('aberto');
    areaSecundaria.style.display = 'flex'; 
    areaSecundaria.scrollTop = 0;
}

function carregarConteudoDinamico(parque, container, action) {
    
    switch (action) {
        case 'info':
            carregarConteudoInfo(parque, container);
            break;
        case 'fauna': 
            carregarConteudoFauna(parque, container);
            break;
        case 'quiz':
            carregarConteudoQuiz(parque, container);
            break;
        case 'checkins':
            carregarConteudoAtividades(parque, container);
            break;
    }
}

// --- Lógica de Upload/Compartilhamento (CANVAS 9:16) ---
function carregarAreaUpload(parqueId, atividadeId) {
    fecharModais(); 
    const parque = DADOS_PARQUES.find(p => p.id === parqueId);
    const atividade = ATIVIDADES_PARQUES[parqueId]?.find(a => a.id === atividadeId);
    
    estadoUsuario = JSON.parse(localStorage.getItem('trilhasDeMinasStatus')) || {};
    
    document.getElementById('conteudo-parque-detalhe').style.display = 'none';
    document.getElementById('conteudo-premios').style.display = 'none';

    const areaEnvioFoto = document.getElementById('area-envio-foto');
    if (!areaEnvioFoto) return;
    areaEnvioFoto.style.display = 'block';

    if (!parque || !atividade) {
        document.getElementById('secundaria-titulo').textContent = 'Erro';
        areaEnvioFoto.innerHTML = '<p>Badge não encontrado.</p>';
        return;
    }

    const isConcluida = estadoUsuario[parqueId] && estadoUsuario[parqueId][atividadeId];
    
    document.getElementById('secundaria-titulo').textContent = 'Compartilhar Conquista';
    
    if (!isConcluida) {
        document.getElementById('secundaria-titulo').textContent = 'Acesso Negado';
        areaEnvioFoto.innerHTML = `
            <p style="text-align: center; padding: 20px;">Você precisa escanear o QR Code de ${atividade.nome} para liberar o compartilhamento!</p>
            <button class="action-button active" onclick="window.location.hash='premiacao'" style="width: 100%; max-width: 300px; margin: 20px auto;">Voltar para Badges</button>
        `;
        return;
    }
    
    // --- AJUSTE CANVAS 9:16 + UI DE COMPARTILHAMENTO (Ícones sem texto) ---
    areaEnvioFoto.innerHTML = `
        <h2 id="badge-upload-titulo" style="text-align: center; margin-bottom: 10px;">Compartilhar Badge: ${atividade.nome} (${parque.nome})</h2>
        <div class="upload-container">
            <p style="margin-bottom: 8px;">Selecione uma foto sua na trilha para carimbar:</p>
            
            <!-- AJUSTE: Botão de upload moderno -->
            <label for="input-foto-badge" class="file-upload-label">
                <i class="fas fa-upload"></i> Escolher Arquivo
            </label>
            <input type="file" id="input-foto-badge" accept="image/*">
            <span id="file-upload-filename" class="file-upload-filename">Nenhum arquivo selecionado</span>
            
            <div id="output-image-preview" style="display: none; position: relative;"> 
                
                <!-- Ícones de download e compartilhamento AGORA DENTRO do preview -->
                <div class="upload-action-icons-container-top">
                    <button id="btn-gerar-e-baixar-icon" class="upload-icon-btn" disabled title="Baixar Imagem">
                        <i class="fas fa-download"></i>
                    </button>
                    
                    <button id="btn-compartilhar-social-icon" class="upload-icon-btn" disabled title="Compartilhar">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>

                <canvas id="passport-canvas" width="1080" height="1920" style="border: 1px solid #ccc; display: none; margin: 0 auto; max-width: 100%; height: auto;"></canvas>
            </div>
        </div>
    `;
    // --- Fim do AJUSTE CANVAS + UI ---


    const canvas = document.getElementById('passport-canvas');
    canvasContext = canvas.getContext('2d');
    
    // As dimensões são setadas no HTML, mas garantimos aqui
    canvas.width = 1080; 
    canvas.height = 1920; 

    // Delay para garantir que a fonte 'Lora' (substituta de EB Garamond) esteja pronta
    const fontLoadDelay = 500; 

    const inputFotoBadge = document.getElementById('input-foto-badge');
    const btnGerarBaixar = document.getElementById('btn-gerar-e-baixar-icon');
    const btnCompartilhar = document.getElementById('btn-compartilhar-social-icon');
    const fileNameSpan = document.getElementById('file-upload-filename'); // Pega o span do nome do arquivo

    if (!navigator.share) {
        btnCompartilhar.style.display = 'none';
    } else {
        btnCompartilhar.style.display = 'flex'; 
    }
    
    inputFotoBadge.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameSpan.textContent = file.name; // Mostra o nome do arquivo
            const reader = new FileReader();
            reader.onload = (e) => {
                userPhoto.src = e.target.result;
                userPhoto.onload = () => {
                    // Mostra o canvas e desenha a imagem
                    document.getElementById('output-image-preview').style.display = 'block';
                    document.getElementById('passport-canvas').style.display = 'block';
                    setTimeout(() => {
                        drawPassportImage(parque, atividade, userPhoto);
                        // Habilita os botões
                        btnGerarBaixar.disabled = false;
                        btnCompartilhar.disabled = false;
                        btnCompartilhar.onclick = () => shareCanvasImage(parque.nome, atividade.nome);
                    }, fontLoadDelay); // Delay para carregar a fonte
                };
            };
            reader.readAsDataURL(file);
        } else {
            fileNameSpan.textContent = "Nenhum arquivo selecionado"; // Reseta o nome do arquivo
            // Esconde o canvas se nenhum arquivo for selecionado
            document.getElementById('output-image-preview').style.display = 'none';
            document.getElementById('passport-canvas').style.display = 'none';
            // Desabilita botões
            btnGerarBaixar.disabled = true;
            btnCompartilhar.disabled = true;
            btnCompartilhar.onclick = null;
        }
    };
    
    if (atividade.imagem_png) {
        stampImage.src = atividade.imagem_png.startsWith('badges/') ? atividade.imagem_png : `badges/${atividade.imagem_png}`;
    } else {
        stampImage.src = 'images/default_stamp_fallback.png'; 
    }
    
    btnGerarBaixar.onclick = () => {
        if (inputFotoBadge.files.length > 0) { 
            downloadCanvasImage(parque.nome, atividade.nome);
        } else {
            alert('Nenhuma imagem para baixar. Por favor, selecione uma foto.');
        }
    };
    
    document.getElementById('area-secundaria').classList.add('aberto');
    document.getElementById('area-secundaria').style.display = 'flex';
    document.getElementById('area-secundaria').scrollTop = 0;
}

function drawPassportImage(parque, atividade, userUploadedPhoto) {
    if (!canvasContext) return;

    const canvas = canvasContext.canvas;
    canvas.width = 1080;
    canvas.height = 1920;
    
    const ctx = canvasContext;

    const performDraw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. FUNDO
        if (passportTemplateImage.complete && passportTemplateImage.naturalWidth > 0) {
            ctx.drawImage(passportTemplateImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#f0f8f0'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // --- ÁREA DE CONFIGURAÇÃO (EDITE AQUI SE PRECISAR) ---
        
        // 1. Margem Esquerda (Distância da borda esquerda até a foto)
        const photoX = 70;  
        
        // 2. Largura da Foto (Aumentei para preencher mais)
        const photoWidth = 720;  
        
        // 3. Posição Vertical (Distância do topo)
        const photoY = 320; 
        
        // 4. Altura da Foto
        const photoHeight = 1280; 

        // 5. Margem de Segurança entre Foto e Texto (Aumente se o texto tocar na foto)
        const gap = 160; 

        // -----------------------------------------------------
        
        // 2. FOTO DO USUÁRIO
        
        // Sombra da moldura
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // Moldura Branca
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(photoX - 15, photoY - 15, photoWidth + 30, photoHeight + 30);
        
        ctx.shadowColor = 'transparent'; 

        if (userUploadedPhoto && userUploadedPhoto.complete && userUploadedPhoto.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(photoX, photoY, photoWidth, photoHeight);
            ctx.clip();
            
            // Ajuste de imagem (cover)
            const imgAspectRatio = userUploadedPhoto.naturalWidth / userUploadedPhoto.naturalHeight;
            const frameAspectRatio = photoWidth / photoHeight;
            let sx = 0, sy = 0, sWidth = userUploadedPhoto.naturalWidth, sHeight = userUploadedPhoto.naturalHeight;
            
            if (imgAspectRatio > frameAspectRatio) {
                sHeight = userUploadedPhoto.naturalHeight;
                sWidth = sHeight * frameAspectRatio;
                sx = (userUploadedPhoto.naturalWidth - sWidth) / 2;
            } else {
                sWidth = userUploadedPhoto.naturalWidth;
                sHeight = sWidth / frameAspectRatio;
                sy = (userUploadedPhoto.naturalHeight - sHeight) / 2;
            }
            
            ctx.drawImage(userUploadedPhoto, sx, sy, sWidth, sHeight, photoX, photoY, photoWidth, photoHeight);
            ctx.restore();
        }

        // 3. TEXTO VERTICAL
        ctx.save();
        
        // O ponto de origem do texto é: Fim da foto + Gap
        const textOriginX = photoX + photoWidth + gap; 
        const textOriginY = photoY + photoHeight;      
        
        ctx.translate(textOriginX, textOriginY);
        ctx.rotate(-Math.PI / 2); // Rotaciona 90 graus anti-horário
        
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'middle';

        // Espaçamento entre as linhas de texto
        const lineSpacing = 55; 

        // LINHA 1: CHECK-IN (Esta linha fica exatamente na posição 'gap' definida acima)
        ctx.font = 'bold 40pt "Bebas Neue", "Arial Black", sans-serif';
        ctx.fillStyle = '#4CAF50'; 
        ctx.fillText('CHECK-IN REALIZADO', 0, 0); 

        // LINHA 2: Nome do Parque (Fica à direita da linha 1)
        ctx.font = 'bold 24pt "Open Sans", sans-serif';
        ctx.fillStyle = '#333333'; 
        // O valor negativo (-55) move para a direita visualmente (afastando da foto)
        ctx.fillText(`PARQUE ESTADUAL ${parque.nome.toUpperCase()}`, 0, -lineSpacing);

        // LINHA 3: Nome da Atividade (Fica à direita da linha 2)
        ctx.font = 'bold 20pt "Open Sans", sans-serif';
        ctx.fillStyle = '#555555'; 
        ctx.fillText(atividade.nome.toUpperCase(), 0, -lineSpacing * 2);
        
        // Linha decorativa vertical
        ctx.beginPath();
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 4;
        // Desenha a linha abaixo do texto
        ctx.moveTo(-20, 45); 
        ctx.lineTo(canvas.height * 0.35, 45); 
        ctx.stroke();

        ctx.restore(); 

        // 4. BADGE/CARIMBO (Ajustado para acompanhar a nova largura da foto)
        if (stampImage.complete && stampImage.naturalWidth > 0) {
            const badgeSize = 380; 
            // Alinhado à direita da foto nova
            const badgeX = photoX + photoWidth - (badgeSize * 0.5); 
            const badgeY = photoY - (badgeSize * 0.3); 
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.save();
            ctx.translate(badgeX + badgeSize / 2, badgeY + badgeSize / 2);
            ctx.rotate(15 * Math.PI / 180); 
            ctx.drawImage(stampImage, -badgeSize / 2, -badgeSize / 2, badgeSize, badgeSize);
            ctx.restore();
        }
    };

    setTimeout(performDraw, 500);
}

function downloadCanvasImage(parqueNome, atividadeNome) {
    if (!canvasContext || !document.getElementById('input-foto-badge').files.length) {
        alert('Nenhuma imagem para baixar. Por favor, selecione uma foto.');
        return;
    }

    const canvas = document.getElementById('passport-canvas');
    const parque = DADOS_PARQUES.find(p => p.nome === parqueNome);
    if (!parque) { console.error("Parque não encontrado para download:", parqueNome); return; }
    const atividade = ATIVIDADES_PARQUES[parque.id]?.find(a => a.nome === atividadeNome);
    if (!atividade) { console.error("Atividade não encontrada para download:", atividadeNome); return; }

    // Força a renderização final com a foto do usuário
    drawPassportImage(parque, atividade, userPhoto);

    // Usa setTimeout para garantir que o desenho (incluindo fontes) esteja completo
    setTimeout(() => {
        const dataURL = canvas.toDataURL('image/png'); 
        const link = document.createElement('a');
        link.download = `trilhasdeminas_${parque.id}_${atividade.id}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 1000); // 1 segundo de espera para garantir a renderização
}

async function shareCanvasImage(parqueNome, atividadeNome) {
    if (!canvasContext || !document.getElementById('input-foto-badge').files.length) {
        alert('Nenhuma imagem para compartilhar. Por favor, selecione uma foto.');
        return;
    }

    const canvas = document.getElementById('passport-canvas');
    
    const parque = DADOS_PARQUES.find(p => p.nome === parqueNome);
    if (!parque) { console.error("Parque não encontrado para share:", parqueNome); return; }
    const atividade = ATIVIDADES_PARQUES[parque.id]?.find(a => a.nome === atividadeNome);
    if (!atividade) { console.error("Atividade não encontrada para share:", atividadeNome); return; }

    // Força a renderização e espera 1s
    drawPassportImage(parque, atividade, userPhoto);
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    canvas.toBlob(async (blob) => {
        if (blob) {
            try {
                const file = new File([blob], `trilhasdeminas_${parque.id}_${atividade.id}.png`, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Trilhas de Minas - Check-in Concluído!',
                        text: `Acabei de completar a atividade "${atividade.nome}" no Parque Estadual ${parque.nome} e ganhei um novo Badge! Venha explorar as Trilhas de Minas! #TrilhasDeMinas #TurismoMG`
                    });
                } else {
                    await navigator.share({
                        title: 'Trilhas de Minas - Check-in Concluído!',
                        text: `Acabei de completar a atividade "${atividade.nome}" no Parque Estadual ${parque.nome} e ganhei um novo Badge! Venha explorar as Trilhas de Minas! #TrilhasDeMinas #TurismoMG`,
                        url: window.location.origin 
                    });
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Erro ao compartilhar:', error);
                }
            }
        } else {
            alert('Erro ao gerar a imagem para compartilhamento.');
        }
    }, 'image/png', 0.95); // Qualidade 95%
}


// --- Lógica do Roteamento (Hashchange) ---
function lidarComHash() {
    const fullHash = window.location.hash;
    const hash = fullHash.substring(1);
    
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
    
    document.getElementById('install-prompt').style.display = 'none';
    fecharModais(); 

    const appContainer = document.getElementById('app-container');
    const areaSecundaria = document.getElementById('area-secundaria');

    if (!hash || hash === 'home') {
        areaSecundaria.classList.remove('aberto');
        areaSecundaria.style.display = 'none';
        
        appContainer.style.display = 'flex'; 
        
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        
        if (fullHash !== '') {
            window.location.hash = '';
        }
        
        setupPwaInstallPrompt(); 
        return;
    }
    
    document.body.style.overflow = 'hidden'; 
    document.body.style.height = '100vh';
    appContainer.style.display = 'flex';
    areaSecundaria.style.display = 'flex';
    
    if (hash.startsWith('checkin-')) {
        const parts = hash.split('-'); 
        if (parts.length === 3) {
            processarCheckin(parts[1], parts[2]);
            return;
        }
    }

    if (hash.startsWith('upload-')) {
        const parts = hash.split('-'); 
        if (parts.length === 3) {
            carregarAreaUpload(parts[1], parts[2]);
            return;
        }
    }
    if (hash.startsWith('certificate-')) {
        const rankId = hash.split('-')[1];
        carregarAreaCertificado(rankId);
        return;
    }
    
    if (hash === 'premiacao') {
        carregarConteudoPremiacao();
        return;
    }

    const parts = hash.split('-');
    const parqueId = parts[0];

    const parqueEncontrado = DADOS_PARQUES.find(p => p.id === parqueId);

    if (parqueEncontrado && parqueId !== 'premiacao') {
        const action = parts.length > 1 ? parts[1] : 'info'; 
        carregarDetalhesParque(parqueId, action);
    } else {
        window.location.hash = ''; 
    }
}

// --- Inicialização da Aplicação ---
async function carregarDados() {
    try {
        const [parquesResp, detalhesResp, faunaResp] = await Promise.all([
            fetch('parques.json'),
            fetch('park_details.json'),
            fetch('fauna.json') 
        ]);
        
        if (!parquesResp.ok || !detalhesResp.ok || !faunaResp.ok) {
            throw new Error('Falha ao carregar os arquivos de dados JSON.');
        }

        const parquesData = await parquesResp.json();
        const detalhesData = await detalhesResp.json();
        const faunaData = await faunaResp.json(); 
        
        DADOS_PARQUES = parquesData.DADOS_PARQUES;
        ATIVIDADES_PARQUES = parquesData.ATIVIDADES_PARQUES;
        DETALHES_PARQUES = detalhesData;
        DADOS_FAUNA = faunaData;
    } catch (error) {
        console.error("Erro em carregarDados:", error);
        throw error; 
    }
}

function configurarBotaoIntro() {
    const btnIntro = document.getElementById('btn-intro-checkin');
    if (btnIntro) {
        btnIntro.addEventListener('click', (e) => {
            e.preventDefault();
            window.abrirModalIntro();
        });
    }
}

function configurarNavegacao() {
    const btnHome = document.getElementById('btn-home');
    if (btnHome) {
        btnHome.removeEventListener('click', btnHome.clickListener);
        const clickListener = () => {
            window.location.hash = ''; 
        };
        btnHome.addEventListener('click', clickListener);
        btnHome.clickListener = clickListener;
    }

    window.removeEventListener('hashchange', lidarComHash);
    window.addEventListener('hashchange', lidarComHash);
    
    configurarBotaoIntro();
}

async function inicializar() {
    try {
        await carregarDados();
        
        document.getElementById('app-container').style.display = 'none';
        
        registrarServiceWorker();
        configurarFechamentoModais();
        carregarBotoesParques();

        const videoElement = document.getElementById('intro-video-element');
        const videoIntro = document.getElementById('video-intro');
        let checkinProcessado = false;

        const currentHash = window.location.hash;
        if (currentHash.startsWith('#checkin-')) {
            console.log('Check-in detectado na URL inicial:', currentHash);
            const parts = currentHash.substring(1).split('-');
            if (parts.length === 3) {
                processarCheckin(parts[1], parts[2]); 
                checkinProcessado = true;
            }
        }
        
        configurarNavegacao();

        // LÓGICA DO VÍDEO CORRIGIDA PARA NÃO CONGELAR
        if (localStorage.getItem('first_visit') !== 'false' && !checkinProcessado && videoElement && videoIntro) {
            localStorage.setItem('first_visit', 'false');
            videoIntro.style.display = 'flex';
            videoElement.load();

            const onVideoEnd = () => {
                if (videoIntro.style.display === 'none') return; // Já foi tratado
                videoIntro.classList.add('fade-out');
                setTimeout(() => {
                    videoIntro.style.display = 'none';
                    iniciarApp(); 
                    lidarComHash(); 
                }, 1000);
            };

            // Tenta tocar
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Sucesso no autoplay
                    videoElement.onended = onVideoEnd;
                    // Fallback de segurança (5 segundos) caso 'onended' não dispare
                    setTimeout(onVideoEnd, 5000); 
                }).catch(error => {
                    // Autoplay falhou (comum em browsers)
                    console.warn('Autoplay impedido. Iniciando app diretamente.', error);
                    onVideoEnd(); // Pula o vídeo
                });
            } else {
                 onVideoEnd(); // Caso playPromise não seja suportado
            }
        } else {
            if (videoIntro) videoIntro.style.display = 'none';
            iniciarApp(); 
            if (!checkinProcessado) {
                lidarComHash(); 
            }
        }
        
    } catch (error) {
        console.error('Erro fatal na inicialização:', error);
        document.getElementById('video-intro').style.display = 'none';
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.style.display = 'flex';
            appContainer.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <p>Erro ao carregar o aplicativo. Recarregue a página.</p>
                    <button onclick="location.reload()" class="action-button">Recarregar</button>
                </div>
            `;
        }
    }
}

function carregarAreaCertificado(rankId) {
    fecharModais();
    
    const rank = RANKS_GLOBAIS.find(r => r.id === rankId);
    if (!rank) return;

    document.getElementById('conteudo-parque-detalhe').style.display = 'none';
    document.getElementById('conteudo-premios').style.display = 'none';
    
    const areaEnvioFoto = document.getElementById('area-envio-foto');
    areaEnvioFoto.style.display = 'block';
    
    // Muda o título
    document.getElementById('secundaria-titulo').textContent = 'Certificado de Conquista';
    
    areaEnvioFoto.innerHTML = `
        <h2 id="badge-upload-titulo" style="text-align: center; margin-bottom: 10px;">${rank.nome}</h2>
        <p style="text-align: center; margin-bottom: 20px; font-style: italic;">"${rank.desc}"</p>
        
        <div class="upload-container">
            <p>Selecione sua melhor foto de trilha para o certificado:</p>
            <label for="input-foto-badge" class="file-upload-label"><i class="fas fa-upload"></i> Escolher Foto</label>
            <input type="file" id="input-foto-badge" accept="image/*">
            <span id="file-upload-filename" class="file-upload-filename">Nenhuma foto selecionada</span>
            
            <div id="output-image-preview" style="display: none; position: relative;">
                <div class="upload-action-icons-container-top">
                    <button id="btn-gerar-e-baixar-icon" class="upload-icon-btn" disabled><i class="fas fa-download"></i></button>
                    <button id="btn-compartilhar-social-icon" class="upload-icon-btn" disabled><i class="fas fa-share-alt"></i></button>
                </div>
                <canvas id="passport-canvas" style="width: 100%; height: auto; border: 1px solid #ccc;"></canvas>
            </div>
        </div>
    `;

    const canvas = document.getElementById('passport-canvas');
    canvasContext = canvas.getContext('2d');
    
    // Configuração dos botões (Cópia simplificada da lógica de upload anterior)
    const inputFoto = document.getElementById('input-foto-badge');
    const btnBaixar = document.getElementById('btn-gerar-e-baixar-icon');
    const btnShare = document.getElementById('btn-compartilhar-social-icon');
    
    inputFoto.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('file-upload-filename').textContent = file.name;
            const reader = new FileReader();
            reader.onload = (evt) => {
                userPhoto.src = evt.target.result;
                userPhoto.onload = () => {
                    document.getElementById('output-image-preview').style.display = 'block';
                    // CHAMA A FUNÇÃO ESPECIAL DE DESENHO DE CERTIFICADO
                    drawCertificateImage(rank, userPhoto);
                    btnBaixar.disabled = false;
                    btnShare.disabled = false;
                };
            };
            reader.readAsDataURL(file);
        }
    };
    
    // Eventos de clique para baixar/compartilhar (usando a lógica do canvas atual)
    btnBaixar.onclick = () => {
        const link = document.createElement('a');
        link.download = `certificado_${rank.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
}

function drawCertificateImage(rank, userPhoto) {
    if (!canvasContext) return;
    const canvas = canvasContext.canvas;
    const ctx = canvasContext;
    
    canvas.width = 1080;
    canvas.height = 1920; // Mantemos formato Story para facilitar compartilhar

    // 1. Fundo do Certificado
    if (certificateTemplateImage.complete && certificateTemplateImage.naturalWidth > 0) {
        ctx.drawImage(certificateTemplateImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback elegante: Fundo creme com borda dourada
        ctx.fillStyle = '#fdfbf7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#daa520'; // Dourado
        ctx.lineWidth = 20;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    }

    // 2. Foto do Usuário (Centralizada e redonda ou quadrada menor)
    // Vamos fazer um círculo centralizado na parte superior
    const photoSize = 600;
    const photoX = (canvas.width - photoSize) / 2;
    const photoY = 400;

    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    
    // Desenha foto (cover logic simplificada)
    ctx.drawImage(userPhoto, photoX, photoY, photoSize, photoSize);
    ctx.restore();
    
    // Moldura da foto
    ctx.beginPath();
    ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#daa520';
    ctx.stroke();

    // 3. Textos do Certificado
    ctx.textAlign = 'center';
    ctx.fillStyle = '#333';

    // Título "CERTIFICADO"
    ctx.font = 'bold 60pt "Bebas Neue", sans-serif';
    ctx.fillStyle = '#daa520'; // Dourado
    ctx.fillText('CERTIFICADO DE CONQUISTA', canvas.width / 2, 1150);

    // Texto "Conferido a um explorador de"
    ctx.font = 'italic 30pt "Lora", serif';
    ctx.fillStyle = '#555';
    ctx.fillText('Conferido por mérito ao atingir', canvas.width / 2, 1250);
    
    // Porcentagem
    ctx.font = 'bold 80pt "Arial", sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText(`${rank.percent}%`, canvas.width / 2, 1380);
    
    // Texto "dos parques de Minas Gerais"
    ctx.font = '30pt "Lora", serif';
    ctx.fillStyle = '#555';
    ctx.fillText('dos check-ins de Minas Gerais', canvas.width / 2, 1450);

    // Nome do Rank (O Grande Título)
    ctx.font = 'bold 55pt "Open Sans", sans-serif';
    ctx.fillStyle = '#2e7d32'; // Verde nobre
    ctx.fillText(rank.nome.toUpperCase(), canvas.width / 2, 1600);

    // Selo ou Descrição
    ctx.font = 'italic 24pt "Lora", serif';
    ctx.fillStyle = '#777';
    ctx.fillText(`"${rank.desc}"`, canvas.width / 2, 1700);

    // Rodapé
    ctx.font = '20pt "Open Sans", sans-serif';
    ctx.fillStyle = '#999';
    ctx.fillText('Trilhas de Minas • Reconhecimento Oficial', canvas.width / 2, 1850);
}

// --- FUNÇÃO TEMPORÁRIA PARA TESTES ---
window.ativarModoTeste = function() {
    if (!confirm("Isso vai liberar 40 badges aleatórios para testar o Certificado. Continuar?")) return;

    let contador = 0;
    for (const parqueId in ATIVIDADES_PARQUES) {
        ATIVIDADES_PARQUES[parqueId].forEach(ativ => {
            // Libera até 40 badges (o suficiente para o nível 1 - 30%)
            if (contador < 40 && ativ.id !== 'quiz') { 
                if (!estadoUsuario[parqueId]) estadoUsuario[parqueId] = {};
                estadoUsuario[parqueId][ativ.id] = true;
                contador++;
            }
        });
    }
    
    salvarEstado();
    alert(`Sucesso! ${contador} badges liberados.`);
    
    // Redireciona para a tela de prêmios para você ver o resultado
    window.location.hash = '#premiacao';
    window.location.reload(); // Recarrega para garantir que tudo atualize
}

function iniciarApp() {
    document.getElementById('app-container').style.display = 'flex';
    document.querySelector('header').style.display = 'flex';
    document.getElementById('botoes-parques').style.display = 'grid'; 
    
    setupPwaInstallPrompt();

    const btnPremiacao = document.getElementById('btn-premiacao');
    if (btnPremiacao) {
        btnPremiacao.removeEventListener('click', btnPremiacao.clickListener); 
        const clickListener = (e) => {
            e.preventDefault();
            window.location.hash = `#premiacao`; 
        };
        btnPremiacao.addEventListener('click', clickListener);
        btnPremiacao.clickListener = clickListener;
    }
}

document.addEventListener('DOMContentLoaded', inicializar);















