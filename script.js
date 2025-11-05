// script.js - CÓDIGO COMPLETO (FINAL COM CORREÇÕES DE BADGES E NAVEGAÇÃO)

let DADOS_PARQUES = [];
let ATIVIDADES_PARQUES = {};
let DETALHES_PARQUES = {}; 
let estadoUsuario = JSON.parse(localStorage.getItem('trilhasDeMinasStatus')) || {};
let scrollPosition = 0;
let deferredPrompt; 

// Variáveis de estado do Quiz
let currentQuizData = null; 
let currentQuizIndex = 0;   
let quizScore = 0;          

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

// --- Lógica do Carrossel (Componente) ---

let currentCarouselIndex = 0;
let carouselImages = [];
let carouselInterval = null;

function setupCarousel(images) {
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
        img.alt = `Imagem do Parque ${index + 1}`;
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
    
    // 3. Setup do Auto-play
    resetInterval();
    
    // Listener para navegação manual
    carouselElement.addEventListener('scroll', handleScroll);
}

function handleScroll() {
    const carouselElement = document.getElementById('park-carousel');
    const scrollLeft = carouselElement.scrollLeft;
    const width = carouselElement.offsetWidth;
    // Arredonda para o slide mais próximo
    let index = Math.round(scrollLeft / width); 
    
    // Ajustar o index se a navegação manual mudar
    if (index !== currentCarouselIndex) {
        showSlide(index, false); // Atualiza os dots, mas sem scroll
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

    if (shouldScroll) {
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
    // Muda a cada 4 segundos
    carouselInterval = setInterval(nextSlide, 4000); 
}


// --- Lógica de Navegação e Conteúdo ---

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
            // A navegação agora é controlada pela função lidarComHash
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
 * CORRIGIDO: Aplica a tag <img> com classe 'badge-custom-img' quando 'imagem_png' está presente.
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
                // Se tiver imagem PNG, usa a tag <img> com a nova classe CSS
                badgeContent = `<img src="${atividade.imagem_png}" alt="${atividade.nome}" class="badge-custom-img">`;
            } else {
                // Caso contrário, usa o ícone Font Awesome existente
                badgeContent = `<i class="fas ${atividade.icone}"></i>`;
            }
            // ----------------------------------------
            
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
}


function carregarConteudoPremiacao() {
    // 1. Esconder a área de detalhes do parque (se estiver aberta)
    document.getElementById('conteudo-parque-detalhe').style.display = 'none';

    // 2. Configurar o header da Área Secundária
    const areaSecundaria = document.getElementById('area-secundaria');
    document.getElementById('secundaria-titulo').textContent = 'Seus Check-ins';

    // 3. Carregar o conteúdo de premiação
    const conteudoSecundario = document.getElementById('conteudo-secundario-dinamico');
    conteudoSecundario.innerHTML = `
        <div id="conteudo-premios">
            <div class="badge-intro-text">
                <div class="badge-mascote-texto">
                    <p>Continue explorando os parques! Cada atividade concluída e Quiz vencido libera um Badge exclusivo na sua coleção.</p>
                </div>
                <img src="mascote_badge.png" alt="Mascote com Badge" class="badge-mascote-img">
            </div>
            
            <h2 class="premios-titulo">Badges Desbloqueados</h2>
            <div id="lista-icones-premios" class="grid-premios">
                </div>
            
            <h2 class="premios-titulo" style="margin-top: 40px;">Como Obter Badges?</h2>
            <p style="font-size: 0.9rem;">Visite os parques, responda aos Quizzes e escaneie os QR Codes nas placas de trilhas e pontos turísticos para registrar seu check-in e desbloquear seu prêmio!</p>
        </div>
    `;

    carregarPremios();
    
    // 4. Exibir a área secundária e garantir o scroll
    areaSecundaria.classList.add('aberto');
    areaSecundaria.scrollTop = 0;
}


