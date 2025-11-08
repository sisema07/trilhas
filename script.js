// script.js - CÓDIGO COMPLETO FINAL AJUSTADO (VERSÃO CORRIGIDA E MELHORADA)

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

// Caminho para a sua imagem de fundo do passaporte
passportTemplateImage.src = 'images/passport_template.png';

// Variáveis de estado do Quiz
let currentQuizData = null; 
let currentQuizIndex = 0;   
let quizScore = 0;          

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
        
        // Verifica se a instalação já foi aceita/rejeitada permanentemente
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
            // Marca para não mostrar novamente
            localStorage.setItem('pwa_prompt_shown', 'true');
        });
    });

    document.getElementById('close-prompt')?.addEventListener('click', () => {
        document.getElementById('install-prompt').style.display = 'none';
        // Marca para não mostrar novamente
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
        // Garante que o listener não seja duplicado
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
    // Intervalo reduzido para 3 segundos para um carrossel mais dinâmico
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

        // Garante que 'quiz' não seja desbloqueado por QR codes de trilhas/pontos
        if (atividadeId === 'quiz') {
            console.warn('Tentativa de check-in em badge de quiz. Ignorado.');
            // Continua, mas com a mensagem de badge já desbloqueado se o hash for quiz
            isNewBadge = estadoUsuario[parqueId][atividadeId] !== true;

        } else if (!estadoUsuario[parqueId][atividadeId]) {
            estadoUsuario[parqueId][atividadeId] = true;
            salvarEstado();
            isNewBadge = true;
            console.log(`Novo badge desbloqueado: ${parqueId}-${atividadeId}`);
        } 
        
        const message = isNewBadge 
            ? "Trilhas de Minas\n\n🎉 Novo Badge desbloqueado!\nConfira na área Check-ins"
            : "Trilhas de Minas\n\nEste Badge já estava desbloqueado!\nConfira na área Check-ins";
        
        // CORREÇÃO CRÍTICA: Se o check-in for feito, o hash é forçado para 'premiacao'
        // para evitar que a URL de checkin persista.
        setTimeout(() => {
            alert(message);
            window.location.hash = '#premiacao';
            carregarPremios();
        }, 100);
        
        return true;
    } else {
        console.error(`Atividade não encontrada: ${parqueId}-${atividadeId}`);
        alert('Erro: Atividade não encontrada. Verifique o QR Code.');
        // Limpa o hash de erro
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
        // CORREÇÃO: Usar click para forçar a navegação via hash
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

function carregarPremios() {
    const listaPremios = document.getElementById('lista-icones-premios');
    if (!listaPremios) return;

    listaPremios.innerHTML = '';
    
    for (const parqueId in ATIVIDADES_PARQUES) {
        const atividades = ATIVIDADES_PARQUES[parqueId];
        
        if (!estadoUsuario[parqueId]) {
             estadoUsuario[parqueId] = {};
        }

        atividades.forEach(atividade => {
            // Inicializa a atividade para 'false' apenas se ela não existir no estado
            if (typeof estadoUsuario[parqueId][atividade.id] === 'undefined') {
                estadoUsuario[parqueId][atividade.id] = false;
            }

            const isConcluida = estadoUsuario[parqueId][atividade.id];

            const card = document.createElement('div');
            card.className = `icone-premio ${isConcluida ? 'desbloqueado' : ''}`;
            card.dataset.parqueId = parqueId;
            card.dataset.atividadeId = atividade.id;
            
            let badgeContent;
            if (atividade.imagem_png) {
                badgeContent = `<img src="${atividade.imagem_png}" alt="${atividade.nome}" class="badge-custom-img">`;
            } else {
                badgeContent = `<i class="fas ${atividade.icone}"></i>`;
            }
            
            card.innerHTML = `
                ${badgeContent}
                <span>${atividade.nome}</span>
            `;
            listaPremios.appendChild(card);
            
            if (isConcluida) {
                 // Permite o clique no card apenas se o badge estiver desbloqueado
                 card.addEventListener('click', () => {
                    const parqueIdClick = card.dataset.parqueId;
                    const atividadeIdClick = card.dataset.atividadeId;
                    window.location.hash = `upload-${parqueIdClick}-${atividadeIdClick}`;
                 });
            }
        });
    }
    salvarEstado();
}

function carregarConteudoPremiacao() {
    // Esconde outras áreas
    document.getElementById('conteudo-parque-detalhe').style.display = 'none';
    document.getElementById('area-envio-foto').style.display = 'none';

    const areaSecundaria = document.getElementById('area-secundaria');
    document.getElementById('secundaria-titulo').textContent = 'Seus Check-ins';

    document.getElementById('conteudo-premios').style.display = 'block';

    carregarPremios();
    
    areaSecundaria.classList.add('aberto');
    // Garante que a área secundária esteja visível (ajuste para mobile)
    areaSecundaria.style.display = 'flex'; 
    areaSecundaria.scrollTop = 0;
}

// --- CARREGAMENTO DE CONTEÚDO DINÂMICO ---
function carregarConteudoInfo(parque, container) {
    const detalhes = DETALHES_PARQUES[parque.id] || {};
    container.innerHTML = `
        <h3>Informações Gerais</h3>
        <p>${detalhes.info_content || 'Informações detalhadas sobre o parque não disponíveis.'}</p>
        
        <h3>O que esperar</h3>
        <p>${parque.descricao || 'O parque é um local ideal para explorar a natureza.'}</p>
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
            
            // Usamos uma IIFE para garantir que a função seja exposta no escopo global (window)
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

    // Função de download que será executada ao clicar no botão
    const downloadFunction = (path, name) => {
        // Cria um link temporário
        const link = document.createElement('a');
        link.href = path;
        link.download = name; // Nome do arquivo a ser baixado
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    modalBody.innerHTML = `
        <h4>${animal.nome}</h4>
        <img src="${imagePath}" alt="${animal.nome}">
        <p><strong>Status de Conservação (IUCN):</strong> ${animal.status || 'Não Classificado'}</p>
        <p>${animal.descricao}</p>
        
        <button id="btn-fauna-download" class="action-button active" 
            style="width: 100%; margin-top: 15px;">
            <i class="fas fa-download"></i> Baixar Imagem
        </button>
    `;

    // Anexa o listener de clique ao novo botão
    document.getElementById('btn-fauna-download').addEventListener('click', () => {
        downloadFunction(imagePath, fileName);
    });
    
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
    
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 10px;">
            <p class="result-classification" style="color: var(--cor-secundaria);">Conhecimento de Mestre!</p>
            <div class="win-animation-container">
                <img src="win.gif" alt="Quiz Concluído" class="win-gif-mascote">
            </div>
            <p class="success-badge-message">Parabéns! Você ganhou o badge do Quiz!</p>
            <p style="margin-bottom: 20px;">Pontuação: ${score} de ${total}</p>
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
            // Oculta completamente após a transição
            modal.style.display = 'none';
        }, 300); 
    });
}

// Configura listeners de fechar modal (chamado em 'inicializar')
function configurarFechamentoModais() {
    // Adiciona listener para fechar modais ao clicar no X
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', fecharModais);
    });

    // Garante que o modal feche ao clicar fora (no overlay)
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
    const badgeQuiz = ATIVIDADES_PARQUES[parque.id]?.find(a => a.id === 'quiz');
    const isQuizCompleted = badgeQuiz && estadoUsuario[parque.id] && estadoUsuario[parque.id][badgeQuiz.id];
    
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
                <p class="success-badge-message">O badge foi adicionado à sua coleção.</p>
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
    // CORREÇÃO: Usar Array.isArray para garantir que 'a' é um array
    const alternativas = Array.isArray(questao.a) ? questao.a : [];
    
    alternativas.forEach((alternativa, index) => {
        // CORREÇÃO: Garante que a função selectQuizOption esteja no escopo global para o onclick
        optionsHtml += `
            <button class="action-button quiz-option-btn" data-index="${index}" onclick="window.selectQuizOption(${index}, this)">${alternativa}</button>
        `;
    });
    
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

// Expõe a função de seleção de quiz
window.selectQuizOption = function(selectedIndex, buttonElement) {
    const buttons = document.querySelectorAll('.quiz-option-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    const questao = currentQuizData[currentQuizIndex];
    const isCorrect = selectedIndex === questao.correct;
    
    if (isCorrect) {
        buttonElement.classList.add('active'); 
        quizScore++;
    } else {
        buttonElement.style.backgroundColor = '#f44336'; 
        buttonElement.style.color = 'white';
        // Destaca a resposta correta
        document.querySelector(`.quiz-option-btn[data-index="${questao.correct}"]`)?.classList.add('active');
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
    // O hash deve ser um ID de parque válido, então usamos DADOS_PARQUES para encontrar
    const parqueId = window.location.hash.substring(1).split('-')[0];
    const parque = DADOS_PARQUES.find(p => p.id === parqueId);
    
    if (!parque) return;

    const requiredScore = Math.ceil(total * 0.75); 
    
    if (quizScore >= requiredScore) { 
        const badgeId = currentQuizData[0].badge_id || 'quiz';
        
        // Marca o badge como conquistado
        if (ATIVIDADES_PARQUES[parqueId]?.find(a => a.id === badgeId)) {
            if (!(estadoUsuario[parqueId] && estadoUsuario[parqueId][badgeId])) {
                if (!estadoUsuario[parqueId]) estadoUsuario[parqueId] = {};
                estadoUsuario[parqueId][badgeId] = true;
                salvarEstado();
            }
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
        // CÓDIGO PARA FALHA NO QUIZ
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
            if (!estadoUsuario[parque.id]) estadoUsuario[parque.id] = {};
            if (typeof estadoUsuario[parque.id][atividade.id] === 'undefined') {
                estadoUsuario[parque.id][atividade.id] = false;
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
            
            // Corrige o onclick para ser seguro
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

    // Esconde outras áreas
    document.getElementById('conteudo-premios').style.display = 'none';
    document.getElementById('area-envio-foto').style.display = 'none';

    const areaSecundaria = document.getElementById('area-secundaria');
    document.getElementById('secundaria-titulo').textContent = parque.nome;
    
    // Mapeamento dos links de contato (Garantindo que os elementos existam)
    document.getElementById('map-link-icon').href = detalhes.map_link || '#';
    document.getElementById('insta-link-icon').href = detalhes.instagram_link || '#';
    document.getElementById('phone-link-icon').href = `tel:${detalhes.phone || ''}`;
    document.getElementById('email-link-icon').href = `mailto:${detalhes.email || ''}`;

    setupCarousel(parqueId, detalhes.carousel_images || []);
    
    const contentArea = document.getElementById('dynamic-content-area');
    
    // Configuração dos listeners para os botões de ação (Info, Fauna, Quiz, Atividades)
    document.querySelectorAll('.action-button[data-action]').forEach(btn => {
        // Remove listener anterior antes de adicionar
        if (btn.actionListenerSetup) {
             btn.removeEventListener('click', btn.actionListenerSetup);
        }
        
        const actionListener = (e) => {
           e.preventDefault();
           const newAction = e.target.closest('.action-button').dataset.action;
           window.location.hash = `#${parqueId}-${newAction}`; 
        };
        btn.addEventListener('click', actionListener);
        btn.actionListenerSetup = actionListener; // Armazena o listener para remoção futura
    });


    const actionButton = document.querySelector(`.action-button[data-action="${action}"]`);
    
    // Aplica a classe 'active'
    document.querySelectorAll('.action-button[data-action]').forEach(btn => btn.classList.remove('active'));
    if (actionButton) {
        actionButton.classList.add('active');
    }
        
    // Carrega o conteúdo dinâmico
    carregarConteudoDinamico(parque, contentArea, action);

    document.getElementById('conteudo-parque-detalhe').style.display = 'block';
    
    areaSecundaria.classList.add('aberto');
    // Garante que a área secundária esteja visível
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
        case 'activities':
            carregarConteudoAtividades(parque, container);
            break;
    }
}

