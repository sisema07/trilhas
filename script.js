// script.js - CÓDIGO COMPLETO (FINAL COM CORREÇÕES NO CANVAS E FONTES)

let DADOS_PARQUES = [];
let ATIVIDADES_PARQUES = {};
let DETALHES_PARQUES = {}; 
let estadoUsuario = JSON.parse(localStorage.getItem('trilhasDeMinasStatus')) || {};
let scrollPosition = 0;
let deferredPrompt; 

// NOVAS VARIÁVEIS PARA O CANVAS DE COMPARTILHAMENTO
let passportTemplateImage = new Image(); // Imagem base do passaporte
let stampImage = new Image();            // Imagem do carimbo do badge
let userPhoto = new Image();             // Foto do usuário
let canvasContext = null;                // Contexto 2D do Canvas

// Caminho para a sua imagem de fundo do passaporte (VOCÊ DEVE CRIAR ESTE ARQUIVO)
passportTemplateImage.src = 'images/passport_template.png'; // Caminho fixo para o template 600x800

// Variáveis de estado do Quiz
let currentQuizData = null; 
let currentQuizIndex = 0;   
let quizScore = 0;          

function salvarEstado() {
    localStorage.setItem('trilhasDeMinasStatus', JSON.stringify(estadoUsuario));
}

// --- PWA/OFFLINE: Service Worker Registration e Instalação (código omitido para brevidade, mas deve ser mantido) ---

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


// --- Lógica do Carrossel (Componente) (código omitido para brevidade, mas deve ser mantido) ---

let currentCarouselIndex = 0;
let carouselImages = [];
let carouselInterval = null;