// --- Lógica de Detalhes do Parque ---

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
                    <img src="badge_ok.gif" alt="Quiz Concluído" class="win-gif-mascote">
                </div>
                <p class="success-badge-message">O badge foi adicionado à sua coleção.</p>
            </div>
        `;
        return;
    }

    // Inicialização do Quiz
    currentQuizIndex = 0;
    quizScore = 0;
    
    container.innerHTML = `
        <div class="quiz-header-content">
            <img src="${parque.fauna_parque_png || 'jaguatirica.png'}" alt="Mascote do Parque" class="quiz-fauna-img">
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
    if (currentQuizIndex >= currentQuizData.length) {
        finalizarQuiz();
        return;
    }
    
    const questao = currentQuizData[currentQuizIndex];
    
    let optionsHtml = '';
    questao.a.forEach((alternativa, index) => {
        optionsHtml += `
            <button class="action-button quiz-option-btn" data-index="${index}">${alternativa}</button>
        `;
    });
    
    area.innerHTML = `
        <h4 style="margin-bottom: 20px;">Questão ${currentQuizIndex + 1}/${currentQuizData.length}:</h4>
        <p style="font-weight: 700; font-size: 1.1rem; text-align: center;">${questao.q}</p>
        <div class="action-buttons-container" style="flex-direction: column; gap: 10px; margin-top: 20px;">
            ${optionsHtml}
        </div>
    `;
    
    document.querySelectorAll('.quiz-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            verificarResposta(e.target);
        });
    });
    
    atualizarBarraProgresso();
}

function verificarResposta(btn) {
    const selectedIndex = parseInt(btn.dataset.index);
    const questao = currentQuizData[currentQuizIndex];
    const isCorrect = selectedIndex === questao.correct;
    
    // Desabilitar botões
    document.querySelectorAll('.quiz-option-btn').forEach(b => b.disabled = true);
    
    if (isCorrect) {
        btn.classList.add('active'); // Cor verde
        quizScore++;
    } else {
        btn.style.backgroundColor = '#f44336'; // Cor vermelha
        btn.style.color = 'white';
        // Mostrar a resposta correta
        document.querySelector(`.quiz-option-btn[data-index="${questao.correct}"]`).classList.add('active');
    }
    
    setTimeout(() => {
        currentQuizIndex++;
        carregarProximaQuestao();
    }, 1200);
}

function atualizarBarraProgresso() {
    const progress = (currentQuizIndex / currentQuizData.length) * 100;
    document.getElementById('quiz-progress').style.width = `${progress}%`;
}

function finalizarQuiz() {
    const area = document.getElementById('quiz-question-area');
    const total = currentQuizData.length;
    const parkId = window.location.hash.substring(1);
    
    let resultadoHtml;
    
    // Condição de sucesso: 80% de acerto
    if (quizScore / total >= 0.8) { 
        // Desbloquear o badge do quiz
        const badgeId = currentQuizData[0].badge_id || 'quiz';
        if (ATIVIDADES_PARQUES[parkId]?.find(a => a.id === badgeId)) {
            estadoUsuario[parkId][badgeId] = true;
            salvarEstado();
            
            resultadoHtml = `
                <div style="text-align: center; padding: 20px;">
                    <div class="win-animation-container">
                        <img src="badge_ok.gif" alt="Quiz Concluído" class="win-gif-mascote">
                    </div>
                    <p class="result-classification">Conhecimento de Mestre!</p>
                    <p class="success-badge-message">Parabéns! Você ganhou o badge de ${DADOS_PARQUES.find(p => p.id === parkId)?.nome}!</p>
                    <p>Pontuação: ${quizScore} de ${total}</p>
                    <button class="action-button" onclick="window.location.hash='#'">Voltar para Home</button>
                </div>
            `;
        }
    } else {
        resultadoHtml = `
            <div style="text-align: center; padding: 20px;">
                <div class="win-animation-container" style="border-color: #f44336;">
                    <img src="badge_fail.gif" alt="Quiz Falhou" class="win-gif-mascote">
                </div>
                <p class="result-classification" style="color: #f44336;">Tente Novamente!</p>
                <p style="margin-bottom: 20px;">Você acertou ${quizScore} de ${total}. Estude mais sobre o parque e tente novamente!</p>
                <button class="action-button active" onclick="carregarConteudoQuiz(DADOS_PARQUES.find(p => p.id === '${parkId}'), document.getElementById('dynamic-content-area'))">Reiniciar Quiz</button>
            </div>
        `;
    }
    
    area.innerHTML = resultadoHtml;
    document.getElementById('quiz-progress').style.width = '100%';
}


/**
 * Carrega e exibe a lista de atividades escaneáveis (Badges) de um parque específico (Layout Lista).
 * CORRIGIDO: Aplica a tag <img> com classe 'badge-custom-img' quando 'imagem_png' está presente.
 */
