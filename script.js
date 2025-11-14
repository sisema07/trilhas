// script.js - CÓDIGO COMPLETO COM AJUSTES (1, 3, 4, 6)

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
            isNewBadge = false; // Quiz não é mais um badge de check-in

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
            carregarPremios(); // Recarrega os prêmios para mostrar o novo badge
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

// --- AJUSTE 3: Funções de Cálculo do Quiz Global ---
function getTotalQuizzes() {
    let total = 0;
    for (const parqueId in DETALHES_PARQUES) {
        // Verifica se o parque tem um quiz definido e se não está vazio
        if (DETALHES_PARQUES[parqueId].quiz && DETALHES_PARQUES[parqueId].quiz.length > 0) {
            total++;
        }
    }
    return total;
}

function getQuizzesConcluidos() {
    let concluidos = 0;
    for (const parqueId in DETALHES_PARQUES) {
        // Verifica se o quiz existe nesse parque
        if (DETALHES_PARQUES[parqueId].quiz && DETALHES_PARQUES[parqueId].quiz.length > 0) {
            // Verifica se o estado do usuário para [parqueId]['quiz'] é true
            if (estadoUsuario[parqueId] && estadoUsuario[parqueId]['quiz'] === true) {
                concluidos++;
            }
        }
    }
    return concluidos;
}
// --- Fim do AJUSTE 3 ---