// --- Lógica de Upload/Compartilhamento (CANVAS) ---
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
    
    // Reconstrói a área de upload para garantir listeners e estado limpo
    areaEnvioFoto.innerHTML = `
        <h2 id="badge-upload-titulo" style="text-align: center; margin-bottom: 20px;">Compartilhar Badge: ${atividade.nome} (${parque.nome})</h2>
        <div class="upload-container">
            <p>Selecione uma foto sua na trilha para carimbar:</p>
            <input type="file" id="input-foto-badge" accept="image/*">
            
            <div id="output-image-preview">
                <canvas id="passport-canvas" width="600" height="800" style="border: 1px solid #ccc; display: block; margin: 20px auto; max-width: 100%; height: auto;"></canvas>
            </div>
            
            <button id="btn-gerar-e-baixar" class="action-button" style="margin-top: 20px; width: 100%;" disabled>
                <i class="fas fa-download"></i> Baixar Foto com Check-in
            </button>
            
            <button id="btn-compartilhar-social" class="action-button" style="margin-top: 10px; width: 100%;" disabled>
                <i class="fas fa-share-alt"></i> Compartilhar
            </button>
        </div>
    `;


    const canvas = document.getElementById('passport-canvas');
    canvasContext = canvas.getContext('2d');
    
    canvas.width = 600; 
    canvas.height = 800; 

    // Garante que as fontes do canvas estejam carregadas
    if (!document.getElementById('google-fonts-link')) {
        const link = document.createElement('link');
        link.id = 'google-fonts-link';
        link.href = 'https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Roboto+Slab:wght@700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    const inputFotoBadge = document.getElementById('input-foto-badge');
    const btnGerarBaixar = document.getElementById('btn-gerar-e-baixar');
    const btnCompartilhar = document.getElementById('btn-compartilhar-social');

    // Oculta/Mostra o botão Compartilhar se a API não estiver disponível
    if (!navigator.share) {
        btnCompartilhar.style.display = 'none';
    } else {
        btnCompartilhar.style.display = 'block';
    }
    
    inputFotoBadge.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                userPhoto.src = e.target.result;
                userPhoto.onload = () => {
                    drawPassportImage(parque, atividade, userPhoto);
                    // Habilitar botões após carregar e desenhar a foto
                    btnGerarBaixar.disabled = false;
                    btnCompartilhar.disabled = false;
                    btnGerarBaixar.classList.add('active'); // Estilo ativo
                    btnCompartilhar.classList.add('active'); // Estilo ativo
                    // Reconfigura o clique
                    btnCompartilhar.onclick = () => shareCanvasImage(parque.nome, atividade.nome);
                };
            };
            reader.readAsDataURL(file);
        } else {
            drawPassportImage(parque, atividade, null);
            // Desabilitar botões se não houver foto
            btnGerarBaixar.disabled = true;
            btnCompartilhar.disabled = true;
            btnGerarBaixar.classList.remove('active');
            btnCompartilhar.classList.remove('active');
            btnCompartilhar.onclick = null;
        }
    };
    
    // Configura a imagem do badge
    if (atividade.imagem_png) {
        stampImage.src = atividade.imagem_png.startsWith('badges/') ? atividade.imagem_png : `badges/${atividade.imagem_png}`;
    } else {
        stampImage.src = 'images/default_stamp_fallback.png'; 
    }

    // Desenha o canvas inicial (sem foto do usuário)
    drawPassportImage(parque, atividade, null);

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

