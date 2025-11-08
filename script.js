// script.js - CÓDIGO COMPLETO CORRIGIDO (COM INCENTIVOS E MASCOTE RUNNER/VIDAS)

let DADOS_PARQUES = [];
let ATIVIDADES_PARQUES = {};
let DETALHES_PARQUES = {}; 
// NOVO: Estrutura de dados da fauna local (Exemplos com texto ilustrativo)
const DADOS_FAUNA = {
    "biribiri": [
        { "nome": "Jaguatirica", "imagem": "jaguatirica.png", "descricao": "A Jaguatirica (Leopardus pardalis) é um predador noturno de porte médio da Mata Atlântica e do Cerrado. Está classificada como Quase Ameaçada (NT). É fundamental para o equilíbrio do ecossistema, mas sofre com a fragmentação de seu habitat e caça. Texto ilustrativo.", "status": "NT" },
        { "nome": "Tamanduá-Bandeira", "imagem": "tamandua.png", "descricao": "O Tamanduá-Bandeira (Myrmecophaga tridactyla) é um dos maiores mamíferos do Cerrado, conhecido por sua língua comprida. Classificado como Vulnerável (VU) no Brasil. Sua presença é um indicador de saúde ambiental, mas ele é frequentemente vítima de atropelamentos em rodovias. Texto ilustrativo.", "status": "VU" },
        { "nome": "Lobo-Guará", "imagem": "loboguara.png", "descricao": "O Lobo-Guará (Chrysocyon brachyurus) é o maior canídeo da América do Sul, símbolo do Cerrado. Classificado como Quase Ameaçado (NT). Caçar e atropelamentos são as principais ameaças. Ele desempenha um papel importante na dispersão de sementes. Texto ilustrativo.", "status": "NT" }
    ],
    "ibitipoca": [
        { "nome": "Sapo-Pingo-de-Ouro", "imagem": "sapo-pingo.png", "descricao": "O Sapo-Pingo-de-Ouro (Brachycephalus ibitipoca) é um pequeno sapo colorido, endêmico de Ibitipoca. Classificado como Criticamente em Perigo (CR). Sua sobrevivência é sensível a mudanças climáticas e à perda de habitat nas partes mais altas do parque. Texto ilustrativo.", "status": "CR" },
        { "nome": "Macaco-Prego", "imagem": "macacoprego.png", "descricao": "O Macaco-Prego (Sapajus nigritus) é inteligente e social, sendo um dos primatas mais comuns da região. Está classificada como Pouco Preocupante (LC). Vive em grupos e se alimenta de frutos e insetos.", "status": "LC" }
    ]
    // Adicionar dados de fauna para outros parques aqui
};

// NOVO: Variável de chances/erros
const MAX_ERROS = 3; 

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
let quizErrors = 0; // NOVO: Contador de erros (vidas)        

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

    document.getElementById('install-btn').addEventListener('click', () => {
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

    document.getElementById('close-prompt').addEventListener('click', () => {
        document.getElementById('install-prompt').style.display = 'none';
        localStorage.setItem('pwa_prompt_shown', 'true');
    });
}

let currentCarouselIndex = 0;
let carouselImages = [];
let carouselInterval = null;

function setupCarousel(parqueId, images) {
    const carouselElement = document.getElementById('park-carousel');
    const dotsElement = document.getElementById('carousel-dots');
    
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
        carouselElement.addEventListener('scroll', handleScroll);
    } else {
        dotsElement.style.display = 'none';
        carouselElement.removeEventListener('scroll', handleScroll);
    }
}

function handleScroll() {
    const carouselElement = document.getElementById('park-carousel');
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
    carouselInterval = setInterval(nextSlide, 4000); 
}