function setupCarousel(parqueId, images) {
    const carouselElement = document.getElementById('park-carousel');
    const dotsElement = document.getElementById('carousel-dots');
    
    // Limpar conteúdos anteriores
    carouselElement.innerHTML = '';
    dotsElement.innerHTML = '';
    
    carouselImages = images;
    currentCarouselIndex = 0;
    
    // 1. Criar Imagens e Adicionar ao Carrossel
    carouselImages.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Imagem do Parque ${parqueId} ${index + 1}`;
        img.className = 'carousel-image';
        carouselElement.appendChild(img);
        
        // 2. Criar Dots de Navegação
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.dataset.index = index;
        dot.addEventListener('click', () => {
            showSlide(index);
            resetInterval();
        });
        dotsElement.appendChild(dot);
    });
    
    // Se houver mais de uma imagem, habilita dots e auto-play
    if (images.length > 1) {
        dotsElement.style.display = 'flex';
        // 3. Setup do Auto-play
        resetInterval();
        // Listener para navegação manual
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

/**
 * Processa a URL de check-in (ex: #checkin-biribiri-portaria)
 */
function processarCheckin(parqueId, atividadeId) {
    if (ATIVIDADES_PARQUES[parqueId] && ATIVIDADES_PARQUES[parqueId].some(a => a.id === atividadeId)) {
        
        if (!estadoUsuario[parqueId]) {
            estadoUsuario[parqueId] = {};
        }

        let isNewBadge = false;

        if (!estadoUsuario[parqueId][atividadeId]) {
            // Desbloqueia o badge
            estadoUsuario[parqueId][atividadeId] = true;
            salvarEstado();
            isNewBadge = true;
        } 
        
        // --- Mensagem Pop-up Customizada ---
        if (isNewBadge) {
             const popUpMessage = "Trilhas de Minas\n\n🎉 Novo Badge desbloqueado!\nConfira na área Check-ins";
             alert(popUpMessage); 
        } else {
             const popUpMessage = "Trilhas de Minas\n\nEste Badge já estava desbloqueado!\nConfira na área Check-ins";
             alert(popUpMessage); 
        }
        // ------------------------------------------
        
        // Redireciona para a tela de Badges para o usuário ver a conquista
        window.location.hash = 'premiacao';
        
        return true;
    }
    return false;
}


// --- Lógica de Navegação e Conteúdo (código omitido para brevidade, mas deve ser mantido) ---

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

    // Estilo especial para o botão de Check-ins
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


/**
 * Carrega todos os Badges.
 */
function carregarPremios() {
    const listaPremios = document.getElementById('lista-icones-premios');
    listaPremios.innerHTML = '';
    
    for (const parqueId in ATIVIDADES_PARQUES) {
        const atividades = ATIVIDADES_PARQUES[parqueId];
        
        // Inicializa o estado do parque se não existir
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
            
            // --- Lógica para usar Imagem ou Ícone ---
            let badgeContent;
            if (atividade.imagem_png) {
                badgeContent = `<img src="${atividade.imagem_png}" alt="${atividade.nome}" class="badge-custom-img">`;
            } else {
                badgeContent = `<i class="fas ${atividade.icone}"></i>`;
            }
            // ----------------------------------------
            
            card.innerHTML = `
                ${badgeContent}
                <span>${atividade.nome}</span>
            `;
            listaPremios.appendChild(card);
            
            // SOMENTE badges desbloqueados são clicáveis para o fluxo de compartilhamento
            if (isConcluida) {
                 card.addEventListener('click', () => {
                    const parqueIdClick = card.dataset.parqueId;
                    const atividadeIdClick = card.dataset.atividadeId;
                     
                    // Navega para a tela de compartilhamento (upload)
                    window.location.hash = `upload-${parqueIdClick}-${atividadeIdClick}`;
                 });
            }
        });
    }
}


function carregarConteudoPremiacao() {
    // 1. Esconder áreas secundárias
    document.getElementById('conteudo-parque-detalhe').style.display = 'none';
    document.getElementById('area-envio-foto').style.display = 'none';

    // 2. Configurar o header da Área Secundária
    const areaSecundaria = document.getElementById('area-secundaria');
    document.getElementById('secundaria-titulo').textContent = 'Seus Check-ins';

    // 3. Exibir o conteúdo de premiação (que já existe no index.html)
    document.getElementById('conteudo-premios').style.display = 'block';

    carregarPremios(); // Garante que a lista de badges seja atualizada
    
    // 4. Exibir a área secundária e garantir o scroll
    areaSecundaria.classList.add('aberto');
    areaSecundaria.scrollTop = 0;
}


// --- Lógica de Detalhes do Parque (código omitido para brevidade, mas deve ser mantido) ---

function carregarConteudoInfo(parque, container) {
    const detalhes = DETALHES_PARQUES[parque.id] || {};
    container.innerHTML = `
        <h3>Informações Gerais</h3>
        <p>${detalhes.info_content || 'Informações detalhadas sobre o parque não disponíveis.'}</p>
        
        <h3>O que esperar</h3>
        <p>${parque.descricao || 'O parque é um local ideal para explorar a natureza.'}</p>
    `;
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

    // Inicialização do Quiz
    currentQuizIndex = 0;
    quizScore = 0;
    
    // O link da imagem da fauna é recuperado do parques.json
    const faunaImgPath = parque.fauna_parque_png ? `fauna/${parque.fauna_parque_png}` : 'fauna/default.png'; 
    
    container.innerHTML = `
        <div class="quiz-header-content">
            <img src="${faunaImgPath}" alt="Mascote do Parque" class="quiz-fauna-img">
            <div class="quiz-header-text">
                <h3>${detalhes.quiz_title || 'Desafio do Conhecimento'}</h3>
                <p style="font-size: 0.9rem;">${detalhes.quiz_description || 'Responda corretamente para liberar um badge exclusivo!'}</p>
            </div>
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
    const nextQuestionBtn = document.getElementById('quiz-next-btn');
    
    if (currentQuizIndex >= currentQuizData.length) {
        finalizarQuiz();
        return;
    }
    
    const questao = currentQuizData[currentQuizIndex];
    
    let optionsHtml = '';
    questao.a.forEach((alternativa, index) => {
        // Usamos o evento onclick diretamente no HTML gerado para simplificar a lógica de listeners.
        optionsHtml += `
            <button class="action-button quiz-option-btn" onclick="selectQuizOption(${index}, this)">${alternativa}</button>
        `;
    });
    
    area.innerHTML = `
        <h4 style="margin-bottom: 20px;">Questão ${currentQuizIndex + 1}/${currentQuizData.length}:</h4>
        <p style="font-weight: 700; font-size: 1.1rem; text-align: center;">${questao.q}</p>
        <div class="action-buttons-container" style="flex-direction: column; gap: 10px; margin-top: 20px;">
            ${optionsHtml}
        </div>
    `;
    
    if(nextQuestionBtn) nextQuestionBtn.style.display = 'none';
    
    atualizarBarraProgresso();
}