// O Canvas Drawing é mantido, mas as fontes precisam de um tempo para carregar no Canvas
function drawPassportImage(parque, atividade, userUploadedPhoto) {
    if (!canvasContext) return;

    const canvas = canvasContext.canvas;
    
    // Funcao interna para desenhar com segurança apos fontes carregadas
    const performDraw = () => {
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Desenha o Template do Passaporte
        if (passportTemplateImage.complete && passportTemplateImage.naturalWidth > 0) {
            canvasContext.drawImage(passportTemplateImage, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback de fundo
            canvasContext.fillStyle = '#e6e0d4';
            canvasContext.fillRect(0, 0, canvas.width, canvas.height);
            canvasContext.fillStyle = '#333';
            canvasContext.font = '20px Arial';
            canvasContext.fillText('Carregue images/passport_template.png', 50, canvas.height / 2);
        }

        const photoX = canvas.width * 0.1;    
        const photoY = canvas.height * 0.28;   
        const photoWidth = canvas.width * 0.8; 
        const photoHeight = canvas.height * 0.6;

        // 2. Desenha a Foto do Usuário (com clip/border-radius)
        if (userUploadedPhoto && userUploadedPhoto.complete && userUploadedPhoto.naturalWidth > 0) {
            
            const cornerRadius = photoWidth * 0.05;
            
            canvasContext.save();
            
            canvasContext.beginPath();
            canvasContext.moveTo(photoX + cornerRadius, photoY);
            canvasContext.lineTo(photoX + photoWidth - cornerRadius, photoY);
            canvasContext.quadraticCurveTo(photoX + photoWidth, photoY, photoX + photoWidth, photoY + cornerRadius);
            canvasContext.lineTo(photoX + photoWidth, photoY + photoHeight - cornerRadius);
            canvasContext.quadraticCurveCurveTo(photoX + photoWidth, photoY + photoHeight, photoX + photoWidth - cornerRadius, photoY + photoHeight);
            canvasContext.lineTo(photoX + cornerRadius, photoY + photoHeight);
            canvasContext.quadraticCurveTo(photoX, photoY + photoHeight, photoX, photoY + photoHeight - cornerRadius);
            canvasContext.lineTo(photoX, photoY + cornerRadius);
            canvasContext.quadraticCurveTo(photoX, photoY, photoX + cornerRadius, photoY);
            canvasContext.closePath();
            
            canvasContext.clip();
            
            const imgAspectRatio = userUploadedPhoto.naturalWidth / userUploadedPhoto.naturalHeight;
            const frameAspectRatio = photoWidth / photoHeight;
            
            let sx, sy, sWidth, sHeight;
            
            if (imgAspectRatio > frameAspectRatio) {
                sHeight = userUploadedPhoto.naturalHeight;
                sWidth = sHeight * frameAspectRatio;
                sx = (userUploadedPhoto.naturalWidth - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = userUploadedPhoto.naturalWidth;
                sHeight = sWidth / frameAspectRatio;
                sx = 0;
                sy = (userUploadedPhoto.naturalHeight - sHeight) / 2;
            }
            
            canvasContext.drawImage(userUploadedPhoto, sx, sy, sWidth, sHeight, photoX, photoY, photoWidth, photoHeight);
            
            canvasContext.restore();

            // Borda verde
            canvasContext.strokeStyle = '#4CAF50';
            canvasContext.lineWidth = 4;
            
            canvasContext.beginPath();
            canvasContext.moveTo(photoX + cornerRadius, photoY);
            canvasContext.lineTo(photoX + photoWidth - cornerRadius, photoY);
            canvasContext.quadraticCurveTo(photoX + photoWidth, photoY, photoX + photoWidth, photoY + cornerRadius);
            canvasContext.lineTo(photoX + photoWidth, photoY + photoHeight - cornerRadius);
            canvasContext.quadraticCurveTo(photoX + photoWidth, photoY + photoHeight, photoX + photoWidth - cornerRadius, photoY + photoHeight);
            canvasContext.lineTo(photoX + cornerRadius, photoY + photoHeight);
            canvasContext.quadraticCurveTo(photoX, photoY + photoHeight, photoX, photoY + photoHeight - cornerRadius);
            canvasContext.lineTo(photoX, photoY + cornerRadius);
            canvasContext.quadraticCurveTo(photoX, photoY, photoX + cornerRadius, photoY);
            canvasContext.closePath();
            canvasContext.stroke();
        }
        
        // 3. Desenha o Carimbo (Badge)
        if (stampImage.complete && stampImage.naturalWidth > 0) {
            canvasContext.save();
            
            const stampSize = canvas.width * 0.3;     
            const stampX = canvas.width * 0.03;      
            const stampY = canvas.height * 0.1;
            const rotationAngle = -25 * Math.PI / 180;

            const centerX = stampX + stampSize / 2;
            const centerY = stampY + stampSize / 2;

            canvasContext.translate(centerX, centerY);
            canvasContext.rotate(rotationAngle);
            canvasContext.translate(-centerX, -centerY);

            canvasContext.drawImage(stampImage, stampX, stampY, stampSize, stampSize);
            
            canvasContext.restore();
        }

        // 4. Desenha o Texto
        canvasContext.textAlign = 'left';
        
        const textStartX = canvas.width * 0.32;   
        let currentTextY = canvas.height * 0.13;

        // Título "CHECK-IN REALIZADO"
        canvasContext.font = `bold ${canvas.width * 0.036}px "Roboto Slab", serif`; 
        canvasContext.fillStyle = '#4CAF50';
        canvasContext.fillText('CHECK-IN REALIZADO', textStartX, currentTextY);
        currentTextY += canvas.width * 0.036 + canvas.width * 0.005; 

        // Nome do Parque
        canvasContext.font = `bold ${canvas.width * 0.03}px "Lora", serif`; 
        canvasContext.fillStyle = '#555';
        canvasContext.fillText(`PARQUE ESTADUAL ${parque.nome.toUpperCase()}`, textStartX, currentTextY); 
        currentTextY += canvas.width * 0.03 + canvas.width * 0.005; 

        // Nome da Atividade
        canvasContext.fillText(atividade.nome.toUpperCase(), textStartX, currentTextY); 
    };

    // Timeout para esperar a possível carga de fontes (prática comum em canvas)
    setTimeout(performDraw, 100);
}

function downloadCanvasImage(parqueNome, atividadeNome) {
    // Verifica se a foto foi carregada (necessário para o desenho final)
    if (!canvasContext || !document.getElementById('input-foto-badge').files.length) {
        alert('Nenhuma imagem para baixar. Por favor, selecione uma foto.');
        return;
    }

    const canvas = document.getElementById('passport-canvas');
    // Força a renderização final com a foto do usuário
    drawPassportImage(DADOS_PARQUES.find(p => p.id === parqueNome.toLowerCase()), ATIVIDADES_PARQUES[parqueNome.toLowerCase()].find(a => a.nome === atividadeNome), userPhoto);

    const dataURL = canvas.toDataURL('image/png'); 
    const link = document.createElement('a');
    link.download = `trilhasdeminas_${parqueNome.toLowerCase().replace(/\s/g, '_')}_${atividadeNome.toLowerCase().replace(/\s/g, '_')}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Lógica de Compartilhamento Nativo (Web Share API) ---
async function shareCanvasImage(parqueNome, atividadeNome) {
    if (!canvasContext || !document.getElementById('input-foto-badge').files.length) {
        alert('Nenhuma imagem para compartilhar. Por favor, selecione uma foto.');
        return;
    }

    const canvas = document.getElementById('passport-canvas');
    
    // Força a renderização final com a foto do usuário antes de compartilhar
    const parque = DADOS_PARQUES.find(p => p.nome === parqueNome);
    const atividade = ATIVIDADES_PARQUES[parque.id].find(a => a.nome === atividadeNome);
    drawPassportImage(parque, atividade, userPhoto);

    canvas.toBlob(async (blob) => {
        if (blob) {
            try {
                const file = new File([blob], `trilhasdeminas_${parqueNome.toLowerCase().replace(/\s/g, '_')}_${atividadeNome.toLowerCase().replace(/\s/g, '_')}.png`, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Trilhas de Minas - Check-in Concluído!',
                        text: `Acabei de completar a atividade "${atividadeNome}" no Parque Estadual ${parqueNome} e ganhei um novo Badge! Venha explorar as Trilhas de Minas! #TrilhasDeMinas #TurismoMG`
                    });
                    console.log('Compartilhamento bem-sucedido');
                } else {
                    // Fallback para navegadores que não suportam compartilhamento de arquivos
                    await navigator.share({
                        title: 'Trilhas de Minas - Check-in Concluído!',
                        text: `Acabei de completar a atividade "${atividadeNome}" no Parque Estadual ${parqueNome} e ganhei um novo Badge! Venha explorar as Trilhas de Minas! #TrilhasDeMinas #TurismoMG`,
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
    }, 'image/png');
}