function carregarPremios() {
    const listaPremios = document.getElementById('lista-icones-premios');
    if (!listaPremios) return;

    listaPremios.innerHTML = '';

    // --- AJUSTE 3: Adicionar Badge de Conhecimento Global ---
    const totalQuizzes = getTotalQuizzes();
    const quizzesConcluidos = getQuizzesConcluidos();
    const progressoQuiz = (totalQuizzes > 0) ? (quizzesConcluidos / totalQuizzes) * 100 : 0;
    const isQuizBadgeCompleto = quizzesConcluidos === totalQuizzes && totalQuizzes > 0;

    const cardQuiz = document.createElement('div');
    // Adiciona 'desbloqueado' se o progresso for 100%
    cardQuiz.className = `icone-premio ${isQuizBadgeCompleto ? 'desbloqueado' : ''}`;
    cardQuiz.id = 'badge-conhecimento-global'; // ID para fácil seleção
    
    cardQuiz.innerHTML = `
        <img src="badges/quiz-badge.png" alt="Conhecimento" class="badge-custom-img">
        <span>Conhecimento</span>
        <!-- Barra de progresso interna -->
        <div id="badge-conhecimento-progresso" style="height: ${progressoQuiz}%;"></div>
        <!-- Texto de progresso -->
        <span id="badge-conhecimento-progresso-texto" style="display: ${progressoQuiz > 0 && !isQuizBadgeCompleto ? 'block' : 'none'};">
            ${Math.round(progressoQuiz)}%
        </span>
    `;
    
    // Adiciona o card do quiz no início da lista
    listaPremios.appendChild(cardQuiz);
    // ---------------------------------------------------
    
    // Loop para os badges de CHECK-IN
    for (const parqueId in ATIVIDADES_PARQUES) {
        const atividades = ATIVIDADES_PARQUES[parqueId];
        
        if (!estadoUsuario[parqueId]) {
             estadoUsuario[parqueId] = {};
        }

        atividades.forEach(atividade => {
            // AJUSTE 3: Ignora a atividade 'quiz' se ela ainda existir (foi removida do JSON)
            if (atividade.id === 'quiz') return; 

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

    carregarPremios(); // Esta função agora desenha o badge de Quiz e os de check-in
    
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

// --- AJUSTE 4: Popup de vitória do Quiz atualizado ---
window.abrirModalQuizWin = function(score, total) {
    const modal = document.getElementById('quiz-win-modal');
    const modalBody = document.getElementById('quiz-win-modal-body');
    if (!modal || !modalBody) return;
    
    // Calcula o progresso global
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
    
    // AJUSTE 3: O ID do badge de quiz agora é sempre 'quiz' e não vem do JSON de atividades
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
                <!-- AJUSTE 4: Mensagem de progresso -->
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
        // AJUSTE 3: O ID do badge de quiz é sempre 'quiz'
        const badgeId = 'quiz';
        
        // Marca o badge 'quiz' deste parque como conquistado
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
            // AJUSTE 4: Chamar o novo modal de vitória
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
            // AJUSTE 3: O quiz não é mais listado aqui
            if (atividade.id === 'quiz') return;

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
    
    // --- AJUSTE 6: Substituindo botões por ícones ---
    areaEnvioFoto.innerHTML = `
        <h2 id="badge-upload-titulo" style="text-align: center; margin-bottom: 20px;">Compartilhar Badge: ${atividade.nome} (${parque.nome})</h2>
        <div class="upload-container">
            <p>Selecione uma foto sua na trilha para carimbar:</p>
            <input type="file" id="input-foto-badge" accept="image/*">
            
            <div id="output-image-preview">
                <canvas id="passport-canvas" width="600" height="800" style="border: 1px solid #ccc; display: block; margin: 20px auto; max-width: 100%; height: auto;"></canvas>
            </div>
            
            <div class="upload-action-icons-container">
                <button id="btn-gerar-e-baixar-icon" class="upload-icon-btn" disabled title="Baixar Imagem">
                    <i class="fas fa-download"></i>
                    <span>Baixar</span>
                </button>
                
                <button id="btn-compartilhar-social-icon" class="upload-icon-btn" disabled title="Compartilhar">
                    <i class="fas fa-share-alt"></i>
                    <span>Compartilhar</span>
                </button>
            </div>
        </div>
    `;
    // --- Fim do AJUSTE 6 ---


    const canvas = document.getElementById('passport-canvas');
    canvasContext = canvas.getContext('2d');
    
    canvas.width = 600; 
    canvas.height = 800; 

    if (!document.getElementById('google-fonts-link')) {
        const link = document.createElement('link');
        link.id = 'google-fonts-link';
        link.href = 'https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Roboto+Slab:wght@700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    // AJUSTE 6: Selecionando os novos botões de ícone
    const inputFotoBadge = document.getElementById('input-foto-badge');
    const btnGerarBaixar = document.getElementById('btn-gerar-e-baixar-icon');
    const btnCompartilhar = document.getElementById('btn-compartilhar-social-icon');

    if (!navigator.share) {
        btnCompartilhar.style.display = 'none';
    } else {
        btnCompartilhar.style.display = 'flex'; // 'flex' para o ícone
    }
    
    inputFotoBadge.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                userPhoto.src = e.target.result;
                userPhoto.onload = () => {
                    drawPassportImage(parque, atividade, userPhoto);
                    btnGerarBaixar.disabled = false;
                    btnCompartilhar.disabled = false;
                    btnCompartilhar.onclick = () => shareCanvasImage(parque.nome, atividade.nome);
                };
            };
            reader.readAsDataURL(file);
        } else {
            drawPassportImage(parque, atividade, null);
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

    drawPassportImage(parque, atividade, null);

    // AJUSTE 6: Listener de clique para o novo ícone
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
    
    const performDraw = () => {
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        if (passportTemplateImage.complete && passportTemplateImage.naturalWidth > 0) {
            canvasContext.drawImage(passportTemplateImage, 0, 0, canvas.width, canvas.height);
        } else {
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

        if (userUploadedPhoto && userUploadedPhoto.complete && userUploadedPhoto.naturalWidth > 0) {
            
            const cornerRadius = photoWidth * 0.05;
            
            canvasContext.save();
            
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

        canvasContext.textAlign = 'left';
        
        const textStartX = canvas.width * 0.32;   
        let currentTextY = canvas.height * 0.13;

        canvasContext.font = `bold ${canvas.width * 0.036}px "Roboto Slab", serif`; 
        canvasContext.fillStyle = '#4CAF50';
        canvasContext.fillText('CHECK-IN REALIZADO', textStartX, currentTextY);
        currentTextY += canvas.width * 0.036 + canvas.width * 0.005; 

        canvasContext.font = `bold ${canvas.width * 0.03}px "Lora", serif`; 
        canvasContext.fillStyle = '#555';
        canvasContext.fillText(`PARQUE ESTADUAL ${parque.nome.toUpperCase()}`, textStartX, currentTextY); 
        currentTextY += canvas.width * 0.03 + canvas.width * 0.005; 

        canvasContext.fillText(atividade.nome.toUpperCase(), textStartX, currentTextY); 
    };

    setTimeout(performDraw, 100);
}

function downloadCanvasImage(parqueNome, atividadeNome) {
    if (!canvasContext || !document.getElementById('input-foto-badge').files.length) {
        alert('Nenhuma imagem para baixar. Por favor, selecione uma foto.');
        return;
    }

    const canvas = document.getElementById('passport-canvas');
    // Encontra o parque e atividade pelos nomes/IDs
    const parque = DADOS_PARQUES.find(p => p.nome === parqueNome) || DADOS_PARQUES.find(p => p.id === parqueNome);
    const atividade = ATIVIDADES_PARQUES[parque.id]?.find(a => a.nome === atividadeNome);

    if (parque && atividade) {
        drawPassportImage(parque, atividade, userPhoto);
    } else {
        console.error("Não foi possível encontrar parque/atividade para desenhar download.");
        return;
    }

    const dataURL = canvas.toDataURL('image/png'); 
    const link = document.createElement('a');
    link.download = `trilhasdeminas_${parque.id}_${atividade.id}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function shareCanvasImage(parqueNome, atividadeNome) {
    if (!canvasContext || !document.getElementById('input-foto-badge').files.length) {
        alert('Nenhuma imagem para compartilhar. Por favor, selecione uma foto.');
        return;
    }

    const canvas = document.getElementById('passport-canvas');
    
    const parque = DADOS_PARQUES.find(p => p.nome === parqueNome);
    const atividade = ATIVIDADES_PARQUES[parque.id].find(a => a.nome === atividadeNome);
    drawPassportImage(parque, atividade, userPhoto);

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
    }, 'image/png');
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
    const [parquesResp, detalhesResp, faunaResp] = await Promise.all([
        fetch('parques.json'),
        fetch('park_details.json'),
        fetch('fauna.json') 
    ]);
    
    // Adiciona verificação de erro no fetch
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
        
        // AJUSTE 1: Esconde o app-container (que contém a logo/título)
        // O app-container já começa com display:none no HTML, mas garantimos aqui.
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

        // AJUSTE 1: Lógica do vídeo
        if (localStorage.getItem('first_visit') !== 'false' && !checkinProcessado && videoElement && videoIntro) {
            localStorage.setItem('first_visit', 'false');
            
            videoIntro.style.display = 'flex'; // Garante que o contêiner do vídeo esteja visível
            videoElement.load();
            
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Sucesso no Autoplay
                    videoElement.onended = () => {
                         videoIntro.classList.add('fade-out');
                         setTimeout(() => {
                            videoIntro.style.display = 'none';
                            iniciarApp(); // Mostra o app APÓS o vídeo
                            lidarComHash(); 
                         }, 1000); // Duração do fade-out
                    };
                    // Fallback de tempo (caso o 'onended' falhe)
                    setTimeout(() => {
                        if (videoIntro.style.display !== 'none') { // Só executa se o vídeo ainda estiver tocando
                            videoIntro.classList.add('fade-out');
                            setTimeout(() => {
                                videoIntro.style.display = 'none';
                                iniciarApp(); 
                                lidarComHash(); 
                            }, 1000);
                        }
                    }, (videoElement.duration * 1000) || 5000); // Usa duração real ou 5s
                }).catch(error => {
                    // Falha no Autoplay (comum em mobile)
                    console.warn('Autoplay impedido. Iniciando app diretamente.', error);
                    videoIntro.style.display = 'none';
                    iniciarApp(); 
                    lidarComHash(); 
                });
            } else {
                // Navegadores mais antigos que não retornam promise
                videoIntro.style.display = 'none';
                iniciarApp();
                lidarComHash();
            }
        } else {
            // Não é a primeira visita, ou é check-in
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

function iniciarApp() {
    // Esta função torna o app visível (header com logo, botões, etc.)
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