// Expõe a função para ser usada no HTML gerado
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
    const progress = (currentQuizIndex / currentQuizData.length) * 100;
    document.getElementById('quiz-progress').style.width = `${progress}%`;
}

function finalizarQuiz() {
    const area = document.getElementById('quiz-question-area');
    const total = currentQuizData.length;
    const parqueId = window.location.hash.substring(1).split('-')[0];
    
    let resultadoHtml;
    const requiredScore = Math.ceil(total * 0.75);
    
    if (quizScore >= requiredScore) { 
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
        resultadoHtml = `
            <div style="text-align: center; padding: 20px;">
                <p class="result-classification" style="color: #f44336;">Tente Novamente!</p>
                <p style="margin-bottom: 20px;">Você acertou ${quizScore} de ${total}. Você precisa de ${requiredScore} acertos para ganhar o Badge.</p>
                <button class="action-button active" onclick="carregarConteudoQuiz(DADOS_PARQUES.find(p => p.id === '${parqueId}'), document.getElementById('dynamic-content-area'))">Reiniciar Quiz</button>
            </div>
        `;
    }
    
    area.innerHTML = resultadoHtml;
    document.getElementById('quiz-progress').style.width = '100%';
}


/**
 * Carrega e exibe a lista de atividades escaneáveis (Badges) de um parque específico (Layout Lista).
 */
function carregarConteudoAtividades(parque, container) {
    const atividades = ATIVIDADES_PARQUES[parque.id] || [];
    
    // 1. INSTRUÇÕES (Layout ajustado)
    let html = `
        <div class="activity-instructions">
            <div class="instruction-text">
                <h3>Escaneie os QR codes</h3>
            </div>
            <div class="qr-mascote-container activity-mascote-anchor">
                <img src="qr.png" alt="Mascote escaneando QR Code" class="qr-mascote-img">
            </div>
        </div>
        <hr class="separator" style="margin: 15px 0;">
        
        <div id="lista-atividades-dinamica"> 
    `;

    // 2. LISTA DE ATIVIDADES
    if (atividades.length === 0) {
        html += '<p style="text-align: center; margin-top: 20px;">Nenhuma atividade cadastrada para este parque.</p>';
    } else {
        atividades.forEach(atividade => {
            const desbloqueado = estadoUsuario[parque.id] && estadoUsuario[parque.id][atividade.id] ? 'desbloqueado' : '';
            const badgeId = `${parque.id}-${atividade.id}`;
            
            // --- Lógica para usar Imagem ou Ícone ---
            let badgeContent;
            if (atividade.imagem_png) {
                badgeContent = `<img src="${atividade.imagem_png}" alt="${atividade.nome}" class="badge-custom-img">`;
            } else {
                badgeContent = `<i class="fas ${atividade.icone}"></i>`;
            }
            // ----------------------------------------
            
            // HTML de lista
            html += `
                <div class="activity-list-item ${desbloqueado}" data-badge-id="${badgeId}">
                    <div class="icone-premio">
                        ${badgeContent}
                        <span>${atividade.nome}</span> 
                    </div>
                    
                    <div class="activity-description-box">
                        <h4>${atividade.nome}</h4>
                        <p>${atividade.descricao_curta || 'Descrição pendente.'}</p>
                    </div>
                </div>
            `;
        });
    }

    html += '</div>';
    container.innerHTML = html; 

    // 3. Listener para badges desbloqueados
    document.querySelectorAll('#lista-atividades-dinamica .activity-list-item.desbloqueado').forEach(item => {
        item.addEventListener('click', (event) => {
            const badgeId = event.currentTarget.dataset.badgeId;
            window.location.hash = `upload-${badgeId}`; 
        });
    });
}