// --- FLUXO PRINCIPAL DE CHECK-IN (QR CODE) ---
function processarCheckin(parqueId, atividadeId) {
    console.log(`Processando check-in: ${parqueId} - atividadeId`);
    
    if (ATIVIDADES_PARQUES[parqueId] && ATIVIDADES_PARQUES[parqueId].some(a => a.id === atividadeId)) {
        
        if (!estadoUsuario[parqueId]) {
            estadoUsuario[parqueId] = {};
        }

        let isNewBadge = false;

        if (!estadoUsuario[parqueId][atividadeId]) {
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
        return false;
    }
}

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
    container.innerHTML = '';
    DADOS_PARQUES.forEach(parque => {
        container.appendChild(carregarBotaoParque(parque));
    });
}

function carregarPremios() {
    const listaPremios = document.getElementById('lista-icones-premios');
    listaPremios.innerHTML = '';
    
    for (const parqueId in ATIVIDADES_PARQUES) {
        const atividades = ATIVIDADES_PARQUES[parqueId];
        
        if (!estadoUsuario[parqueId]) {
             estadoUsuario[parqueId] = {};
        }

        atividades.forEach(atividade => {
            // CORREÇÃO: Inicializa a atividade para 'false' apenas se ela não existir no estado
            if (typeof estadoUsuario[parqueId][atividade.id] === 'undefined') {
                estadoUsuario[parqueId][atividade.id] = false;
            }

            const isConcluida = estadoUsuario[parqueId][atividade.id];

            const card = document.createElement('div');
            // PADRONIZAÇÃO: Agora as classes garantem o mesmo estilo que a área de atividades
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
    areaSecundaria.scrollTop = 0;
}

function carregarConteudoInfo(parque, container) {
    const detalhes = DETALHES_PARQUES[parque.id] || {};
    container.innerHTML = `
        <h3>Informações Gerais</h3>
        <p>${detalhes.info_content || 'Informações detalhadas sobre o parque não disponíveis.'}</p>
        
        <h3>O que esperar</h3>
        <p>${parque.descricao || 'O parque é um local ideal para explorar a natureza.'}</p>
    `;
}

// NOVO: Função para carregar o conteúdo da Fauna
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
                <div class="fauna-grid-item desbloqueado" data-index="${index}" data-parque-id="${parque.id}" onclick="abrirModalFauna('${parque.id}', ${index})">
                    <img src="${imagePath}" alt="${animal.nome}">
                    <span>${animal.nome}</span>
                </div>
            `;
        });
    }

    html += '</div>';
    container.innerHTML = html;
}

// NOVO: Função para abrir o modal de detalhes da Fauna (Pop-up ativado)
window.abrirModalFauna = function(parqueId, index) {
    const animal = DADOS_FAUNA[parqueId][index];
    if (!animal) return;

    const modal = document.getElementById('fauna-modal');
    const modalBody = document.getElementById('fauna-modal-body');
    const imagePath = `fauna/${animal.imagem}`;
    
    modalBody.innerHTML = `
        <h4>${animal.nome}</h4>
        <img src="${imagePath}" alt="${animal.nome}">
        <p><strong>Status de Conservação (IUCN):</strong> ${animal.status || 'Não Classificado'}</p>
        <p>${animal.descricao}</p>
    `;
    
    modal.classList.add('open');
    modal.style.display = 'flex'; // Garante que o display seja flex
}

// NOVO: Função para abrir o modal de instrução do QR Code (Pop-up ativado)
window.abrirModalQr = function() {
    const modal = document.getElementById('qr-modal');
    modal.classList.add('open');
    modal.style.display = 'flex'; // Garante que o display seja flex
}

// NOVO: Função para abrir o modal introdutório de Check-in
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

// Função para fechar qualquer modal
function fecharModais() {
    document.querySelectorAll('.modal-overlay.open').forEach(modal => {
        modal.classList.remove('open');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Espera a transição de opacidade/visibilidade antes de ocultar
    });
}

// Adiciona listener para fechar modais ao clicar no X ou no overlay
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', fecharModais);
});

document.getElementById('fauna-modal').addEventListener('click', (e) => {
    if (e.target.id === 'fauna-modal') fecharModais();
});
document.getElementById('qr-modal').addEventListener('click', (e) => {
    if (e.target.id === 'qr-modal') fecharModais();
});
document.getElementById('intro-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'intro-modal') fecharModais();
});


// Função de clique para navegação por hash (usada em carregarDetalhesParque)
function handleActionClick(event, parqueId) {
    event.preventDefault();
    const newAction = event.target.dataset.action;
    window.location.hash = `#${parqueId}-${newAction}`; 
}

function carregarConteudoQuiz(parque, container) {
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

    // Inicialização da pontuação e erros para a nova rodada
    currentQuizIndex = 0;   
    quizScore = 0;
    quizErrors = 0;
    
    container.innerHTML = `
        <div class="quiz-header-content" style="display: block; text-align: center;">
            <h3>${detalhes.quiz_title || 'Desafio do Conhecimento'}</h3>
            </div>
        
        <div class="progress-bar-container">
            <div class="progress-bar">
                <div id="quiz-progress" style="width: 0%;"></div>
            </div>
        </div>
        
        <div id="quiz-feedback-display">
            <div id="lives-container">
                <span class="feedback-label">Vidas Restantes:</span>
                <i class="fas fa-heart quiz-life-icon active" data-life="1"></i>
                <i class="fas fa-heart quiz-life-icon active" data-life="2"></i>
                <i class="fas fa-heart quiz-life-icon active" data-life="3"></i>
            </div>
            <img id="quiz-mascote-feedback" src="logo.png" alt="Mascote Feedback" class="quiz-feedback-mascote">
        </div>

        <div id="quiz-question-area">
            </div>
    `;
    
    carregarProximaQuestao();
}

function carregarProximaQuestao() {
    const area = document.getElementById('quiz-question-area');
    const nextQuestionBtn = document.getElementById('quiz-next-btn');
    
    if (currentQuizIndex >= currentQuizData.length) {
        finalizarQuiz();
        return;
    }
    
    const questao = currentQuizData[currentQuizIndex];
    
    let optionsHtml = '';
    questao.a.forEach((alternativa, index) => {
        optionsHtml += `
            <button class="action-button quiz-option-btn" data-index="${index}" onclick="selectQuizOption(${index}, this)">${alternativa}</button>
        `;
    });
    
    // Transição para dar um efeito mais suave
    area.style.opacity = '0';
    setTimeout(() => {
        area.innerHTML = `
            <h4 style="margin-bottom: 20px;">Questão ${currentQuizIndex + 1}/${currentQuizData.length}:</h4>
            <p style="font-weight: 700; font-size: 1.1rem; text-align: center;">${questao.q}</p>
            <div class="action-buttons-container" style="flex-direction: column; gap: 10px; margin-top: 20px;">
                ${optionsHtml}
            </div>
        `;
        area.style.opacity = '1'; // Fade-in da nova pergunta
    }, 200); // Transição rápida
    
    if(nextQuestionBtn) nextQuestionBtn.style.display = 'none';
    
    atualizarBarraProgresso();
}

// NOVO: Função para trocar a imagem do mascote (feedback)
function atualizarMascoteFeedback(acertou) {
    const mascote = document.getElementById('quiz-mascote-feedback');
    // Você precisará de imagens "mascote-feliz.png" e "mascote-triste.png"
    const happyImg = 'logo.png'; // Usando logo.png como feliz por simplicidade, mude para mascote-feliz.png
    const sadImg = 'qr.png'; // Usando qr.png como triste por simplicidade, mude para mascote-triste.png

    if (mascote) {
        mascote.src = acertou ? happyImg : sadImg;
        mascote.style.animation = 'none'; // Reseta a animação se for o caso
        
        setTimeout(() => {
            mascote.src = 'logo.png'; // Volta para a imagem padrão (neutra)
        }, 600);
    }
}

// NOVO: Função para remover uma vida e dar feedback visual
function atualizarVidas() {
    // Seleciona o ícone de vida correspondente ao número de erros (1, 2 ou 3)
    const vidaPerdida = document.querySelector(`.quiz-life-icon.active[data-life="${quizErrors}"]`);
    
    // Se não encontrou o ícone *ativo* com o número atual de erros, tenta encontrar o último ativo
    if (!vidaPerdida) {
        // Encontra o último coração ATIVO (o mais alto data-life)
        const allLives = document.querySelectorAll('.quiz-life-icon');
        let lastActiveLife = null;
        for (let i = allLives.length - 1; i >= 0; i--) {
            if (allLives[i].classList.contains('active')) {
                lastActiveLife = allLives[i];
                break;
            }
        }
        if (lastActiveLife) {
            lastActiveLife.classList.remove('active');
            lastActiveLife.classList.add('lost');
        }
    } else {
        vidaPerdida.classList.remove('active');
        vidaPerdida.classList.add('lost');
    }
}


window.selectQuizOption = function(selectedIndex, buttonElement) {
    const buttons = document.querySelectorAll('.quiz-option-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    const questao = currentQuizData[currentQuizIndex];
    const isCorrect = selectedIndex === questao.correct;
    
    if (isCorrect) {
        buttonElement.classList.add('active'); 
        quizScore++;
        atualizarMascoteFeedback(true); // Mascote feliz
    } else {
        buttonElement.style.backgroundColor = '#f44336'; 
        buttonElement.style.color = 'white';
        document.querySelector(`.quiz-option-btn[data-index="${questao.correct}"]`)?.classList.add('active');
        
        // NOVO: Registra o erro e atualiza as vidas
        quizErrors++;
        atualizarMascoteFeedback(false); // Mascote triste
        atualizarVidas();
    }
    
    if (quizErrors >= MAX_ERROS) {
         // NOVO: Falha total do quiz
         setTimeout(() => {
             finalizarQuiz(true); // Passa true para indicar falha por erros
         }, 800);
         return; 
    }

    setTimeout(() => {
        currentQuizIndex++;
        carregarProximaQuestao();
    }, 800); // REDUÇÃO DE TEMPO para 800ms
}

function atualizarBarraProgresso() {
    const progress = (currentQuizIndex / currentQuizData.length) * 100;
    document.getElementById('quiz-progress').style.width = `${progress}%`;
    
    // NOVO: Remove a lógica do Mascote Runner aqui. O mascote de feedback é estático.
}

function finalizarQuiz(falhaPorErros = false) {
    const area = document.getElementById('quiz-question-area');
    const total = currentQuizData.length;
    const parqueId = window.location.hash.substring(1).split('-')[0];
    
    let resultadoHtml;
    const requiredScore = Math.ceil(total * 0.75); 
    
    if (falhaPorErros) {
        // NOVO: Falha por limite de erros
        resultadoHtml = `
            <div style="text-align: center; padding: 20px;">
                <p class="result-classification" style="color: #f44336;">Fim de Jogo!</p>
                <p style="margin-bottom: 25px; font-weight: 700;">Você atingiu o limite de ${MAX_ERROS} erros. Tente novamente para conquistar o Badge!</p>
                <button class="action-button active" onclick="carregarConteudoQuiz(DADOS_PARQUES.find(p => p.id === '${parqueId}'), document.getElementById('dynamic-content-area'))">Reiniciar Quiz</button>
            </div>
        `;
    } else if (quizScore >= requiredScore) { 
        const badgeId = currentQuizData[0].badge_id || 'quiz';
        if (ATIVIDADES_PARQUES[parqueId]?.find(a => a.id === badgeId)) {
            if (!(estadoUsuario[parqueId] && estadoUsuario[parqueId][badgeId])) {
                if (!estadoUsuario[parqueId]) estadoUsuario[parqueId] = {};
                estadoUsuario[parqueId][badgeId] = true;
                salvarEstado();
            }
        }
        
        resultadoHtml = `
            <div style="text-align: center; padding: 20px;">
                <div class="win-animation-container">
                    <img src="win.gif" alt="Quiz Concluído" class="win-gif-mascote">
                </div>
                <p class="result-classification">Conhecimento de Mestre!</p>
                <p class="success-badge-message">Parabéns! Você ganhou o badge do Quiz!</p>
                <p>Pontuação: ${quizScore} de ${total}</p>
                <button class="action-button active" onclick="window.location.hash='premiacao'">Ver Meus Badges</button>
            </div>
        `;
    } else {
        // --- MUDANÇA: MENSAGENS DE INCENTIVO ---
        let incentiveMessage;
        
        if (quizScore >= requiredScore * 0.8) { 
            incentiveMessage = "Quase lá! Você está muito perto de desvendar este parque. Mais uma tentativa e o Badge será seu!";
        } else if (quizScore >= requiredScore * 0.5) { 
            incentiveMessage = "Mandou bem! Continue explorando o parque para aprender mais e completar o desafio na próxima rodada.";
        } else { 
            incentiveMessage = "Não desanime! Use as informações nas abas do parque (Fauna e Info) para te ajudar na próxima tentativa!";
        }
        
        resultadoHtml = `
            <div style="text-align: center; padding: 20px;">
                <p class="result-classification" style="color: #f44336;">Tente Novamente!</p>
                <p style="margin-bottom: 10px; font-weight: 700;">Você acertou ${quizScore} de ${total}.</p>
                <p style="margin-bottom: 25px;">**${incentiveMessage}**</p>
                <button class="action-button active" onclick="carregarConteudoQuiz(DADOS_PARQUES.find(p => p.id === '${parqueId}'), document.getElementById('dynamic-content-area'))">Reiniciar Quiz</button>
            </div>
        `;
    }
    
    area.innerHTML = resultadoHtml;
    document.getElementById('quiz-progress').style.width = '100%';
}

function carregarConteudoAtividades(parque, container) {
    const atividades = ATIVIDADES_PARQUES[parque.id] || [];
    
    // MUDANÇA: O botão QR Code agora chama abrirModalQr()
    let html = `
        <div class="activity-instructions">
            <div class="instruction-text">
                <h3>Escaneie os QR codes</h3>
            </div>
            <div class="qr-mascote-container activity-mascote-anchor" onclick="abrirModalQr()">
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
            // AJUSTE: O item bloqueado não tem a classe 'desbloqueado' e terá opacidade reduzida pelo CSS
            const desbloqueado = isConcluida ? 'desbloqueado' : ''; 
            const badgeId = `${parque.id}-${atividade.id}`;
            
            let badgeContent;
            if (atividade.imagem_png) {
                badgeContent = `<img src="${atividade.imagem_png}" alt="${atividade.nome}">`;
            } else {
                badgeContent = `<i class="fas ${atividade.icone}"></i>`;
            }
            
            // MUDANÇA: Novo layout de 3 colunas (activity-grid-item)
            html += `
                <div class="activity-grid-item ${desbloqueado}" data-badge-id="${badgeId}" ${isConcluida ? `onclick="window.location.hash = 'upload-${parque.id}-${atividade.id}'"` : ''}>
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
    
    // MUDANÇA: Links de Contato (Telefone e E-mail)
    document.getElementById('map-link-icon').href = detalhes.map_link || '#';
    document.getElementById('insta-link-icon').href = detalhes.instagram_link || '#';
    document.getElementById('phone-link-icon').href = `tel:${detalhes.phone || ''}`;
    document.getElementById('email-link-icon').href = `mailto:${detalhes.email || ''}`;

    setupCarousel(parqueId, detalhes.carousel_images || []);
    
    const contentArea = document.getElementById('dynamic-content-area');
    
    // CORREÇÃO CRÍTICA: Configura o listener uma única vez e força a ação via hash.
    document.querySelectorAll('.action-button[data-action]').forEach(btn => {
        // Usa uma flag para configurar o listener apenas uma vez
        if (!btn.actionListenerSetup) {
             const actionListener = (e) => {
                e.preventDefault();
                const newAction = e.target.closest('.action-button').dataset.action;
                window.location.hash = `#${parqueId}-${newAction}`; 
             };
             btn.addEventListener('click', actionListener);
             btn.actionListenerSetup = true;
        }
    });


    const actionButton = document.querySelector(`.action-button[data-action="${action}"]`);
    if (actionButton) {
        // Garante que a classe 'active' seja aplicada corretamente
        document.querySelectorAll('.action-button[data-action]').forEach(btn => btn.classList.remove('active'));
        actionButton.classList.add('active');
        
        carregarConteudoDinamico(parque, contentArea, action);
    }
    
    document.getElementById('conteudo-parque-detalhe').style.display = 'block';
    
    areaSecundaria.classList.add('aberto');
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
    document.getElementById('area-envio-foto').style.display = 'block';

    if (!parque || !atividade) {
        document.getElementById('secundaria-titulo').textContent = 'Erro';
        document.getElementById('area-envio-foto').innerHTML = '<p>Badge não encontrado.</p>';
        return;
    }

    const isConcluida = estadoUsuario[parqueId] && estadoUsuario[parqueId][atividadeId];
    
    document.getElementById('secundaria-titulo').textContent = 'Compartilhar Conquista';
    
    if (!isConcluida) {
        document.getElementById('secundaria-titulo').textContent = 'Acesso Negado';
        document.getElementById('area-envio-foto').innerHTML = `
            <p style="text-align: center; padding: 20px;">Você precisa escanear o QR Code de ${atividade.nome} para liberar o compartilhamento!</p>
            <button class="action-button active" onclick="window.location.hash='premiacao'" style="width: 100%; max-width: 300px; margin: 20px auto;">Voltar para Badges</button>
        `;
        return;
    }
    
    const badgeTituloElement = document.getElementById('badge-upload-titulo');
    badgeTituloElement.textContent = `Compartilhar Badge: ${atividade.nome} (${parque.nome})`;

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

    const inputFotoBadge = document.getElementById('input-foto-badge');
    const btnGerarBaixar = document.getElementById('btn-gerar-e-baixar');
    const btnCompartilhar = document.getElementById('btn-compartilhar-social');

    // Limpar event listeners
    btnGerarBaixar.onclick = null; 
    btnCompartilhar.onclick = null; 
    inputFotoBadge.onchange = null;
    
    // Desabilitar botões por padrão até que a foto seja carregada
    btnGerarBaixar.disabled = true;
    btnCompartilhar.disabled = true;
    btnCompartilhar.classList.remove('active');

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
                    btnCompartilhar.classList.add('active');
                    btnCompartilhar.onclick = () => shareCanvasImage(parque.nome, atividade.nome);
                };
            };
            reader.readAsDataURL(file);
        } else {
            drawPassportImage(parque, atividade, null);
            // Desabilitar botões se não houver foto
            btnGerarBaixar.disabled = true;
            btnCompartilhar.disabled = true;
            btnCompartilhar.classList.remove('active');
            btnCompartilhar.onclick = null;
        }
    };
    
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
    document.getElementById('area-secundaria').scrollTop = 0;
}

