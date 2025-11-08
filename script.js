
// script.js - CÓDIGO COMPLETO CORRIGIDO (COM MODAIS MODERNOS E MODAL DE VITÓRIA DO QUIZ)

let DADOS_PARQUES = [];
let ATIVIDADES_PARQUES = {};
let DETALHES_PARQUES = {}; 
// NOVO: Estrutura de dados da fauna local (Exemplos com texto ilustrativo)
const DADOS_FAUNA = {
    "biribiri": [
{
  "nome": "Carcará",
  "imagem": "carcara.png",
  "descricao": "Ave de rapina oportunista e onívora, facilmente reconhecida por seu voo lento e comportamento curioso. Vive em campos e áreas abertas.",
  "status": "Pouco preocupante (Least Concern)",
  "nome_cientifico": "Caracara plancus"
},
{
  "nome": "Gambá",
  "imagem": "gamba.png",
  "descricao": "Marsupial de hábito noturno e alimentação variada (frutas, insetos e pequenos vertebrados). Adapta-se bem a diferentes ambientes.",
  "status": "Pouco preocupante (Least Concern)",
  "nome_cientifico": "Didelphis albiventris"
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas, pelagem avermelhada e alimentação onívora (frutos, pequenos vertebrados e insetos). É uma das espécies mais emblemáticas do Cerrado e ocorre também no Parque Estadual do Biribiri.",
  "status": "Vulnerável no Brasil (MMA 2022) / Near Threatened na IUCN",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Onça-parda",
  "imagem": "oncaparda.png",
  "descricao": "Grande felino de ampla distribuição nas Américas. Atua como predador de topo e é fundamental para o equilíbrio ecológico.",
  "status": "Pouco preocupante (Least Concern) na IUCN / Vulnerável em algumas regiões do Brasil",
  "nome_cientifico": "Puma concolor"
},
{
  "nome": "Tamanduá-bandeira",
  "imagem": "tamanduabandeira.png",
  "descricao": "Grande mamífero que se alimenta de formigas e cupins usando sua língua comprida e pegajosa. É sensível à perda de habitat e atropelamentos.",
  "status": "Vulnerável no Brasil e na IUCN",
  "nome_cientifico": "Myrmecophaga tridactyla"
},
{
  "nome": "Tatu-canastra",
  "imagem": "tatucanastra.png",
  "descricao": "O maior dos tatus, podendo ultrapassar 50 kg. Vive em áreas de Cerrado e é um escavador habilidoso. Espécie difícil de ser observada.",
  "status": "Vulnerável no Brasil e na IUCN",
  "nome_cientifico": "Priodontes maximus"
},
{
  "nome": "Veado-catingueiro",
  "imagem": "veadocatingueiro.png",
  "descricao": "Veado de pequeno a médio porte, típico de áreas abertas e de transição. Alimenta-se de folhas e frutos e é sensível à caça.",
  "status": "Pouco preocupante (Least Concern)",
  "nome_cientifico": "Mazama gouazoubira"
}

    ],
    "ibitipoca": [
        {
  "nome": "Andorinhão-de-coleira-falha",
  "imagem": "andorinhaodecoleirafalha.png",
  "descricao": "Ave citada como parte da fauna do parque, especialmente para observação de aves. ([parquedoibitipoca.com.br](https://parquedoibitipoca.com.br/?utm_source=chatgpt.com))"
},
{
  "nome": "Coati",
  "imagem": "coati.png",
  "descricao": "Mamífero citado como presente no parque, pertencente à família dos procionídeos. ([ief.mg.gov.br](https://www.ief.mg.gov.br/w/parque-estadual-do-ibitipoca-comemora-44-anos?utm_source=chatgpt.com))",
  "status": "Não disponível detalhadamente",
  "nome_cientifico": "Nasua nasua"
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas, pelagem avermelhada, típico de áreas abertas e de transição. É citado como presente no parque. ([liferay.meioambiente.mg.gov.br](https://liferay.meioambiente.mg.gov.br/web/ief/w/parque-estadual-do-ibitipoca?utm_source=chatgpt.com))",
  "status": "Vulnerável no Brasil / Near Threatened (IUCN)",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Macaco-barbado",
  "imagem": "macacobarbado.png",
  "descricao": "Primata citado como presente no parque. ([ief.mg.gov.br](https://www.ief.mg.gov.br/w/parque-estadual-do-ibitipoca-comemora-44-anos?utm_source=chatgpt.com))"
},
{
  "nome": "Onça-parda",
  "imagem": "oncaparda.png",
  "descricao": "Grande felino de ampla distribuição na América; citado como espécie presente no parque, embora com pressões regionais. ([ief.mg.gov.br](https://www.ief.mg.gov.br/w/parque-estadual-do-ibitipoca-comemora-44-anos?utm_source=chatgpt.com))",
  "status": "Vulnerável no Brasil",
  "nome_cientifico": "Puma concolor"
},
{
  "nome": "Papagaio-do-peito-roxo",
  "imagem": "papagaiodopeitoroxo.png",
  "descricao": "Ave registrada no parque entre os destaques da fauna. ([liferay.meioambiente.mg.gov.br](https://liferay.meioambiente.mg.gov.br/web/ief/w/parque-estadual-do-ibitipoca?utm_source=chatgpt.com))"
}

    ],
    "itacolomi": [
{
  "nome": "Andorinhão-de-coleira",
  "imagem": "andorinhaodecoleira.png",
  "descricao": "Ave migratória registrada no parque, citada entre as espécies raras e ameaçadas encontradas na unidade. :contentReference[oaicite:1]{index=1}",
  "status": "Não disponível detalhadamente",
  "nome_cientifico": ""
},
{
  "nome": "Ave-pavó",
  "imagem": "avepavo.png",
  "descricao": "Ave destacada na fauna do parque como uma espécie rara e ameaçada de extinção. :contentReference[oaicite:2]{index=2}",
  "status": "Não disponível detalhadamente",
  "nome_cientifico": ""
},
{
  "nome": "Gato-mourisco",
  "imagem": "gatomourisco.png",
  "descricao": "Pequeno felino silvestre mencionado entre os mamíferos presentes no parque. :contentReference[oaicite:3]{index=3}",
  "status": "Não disponível detalhadamente",
  "nome_cientifico": ""
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas, pelagem avermelhada; citado como espécie rara e ameaçada que ocorre no parque. :contentReference[oaicite:4]{index=4}",
  "status": "Vulnerável no Brasil / Quase Ameaçado (Near Threatened) pela IUCN",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Onça-parda",
  "imagem": "oncaparda.png",
  "descricao": "Grande felino citado como presente no parque, sendo uma das espécies de mamíferos de topo registradas na unidade. :contentReference[oaicite:5]{index=5}",
  "status": "Vulnerável no Brasil / Baixo risco em escala global (Least Concern) segundo IUCN",
  "nome_cientifico": "Puma concolor"
},
{
  "nome": "Tamanduá-mirim",
  "imagem": "tamanduamirim.png",
  "descricao": "Mamífero de pequeno porte especializado em ingerir formigas e cupins, mencionado entre os mamíferos da fauna do parque. :contentReference[oaicite:6]{index=6}",
  "status": "Não disponível detalhadamente",
  "nome_cientifico": ""
}
],

    "matadolimoeiro": [
{
  "nome": "Gambá-de-orelha-branca",
  "imagem": "gambadeorelhabranca.png",
  "descricao": "Marsupial presente somente em áreas de Mata Atlântica, observado no parque como espécie rara. :contentReference[oaicite:1]{index=1}",
  "nome_cientifico": "Didelphis aurita"
},
{
  "nome": "Rato-do-mato",
  "imagem": "ratodumato.png",
  "descricao": "Roedor típico do Cerrado, citado como espécie rara observada dentro da unidade de conservação. :contentReference[oaicite:2]{index=2}",
  "nome_cientifico": ""
}

],
    "novabaden": [
{
  "nome": "Bugio-ruivo",
  "imagem": "bugioruivo.png",
  "descricao": "Primata do gênero Alouatta citado na unidade; presença confirmada em levantamentos e relatórios locais.",
  "status": "Em Perigo (EN) — avaliação nacional / ICMBio",
  "nome_cientifico": "Alouatta guariba"
},
{
  "nome": "Canário-da-terra",
  "imagem": "canariodaterra.png",
  "descricao": "Ave passeriforme observada na região do parque e destacada em registros de avifauna locais."
},
{
  "nome": "Jaguatirica",
  "imagem": "jaguatirica.png",
  "descricao": "Felino de médio porte citado entre os mamíferos registrados no parque."
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas, frequentemente citado no diagnóstico faunístico do parque.",
  "status": "Vulnerável (Brasil)",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Martim-pescador-verde",
  "imagem": "martimpescadorverde.png",
  "descricao": "Ave típica de margens e corpos d'água; registrada em observações fotográficas no parque."
},
{
  "nome": "Sagui-da-serra-escuro",
  "imagem": "saguidaserraescuro.png",
  "descricao": "Primata de pequeno porte relatado em levantamentos e menções locais; espécie de interesse conservacionista em MG.",
  "status": "Constatado como ameaçado/regionalmente crítico em fontes locais",
  "nome_cientifico": "Callithrix aurita"
},
{
  "nome": "Veado-campeiro",
  "imagem": "veadocampeiro.png",
  "descricao": "Ungulado citado em diagnósticos antigos do parque (presença de veados na lista de mamíferos do plano de manejo)."
}

],
    "paufurado": [
{
  "nome": "Arara-canindé",
  "imagem": "araracaninde.png",
  "descricao": "Grande psitacídeo de cores vibrantes (azul e amarelo), frequenta áreas com árvores de grande porte próximas a rios e rios temporários; citada entre as aves observadas na região do parque.",
  "status": "Pouco preocupante (Least Concern) — IUCN",
  "nome_cientifico": "Ara ararauna"
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas e pelagem avermelhada, típico do Cerrado; relatado em levantamentos e documentos sobre a fauna do parque.",
  "status": "Vulnerável (Brasil) / Near Threatened (IUCN)",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Onça-parda",
  "imagem": "oncaparda.png",
  "descricao": "Grande felino (também chamado de puma) de ampla distribuição nas Américas; citado em diagnósticos e menções sobre a fauna do Pau Furado.",
  "status": "Pouco preocupante (Least Concern) — IUCN / Vulnerável em avaliações regionais",
  "nome_cientifico": "Puma concolor"
},
{
  "nome": "Tamanduá-bandeira",
  "imagem": "tamanduabandeira.png",
  "descricao": "Mamífero de grande porte especializado em formigas e cupins, com longo focinho e língua pegajosa; citado como parte da fauna do parque.",
  "status": "Vulnerável (IUCN e listas nacionais/regionais)",
  "nome_cientifico": "Myrmecophaga tridactyla"
},
{
  "nome": "Teiú",
  "imagem": "teiu.png",
  "descricao": "Grande lagarto (teiú) encontrado em ambientes abertos e bordas de mata; a herpetofauna do parque é descrita como rica, com ocorrência de teiús e diversas serpentes.",
  "status": "Pouco preocupante (Least Concern) — IUCN",
  "nome_cientifico": "Salvator merianae"
},
{
  "nome": "Veado-campeiro",
  "imagem": "veadocampeiro.png",
  "descricao": "Ungulado citado em relatos sobre a presença de veados no parque; ocorre em áreas abertas e de transição dentro do bioma cerrado."
}

],
    "picodoitambe": [
{
  "nome": "Crossodactylodes itambé",
  "imagem": "crossodactylodesitambe.png",
  "descricao": "Anfíbio descrito por pesquisadores a partir de estudos na região do Pico do Itambé; descoberta recente indica endemismos na área de campos rupestres."
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas, de pelagem avermelhada, típico de campos rupestres e áreas de transição; citado entre as espécies de atenção no parque.",
  "status": "Vulnerável (Brasil) / Near Threatened (IUCN)",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Onça-parda",
  "imagem": "oncaparda.png",
  "descricao": "Grande felino (puma) registrado na região; espécie de predador de topo mencionada nas listas de fauna local.",
  "status": "Pouco preocupante (Least Concern) — IUCN / Vulnerável em avaliações regionais",
  "nome_cientifico": "Puma concolor"
},
{
  "nome": "Tamanduá-bandeira",
  "imagem": "tamanduabandeira.png",
  "descricao": "Mamífero de grande porte especializado em formigas e cupins; mencionado em relatórios e guias sobre a fauna do parque.",
  "status": "Vulnerável (Brasil / IUCN)",
  "nome_cientifico": "Myrmecophaga tridactyla"
},
{
  "nome": "Trinca-ferro",
  "imagem": "trincaferro.png",
  "descricao": "Passeriforme observado na área (registros de avifauna em bases de observadores indicam diversas espécies de aves registradas no parque)."
}
],
    "riodoce": [
{
  "nome": "Anta",
  "imagem": "anta.png",
  "descricao": "Maior mamífero terrestre brasileiro, dispersora de sementes, registrada no parque.",
  "status": "Vulnerável (Brasil)",
  "nome_cientifico": "Tapirus terrestris"
},
{
  "nome": "Bugio-ruivo",
  "imagem": "bugioruivo.png",
  "descricao": "Primata da Mata Atlântica observado no parque.",
  "status": "Vulnerável (Brasil)",
  "nome_cientifico": "Alouatta guariba"
},
{
  "nome": "Lontra",
  "imagem": "lontra.png",
  "descricao": "Mamífero semi-aquático da família dos mustelídeos citado entre as espécies ameaçadas no parque.",
  "status": "Vulnerável",
  "nome_cientifico": "Lontra longicaudis"
},
{
  "nome": "Muriqui-do-norte",
  "imagem": "muriquidonorte.png",
  "descricao": "Maior primata das Américas, presente no parque em remanescentes da Mata Atlântica.",
  "status": "Em Perigo (EN)",
  "nome_cientifico": "Brachyteles hypoxanthus"
},
{
  "nome": "Onça-pintada",
  "imagem": "oncapintada.png",
  "descricao": "Maior felino das Américas, indicador de qualidade ecológica, encontrado no parque.",
  "status": "Vulnerável",
  "nome_cientifico": "Panthera onca"
},
{
  "nome": "Onça-parda",
  "imagem": "oncaparda.png",
  "descricao": "Felino de grande porte citado entre os mamíferos da unidade de conservação.",
  "status": "Pouco preocupante (Least Concern)",
  "nome_cientifico": "Puma concolor"
},
{
  "nome": "Tatu-canastra",
  "imagem": "tatucanastra.png",
  "descricao": "Maior espécie de tatu, mencionada entre as espécies ameaçadas presentes no parque.",
  "status": "Vulnerável",
  "nome_cientifico": "Priodontes maximus"
}
],
    "riopreto": [
{
  "nome": "Jaguar-tirica",
  "imagem": "jaguatirica.png",
  "descricao": "Felino de médio porte citado entre as espécies ameaçadas presentes na unidade de conservação.",
  "status": "Ameaçado",
  "nome_cientifico": "Leopardus wiedii"
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas e pelagem avermelhada, típico de formações de cerrado e campos rupestres; relatado como presente no parque. :contentReference[oaicite:1]{index=1}",
  "status": "Vulnerável (Brasil) / Near Threatened (IUCN)",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Tamanduá-bandeira",
  "imagem": "tamanduabandeira.png",
  "descricao": "Grande mamífero especializado em formigas e cupins, listado entre as espécies de fauna ameaçadas da unidade. :contentReference[oaicite:2]{index=2}",
  "status": "Vulnerável",
  "nome_cientifico": "Myrmecophaga tridactyla"
},
{
  "nome": "Tatu-canastra",
  "imagem": "tatucanastra.png",
  "descricao": "O maior dos tatus, citado entre as espécies ameaçadas presentes no parque. :contentReference[oaicite:3]{index=3}",
  "status": "Vulnerável",
  "nome_cientifico": "Priodontes maximus"
}

],
    "serradasararas": [
{
  "nome": "Arara-canindé",
  "imagem": "araracaninde.png",
  "descricao": "Psitacídeo de cores azul-e-amarelas, cria no parque em topos de chapada e paredões; citado como uma das espécies-símbolo da unidade.",
  "status": "Vulnerável (Brasil)",
  "nome_cientifico": "Ara ararauna"
},
{
  "nome": "Arara-vermelha",
  "imagem": "araravermelha.png",
  "descricao": "Grande arara vermelha-alaranjada que também ocupa nichos na unidade, especialmente nas formações rochosas e veredas da serra.",
  "status": "Vulnerável (Brasil / IUCN)",
  "nome_cientifico": "Ara chloropterus"
},
{
  "nome": "Gato-mourisco",
  "imagem": "gatomourisco.png",
  "descricao": "Pequeno felino silvestre citado entre os mamíferos da unidade, adaptado ao cerrado e vereda da região.",
  "status": "Não disponível detalhadamente",
  "nome_cientifico": ""
},
{
  "nome": "Jaguatirica",
  "imagem": "jaguatirica.png",
  "descricao": "Felino de médio porte presente no parque, atuando como predador de borda de mata e vegetação de cerrado.",
  "status": "Não disponível detalhadamente",
  "nome_cientifico": "Leopardus pardalis"
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas e pelagem avermelhada, típico de formações de cerrado; listado entre as espécies de atenção no parque.",
  "status": "Vulnerável (Brasil) / Near Threatened (IUCN)",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Onça-parda",
  "imagem": "oncaparda.png",
  "descricao": "Grande felino de ampla distribuição, registrado na unidade de conservação e considerado importante para a fauna da região.",
  "status": "Pouco preocupante (Least Concern) / Vulnerável regionalmente",
  "nome_cientifico": "Puma concolor"
},
{
  "nome": "Tamanduá-bandeira",
  "imagem": "tamanduabandeira.png",
  "descricao": "Mamífero especializado em formigas e cupins, relatado como ocorrente no parque nas áreas de vereda.",
  "status": "Vulnerável",
  "nome_cientifico": "Myrmecophaga tridactyla"
},
{
  "nome": "Veado-campeiro",
  "imagem": "veadocampeiro.png",
  "descricao": "Ungulado de áreas abertas e de transição, citado entre as espécies de mamíferos registradas no parque.",
  "status": "Não disponível detalhadamente",
  "nome_cientifico": "Ozotoceros bezoarticus"
}

],
    "serradobrigadeiro": [
{
  "nome": "Bugio-ruivo",
  "imagem": "bugioruivo.png",
  "descricao": "Primata da Mata Atlântica observado no parque, citado como uma das espécies ameaçadas da região. :contentReference[oaicite:1]{index=1}",
  "status": "Vulnerável (Brasil)",
  "nome_cientifico": "Alouatta guariba"
},
{
  "nome": "Jaguar-pintada",
  "imagem": "jaguarpintada.png",
  "descricao": "Maior felino das Américas, citado entre as espécies de fauna ameaçadas presentes na unidade. :contentReference[oaicite:2]{index=2}",
  "status": "Vulnerável",
  "nome_cientifico": "Panthera onca"
},
{
  "nome": "Jaguatirica",
  "imagem": "jaguatirica.png",
  "descricao": "Felino de médio porte listado como presente no parque. :contentReference[oaicite:3]{index=3}"
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas e pelagem avermelhada, típico de áreas de Mata Atlântica de altitude e citado no parque. :contentReference[oaicite:4]{index=4}",
  "status": "Vulnerável (Brasil) / Near Threatened (IUCN)",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Muriqui-do-norte",
  "imagem": "muriquidonorte.png",
  "descricao": "Maior primata das Américas, encontrado em grupos independentes dentro do parque, sendo espécie de destaque para conservação. :contentReference[oaicite:5]{index=5}",
  "status": "Em Perigo (Endangered)",
  "nome_cientifico": "Brachyteles hypoxanthus"
},
{
  "nome": "Onça-parda",
  "imagem": "oncaparda.png",
  "descricao": "Felino de grande porte registrado no parque, aparece em estudos sobre mamíferos da unidade. :contentReference[oaicite:6]{index=6}",
  "status": "Least Concern (IUCN)",
  "nome_cientifico": "Puma concolor"
},
{
  "nome": "Tamanduá-de-colete",
  "imagem": "tamanduadecolete.png",
  "descricao": "Mamífero especializado em formigas e cupins citado na fauna do parque. :contentReference[oaicite:7]{index=7}"
}

],
    "serradointendente": [
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas, pelagem avermelhada, citado entre os mamíferos em risco na região da Serra do Intendente. :contentReference[oaicite:1]{index=1}",
  "status": "Vulnerável (Brasil) / Near Threatened (IUCN)",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Macaco-sauá-de-cara-preta",
  "imagem": "macacosua­decarapreta.png",
  "descricao": "Primata considerado raro, registrado pela primeira vez na Serra do Intendente, segundo levantamento ornitofaunístico da área. :contentReference[oaicite:2]{index=2}"
},
{
  "nome": "Tamanduá-bandeira",
  "imagem": "tamanduabandeira.png",
  "descricao": "Grande mamífero especializado em formigas e cupins, citado como parte da fauna em risco presente no parque. :contentReference[oaicite:3]{index=3}",
  "status": "Vulnerável",
  "nome_cientifico": "Myrmecophaga tridactyla"
},
{
  "nome": "Pedreiro-do-Espinhaço",
  "imagem": "pedreirodoespinhaco.png",
  "descricao": "Ave endêmica das porções mais elevadas da Serra do Espinhaço, identificada no Parque Estadual Serra do Intendente como ocorrente. :contentReference[oaicite:4]{index=4}"
}

],
    "serradopapagaio": [
{
  "nome": "Jaguatirica",
  "imagem": "jaguatirica.png",
  "descricao": "Felino ágil citado nas listas de fauna do parque como presente nas áreas de floresta e campos de altitude. :contentReference[oaicite:1]{index=1}"
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas, pelagem avermelhada; espécie típica de áreas de transição que ocorre no parque. :contentReference[oaicite:2]{index=2}",
  "status": "Vulnerável (Brasil) / Near Threatened (IUCN)",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Mono-carvoeiro",
  "imagem": "monocarvoeiro.png",
  "descricao": "Primata de grande porte da Mata Atlântica citado como uma das espécies de destaque para conservação na unidade. :contentReference[oaicite:3]{index=3}",
  "status": "Em Perigo (Endangered)",
  "nome_cientifico": "Brachyteles hypoxanthus"
},
{
  "nome": "Onça-parda",
  "imagem": "oncaparda.png",
  "descricao": "Grande felino predador de topo registrado em levantamentos faunísticos no parque. :contentReference[oaicite:4]{index=4}",
  "status": "Pouco preocupante (Least Concern) / Vulnerável regionalmente",
  "nome_cientifico": "Puma concolor"
},
{
  "nome": "Papagaio-do-peito-roxo",
  "imagem": "papagaiodopeitoroxo.png",
  "descricao": "Psitacídeo ameaçado que dá nome à unidade e é citado como espécie protegida no parque. :contentReference[oaicite:5]{index=5}",
  "status": "Ameaçado",
  "nome_cientifico": "Amazona vinacea"
},
{
  "nome": "Tatu-canastra",
  "imagem": "tatucanastra.png",
  "descricao": "Maior das espécies de tatu, mencionada entre as espécies de solo do parque nas áreas de campos de altitude. :contentReference[oaicite:6]{index=6}",
  "status": "Vulnerável (Brasil)",
  "nome_cientifico": "Priodontes maximus"
},
{
  "nome": "Veado-campeiro",
  "imagem": "veadocampeiro.png",
  "descricao": "Ungulado de áreas abertas observado no parque em áreas de campos e transição. :contentReference[oaicite:7]{index=7}"
}

],
    "serradorolamoca": [
{
  "nome": "Jaguatirica",
  "imagem": "jaguatirica.png",
  "descricao": "Felino de médio porte registrado na unidade de conservação; presença confirmada em registros de mamíferos da região. ([turn0search12],[turn0search18])"
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas, pelagem avermelhada, encontrado no parque — citado como uma das espécies-ameaçadas da unidade. ([turn0search4],[turn0search8])",
  "status": "Vulnerável (Brasil) / Near Threatened (IUCN)",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Onça-parda",
  "imagem": "oncaparda.png",
  "descricao": "Grande felino (puma) monitorado no parque, com exemplar jovem equipado com coleira de rastreamento. ([turn0search3],[turn0search10])",
  "status": "Pouco preocupante (Least Concern) / Vulnerável regionalmente",
  "nome_cientifico": "Puma concolor"
},
{
  "nome": "Veado-campeiro",
  "imagem": "veadocampeiro.png",
  "descricao": "Ungulado típico de áreas de transição registrado dentre a mastofauna da unidade de conservação. ([turn0search18],[turn0search12])"
},
{
  "nome": "Carcará",
  "imagem": "carcara.png",
  "descricao": "Ave de rapina visualmente observada com frequência na unidade, entre as principais aves da fauna local. ([turn0search4])"
}

],
    "serraverde": [
{
  "nome": "Capivara",
  "imagem": "capivara.png",
  "descricao": "Mamífero grande de hábitos semi-aquáticos citado entre os mamíferos da unidade de conservação. :contentReference[oaicite:1]{index=1}"
},
{
  "nome": "Cachorro-do-mato",
  "imagem": "cachorrodomato.png",
  "descricao": "Pequeno carnívoro silvestre presença confirmada nas listagens de mamíferos da área urbana remanescente do parque. :contentReference[oaicite:2]{index=2}"
},
{
  "nome": "Gambá",
  "imagem": "gamba.png",
  "descricao": "Marsupial onívoro, listado entre os mamíferos de médio porte no parque. :contentReference[oaicite:3]{index=3}"
},
{
  "nome": "Pica-pau-do-campo",
  "imagem": "picapaudocampo.png",
  "descricao": "Ave registrada nas trilhas do parque, especialmente mencionada na Trilha do Pica-Pau. :contentReference[oaicite:4]{index=4}"
},
{
  "nome": "Tucano",
  "imagem": "tucano.png",
  "descricao": "Ave grande de bico colorido citada entre as aves observáveis no parque. :contentReference[oaicite:5]{index=5}"
}

],
    "sumidouro": [
{
  "nome": "Gambá",
  "imagem": "gamba.png",
  "descricao": "Marsupial onívoro listado entre os mamíferos da unidade de conservação. :contentReference[oaicite:1]{index=1}"
},
{
  "nome": "Gato-do-mato",
  "imagem": "gatodomato.png",
  "descricao": "Felino de médio porte citado no inventário de fauna do parque. :contentReference[oaicite:2]{index=2}"
},
{
  "nome": "Lobo-guará",
  "imagem": "loboguara.png",
  "descricao": "Canídeo de pernas longas e pelagem avermelhada, citado como presente no parque. :contentReference[oaicite:3]{index=3}",
  "status": "Vulnerável (Brasil) / Near Threatened (IUCN)",
  "nome_cientifico": "Chrysocyon brachyurus"
},
{
  "nome": "Tatu-galinha",
  "imagem": "tatugalinha.png",
  "descricao": "Espécie de tatu registrada entre os mamíferos do parque. :contentReference[oaicite:4]{index=4}"
},
{
  "nome": "Veado-catingueiro",
  "imagem": "veadocatingueiro.png",
  "descricao": "Ungulado de médio porte citado no parque entre as espécies de mamíferos da área. :contentReference[oaicite:5]{index=5}"
}

]
    // Adicionar dados de fauna para outros parques aqui
};

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
    console.log(`Processando check-in: ${parqueId} - ${atividadeId}`);
    
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

// NOVO: Função para abrir o modal de sucesso do Quiz
window.abrirModalQuizWin = function(score, total) {
    const modal = document.getElementById('quiz-win-modal');
    const modalBody = document.getElementById('quiz-win-modal-body');
    
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 10px;">
            <p class="result-classification" style="color: var(--cor-secundaria);">Conhecimento de Mestre!</p>
            <div class="win-animation-container">
                <img src="win.gif" alt="Quiz Concluído" class="win-gif-mascote">
            </div>
            <p class="success-badge-message">Parabéns! Você ganhou o badge do Quiz!</p>
            <p style="margin-bottom: 20px;">Pontuação: ${score} de ${total}</p>
            <button class="action-button active" onclick="fecharModais(); window.location.hash='premiacao'">Ver Meus Badges</button>
        </div>
    `;

    modal.classList.add('open');
    modal.style.display = 'flex'; // Garante que o display seja flex
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

// Garante que o modal feche ao clicar fora (no overlay)
document.getElementById('fauna-modal').addEventListener('click', (e) => {
    if (e.target.id === 'fauna-modal') fecharModais();
});
document.getElementById('qr-modal').addEventListener('click', (e) => {
    if (e.target.id === 'qr-modal') fecharModais();
});
document.getElementById('intro-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'intro-modal') fecharModais();
});
document.getElementById('quiz-win-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'quiz-win-modal') fecharModais();
});


// Função de clique para navegação por hash (usada em carregarDetalhesParque)
function handleActionClick(event, parqueId) {
    event.preventDefault();
    const newAction = event.target.dataset.action;
    window.location.hash = `#${parqueId}-${newAction}`; 
}

function carregarConteudoQuiz(parque, container) {
    // Fecha quaisquer modais abertos antes de carregar o quiz
    fecharModais(); 
    
    const detalhes = DETALHES_PARQUES[parque.id] || {};
    currentQuizData = detalhes.quiz || [];
    const badgeQuiz = ATIVIDADES_PARQUES[parque.id]?.find(a => a.id === 'quiz');
    const isQuizCompleted = badgeQuiz && estadoUsuario[parque.id] && estadoUsuario[parque.id][badgeQuiz.id];
    
    if (currentQuizData.length === 0) {
        container.innerHTML = '<h3>Quiz</h3><p>Nenhum quiz disponível para este parque.</p>';
        return;
    }

    if (isQuizCompleted) {
        // Se já completou, apenas mostra o botão para ir aos badges, sem pop-up.
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

    currentQuizIndex = 0;
    quizScore = 0;
    
    container.innerHTML = `
        <div class="quiz-header-content" style="display: block; text-align: center;">
            <h3>${detalhes.quiz_title || 'Desafio do Conhecimento'}</h3>
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
    
    const requiredScore = Math.ceil(total * 0.75); 
    
    if (quizScore >= requiredScore) { 
        const badgeId = currentQuizData[0].badge_id || 'quiz';
        
        // 1. Marca o badge como conquistado
        if (ATIVIDADES_PARQUES[parqueId]?.find(a => a.id === badgeId)) {
            if (!(estadoUsuario[parqueId] && estadoUsuario[parqueId][badgeId])) {
                if (!estadoUsuario[parqueId]) estadoUsuario[parqueId] = {};
                estadoUsuario[parqueId][badgeId] = true;
                salvarEstado();
            }
        }
        
        // 2. Limpa a área do quiz para mostrar o resultado estático antes do modal
        area.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p class="result-classification" style="color: var(--cor-secundaria);">Quiz Concluído!</p>
                <p>Você acertou ${quizScore} de ${total}.</p>
            </div>
        `;
        document.getElementById('quiz-progress').style.width = '100%';

        // 3. Abre o novo modal de sucesso com o GIF
        setTimeout(() => {
            abrirModalQuizWin(quizScore, total);
        }, 500); // Dá um pequeno delay antes de abrir o modal
        
    } else {
        // CÓDIGO PARA FALHA NO QUIZ
        let resultadoHtml = `
            <div style="text-align: center; padding: 20px;">
                <p class="result-classification" style="color: #f44336;">Tente Novamente!</p>
                <p style="margin-bottom: 20px;">Você acertou ${quizScore} de ${total}. Você precisa de ${requiredScore} acertos para ganhar o Badge.</p>
                <button class="action-button active" onclick="carregarConteudoQuiz(DADOS_PARQUES.find(p => p.id === '${parqueId}'), document.getElementById('dynamic-content-area'))">Reiniciar Quiz</button>
            </div>
        `;
        area.innerHTML = resultadoHtml;
        document.getElementById('quiz-progress').style.width = '100%';
    }
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
        
        // CORREÇÃO CRÍTICA: Garante que o container principal esteja visível
        document.getElementById('app-container').style.display = 'flex';
        
        // Garante que a área secundária está oculta (embora 'aberto' já faça isso)
        document.getElementById('area-secundaria').style.display = 'none';

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

// CORREÇÃO: Lógica de navegação do Botão Home
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
                    }, 1000); // Reduzi o tempo para 1000ms para corresponder ao fade-out
                }).catch(error => {
                    console.warn('Autoplay impedido. Iniciando app diretamente.', error);
                    iniciarApp();
                });
            }
        } else {
            document.getElementById('video-intro').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            
            // CORREÇÃO: Chama o carregamento dos botões (que estava faltando neste bloco)
            carregarBotoesParques();

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