function carregarDetalhesParque(parqueId, action = 'info') {
    const parque = DADOS_PARQUES.find(p => p.id === parqueId);
    const detalhes = DETALHES_PARQUES[parqueId];
    
    if (!parque || !detalhes) {
        console.error('Parque ou detalhes não encontrados:', parqueId);
        window.location.hash = ''; 
        return;
    }

    // 1. Esconder áreas secundárias
    document.getElementById('conteudo-premios').style.display = 'none';
    document.getElementById('area-envio-foto').style.display = 'none';

    // 2. Configurar o Header
    const areaSecundaria = document.getElementById('area-secundaria');
    document.getElementById('secundaria-titulo').textContent = parque.nome;
    
    // 3. Configurar Links
    document.getElementById('map-link-icon').href = detalhes.map_link || '#';
    document.getElementById('insta-link-icon').href = detalhes.instagram_link || '#';
    
    // 4. Configurar Carrossel
    setupCarousel(parqueId, detalhes.carousel_images || []);
    
    // 5. Configurar Área de Conteúdo Dinâmico
    const contentArea = document.getElementById('dynamic-content-area');
    
    // 6. Configurar Listeners dos Botões de Ação (NÃO MUDAM O HASH)
    document.querySelectorAll('.action-button[data-action]').forEach(btn => {
        btn.classList.remove('active');
        btn.onclick = null; // Limpa listeners antigos
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const newAction = e.target.dataset.action;
            // Apenas carrega o conteúdo, mantendo o hash do parque
            carregarConteudoDinamico(parque, contentArea, newAction); 
        });
    });

    // 7. Carregar Conteúdo Baseado na Ação
    const actionButton = document.querySelector(`.action-button[data-action="${action}"]`);
    if (actionButton) {
        actionButton.classList.add('active');
        carregarConteudoDinamico(parque, contentArea, action);
    }
    
    // 8. Exibir a área de detalhes
    document.getElementById('conteudo-parque-detalhe').style.display = 'block';
    
    // 9. Exibir a área secundária e garantir o scroll
    areaSecundaria.classList.add('aberto');
    areaSecundaria.scrollTop = 0;
}