function drawPassportImage(parque, atividade, userUploadedPhoto) {
    if (!canvasContext) return;

    const canvas = canvasContext.canvas;
    
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
}

function downloadCanvasImage(parqueNome, atividadeNome) {
    if (!canvasContext || !document.getElementById('input-foto-badge').files.length) {
        alert('Nenhuma imagem para baixar. Por favor, selecione uma foto.');
        return;
    }

    const canvas = document.getElementById('passport-canvas');
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
    
    // Converte o canvas para Blob
    canvas.toBlob(async (blob) => {
        if (blob) {
            try {
                // Cria um arquivo a partir do Blob
                const file = new File([blob], `trilhasdeminas_${parqueNome.toLowerCase().replace(/\s/g, '_')}_${atividadeNome.toLowerCase().replace(/\s/g, '_')}.png`, { type: 'image/png' });

                // Verifica se a API de compartilhamento pode lidar com arquivos
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
                        url: window.location.origin // URL base do app
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
    }
    
    document.getElementById('install-prompt').style.display = 'none';
    fecharModais(); // Garante que modais sejam fechados ao navegar

    // Se o hash está vazio, volta para a home e garante que o container principal esteja visível.
    if (!hash || hash === 'home' || hash === '#') {
        document.getElementById('area-secundaria').classList.remove('aberto');
        document.getElementById('app-container').style.display = 'flex';
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        setupPwaInstallPrompt(); 
        return;
    }
    
    document.body.style.overflow = 'hidden'; 
    document.body.style.height = '100vh';

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
        // CORREÇÃO: Força a action 'info' se nenhuma for especificada, o que corrige o bug de retorno.
        const action = parts.length > 1 ? parts[1] : 'info'; 
        carregarDetalhesParque(parqueId, action);
    } else {
        window.location.hash = ''; 
    }
}

// --- Inicialização da Aplicação ---
function iniciarApp() {
    carregarBotoesParques();
    
    // Chamada inicial de lidarComHash para carregar o estado, caso o hash esteja setado (ex: deep link de check-in)
    lidarComHash(); 

    const videoIntro = document.getElementById('video-intro');
    videoIntro.classList.add('fade-out'); 
    setTimeout(() => {
        videoIntro.style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        setupPwaInstallPrompt();
    }, 1000); 

    const btnPremiacao = document.getElementById('btn-premiacao');
    if (btnPremiacao) {
        btnPremiacao.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = `#premiacao`; 
        });
    }
}