// --- Lógica do Roteamento (Hashchange) ---
function lidarComHash() {
    const fullHash = window.location.hash;
    const hash = fullHash.substring(1);
    
    // Para o carrossel em qualquer navegação
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
    
    document.getElementById('install-prompt').style.display = 'none';
    fecharModais(); 

    const appContainer = document.getElementById('app-container');
    const areaSecundaria = document.getElementById('area-secundaria');

    // Se o hash está vazio, volta para a home e garante que o container principal esteja visível.
    if (!hash || hash === 'home') {
        // Logica para FECHAMENTO COMPLETO (Instrução do usuário)
        areaSecundaria.classList.remove('aberto');
        areaSecundaria.style.display = 'none'; // Oculta a área secundária completamente
        
        appContainer.style.display = 'flex'; // Garante o container principal visível
        
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        
        // CORREÇÃO CRÍTICA: Limpa o hash para evitar a volta para a última tela
        if (fullHash !== '') {
            window.location.hash = '';
        }
        
        setupPwaInstallPrompt(); 
        return;
    }
    
    // Se há hash, prepara para mostrar a área secundária
    document.body.style.overflow = 'hidden'; 
    document.body.style.height = '100vh';
    appContainer.style.display = 'flex'; // Mantém o principal visível
    areaSecundaria.style.display = 'flex'; // Torna a secundária flexível
    
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
        // Se o hash for inválido, volta para a home
        window.location.hash = ''; 
    }
}

