// script.js - CÓDIGO COMPLETO (FINAL COM CORREÇÃO CRÍTICA DO FLUXO DE CHECK-IN)

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
    // Muda a cada 4 segundos
    carouselInterval = setInterval(nextSlide, 4000); 
}


// --- FLUXO PRINCIPAL DE CHECK-IN (QR CODE) ---

/**
 * Processa a URL de check-in (ex: #checkin-biribiri-portaria)
 * Apenas desbloqueia o badge e redireciona para a tela de Badges.
 */
function processarCheckin(parqueId, atividadeId) {
    if (ATIVIDADES_PARQUES[parqueId] && ATIVIDADES_PARQUES[parqueId].some(a => a.id === atividadeId)) {
        
        if (!estadoUsuario[parqueId]) {
            estadoUsuario[parqueId] = {};
        }

        let mensagem = `Você fez check-in em ${parqueId.toUpperCase()}! `;

        if (!estadoUsuario[parqueId][atividadeId]) {
            // Desbloqueia o badge
            estadoUsuario[parqueId][atividadeId] = true;
            salvarEstado();
            mensagem = `🎉 Novo Badge desbloqueado em ${parqueId.toUpperCase()}!`;
        } else {
            mensagem = `Badge já estava desbloqueado. Divirta-se!`;
        }

        // Alerta o usuário (feedback imediato)
        alert(mensagem); 
        
        // Redireciona para a tela de Badges para o usuário ver a conquista
        window.location.hash = 'premiacao';
        
        return true;
    }
    return false;
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
    
    // Certifica-se de que o botão Next está escondido até a seleção
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
        // Mostra o correto (usando a classe active que tem a cor verde)
        document.querySelector(`.quiz-option-btn[data-index="${questao.correct}"]`)?.classList.add('active');
    }
    
    // Avança para a próxima questão após um breve delay
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
    
    // Condição de sucesso: 75% de acerto
    const requiredScore = Math.ceil(total * 0.75);
    
    if (quizScore >= requiredScore) { 
        // Desbloquear o badge do quiz
        const badgeId = currentQuizData[0].badge_id || 'quiz';
        if (ATIVIDADES_PARQUES[parqueId]?.find(a => a.id === badgeId)) {
            // Verifica se já estava desbloqueado antes de salvar
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
            const badgeId = event.currentTarget.dataset.badgeId; // biribiri-portaria
            // Navega para a tela de compartilhamento (upload)
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


// --- Lógica de Upload/Compartilhamento (Só acessível via clique no Badge) ---

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

    // Re-adicionar listener
    document.getElementById('btn-enviar-foto').removeEventListener('click', processarCompartilhamentoFoto);
    document.getElementById('btn-enviar-foto').addEventListener('click', () => {
        // Passa os IDs para a função de processamento
        processarCompartilhamentoFoto(parqueId, atividadeId);
    });

    document.getElementById('area-secundaria').classList.add('aberto');
    document.getElementById('area-secundaria').scrollTop = 0;
}

window.processarCompartilhamentoFoto = function(parqueId, atividadeId) {
    const fotoInput = document.getElementById('input-foto-badge');
    const btn = document.getElementById('btn-enviar-foto');
    
    if (fotoInput.files.length === 0) {
        alert('Por favor, selecione uma foto para processar e compartilhar.');
        return;
    }

    btn.textContent = 'Processando...';
    btn.disabled = true;

    // A lógica de desbloqueio é omitida aqui, pois só acessamos esta tela se o badge JÁ estiver liberado.
    
    // SIMULAÇÃO DO COMPARTILHAMENTO E VOLTA
    setTimeout(() => {
        alert(`Sucesso! Sua foto foi carimbada (simulação) e está pronta para o compartilhamento!`);
        btn.textContent = 'Compartilhado!';
        // Volta para a tela de Check-ins (Premiacao)
        window.location.hash = `premiacao`; 
    }, 1500); 
}


// --- Lógica do Roteamento (Hashchange) ---

function lidarComHash() {
    // Usamos location.hash para garantir que o histórico funcione
    const fullHash = window.location.hash;
    const hash = fullHash.substring(1);
    
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
        setupPwaInstallPrompt(); 
        return;
    }
    
    document.body.style.overflow = 'hidden'; // Remove o scroll do corpo principal
    document.body.style.height = '100vh'; // Garante que a tela cheia funcione

    // Rota: 1. DESBLOQUEIO PURO (QR CODE)
    if (hash.startsWith('checkin-')) {
        const parts = hash.split('-'); // [checkin, parqueId, atividadeId]
        if (parts.length === 3) {
            // Desbloqueia e Roteia para #premiacao
            processarCheckin(parts[1], parts[2]);
            // O processarCheckin já ajusta a hash, o resto do lidarComHash será executado na próxima mudança
            return;
        }
    }

    // Rota: 2. COMPARTILHAMENTO (SÓ ACESSÍVEL VIA CLIQUE NO BADGE LIBERADO)
    if (hash.startsWith('upload-')) {
        const parts = hash.split('-'); // [upload, parqueId, atividadeId]
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
        // Carrega sempre o parque, ignorando sub-ações no hash para o histórico de navegação
        const action = parts.length > 1 ? parts[1] : 'info';
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
        
        const videoElement = document.getElementById('intro-video-element');
        let checkinProcessado = false; 

        // Adicionar o listener para o vídeo
        videoElement.addEventListener('ended', () => {
             iniciarApp(); 
        });

        // Lógica de primeira visita e auto-play
        if (localStorage.getItem('first_visit') !== 'false' || window.location.hash) {
            
            // Se houver hash de checkin, processa e evita o vídeo (melhor experiência)
            if (window.location.hash.startsWith('#checkin-')) {
                 const parts = window.location.hash.substring(1).split('-');
                 processarCheckin(parts[1], parts[2]); // Processa e redireciona para #premiacao
                 checkinProcessado = true;
            } else if (window.location.hash) {
                 // É um deeplink normal
                 checkinProcessado = true;
            }

            if (!checkinProcessado && localStorage.getItem('first_visit') !== 'false') {
                 localStorage.setItem('first_visit', 'false');
                 document.getElementById('video-intro').style.display = 'flex';
                 videoElement.load();
                 videoElement.play().catch(error => {
                     console.warn('Playback impedido. Iniciando App diretamente.', error);
                     iniciarApp(); 
                 });
            } else {
                 document.getElementById('video-intro').style.display = 'none';
                 document.getElementById('app-container').style.display = 'flex'; 
                 lidarComHash();
            }

        } else {
             // Não é a primeira visita e não há hash (começa na home)
             document.getElementById('video-intro').style.display = 'none';
             document.getElementById('app-container').style.display = 'flex'; 
             lidarComHash();
        }
        
    } catch (error) {
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('app-container').innerHTML = '<p style="text-align: center; color: red; margin-top: 50px; font-weight: bold;">ERRO DE CARREGAMENTO: Não foi possível carregar os dados. Verifique a sintaxe de parques.json e park_details.json.</p>';
        document.getElementById('video-intro').style.display = 'none';
        console.error('Erro fatal ao carregar dados:', error);
    }

    // LÓGICA DO BOTÃO VOLTAR (AJUSTE CRÍTICO DE NAVEGAÇÃO)
    document.getElementById('btn-voltar').addEventListener('click', () => {
        const hash = window.location.hash.substring(1);
        if (hash.startsWith('upload-')) {
            // Volta da tela de upload para a lista de atividades do parque
            window.location.hash = `premiacao`; 
        } else if (hash === 'premiacao') {
             // Volta de Premiacao para a home
             window.location.hash = ''; 
        } else if (DADOS_PARQUES.some(p => p.id === hash.split('-')[0])) {
             // Volta da página do parque para a home
             window.location.hash = ''; 
        } else if (hash !== '') {
             // Caso de rotas de erro/fallback
             window.location.hash = '';
        } else {
            document.getElementById('area-secundaria').classList.remove('aberto');
        }
    });
    
    // O botão Home sempre volta para a Home
    document.getElementById('btn-home').addEventListener('click', () => {
        window.location.hash = ''; 
    });

    window.addEventListener('hashchange', lidarComHash);
}

document.addEventListener('DOMContentLoaded', inicializar);