async function carregarDados() {
    const [parquesResp, detalhesResp] = await Promise.all([
        fetch('parques.json'),
        fetch('park_details.json')
    ]);
    
    const parquesData = await parquesResp.json();
    const detalhesData = await detalhesResp.json();
    
    DADOS_PARQUES = parquesData.DADOS_PARQUES;
    ATIVIDADES_PARQUES = parquesData.ATIVIDADES_PARQUES;
    DETALHES_PARQUES = detalhesData;
    
    // MUDANÇA: Adiciona e-mail e telefone de exemplo em DETALHES_PARQUES para testes
    // Você deve atualizar isso com dados reais em park_details.json!
    if (DETALHES_PARQUES['biribiri']) {
        DETALHES_PARQUES['biribiri'].phone = '5531999999999'; 
        DETALHES_PARQUES['biribiri'].email = 'contato.biribiri@exemplo.com'; 
    }
    if (DETALHES_PARQUES['ibitipoca']) {
        DETALHES_PARQUES['ibitipoca'].phone = '5532988888888'; 
        DETALHES_PARQUES['ibitipoca'].email = 'contato.ibitipoca@exemplo.com'; 
    }
}

// NOVO: Função para configurar o clique do novo botão introdutório de Check-in
function configurarBotaoIntro() {
    const btnIntro = document.getElementById('btn-intro-checkin');
    if (btnIntro) {
        btnIntro.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalIntro();
        });
    }
}