// Nova função para centralizar a chamada de conteúdo dinâmico
function carregarConteudoDinamico(parque, container, action) {
    document.querySelectorAll('.action-button[data-action]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.action === action) {
            btn.classList.add('active');
        }
    });
    
    switch (action) {
        case 'info':
            carregarConteudoInfo(parque, container);
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
    const parque = DADOS_PARQUES.find(p => p.id === parqueId);
    const atividade = ATIVIDADES_PARQUES[parqueId]?.find(a => a.id === atividadeId);
    
    // 1. Esconder áreas secundárias
    document.getElementById('conteudo-parque-detalhe').style.display = 'none';
    document.getElementById('conteudo-premios').style.display = 'none';
    document.getElementById('area-envio-foto').style.display = 'block'; // Exibe a área de envio do HTML

    if (!parque || !atividade) {
        document.getElementById('secundaria-titulo').textContent = 'Erro';
        document.getElementById('area-envio-foto').innerHTML = '<p>Badge não encontrado.</p>';
        return;
    }

    const isConcluida = estadoUsuario[parqueId] && estadoUsuario[parqueId][atividadeId];
    
    document.getElementById('secundaria-titulo').textContent = 'Compartilhar Conquista';
    
    // Acesso negado se o badge não estiver desbloqueado (Garantia extra)
    if (!isConcluida) {
        document.getElementById('secundaria-titulo').textContent = 'Acesso Negado';
        document.getElementById('area-envio-foto').innerHTML = `
            <p style="text-align: center; padding: 20px;">Você precisa escanear o QR Code de ${atividade.nome} para liberar o compartilhamento!</p>
            <button class="action-button active" onclick="window.location.hash='premiacao'" style="width: 100%; max-width: 300px; margin: 20px auto;">Voltar para Badges</button>
        `;
        return;
    }
    
    // Atualiza o título dinâmico na área de envio
    const badgeTituloElement = document.getElementById('badge-upload-titulo');
    badgeTituloElement.textContent = `Compartilhar Badge: ${atividade.nome} (${parque.nome})`;

    // --- Lógica do Canvas para Compartilhamento ---
    const canvas = document.getElementById('passport-canvas');
    canvasContext = canvas.getContext('2d');
    
    // Carrega as fontes do Google Fonts dinamicamente
    if (!document.getElementById('google-fonts-link')) {
        const link = document.createElement('link');
        link.id = 'google-fonts-link';
        link.href = 'https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Roboto+Slab:wght@700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    const inputFotoBadge = document.getElementById('input-foto-badge');
    const btnGerarBaixar = document.getElementById('btn-gerar-e-baixar');

    // Limpar listeners anteriores para evitar duplicações
    inputFotoBadge.onchange = null;
    btnGerarBaixar.onclick = null;
    
    // Event listener para quando o usuário seleciona uma foto
    inputFotoBadge.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                userPhoto.src = e.target.result;
                userPhoto.onload = () => {
                    // Desenha a imagem no canvas assim que o template do passaporte e a foto do usuário estiverem carregados
                    drawPassportImage(parque, atividade, userPhoto);
                };
            };
            reader.readAsDataURL(file);
        } else {
            // Desenha apenas o template
            drawPassportImage(parque, atividade, null);
        }
    };
    
    // Carrega a imagem do carimbo (BUSCA NA FOLDER 'badges/')
    // CORREÇÃO CRÍTICA: Garantir que o caminho para o carimbo (badge) seja buscado corretamente na pasta 'badges/'
    if (atividade.imagem_png) {
        stampImage.src = atividade.imagem_png.startsWith('badges/') ? atividade.imagem_png : `badges/${atividade.imagem_png}`;
    } else {
        // Fallback (apenas se a imagem_png não estiver preenchida)
        stampImage.src = 'images/default_stamp_fallback.png'; 
    }
    
    // Inicializa o canvas com o template do passaporte (sem a foto do usuário ainda)
    drawPassportImage(parque, atividade, null); // Passa null para userPhoto inicialmente


    // Listener para o botão de baixar
    btnGerarBaixar.onclick = () => {
        if (inputFotoBadge.files.length > 0) {
            downloadCanvasImage(parque.nome, atividade.nome);
        } else {
            alert('Por favor, selecione uma foto antes de baixar o check-in.');
        }
    };
    
    document.getElementById('area-secundaria').classList.add('aberto');
    document.getElementById('area-secundaria').scrollTop = 0;
}

/**
 * Desenha a imagem completa do passaporte no Canvas.
 */
