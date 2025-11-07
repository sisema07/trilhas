const CACHE_NAME = 'trilhas-de-minas-v10'; // AUMENTANDO VERSÃO NOVAMENTE
const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'script.js',
    'parques.json',
    'park_details.json', 
    'trilhas.mp4',
    // Ícones do Font Awesome e Google Fonts (CDN)
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Open+Sans:wght@400;600;700&display=swap',
    
    // --- LISTAS DE IMAGENS E LOGOS ---
    'logos/biribiri.png',
    // ... (inclua aqui todos os seus outros logos, como estavam antes) ...
    'fauna/jaguatirica.png',
    'mascote-quiz-run.png',
    'win.gif',
    
    // --- NOVO: IMAGENS DE BADGE (Para Carregamento Offline) ---
    'badges/portaria-biribiri-badge.png',
    'badges/vilarejo-historico-badge.png',
    'badges/cachoeira-sentinela-badge.png',
    'badges/cachoeira-dos-cristais-badge.png',
    
    // --- IMAGENS DE TEMPLATE DO CANVAS ---
    'images/passport_template.png' 
];

// Instalação: Cache dos recursos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto: Arquivos estáticos em cache.');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Falha ao adicionar arquivos ao cache:', err);
            })
    );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME]; 
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName); 
                    }
                })
            );
        })
    );
});

// Fetch: Servindo arquivos do cache, se disponíveis
// CORREÇÃO na estratégia de fetch
self.addEventListener('fetch', event => {
    // Ignorar requisições não GET
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retorna do cache se encontrado
                if (response) {
                    return response;
                }
                
                // Faz requisição de rede
                return fetch(event.request).then(response => {
                    // Verifica se a resposta é válida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clona a resposta para cache
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // Fallback para navegação
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});