function carregarConteudoAtividades(parque, container) {
    const atividades = ATIVIDADES_PARQUES[parque.id] || [];
    const detalhes = DETALHES_PARQUES[parque.id] || {};
    
    // 1. INSTRUÇÕES 
    let html = `
        <div class="activity-instructions">
            <div class="instruction-text">
                <h3>Escaneie os QR codes</h3>
                <p class="badge-description">${detalhes.badge_descricao || 'Instruções gerais sobre o tipo de atividade.'}</p>
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
                // Se tiver imagem PNG, usa a tag <img> com a nova classe CSS
                badgeContent = `<img src="${atividade.imagem_png}" alt="${atividade.nome}" class="badge-custom-img">`;
            } else {
                // Caso contrário, usa o ícone Font Awesome existente
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
        window.location.hash = ''; // Volta para a home
        return;
    }

    // 1. Esconder a área de premiação
    document.getElementById('conteudo-premios').style.display = 'none';

    // 2. Configurar o Header
    const areaSecundaria = document.getElementById('area-secundaria');
    document.getElementById('secundaria-titulo').textContent = parque.nome;
    
    // 3. Configurar Links
    document.getElementById('map-link-icon').href = detalhes.map_link || '#';
    document.getElementById('insta-link-icon').href = detalhes.instagram_link || '#';
    
    // 4. Configurar Carrossel
    setupCarousel(detalhes.carousel_images || []);
    
    // 5. Configurar Área de Conteúdo Dinâmico
    const contentArea = document.getElementById('dynamic-content-area');
    
    // 6. Configurar Listeners dos Botões de Ação
    document.querySelectorAll('.action-button').forEach(btn => {
        btn.classList.remove('active');
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const newAction = e.target.dataset.action;
            window.location.hash = `#${parqueId}-${newAction}`;
        });
    });

    // 7. Carregar Conteúdo Baseado na Ação
    const actionButton = document.querySelector(`.action-button[data-action="${action}"]`);
    if (actionButton) {
        actionButton.classList.add('active');
        switch (action) {
            case 'info':
                carregarConteudoInfo(parque, contentArea);
                break;
            case 'quiz':
                carregarConteudoQuiz(parque, contentArea);
                break;
            case 'activities':
                carregarConteudoAtividades(parque, contentArea);
                break;
        }
    }
    
    // 8. Exibir a área de detalhes
    document.getElementById('conteudo-parque-detalhe').style.display = 'block';
    
    // 9. Exibir a área secundária e garantir o scroll
    areaSecundaria.classList.add('aberto');
    areaSecundaria.scrollTop = 0;
}


// --- Lógica de Upload/Check-in ---

function carregarAreaUpload(parqueId, atividadeId) {
    const parque = DADOS_PARQUES.find(p => p.id === parqueId);
    const atividade = ATIVIDADES_PARQUES[parqueId]?.find(a => a.id === atividadeId);

    if (!parque || !atividade) {
        window.location.hash = '';
        return;
    }

    const badgeId = `${parqueId}-${atividadeId}`;
    const isConcluida = estadoUsuario[parqueId] && estadoUsuario[parqueId][atividadeId];
    
    document.getElementById('conteudo-parque-detalhe').style.display = 'none';
    document.getElementById('conteudo-premios').style.display = 'none';
    
    const areaSecundaria = document.getElementById('area-secundaria');
    document.getElementById('secundaria-titulo').textContent = 'Compartilhe seu Check-in';

    let uploadHtml = `
        <div id="conteudo-upload" style="padding: 20px; text-align: center;">
            <h3 style="color: var(--cor-principal);">Seu Momento ${atividade.nome}</h3>
            <p>Parque: ${parque.nome}</p>
    `;
    
    if (isConcluida) {
         uploadHtml += `
            <div style="margin: 20px 0; padding: 15px; border: 1px solid var(--cor-secundaria); border-radius: 10px; background-color: #e0f2f1;">
                <p style="color: var(--cor-secundaria); font-weight: bold; margin: 0;">Badge já conquistado!</p>
                <p style="font-size: 0.9rem; margin-top: 5px;">Você pode compartilhar este momento novamente com seus amigos.</p>
            </div>
        `;
    } else {
         uploadHtml += `
            <p style="font-weight: 700; margin-bottom: 20px;">Parabéns por completar o desafio! Agora, vamos registrar seu momento!</p>
        `;
    }
    
    uploadHtml += `
            <div class="activity-list-item desbloqueado" style="margin: 20px auto; max-width: 300px; box-shadow: none;">
                <div class="icone-premio" style="box-shadow: none;">
                    ${atividade.imagem_png ? `<img src="${atividade.imagem_png}" alt="${atividade.nome}" class="badge-custom-img">` : `<i class="fas ${atividade.icone}"></i>`}
                </div>
                <div class="activity-description-box" style="padding-right: 0;">
                    <h4 style="margin: 0; font-size: 1.1rem;">Badge: ${atividade.nome}</h4>
                    <p style="margin: 0; font-size: 0.85rem;">${atividade.descricao_curta}</p>
                </div>
            </div>
            
            <form id="upload-form" data-parque-id="${parqueId}" data-atividade-id="${atividadeId}">
                <input type="file" id="foto-checkin" accept="image/*" capture="camera" style="display: block; margin: 20px auto; padding: 10px; border: 1px solid #ccc; border-radius: 8px;">
                <p style="font-size: 0.8rem; color: #666; margin-bottom: 20px;">*Recomendamos usar a câmera para garantir a autenticidade.</p>
                
                <button type="button" id="btn-enviar-foto" class="action-button active" style="margin-top: 10px; width: 100%; max-width: 300px;">
                    Compartilhar e Conquistar
                </button>
            </form>
            
            <p id="upload-status" style="margin-top: 15px; font-weight: bold; color: var(--cor-secundaria);"></p>
        </div>
    `;

    document.getElementById('conteudo-secundario-dinamico').innerHTML = uploadHtml;
    
    // Re-adicionar listener (pois o conteúdo foi recriado)
    document.getElementById('btn-enviar-foto').addEventListener('click', processarCompartilhamentoFoto);
    
    areaSecundaria.classList.add('aberto');
    areaSecundaria.scrollTop = 0;
}

