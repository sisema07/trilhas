const CACHE_NAME = 'trilhas-de-minas-v11';
const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'script.js',
    'parques.json',
    'park_details.json', 
    'trilhas.mp4',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Open+Sans:wght@400;600;700&display=swap',
    
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
    'mascote-quiz-run.png',
    'win.gif',
    'qr.png',
    'logo.png',
    'titulo.png',
    
    // Badges
    'badges/portaria-biribiri-badge.png',
    'badges/vilarejo-historico-badge.png',
    'badges/cachoeira-sentinela-badge.png',
    'badges/cachoeira-dos-cristais-badge.png',
    
    // Template do Canvas
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
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then(response => {
                    if(!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    
                    if (urlsToCache.some(url => event.request.url.includes(url.replace('./', '')))) {
                       caches.open(CACHE_NAME)
                           .then(cache => {
                               cache.put(event.request, responseToCache);
                           });
                    }
                    return response;
                });
            })
            .catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});
