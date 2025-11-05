// script.js - CÓDIGO COMPLETO (FINAL COM CORREÇÕES DE CARROSSEL E NAVEGAÇÃO)

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
        console.error("Erro ao tentar play automático no vídeo:", error);
        setTimeout(fecharIntro, 200); 
    });

    function fecharIntro() {
        intro.classList.add('fade-out');
        setTimeout(() => {
            intro.style.display = 'none';
            lidarComHash(); 
        }, 1000);
    }

    video.onended = fecharIntro;
}

/**
 * Carrega os botões na tela principal.
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
        
        let iconePrincipal;
        if (parque.is_premio || !parque.logo_png) {
            iconePrincipal = `<i class="icone-parque-principal fas ${parque.icone_principal}"></i>`;
        } else {
            iconePrincipal = `<img src="${parque.logo_png}" alt="${parque.nome}" class="logo-parque-principal">`;
        }

        const nome = `<span class="nome-parque">${parque.is_premio ? parque.nome : parque.nome.replace('PE ', '')}</span>`; 

        btn.innerHTML = iconeMarca + iconePrincipal + nome;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = parque.id;
        });
        
        container.appendChild(btn);
    });
}

/**
 * Lógica do Carrossel de Imagens (NOVA FUNÇÃO)
 */
function setupCarousel(parqueId) {
    const carouselElement = document.getElementById('park-carousel');
    const dotsContainer = document.getElementById('carousel-dots');
    carouselElement.innerHTML = '';
    dotsContainer.innerHTML = '';

    const detalhes = DETALHES_PARQUES[parqueId];
    // CORREÇÃO: Usamos o array 'carousel_images' se existir
    const images = detalhes.carousel_images && detalhes.carousel_images.length > 0
        ? detalhes.carousel_images
        : [`entradas/${parqueId}.png`]; // Fallback para a imagem única
    
    images.forEach((src, index) => {
        // Imagens
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Imagem ${index + 1} do parque`;
        img.className = 'carousel-image';
        carouselElement.appendChild(img);

        // Pontos de navegação
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            carouselElement.scrollTo({
                left: carouselElement.offsetWidth * index,
                behavior: 'smooth'
            });
        });
        dotsContainer.appendChild(dot);
    });

    // Atualiza os pontos (dots) ao rolar o carrossel
    carouselElement.addEventListener('scroll', () => {
        // Calcula o índice atual arredondando para o número inteiro mais próximo
        const activeIndex = Math.round(carouselElement.scrollLeft / carouselElement.offsetWidth);
        
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    });
}


/**
 * Exibe a área detalhada (Parque, Check-ins, Upload), e define o botão ativo na página do parque.
 */
function mostrarArea(id, action = 'info') { 
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
    
    // CORREÇÃO 1: Botão Home/Início
    document.getElementById('btn-home').addEventListener('click', () => {
        window.location.hash = ''; 
    });

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
        const detalhes = DETALHES_PARQUES[id];
        
        if (!parque || !detalhes) return;

        titulo.textContent = parque.nome;
        parqueDetail.style.display = 'block';
        
        // --- Configura o Carrossel ---
        setupCarousel(parque.id);
        // ----------------------------------
        
        // --- Configuração da Área de Visitação (Maps e Instagram) ---
        const mapLink = detalhes.map_link || '#';
        const instaLink = detalhes.instagram_link || '#'; 

        document.getElementById('map-link-icon').href = mapLink;
        document.getElementById('insta-link-icon').href = instaLink;
        // O texto 'Venha nos visitar' está fixo no HTML/CSS, e não é clicável.
        // ------------------------------------------------------------------------
        
        const contentArea = document.getElementById('dynamic-content-area');
        const buttons = document.querySelectorAll('.action-button');
        
        buttons.forEach(btn => btn.classList.remove('active'));
        const activeButton = document.querySelector(`.action-button[data-action="${action}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        if (action === 'info') {
            contentArea.innerHTML = `<h3>Informações Gerais</h3><p>${detalhes.info_content}</p>`;
        } else if (action === 'quiz') {
            carregarQuiz(parque, contentArea);
        } else if (action === 'activities') {
            carregarConteudoAtividades(parque, contentArea);
        }

        if (!document.getElementById('info-button').dataset.listenerAdded) {
            document.querySelectorAll('.action-button').forEach(btn => {
                btn.dataset.listenerAdded = true; 
                btn.addEventListener('click', function() {
                    const newAction = this.dataset.action;
                    window.location.hash = `${parque.id}-${newAction}`;
                });
            });
        }
    }
    areaSecundaria.scrollTo(0, 0);
}

// script.js - SUBSTITUA a função carregarPremios()

/** * Carrega todos os Badges.
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
            
            // --- NOVO: Lógica para usar Imagem ou Ícone ---
            let badgeContent;
            if (atividade.imagem_png) {
                // Se tiver imagem PNG, usa a tag <img>
                badgeContent = `<img src="${atividade.imagem_png}" alt="${atividade.nome}" class="badge-custom-img">`;
            } else {
                // Caso contrário, usa o ícone Font Awesome existente
                badgeContent = `<i class="fas ${atividade.icone}"></i>`;
            }
            // ----------------------------------------------
            
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

// script.js - SUBSTITUA a função carregarConteudoAtividades()

/**
 * Carrega e exibe a lista de atividades escaneáveis (Badges) de um parque específico (Layout Lista).
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
            
            // --- NOVO: Lógica para usar Imagem ou Ícone ---
            let badgeContent;
            if (atividade.imagem_png) {
                // Se tiver imagem PNG, usa a tag <img>
                badgeContent = `<img src="${atividade.imagem_png}" alt="${atividade.nome}" class="badge-custom-img">`;
            } else {
                // Caso contrário, usa o ícone Font Awesome existente
                badgeContent = `<i class="fas ${atividade.icone}"></i>`;
            }
            // ----------------------------------------------
            
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

            mostrarArea(parqueId);
            
            window.location.hash = 'premiacao';
        }
    }
}


function lidarComHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        const parts = hash.split('-');
        const id = parts[0];
        const action = parts.length > 1 ? parts[1] : 'info'; 
        mostrarArea(id, action);
    } else {
        document.getElementById('area-secundaria').classList.remove('aberto');
    }
}

// --- LÓGICA DO QUIZ ---

/**
 * Carrega a interface do quiz para o parque e inicializa o jogo.
 */
function carregarQuiz(parque, container) {
    const detalhes = DETALHES_PARQUES[parque.id];
    
    // Verifica se o quiz já foi completado com sucesso
    if (estadoUsuario[parque.id] && detalhes.quiz.length > 0 && estadoUsuario[parque.id][detalhes.quiz[0].badge_id]) {
        container.innerHTML = `
            <div class="quiz-result-container success">
                <h3>🎉 Parabéns! Quiz Concluído!</h3>
                <p>Você já demonstrou ser um expert neste parque. Seu Badge já está ativado!</p>
                <button onclick="window.location.hash = 'premiacao'" class="action-button">Ver Meus Badges</button>
            </div>
        `;
        return;
    }

    if (!detalhes.quiz || detalhes.quiz.length === 0) {
        container.innerHTML = `<p style="text-align: center; margin-top: 30px;">Quiz indisponível para este parque.</p>`;
        return;
    }

    // Inicializa o estado do quiz para o parque
    currentQuizData = detalhes.quiz;
    currentQuizIndex = 0;
    quizScore = 0;
    
    // VARIÁVEIS PARA IMAGEM DA FAUNA (CORREÇÃO 4)
    const faunaImg = parque.fauna_parque_png ? `<img src="fauna/${parque.fauna_parque_png}" alt="Mascote do Parque" class="quiz-fauna-img">` : '';
    
    // Estrutura HTML do Quiz
    container.innerHTML = `
        <div class="quiz-container">
            <div class="quiz-header-content">
                ${faunaImg}
                <div class="quiz-header-text">
                    <h3 class="quiz-title">${detalhes.quiz_title || `Quiz do ${parque.nome}`}</h3>
                    <p class="quiz-description">${detalhes.quiz_description || 'Responda para ganhar um badge!'}</p>
                </div>
            </div>
            
            <div class="progress-bar-container">
                <div class="progress-bar">
                    <div class="progress" id="quiz-progress"></div>
                </div>
            </div>
            
            <div id="quiz-question-container"></div>
            
            <div class="quiz-nav-buttons">
                <button id="quiz-next-btn" class="action-button hidden">Próxima</button>
                <button id="quiz-restart-btn" class="action-button hidden">Reiniciar</button>
            </div>
        </div>
    `;

    // Adiciona Listeners e Inicia a primeira pergunta
    document.getElementById('quiz-next-btn').addEventListener('click', nextQuestion);
    document.getElementById('quiz-restart-btn').addEventListener('click', () => {
        currentQuizIndex = 0;
        quizScore = 0;
        document.getElementById('quiz-restart-btn').classList.add('hidden');
        showQuestion();
    });

    showQuestion();
}

/**
 * Exibe a pergunta atual.
 */
function showQuestion() {
    if (!currentQuizData || currentQuizIndex >= currentQuizData.length) return;
    
    const q = currentQuizData[currentQuizIndex];
    const container = document.getElementById('quiz-question-container');
    const nextBtn = document.getElementById('quiz-next-btn');
    
    // Esconde botões de navegação
    nextBtn.classList.add('hidden');

    container.innerHTML = `
        <div class="question">${q.q}</div>
        <div class="options">
            ${q.a.map((opt, i) => `<button onclick="selectQuizOption(${i})">${opt}</button>`).join('')}
        </div>
    `;
    updateQuizProgress();
}

/**
 * Lógica ao selecionar uma opção no quiz.
 */
function selectQuizOption(selectedIndex) {
    const buttons = document.querySelectorAll('#quiz-question-container .options button');
    buttons.forEach(btn => btn.disabled = true);
    
    // Verifica se a resposta está correta
    const isCorrect = selectedIndex === currentQuizData[currentQuizIndex].correct;
    
    // Cores para feedback visual
    const correctColor = '#3ba64b'; // Verde
    const wrongColor = '#dc3545'; // Vermelho
    
    buttons[selectedIndex].style.backgroundColor = isCorrect ? correctColor : wrongColor;
    
    if (isCorrect) {
        quizScore++;
    } else {
        // Mostra o correto
        buttons[currentQuizData[currentQuizIndex].correct].style.backgroundColor = correctColor;
    }

    // Lógica de Próxima / Concluir
    const nextBtn = document.getElementById('quiz-next-btn');
    
    if (currentQuizIndex < currentQuizData.length - 1) {
        // Se ainda há perguntas, mostra "Próxima"
        nextBtn.textContent = 'Próxima';
        nextBtn.classList.remove('hidden');
        
        // Garante que o listener seja de Próxima
        nextBtn.removeEventListener('click', showQuizResult); 
        nextBtn.addEventListener('click', nextQuestion);
    } else {
        // Se for a última pergunta, muda para "Concluir"
        nextBtn.textContent = 'Concluir';
        nextBtn.removeEventListener('click', nextQuestion); // Remove o listener Próxima
        nextBtn.addEventListener('click', showQuizResult);  // Adiciona o listener Concluir
        nextBtn.classList.remove('hidden');
    }
}

/**
 * Avança para a próxima pergunta.
 */
function nextQuestion() {
    currentQuizIndex++;
    showQuestion();
}

/**
 * Atualiza a barra de progresso. (CORREÇÃO 1: REMOVIDA A LÓGICA DE MOVIMENTO DE MASCOTE)
 */
function updateQuizProgress() {
    const totalQuestions = currentQuizData.length;
    const currentProgressCount = currentQuizIndex + 1; 
    
    const progressPercent = (currentProgressCount / totalQuestions) * 100;
    
    const progressBar = document.getElementById('quiz-progress');
    
    if (!progressBar) return;

    // Aplica a largura na barra
    progressBar.style.width = progressPercent + '%';
}

/**
 * Exibe o resultado final do Quiz, libera o badge e mostra a animação de vitória.
 */
function showQuizResult() {
    updateQuizProgress(); 
    
    const total = currentQuizData.length;
    const requiredScore = Math.ceil(total * 0.75);
    const badgeId = currentQuizData[0].badge_id;
    const parqueId = window.location.hash.substring(1).split('-')[0];
    
    let classification = '';
    let badgeLiberado = false;
    let winAnimation = false; 
    
    if (quizScore === total) { 
        winAnimation = true;
        classification = 'Mestre Explorador!';
    } else if (quizScore >= requiredScore) {
        classification = 'Explorador';
    } else if (quizScore >= total * 0.4) {
        classification = 'Conhecedor';
    } else {
        classification = 'Novato';
    }
    
    // 1. Tenta liberar o Badge (Se acertou 75% ou mais)
    if (quizScore >= requiredScore) {
        if (!estadoUsuario[parqueId]) {
             estadoUsuario[parqueId] = {};
        }
        
        if (!estadoUsuario[parqueId][badgeId]) {
            estadoUsuario[parqueId][badgeId] = true;
            salvarEstado();
            badgeLiberado = true;
        }
    }
    
    // 2. Conteúdo final
    const isPerfectScore = quizScore === total;
    
    document.getElementById('quiz-question-container').innerHTML = `
        <h2>Resultado Final</h2>
        
        ${isPerfectScore ? 
            `<div class="win-animation-container">
                <img src="win.gif" alt="Animação de Vitória" class="win-gif-mascote">
            </div>
            <h3 class="success-message">🏆 VOCÊ ACERTOU TODAS! 🏆</h3>`
            : `<h3 class="result-classification">Classificação: ${classification}</h3>`
        }

        <p><strong>Acertos:</strong> ${quizScore} de ${total}</p>
        
        ${badgeLiberado ? 
            `<p class="success-badge-message">🎉 BADGE CONQUISTADO! 🎉</p>
             <p>O Badge do Quiz foi liberado! Vá para a área de Check-ins.</p>`
            : `<p class="fail-message">Estude mais para tentar novamente! Você precisa de ${requiredScore} acertos para ganhar o Badge.</p>`
        }
    `;

    // 3. LÓGICA DO BOTÃO FINAL (CORREÇÃO 3)
    const nextBtn = document.getElementById('quiz-next-btn');
    nextBtn.classList.add('hidden'); // Esconde o botão "Concluir"
    
    const restartBtn = document.getElementById('quiz-restart-btn');
    
    if (isPerfectScore) {
        // Se acertou todas, transforma o botão "Reiniciar" em "Badges" e navega
        restartBtn.textContent = 'Ver Badges';
        restartBtn.classList.remove('hidden');
        
        // Remove o listener de Reiniciar e adiciona o de navegação
        restartBtn.removeEventListener('click', nextQuestion);
        restartBtn.removeEventListener('click', showQuizResult);
        restartBtn.addEventListener('click', () => {
             window.location.hash = 'premiacao';
        });
        
    } else {
        // Se não foi pontuação perfeita, apenas mantém o botão Reiniciar normal
        restartBtn.textContent = 'Reiniciar';
        restartBtn.classList.remove('hidden');
    }
}

/**
 * Simula o processamento da foto e usa a API Web Share para compartilhar a conquista.
 */
function processarCompartilhamentoFoto() {
    const inputFoto = document.getElementById('input-foto-badge');
    const badgeTitulo = document.getElementById('badge-upload-titulo').textContent;
    
    if (inputFoto.files.length === 0) {
        alert('Por favor, selecione uma foto para processar.');
        return;
    }
    
    const file = inputFoto.files[0];
    const filesArray = [file];
    
    if (navigator.share && navigator.canShare({ files: filesArray, title: badgeTitulo })) {
        
        document.getElementById('btn-enviar-foto').textContent = 'Processando...';
        
        navigator.share({
            files: filesArray,
            title: `Conquista Trilhas de Minas!`,
            text: `Acabei de conquistar o badge "${badgeTitulo.replace('Enviar Foto para Badge: ', '')}" no aplicativo Trilhas de Minas! #TrilhasDeMinas #PE_MG`,
        })
        .then(() => {
            console.log('Compartilhamento concluído com sucesso!');
            document.getElementById('btn-enviar-foto').textContent = 'Compartilhado!';
            setTimeout(() => {
                document.getElementById('btn-enviar-foto').textContent = 'Processar e Compartilhar';
                window.location.hash = 'premiacao';
            }, 1000);
        })
        .catch((error) => {
            console.error('Erro ao tentar compartilhar:', error);
            alert('Não foi possível compartilhar a foto. O navegador pode não suportar o compartilhamento de arquivos ou a operação foi cancelada.');
            document.getElementById('btn-enviar-foto').textContent = 'Processar e Compartilhar';
        });

    } else {
        alert('Seu dispositivo não suporta o compartilhamento nativo de arquivos. Funcionalidade ideal para celular.');
        document.getElementById('btn-enviar-foto').textContent = 'Processar e Compartilhar';
    }
}


// --- EXPOSIÇÃO GLOBAL DE FUNÇÕES (para o HTML dinâmico) ---
window.selectQuizOption = selectQuizOption;
window.nextQuestion = nextQuestion;
window.showQuizResult = showQuizResult;
window.processarCompartilhamentoFoto = processarCompartilhamentoFoto;


// --- FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL ---
async function inicializarApp() {
    registrarServiceWorker();
    setupPwaInstallPrompt();

    try {
        const responseParques = await fetch('parques.json');
        const dadosParques = await responseParques.json();
        DADOS_PARQUES = dadosParques.DADOS_PARQUES;
        ATIVIDADES_PARQUES = dadosParques.ATIVIDADES_PARQUES;
        
        const responseDetails = await fetch('park_details.json');
        DETALHES_PARQUES = await responseDetails.json();
                
        carregarBotoesParques();

        const checkinProcessado = processarCheckinQR();
        
        document.getElementById('app-container').style.display = 'flex';
        
        // --- Listener para habilitar/desabilitar o botão de envio ---
        document.getElementById('input-foto-badge').addEventListener('change', function() {
            const btn = document.getElementById('btn-enviar-foto');
            if (this.files.length > 0) {
                btn.disabled = false;
            } else {
                btn.disabled = true;
            }
        });
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

    document.getElementById('btn-voltar').addEventListener('click', () => {
        if (window.location.hash) {
            window.history.back();
        } else {
            document.getElementById('area-secundaria').classList.remove('aberto');
        }
    });
    window.addEventListener('hashchange', lidarComHash);
    
    document.getElementById('btn-home').addEventListener('click', () => {
        window.location.hash = ''; // CORREÇÃO 2: Botão Home funcionando
    });

    document.getElementById('btn-enviar-foto').addEventListener('click', processarCompartilhamentoFoto);
}

document.addEventListener('DOMContentLoaded', inicializarApp);