// --- Inicialização da Aplicação ---
function iniciarApp() {
    
    document.getElementById('app-container').style.display = 'flex';
    setupPwaInstallPrompt();

    // Configura o listener para o botão de check-ins (se existir)
    const btnPremiacao = document.getElementById('btn-premiacao');
    if (btnPremiacao) {
        // Remove listener anterior antes de adicionar (segurança contra duplicação)
        btnPremiacao.removeEventListener('click', btnPremiacao.clickListener); 
        const clickListener = (e) => {
            e.preventDefault();
            window.location.hash = `#premiacao`; 
        };
        btnPremiacao.addEventListener('click', clickListener);
        btnPremiacao.clickListener = clickListener;
    }
}

async function carregarDados() {
    const [parquesResp, detalhesResp, faunaResp] = await Promise.all([
        fetch('parques.json'),
        fetch('park_details.json'),
        fetch('fauna.json') 
    ]);
    
    const parquesData = await parquesResp.json();
    const detalhesData = await detalhesResp.json();
    const faunaData = await faunaResp.json(); 
    
    DADOS_PARQUES = parquesData.DADOS_PARQUES;
    ATIVIDADES_PARQUES = parquesData.ATIVIDADES_PARQUES;
    DETALHES_PARQUES = detalhesData;
    DADOS_FAUNA = faunaData; 
    
    // Adiciona e-mail e telefone de exemplo em DETALHES_PARQUES se não existirem
    if (DETALHES_PARQUES['biribiri']) {
        DETALHES_PARQUES['biribiri'].phone = DETALHES_PARQUES['biribiri'].phone || '5531999999999'; 
        DETALHES_PARQUES['biribiri'].email = DETALHES_PARQUES['biribiri'].email || 'contato.biribiri@exemplo.com'; 
    }
    if (DETALHES_PARQUES['ibitipoca']) {
        DETALHES_PARQUES['ibitipoca'].phone = DETALHES_PARQUES['ibitipoca'].phone || '5532988888888'; 
        DETALHES_PARQUES['ibitipoca'].email = DETALHES_PARQUES['ibitipoca'].email || 'contato.ibitipoca@exemplo.com'; 
    }
}