function processarCompartilhamentoFoto() {
    const fotoInput = document.getElementById('foto-checkin');
    const statusText = document.getElementById('upload-status');
    const form = document.getElementById('upload-form');
    const parqueId = form.dataset.parqueId;
    const atividadeId = form.dataset.atividadeId;
    
    if (fotoInput.files.length === 0) {
        statusText.textContent = 'Por favor, selecione uma foto para compartilhar.';
        statusText.style.color = '#f44336';
        return;
    }

    statusText.textContent = 'Processando...';
    statusText.style.color = 'var(--cor-principal)';

    // 1. Lógica de Desbloqueio (Check-in)
    if (estadoUsuario[parqueId] && !estadoUsuario[parqueId][atividadeId]) {
        estadoUsuario[parqueId][atividadeId] = true;
        salvarEstado();
    }
    
    const file = fotoInput.files[0];
    const reader = new FileReader();

    reader.onloadend = function() {
        const imageURL = reader.result;
        const atividadeNome = ATIVIDADES_PARQUES[parqueId].find(a => a.id === atividadeId)?.nome || 'Atividade';
        const parqueNome = DADOS_PARQUES.find(p => p.id === parqueId)?.nome || 'Parque';
        
        // 2. Cria a mensagem de compartilhamento
        const shareText = `Acabei de fazer check-in na trilha "${atividadeNome}" no ${parqueNome} e conquistei um novo Badge no app #TrilhasDeMinas! 🏞️`;

        // 3. Tenta usar a API Web Share (para compatibilidade nativa)
        if (navigator.share) {
            navigator.share({
                title: 'Check-in Trilhas de Minas',
                text: shareText,
                url: window.location.href // Opcional: link para a página
                // Arquivos são mais complexos de compartilhar via Web Share API
            }).then(() => {
                statusText.textContent = 'Compartilhamento concluído! Badge salvo!';
                statusText.style.color = 'var(--cor-secundaria)';
                setTimeout(() => window.location.hash = `#${parqueId}-activities`, 2000);
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error('Erro ao compartilhar:', error);
                    statusText.textContent = 'Erro ao compartilhar. Tente novamente.';
                    statusText.style.color = '#f44336';
                } else {
                    statusText.textContent = 'Compartilhamento cancelado.';
                    statusText.style.color = '#666';
                    setTimeout(() => window.location.hash = `#${parqueId}-activities`, 2000);
                }
            });
        } else {
            // 4. Fallback (apenas atualização de status)
            statusText.textContent = 'Badge Conquistado! O compartilhamento direto não é suportado pelo seu navegador.';
            statusText.style.color = 'var(--cor-secundaria)';
            
            // Simula o tempo de upload antes de voltar
            setTimeout(() => window.location.hash = `#${parqueId}-activities`, 2000);
        }
    };

    // Apenas para simular a leitura do arquivo (sem upload real)
    reader.readAsDataURL(file); 
}


// --- Lógica do Roteamento (Hashchange) ---