// CORREÇÃO: Lógica simplificada de navegação de volta (Botão Home)
function configurarNavegacao() {
    // Apenas o btn-home permanece e volta para a home
    document.getElementById('btn-home').addEventListener('click', () => {
        // CORREÇÃO: Força a navegação para a home
        window.location.hash = '';
    });

    window.addEventListener('hashchange', lidarComHash);
    
    configurarBotaoIntro();
}

async function inicializar() {
    try {
        await carregarDados();
        registrarServiceWorker();
        
        const videoElement = document.getElementById('intro-video-element');
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

        if (localStorage.getItem('first_visit') !== 'false' && !checkinProcessado) {
            localStorage.setItem('first_visit', 'false');
            
            document.getElementById('video-intro').style.display = 'flex';
            videoElement.load();
            
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setTimeout(() => {
                        iniciarApp();
                    }, 3000);
                }).catch(error => {
                    console.warn('Autoplay impedido. Iniciando app diretamente.', error);
                    iniciarApp();
                });
            }
        } else {
            document.getElementById('video-intro').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            
            if (!checkinProcessado) {
                lidarComHash();
            }
        }
        
    } catch (error) {
        console.error('Erro fatal na inicialização:', error);
        document.getElementById('video-intro').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('app-container').innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p>Erro ao carregar o aplicativo. Recarregue a página.</p>
                <button onclick="location.reload()" class="action-button">Recarregar</button>
            </div>
        `;
    }

    configurarNavegacao();
}

document.addEventListener('DOMContentLoaded', inicializar);