function configurarBotaoIntro() {
    const btnIntro = document.getElementById('btn-intro-checkin');
    if (btnIntro) {
        btnIntro.addEventListener('click', (e) => {
            e.preventDefault();
            window.abrirModalIntro(); // Usando a função exposta no escopo global
        });
    }
}

function configurarNavegacao() {
    // Configura o botão Home (apenas um listener)
    const btnHome = document.getElementById('btn-home');
    if (btnHome) {
        // Garante que o listener não seja duplicado
        btnHome.removeEventListener('click', btnHome.clickListener);
        const clickListener = () => {
             // Redireciona para a Home (hash vazio)
            window.location.hash = ''; 
        };
        btnHome.addEventListener('click', clickListener);
        btnHome.clickListener = clickListener;
    }

    // Garante que o listener de hashchange seja único
    window.removeEventListener('hashchange', lidarComHash);
    window.addEventListener('hashchange', lidarComHash);
    
    configurarBotaoIntro();
}

async function inicializar() {
    try {
        await carregarDados();
        registrarServiceWorker();
        configurarFechamentoModais();
        carregarBotoesParques(); // Carrega os botões com os dados

        const videoElement = document.getElementById('intro-video-element');
        const videoIntro = document.getElementById('video-intro');
        let checkinProcessado = false;

        const currentHash = window.location.hash;
        if (currentHash.startsWith('#checkin-')) {
            console.log('Check-in detectado na URL inicial:', currentHash);
            const parts = currentHash.substring(1).split('-');
            if (parts.length === 3) {
                // processarCheckin já chama lidarComHash via window.location.hash = '#premiacao'
                processarCheckin(parts[1], parts[2]); 
                checkinProcessado = true;
            }
        }
        
        configurarNavegacao(); // Configura a navegação e o botão home

        if (localStorage.getItem('first_visit') !== 'false' && !checkinProcessado && videoElement && videoIntro) {
            localStorage.setItem('first_visit', 'false');
            
            videoIntro.style.display = 'flex';
            videoElement.load();
            
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Espera o final do vídeo (ou um tempo limite)
                    setTimeout(() => {
                         videoIntro.classList.add('fade-out');
                         setTimeout(() => {
                            videoIntro.style.display = 'none';
                            iniciarApp(); // Mostra o app após a animação
                            lidarComHash(); // Garante o carregamento do estado inicial (Home)
                         }, 1000); 
                    }, videoElement.duration * 1000 || 5000); // Usa duração ou 5s como fallback
                }).catch(error => {
                    console.warn('Autoplay impedido. Iniciando app diretamente.', error);
                    videoIntro.style.display = 'none';
                    iniciarApp();
                    lidarComHash(); 
                });
            }
        } else {
            if (videoIntro) videoIntro.style.display = 'none';
            iniciarApp();
            if (!checkinProcessado) {
                // Se não for um check-in, lida com o hash atual (ou Home)
                lidarComHash(); 
            }
            // Se for checkinProcessado, lidarComHash será chamado dentro de processarCheckin
        }
        
    } catch (error) {
        console.error('Erro fatal na inicialização:', error);
        // Fallback de erro
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

document.addEventListener('DOMContentLoaded', inicializar);