function drawPassportImage(parque, atividade, userUploadedPhoto) {
    if (!canvasContext) return;

    const canvas = canvasContext.canvas;
    
    // Limpa o canvas
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenha a Imagem Base do Passaporte (600x800)
    if (passportTemplateImage.complete && passportTemplateImage.naturalWidth > 0) {
        canvasContext.drawImage(passportTemplateImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: Desenha um retângulo simples se o template não carregar
        canvasContext.fillStyle = '#e6e0d4'; // Cor de papel envelhecido
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
        canvasContext.fillStyle = '#333';
        canvasContext.font = '20px Arial';
        canvasContext.fillText('Carregue images/passport_template.png', 50, canvas.height / 2);
    }

    // 2. Desenha a Imagem do Usuário (dentro da moldura)
    if (userUploadedPhoto && userUploadedPhoto.complete && userUploadedPhoto.naturalWidth > 0) {
        // COORDENADAS PARA A FOTO DO USUÁRIO (AJUSTADAS PARA ACOMOCAR MELHOR O 4:5)
        // NOVAS COORDENADAS: photoX=12%, photoY=32%, photoWidth=76%, photoHeight=51%
        const photoX = canvas.width * 0.12;    
        const photoY = canvas.height * 0.32;   
        const photoWidth = canvas.width * 0.76; 
        const photoHeight = canvas.height * 0.51; 

        // Lógica para preencher o espaço (Cover) mantendo a proporção da foto do usuário
        const imgAspectRatio = userUploadedPhoto.naturalWidth / userUploadedPhoto.naturalHeight;
        const frameAspectRatio = photoWidth / photoHeight;
        
        let sx, sy, sWidth, sHeight; // Source (corte da imagem do usuário)
        
        if (imgAspectRatio > frameAspectRatio) {
            // A imagem do usuário é mais larga que o frame, cortar laterais da imagem
            sHeight = userUploadedPhoto.naturalHeight;
            sWidth = sHeight * frameAspectRatio;
            sx = (userUploadedPhoto.naturalWidth - sWidth) / 2;
            sy = 0;
        } else {
            // A imagem do usuário é mais alta que o frame, cortar topo/base da imagem
            sWidth = userUploadedPhoto.naturalWidth;
            sHeight = sWidth / frameAspectRatio;
            sx = 0;
            sy = (userUploadedPhoto.naturalHeight - sHeight) / 2;
        }
        
        // Desenha a imagem recortada
        canvasContext.drawImage(userUploadedPhoto, sx, sy, sWidth, sHeight, photoX, photoY, photoWidth, photoHeight);
    }
    
    // 3. Adiciona o Carimbo do Badge
    if (stampImage.complete && stampImage.naturalWidth > 0) {
        // POSIÇÃO E TAMANHO DO CARIMBO (Canto Superior Esquerdo, ao lado do texto)
        const stampSize = canvas.width * 0.25; // 25% da largura
        const stampX = canvas.width * 0.05;    // 5% da largura
        const stampY = canvas.height * 0.08;    // Ajustado para 8% (Para baixo o suficiente para alinhar com o texto)
        canvasContext.drawImage(stampImage, stampX, stampY, stampSize, stampSize);
    }

    // 4. Adiciona o Texto Dinâmico
    
    // Texto do Carimbo (Detalhes do Check-in)
    canvasContext.textAlign = 'left';
    
    // CORREÇÃO DE ESPAÇAMENTO E POSICIONAMENTO

    const textStartX = canvas.width * 0.35; // Posição X para o início do texto
    let currentTextY = canvas.height * 0.12; // Posição Y inicial (12% da altura)

    // LINHA 1: CHECK-IN REALIZADO (Alinhado verticalmente abaixo do carimbo)
    canvasContext.font = 'bold 22px "Roboto Slab", serif'; 
    canvasContext.fillStyle = '#4CAF50'; // Verde
    canvasContext.fillText('CHECK-IN REALIZADO', textStartX, currentTextY);
    currentTextY += 22; // Espaçamento vertical ajustado (22px)

    // LINHA 2: Nome do Parque
    canvasContext.font = 'bold 18px "Lora", serif'; 
    canvasContext.fillStyle = '#555';
    canvasContext.fillText(parque.nome.toUpperCase(), textStartX, currentTextY); 
    currentTextY += 20; // Espaçamento vertical ajustado (20px)

    // LINHA 3: Nome da Atividade
    canvasContext.fillText(atividade.nome.toUpperCase(), textStartX, currentTextY); 
}

/**
 * Faz o download da imagem gerada no Canvas.
 */
function downloadCanvasImage(parqueNome, atividadeNome) {
    if (!canvasContext) {
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


// --- Lógica do Roteamento (Hashchange) ---

function lidarComHash() {
    const fullHash = window.location.hash;
    const hash = fullHash.substring(1);
    
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    
    document.getElementById('install-prompt').style.display = 'none';

    // Rota: Home (Sem Hash)
    if (!hash || hash === 'home' || hash === '#') {
        // Garantir que a área secundária feche completamente
        document.getElementById('area-secundaria').classList.remove('aberto');
        document.body.style.overflow = 'auto'; // Retorna o scroll ao corpo principal
        document.body.style.height = 'auto'; 
        setupPwaInstallPrompt(); 
        return;
    }
    
    document.body.style.overflow = 'hidden'; 
    document.body.style.height = '100vh';

    // Rota: 1. DESBLOQUEIO PURO (QR CODE)
    if (hash.startsWith('checkin-')) {
        const parts = hash.split('-'); 
        if (parts.length === 3) {
            processarCheckin(parts[1], parts[2]);
            return;
        }
    }

    // Rota: 2. COMPARTILHAMENTO (CANVAS)
    if (hash.startsWith('upload-')) {
        const parts = hash.split('-'); 
        if (parts.length === 3) {
            carregarAreaUpload(parts[1], parts[2]);
            return;
        }
    }
    
    // Rota: 3. PREMIAÇÃO (TODOS OS BADGES)
    if (hash === 'premiacao') {
        carregarConteudoPremiacao();
        return;
    }

    // Rota: 4. DETALHES DO PARQUE
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

function iniciarApp() {
    carregarBotoesParques();
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
            window.location.hash = `#${btnPremiacao.dataset.parqueId}`; 
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
}


async function inicializar() {
    try {
        await carregarDados();
        registrarServiceWorker();
        
        const videoElement = document.getElementById('intro-video-element');
        let checkinProcessado = false; 
        let videoPlayed = false;

        // Função para garantir que o app inicie
        const ensureAppStarts = () => {
            if (!videoPlayed) {
                videoPlayed = true;
                iniciarApp();
            }
        };

        // Adiciona o evento end, mas também o fallback de 3 segundos.
        videoElement.addEventListener('ended', ensureAppStarts);
        
        // Verifica se há um hash de checkin na URL de entrada
        if (window.location.hash.startsWith('#checkin-')) {
             const parts = window.location.hash.substring(1).split('-');
             processarCheckin(parts[1], parts[2]); 
             checkinProcessado = true;
        }

        // Lógica de primeira visita e auto-play
        if (localStorage.getItem('first_visit') !== 'false' && !checkinProcessado) {
            localStorage.setItem('first_visit', 'false');
            
            document.getElementById('video-intro').style.display = 'flex';
            videoElement.load();
            videoElement.play().then(() => {
                // Se o play começar, adiciona timeout para garantir
                setTimeout(ensureAppStarts, 3000); 
            }).catch(error => {
                // Fallback imediato se o autoplay falhar
                console.warn('Playback impedido. Iniciando App diretamente via fallback.', error);
                ensureAppStarts(); 
            });

        } else {
             // Não é a primeira visita ou o checkin já processou e redirecionou
             document.getElementById('video-intro').style.display = 'none';
             document.getElementById('app-container').style.display = 'flex'; 
             lidarComHash();
        }
        
    } catch (error) {
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('app-container').innerHTML = '<p style="text-align: center; color: red; margin-top: 50px; font-weight: bold;">ERRO DE CARREGAMENTO: Não foi possível carregar os dados. Verifique a sintaxe de todos os arquivos JSON e de imagens.</p>';
        document.getElementById('video-intro').style.display = 'none';
        console.error('Erro fatal ao carregar dados:', error);
    }

    // LÓGICA DO BOTÃO VOLTAR (AJUSTE CRÍTICO DE NAVEGAÇÃO)
    document.getElementById('btn-voltar').addEventListener('click', () => {
        const hash = window.location.hash.substring(1);
        
        if (hash.startsWith('upload-')) {
            window.location.hash = `premiacao`; 
        } else if (hash === 'premiacao') {
             window.location.hash = ''; 
        } else if (DADOS_PARQUES.some(p => p.id === hash.split('-')[0])) {
             window.location.hash = ''; 
        } else if (hash !== '') {
             window.location.hash = '';
        } else {
            document.getElementById('area-secundaria').classList.remove('aberto');
        }
    });
    
    document.getElementById('btn-home').addEventListener('click', () => {
        window.location.hash = ''; 
    });

    window.addEventListener('hashchange', lidarComHash);
}

document.addEventListener('DOMContentLoaded', inicializar);