function lidarComHash() {
    const hash = window.location.hash.substring(1);
    
    // Limpar o intervalo do carrossel ao mudar de página
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    
    document.getElementById('install-prompt').style.display = 'none';

    // Rota: Home (Sem Hash)
    if (!hash || hash === 'home' || hash === '#') {
        document.getElementById('area-secundaria').classList.remove('aberto');
        document.body.style.overflow = 'auto'; // Retorna o scroll ao corpo principal
        document.body.style.height = 'auto'; 
        // Esconder o PWA prompt se for a Home
        setupPwaInstallPrompt(); 
        return;
    }
    
    document.body.style.overflow = 'hidden'; // Remove o scroll do corpo principal
    document.body.style.height = '100vh'; // Garante que a tela cheia funcione

    // Rota: Upload/Check-in (upload-parqueid-atividadeid)
    if (hash.startsWith('upload-')) {
        const parts = hash.split('-'); // [upload, parqueId, atividadeId]
        if (parts.length === 3) {
            carregarAreaUpload(parts[1], parts[2]);
            return;
        }
    }
    
    // Rota: Premiação (premiacao)
    if (hash === 'premiacao') {
        carregarConteudoPremiacao();
        return;
    }

    // Rota: Detalhes do Parque (parqueid-action ou apenas parqueid)
    const parts = hash.split('-');
    const parqueId = parts[0];
    const action = parts[1] || 'info'; 

    const parqueEncontrado = DADOS_PARQUES.find(p => p.id === parqueId);

    if (parqueEncontrado && parqueId !== 'premiacao') {
        // Redireciona para o detalhe do parque com a ação específica
        carregarDetalhesParque(parqueId, action);
    } else {
        // Hash inválido, volta para a home
        window.location.hash = ''; 
    }
}


// --- Inicialização da Aplicação ---

function iniciarApp() {
    carregarBotoesParques();
    lidarComHash(); 

    // Ocultar a intro
    const videoIntro = document.getElementById('video-intro');
    videoIntro.classList.add('fade-out'); 
    setTimeout(() => {
        videoIntro.style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        // Mostrar o PWA prompt após a intro
        setupPwaInstallPrompt();
    }, 1000); 

    // Adiciona listener para o botão de check-ins (que é um link com hash)
    const btnPremiacao = document.getElementById('btn-premiacao');
    if (btnPremiacao) {
        btnPremiacao.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = `#${btnPremiacao.dataset.parqueId}`; // Redireciona para #premiacao
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
        
        // CORREÇÃO: Lógica para iniciar o vídeo/app

        const videoElement = document.getElementById('intro-video-element');
        let checkinProcessado = false; // Se o usuário está em uma tela de check-in, não toca o vídeo

        // Adicionar o listener para o vídeo
        videoElement.addEventListener('ended', iniciarApp);
        
        // Verifica se é a primeira visita
        if (localStorage.getItem('first_visit') !== 'false') {
            
            // Marcar como primeira visita concluída
            localStorage.setItem('first_visit', 'false');
            
            // Iniciar o vídeo
            document.getElementById('video-intro').style.display = 'flex';
            videoElement.load();
            videoElement.play().catch(error => {
                console.warn('Playback impedido. Iniciando App diretamente.', error);
                // Fallback caso o autoplay seja impedido
                iniciarApp(); 
            });

        } else {
             // Não é a primeira visita
             // Se houver hash de navegação, pode ser um deep link
             if (window.location.hash) {
                checkinProcessado = true;
             }
        }
        // ----------------------------------------------------------------------


        if (!checkinProcessado) {
             iniciarApp(); 
        } else {
             document.getElementById('video-intro').style.display = 'none';
             lidarComHash();
        }
        
    } catch (error) {
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('app-container').innerHTML = '<p style="text-align: center; color: red; margin-top: 50px; font-weight: bold;">ERRO DE CARREGAMENTO: Não foi possível carregar os dados. Verifique a sintaxe de parques.json e park_details.json.</p>';
        document.getElementById('video-intro').style.display = 'none';
        console.error('Erro fatal ao carregar dados:', error);
    }

    // CORREÇÃO: Lógica de Botão Voltar/Home
    document.getElementById('btn-voltar').addEventListener('click', () => {
        if (window.location.hash) {
            window.history.back();
        } else {
            // No caso de não haver histórico (deep link, por exemplo)
            document.getElementById('area-secundaria').classList.remove('aberto');
        }
    });
    window.addEventListener('hashchange', lidarComHash);
    
    document.getElementById('btn-home').addEventListener('click', () => {
        window.location.hash = ''; 
    });
}

inicializar();
