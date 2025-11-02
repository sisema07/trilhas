const CACHE_NAME = 'trilhas-de-minas-v5'; // <--- MUDANÇA IMPORTANTE (para v3)
const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'script.js',
    'parques.json',
    'trilhas.mp4',
    // Ícones do Font Awesome e Google Fonts (CDN)
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Open+Sans:wght@400;600;700&display=swap',
    
    // --- INÍCIO DA MODIFICAÇÃO: Lista de logos ATUALIZADA ---
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
    'logos/sumidouro.png',
    'logos/serraverde.png'
    // --- FIM DA MODIFICAÇÃO ---
];

// Instalação: Cache dos recursos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto: Arquivos estáticos em cache.');
                // Adiciona todos os URLs. Se um falhar, a instalação falha.
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Falha ao adicionar arquivos ao cache:', err);
            })
    );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME]; // <--- Usa o novo nome do cache
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName); // Deleta caches antigos (ex: v1, v2)
                    }
                })
            );
        })
    );
});

// Fetch: Servindo arquivos do cache, se disponíveis
self.addEventListener('fetch', event => {
    // Estratégia Cache-First para recursos em cache
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retorna o recurso do cache se for encontrado
                if (response) {
                    return response;
                }
                // Tenta buscar o recurso na rede (e cacheá-lo)
                return fetch(event.request).then(
                    response => {
                        // Verifica se recebemos uma resposta válida
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Se for um novo recurso, o clonamos e adicionamos ao cache
                        const responseToCache = response.clone();
                        
                        // Lógica modificada para cachear recursos dinamicamente se estiverem na lista
                        if (urlsToCache.some(url => event.request.url.includes(url.replace('./', '')))) {
                           caches.open(CACHE_NAME)
                               .then(cache => {
                                   cache.put(event.request, responseToCache);
                               });
                        }
                        return response;
                    }
                );
            })
            // Opcional: retornar uma página offline customizada em caso de falha total
            .catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('index.html'); // Retorna o index.html (página principal)
                }
            })
    );
});




