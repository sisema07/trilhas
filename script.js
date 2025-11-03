// script.js - CÓDIGO COMPLETO (FINALMENTE CORRIGIDO E FUNCIONAL)

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
        
        document.getElementById('park-main-image').src = `entradas/${parque.id}.png`;
        
        const locationLink = document.getElementById('park-location-link');
        locationLink.href = detalhes.map_link || '#'; 
        
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
            
            card.innerHTML = `
                <i class="fas ${atividade.icone}"></i>
                <span>${atividade.nome}</span>
            `;
            listaPremios.appendChild(card);
            
            if (isConcluida) {
                 card.addEventListener('click', () => {
                    window.location.hash = `upload-${parqueId}-${atividade.id}`;
                 });
            }
        });
    }
}


function carregarConteudoAtividades(parque, container) {
    const atividades = ATIVIDADES_PARQUES[parque.id] || [];
    const detalhes = DETALHES_PARQUES[parque.id] || {};
    
    // 1. INSTRUÇÕES (com texto formatado corretamente)
    let html = `
        <div class="activity-instructions">
            <div class="instruction-text">
                <h3>Procure os códigos QRs no parque, abra a câmera do seu celular e escaneie para liberar o badge!</h3>
                <p class="badge-description">${detalhes.badge_descricao || 'Instruções gerais sobre o tipo de atividade.'}</p>
            </div>
            <div class="qr-mascote-container">
                <img src="qr.png" alt="Mascote escaneando QR Code" class="qr-mascote-img">
            </div>
        </div>
        <hr class="separator" style="margin: 15px 0;">
        
        <div id="lista-atividades-dinamica"> `;

    // 2. LISTA DE ATIVIDADES (Badge Apagado / Aceso)
    if (atividades.length === 0) {
        html += '<p style="text-align: center; margin-top: 20px;">Nenhuma atividade cadastrada para este parque.</p>';
    } else {
        atividades.forEach(atividade => {
            const desbloqueado = estadoUsuario[parque.id] && estadoUsuario[parque.id][atividade.id] ? 'desbloqueado' : '';
            const badgeId = `${parque.id}-${atividade.id}`;
            
            // NOVO HTML DE LISTA
            html += `
                <div class="activity-list-item ${desbloqueado}" data-badge-id="${badgeId}">
                    <div class="icone-premio">
                        <i class="fas ${atividade.icone}"></i>
                        <span>${atividade.nome}</span> </div>
                    
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
    
    // Estrutura HTML do Quiz (Removido o botão Submit e Adicionado o container de navegação)
    container.innerHTML = `
        <div class="quiz-container">
            <h3 class="quiz-title">${detalhes.quiz_title || `Quiz do ${parque.nome}`}</h3>
            <p class="quiz-description">${detalhes.quiz_description || 'Responda para ganhar um badge!'}</p>
            
            <div class="progress-bar"><div class="progress" id="quiz-progress"></div></div>
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
 * Atualiza a barra de progresso.
 */
function updateQuizProgress() {
    // Adiciona 1 ao currentQuizIndex, pois é a pergunta que acabou de ser respondida
    const progress = ((currentQuizIndex + 1) / currentQuizData.length) * 100;
    document.getElementById('quiz-progress').style.width = progress + '%';
}

/**
 * Exibe o resultado final do Quiz e libera o badge.
 */
function showQuizResult() {
    updateQuizProgress(); 
    
    const total = currentQuizData.length;
    let classification = '';
    
    if (quizScore < total * 0.4) classification = 'Novato';
    else if (quizScore < total * 0.75) classification = 'Conhecedor';
    else classification = 'Explorador';

    const requiredScore = Math.ceil(total * 0.75);
    const badgeId = currentQuizData[0].badge_id;
    let badgeLiberado = false;
    const parqueId = window.location.hash.substring(1).split('-')[0];
    
    if (quizScore >= requiredScore) {
        // Tenta liberar o Badge
        if (!estadoUsuario[parqueId]) {
             estadoUsuario[parqueId] = {};
        }
        
        if (!estadoUsuario[parqueId][badgeId]) {
            estadoUsuario[parqueId][badgeId] = true;
            salvarEstado();
            badgeLiberado = true;
        }
    }
    
    // Conteúdo final
    document.getElementById('quiz-question-container').innerHTML = `
        <h2>Resultado Final</h2>
        <p><strong>Acertos:</strong> ${quizScore} de ${total}</p>
        <p><strong>Classificação:</strong> ${classification}</p>
        
        ${badgeLiberado ? 
            `<h3 class="success-message">🎉 BADGE CONQUISTADO! 🎉</h3>
             <p>O Badge do Quiz foi liberado! Tente as outras atividades ou vá para a área de Check-ins.</p>`
            : `<p class="fail-message">Estude mais para tentar novamente! Você precisa de ${requiredScore} acertos para ganhar o Badge.</p>`
        }
    `;

    // Esconde o botão Próxima/Concluir e mostra o Reiniciar
    document.getElementById('quiz-next-btn').classList.add('hidden');
    document.getElementById('quiz-restart-btn').classList.remove('hidden');
}


// --- EXPOSIÇÃO GLOBAL DE FUNÇÕES (para o HTML dinâmico) ---
window.selectQuizOption = selectQuizOption;
window.nextQuestion = nextQuestion;
window.showQuizResult = showQuizResult;


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
    
    document.getElementById('btn-enviar-foto').addEventListener('click', () => {
        alert('Funcionalidade de processamento de foto será implementada aqui.');
    });
}

document.addEventListener('DOMContentLoaded', inicializarApp);



