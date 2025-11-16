// script.js - CÓDIGO COMPLETO COM AJUSTES (1, 3, 4, 6) + AJUSTE FINO DE POSICIONAMENTO

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

function carregarPremios() {
    const listaPremios = document.getElementById('lista-icones-premios');
    if (!listaPremios) return;

    listaPremios.innerHTML = '';

    // --- Badge de Conhecimento Global ---
    const totalQuizzes = getTotalQuizzes();
    const quizzesConcluidos = getQuizzesConcluidos();
    const progressoQuiz = (totalQuizzes > 0) ? (quizzesConcluidos / totalQuizzes) * 100 : 0;
    const isQuizBadgeCompleto = (quizzesConcluidos === totalQuizzes) && (totalQuizzes > 0);

    const cardQuiz = document.createElement('div');
    cardQuiz.className = `icone-premio ${isQuizBadgeCompleto ? 'desbloqueado' : ''}`;
    cardQuiz.id = 'badge-conhecimento-global'; 
    
    cardQuiz.innerHTML = `
        <img src="badges/quiz-badge.png" alt="Conhecimento" class="badge-custom-img">
        <span>Conhecimento</span>
        <div id="badge-conhecimento-progresso" style="height: ${progressoQuiz}%;"></div>
        <span id="badge-conhecimento-progresso-texto" style="display: ${progressoQuiz > 0 && !isQuizBadgeCompleto ? 'block' : 'none'};">
            ${Math.round(progressoQuiz)}%
        </span>
    `;
    
    listaPremios.appendChild(cardQuiz);
    
    // --- Badges de CHECK-IN ---
    for (const parqueId in ATIVIDADES_PARQUES) {
        const atividades = ATIVIDADES_PARQUES[parqueId];
        
        if (!estadoUsuario[parqueId]) {
             estadoUsuario[parqueId] = {};
        }

        atividades.forEach(atividade => {
            if (atividade.id === 'quiz') return; 

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
    
    alternativas.forEach((alternativa, index) => {
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
                <p style="margin-bottom: 20px;">Você acertou ${quizScore} de ${total}. Você precisa de ${requiredScore} acertos para ganhar
