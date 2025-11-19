const CACHE_NAME = 'trilhas-de-minas-v18'; // <<--- MUDANÇA AQUI! (v18 para v19)
const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'script.js',
    'parques.json',
    'park_details.json', 
    'fauna.json', // Adicionado
    'trilhas.mp4',
    'manifest.json', // Adicionado
    'logo.png', // Adicionado
    'titulo.png', // Adicionado
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    
    // Links de fontes para cache offline (mantidos)
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Open+Sans:wght@400;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Roboto+Slab:wght@700&display=swap',

    // Logos
    'logos/biribiri.png',
    'logos/ibitipoca.png',
    'logos/itacolomi.png',
    'logos/lapagrande.png',
    'logos/matadokrambeck.png',
    'logos/matadolimoeiro.png',
    'logos/novabaden.png',
    'logos/paufurado.png',
    'logos/picodoitambe.png',
    'logos/riodoce.png',
    'logos/riopreto.png',
    'logos/serradasararas.png',
    'logos/serradobrigadeiro.png',
    'logos/serradointendente.png',
    'logos/serradopapagaio.png',
    'logos/serradorolamoca.png',
    'logos/serranovaetalhado.png',
    'logos/serraverde.png',
    'logos/sumidouro.png',
    
    // Imagens diversas
    'fauna/jaguatirica.png',
    'mascote-quiz-run.png', // Adicionado
    'win.gif',
    'qr.png',
    'images/nature-pattern.png', // Adicionado (se existir)
    
    // Badges (Verificados no parques.json)
    'badges/portaria-biribiri-badge.png',
    'badges/vilarejo-historico-badge.png',
    'badges/cachoeira-sentinela-badge.png',
    'badges/cachoeira-dos-cristais-badge.png',
    'badges/mirante-da-cruzinha.png', // Adicionado
    'badges/mirante-casa-dos-ventos.png', // Adicionado
    'badges/janela-do-ceu.png', // Adicionado
    'badges/pico-do-piao.png', // Adicionado
    
    // Template do Canvas
    'images/passport_template.png',
    'images/default_stamp_fallback.png' // Adicionado
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
                // Permite a falha na adição de alguns arquivos (ex: fontes externas)
                return Promise.resolve();
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

// Fetch: Estratégia Cache, then Network, with update (para recursos estáticos)
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    
    // Evita tentar cachear URLs externas que não estão na lista (como as imagens aleatórias do unsplash)
    const url = new URL(event.request.url);
    if (url.origin !== location.origin && !urlsToCache.includes(url.href)) {
        return event.respondWith(fetch(event.request));
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se o arquivo estiver no cache, retorna
                if (response) {
                    return response;
                }
                
                // Se não estiver, faz a requisição à rede
                return fetch(event.request).then(response => {
                    
                    // Verifica se a resposta é válida
                    if(!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clona a resposta para o cache
                    const responseToCache = response.clone();
                    
                    // Otimização: Cache apenas os arquivos que são essenciais (seja local ou externo na urlsToCache)
                    const isLocalResource = url.origin === location.origin;
                    const isExternalResourceToCache = urlsToCache.includes(url.href);

                    if (isLocalResource || isExternalResourceToCache) {
                       caches.open(CACHE_NAME)
                           .then(cache => {
                               // Limita o tamanho do cache se necessário, mas para o GitHub Pages simples, basta adicionar.
                               cache.put(event.request, responseToCache);
                           });
                    }
                    return response;
                });
            })
            .catch(() => {
                // Fallback para a página inicial se a navegação falhar offline
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});




