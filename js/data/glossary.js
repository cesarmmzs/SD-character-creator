// Explicações exibidas no botão "?". Escritas com palavras próprias; a página indica onde ler a regra completa no livro base.

export const STAT_NAMES = { FOR: 'Força', DES: 'Destreza', CON: 'Constituição', INT: 'Inteligência', SAB: 'Sabedoria', CAR: 'Carisma' };
export const STATS = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
export const ALIGNMENTS = [
  { id: 'lawful', name: 'Ordeiro' },
  { id: 'neutral', name: 'Neutro' },
  { id: 'chaotic', name: 'Caótico' },
];

export const GLOSSARY = {
  nivel: {
    title: 'Nível inicial',
    text: 'Pergunte ao mestre como a aventura começa. No nível 0 você é uma pessoa comum, ainda sem classe, que tenta sobreviver à primeira aventura (muitas mesas começam assim, com vários personagens por jogador). No nível 1 você já é um aventureiro com classe, talentos e mais pontos de vida.',
    page: 14,
  },
  livros: {
    title: 'Livros usados',
    text: 'Escolha os livros que sua mesa usa. O livro base é sempre usado. Cada suplemento Cursed Scroll adiciona classes, antecedentes, armas e magias. Na dúvida, pergunte ao mestre.',
  },
  atributos: {
    title: 'Atributos',
    text: 'Seis números, de 3 a 18, que descrevem seu corpo e sua mente. São rolados com 3d6 (três dados de seis lados somados), na ordem, um para cada atributo. Se nenhum chegar a 14, você pode rolar todos de novo.',
    page: 15,
  },
  modificador: {
    title: 'Modificador',
    text: 'O que realmente entra nas rolagens. Vai de -4 a +4: 10 ou 11 dá 0, cada 2 pontos acima soma +1 e cada 2 abaixo tira 1. Exemplo: Força 14 dá +2, então um ataque com espada rola 1d20 + 2.',
    page: 15,
  },
  FOR: { title: 'Força', text: 'Poder físico: lutar corpo a corpo, forçar portas, nadar. Também define quantos itens você carrega (o maior entre Força e 10). Importante para guerreiros.', page: 15 },
  DES: { title: 'Destreza', text: 'Agilidade e reflexos: atirar com arco, se equilibrar, andar em silêncio. Soma na sua Classe de Armadura. Importante para ladrões.', page: 15 },
  CON: { title: 'Constituição', text: 'Resistência: aguentar ferimentos, venenos, ficar sem ar. Soma nos seus pontos de vida.', page: 15 },
  INT: { title: 'Inteligência', text: 'Raciocínio: decifrar runas, lembrar de lendas, aprender. É o atributo de conjuração dos magos.', page: 15 },
  SAB: { title: 'Sabedoria', text: 'Instinto e força de vontade: perceber o que está escondido, ler presságios. É o atributo de conjuração de sacerdotes e videntes.', page: 15 },
  CAR: { title: 'Carisma', text: 'Presença: convencer, intimidar, resistir a controle mental. É o atributo de conjuração das bruxas.', page: 15 },
  ancestralidade: {
    title: 'Ancestralidade',
    text: 'O povo de onde você vem. Define os idiomas que você já sabe e dá uma habilidade especial. Nenhuma escolha é "errada": todas funcionam com qualquer classe.',
    page: 16,
  },
  classe: {
    title: 'Classe',
    text: 'Seu papel no grupo. Define quais armas e armaduras você usa sem penalidade, o dado de pontos de vida, as habilidades e a tabela de talentos.',
    page: 18,
  },
  dadoVida: {
    title: 'Dado de vida',
    text: 'O dado que você rola para ganhar pontos de vida a cada nível. Um d8 dá em média mais vida que um d4.',
  },
  talentos: {
    title: 'Talentos',
    text: 'Habilidades extras sorteadas na tabela da sua classe, rolando 2d6. Você ganha uma rolagem no nível 1 (humanos ganham duas) e outras nos níveis 3, 5, 7 e 9. Talentos repetidos se somam. Num 12, você escolhe o talento que quiser da tabela ou distribui +2 pontos nos atributos.',
    page: 39,
  },
  antecedente: {
    title: 'Antecedente',
    text: 'O que você fazia antes de virar aventureiro. Não dá números, mas o mestre pode dar Vantagem quando seu passado ajuda numa situação (um herbalista reconhecendo um veneno, por exemplo).',
    page: 26,
  },
  alinhamento: {
    title: 'Alinhamento',
    text: 'De que lado você está na luta eterna entre Ordem e Caos. Ordeiros buscam o bem da maioria, caóticos acham que só os fortes sobrevivem, neutros deixam a natureza seguir seu curso. Afeta o título e algumas magias.',
    page: 27,
  },
  divindade: {
    title: 'Divindade',
    text: 'O deus que você venera, se venera algum. É opcional, exceto para sacerdotes, que precisam servir a um deus do mesmo alinhamento.',
    page: 28,
  },
  patrono: {
    title: 'Patrono',
    text: 'Um ser sobrenatural poderoso que dá dons ao Profanador em troca de favores estranhos. Cada patrono tem sua própria tabela de Dádivas.',
  },
  idiomas: {
    title: 'Idiomas',
    text: 'Os idiomas que você fala e lê. Todos sabem Comum. Idiomas comuns são falados por povos frequentes; os raros (Celestial, Diabólico, Dracônico, Primordial) são de seres sobrenaturais.',
    page: 32,
  },
  magias: {
    title: 'Magias',
    text: 'As magias que você conhece. Para conjurar, role 1d20 + seu modificador de conjuração; a dificuldade é 10 + o grau da magia. No nível 1, você só tem acesso a magias de grau 1.',
    page: 44,
  },
  conjuracao: {
    title: 'Teste de conjuração',
    text: 'O bônus que você soma ao d20 para conjurar: o modificador do seu atributo de conjuração mais bônus de talentos. Se falhar, normalmente perde a magia até descansar.',
    page: 44,
  },
  pv: {
    title: 'Pontos de vida (PV)',
    text: 'Quanto dano você aguenta. No nível 0 é seu modificador de Constituição (mínimo 1). No nível 1 é o dado de vida da classe + modificador de Constituição; se o modificador for menor que +1, conta como +1 (dado 1 com Constituição negativa dá 2 PV). Ao chegar a 0 PV, você está morrendo.',
    page: 14,
  },
  ca: {
    title: 'Classe de Armadura (CA)',
    text: 'O número que o inimigo precisa alcançar para acertar você. Sem armadura é 10 + modificador de Destreza. Armaduras e escudos aumentam a CA.',
    page: 33,
  },
  espacos: {
    title: 'Espaços de equipamento',
    text: 'Quantos itens você carrega: o maior entre sua Força e 10. A maioria dos itens ocupa 1 espaço; alguns são pesados (armaduras de metal, armas grandes) e outros vêm em pacotes (20 flechas num espaço). As primeiras 100 moedas não ocupam espaço.',
    page: 35,
  },
  ouro: {
    title: 'Dinheiro inicial',
    text: 'No nível 1 você rola 2d6 × 5 peças de ouro (PO) para comprar seu equipamento. 1 PO = 10 peças de prata (PP) = 100 peças de cobre (PC).',
    page: 33,
  },
  pacote: {
    title: 'Pacote rápido',
    text: 'Atalho das regras de personagem aleatório: você recebe um kit de exploração, uma arma da sua classe, armadura de couro (se puder usar) e 5 PO. Ótimo para não perder tempo na primeira sessão.',
    page: 40,
  },
  kit: {
    title: 'Kit de exploração',
    text: 'Pacote com o básico para explorar masmorras: mochila, pederneira, 2 tochas, 3 rações, 10 cravos de ferro, arpéu e corda. Custa 7 PO e ocupa 7 espaços.',
    page: 36,
  },
  equipNivel0: {
    title: 'Equipamento no nível 0',
    text: 'Pessoas comuns começam só com o que tinham em casa: role 1d4 para saber quantos itens, e 1d12 para cada item. No nível 0 você pode usar qualquer arma e armadura.',
    page: 33,
  },
  titulo: {
    title: 'Título',
    text: 'Como o mundo conhece você. Muda com o nível e depende da sua classe e do seu alinhamento.',
    page: 30,
  },
  ataques: {
    title: 'Ataques',
    text: 'Para atacar, role 1d20 + o bônus mostrado; se igualar ou passar a CA do alvo, você acerta e rola o dano. Armas corpo a corpo usam Força; à distância usam Destreza. Armas com Acuidade usam o melhor dos dois.',
    page: 90,
  },
  vantagem: {
    title: 'Vantagem e Desvantagem',
    text: 'Com Vantagem, role dois d20 e fique com o melhor. Com Desvantagem, fique com o pior.',
    page: 9,
  },
  fichaSorte: {
    title: 'Ficha de sorte',
    text: 'Uma ficha que você pode gastar para rolar de novo qualquer rolagem sua. O mestre costuma dar como prêmio por boas ideias ou boa interpretação.',
  },
  nome: {
    title: 'Nome',
    text: 'Como seu personagem se chama. Use o botão de sugestão para sortear um nome típico da sua ancestralidade.',
  },
  aparencia: {
    title: 'Aparência',
    text: 'Como os outros veem você: altura, cabelo, roupas, cicatrizes, cheiro. Dois ou três detalhes marcantes bastam.',
  },
  tracos: {
    title: 'Traços de personalidade',
    text: 'Como você age: corajoso, desconfiado, piadista, ganancioso? Ajuda você e o mestre a interpretar o personagem.',
  },
  biografia: {
    title: 'Biografia / passado',
    text: 'De onde você veio e por que se arrisca nas trevas. Use seu antecedente como ponto de partida. Não precisa ser longo.',
  },
  masteryHelp: {
    title: 'Maestria em Armas',
    text: 'Escolha um tipo de arma (por exemplo, espada longa). Com ela você ganha +1 no ataque e no dano, e mais metade do seu nível.',
    page: 18,
  },
  mestre: {
    title: 'Modo mestre',
    text: 'Gera vários personagens aleatórios de uma vez, seguindo as tabelas de personagem aleatório do livro. Útil para a Provação de nível 0 (o livro sugere quatro por jogador) ou para criar PdMs e substitutos rapidamente.',
    page: 118,
  },
  xp: {
    title: 'Experiência (XP)',
    text: 'O mestre dá XP principalmente pelos tesouros que o grupo recupera. Quando seu XP chega ao seu nível × 10 (10 XP no nível 1, 20 no nível 2...), você sobe de nível e o XP volta a zero. Anote aqui o XP que o mestre der.',
    page: 39,
  },
  subirNivel: {
    title: 'Subir de nível',
    text: 'Ao subir, você rola o dado de vida da classe e soma ao seu PV máximo (a Constituição só conta no nível 1). Nos níveis 3, 5, 7 e 9 você ganha uma rolagem de talento. Conjuradores aprendem magias novas conforme a tabela da classe, e seu título pode mudar. O app mostra só o que muda no novo nível.',
    page: 39,
  },
  nivelZeroUm: {
    title: 'Do nível 0 ao nível 1',
    text: 'Quem sobrevive à primeira aventura vira aventureiro: escolhe uma classe, rola o dado de vida da classe (somando a Constituição), rola um talento e, se for conjurador, escolhe as magias. Você mantém seus atributos, ancestralidade e os itens que já tem.',
    page: 39,
  },
  moedas: {
    title: 'Moedas',
    text: 'Há três moedas: ouro (PO), prata (PP) e cobre (PC). 1 PO vale 10 PP, e 1 PP vale 10 PC. As 100 primeiras moedas que você carrega não ocupam espaço; depois disso, cada 100 moedas ocupam 1 espaço.',
    page: 35,
  },
  mochila: {
    title: 'Mochila',
    text: 'Tudo o que você carrega. Use "−" e "+" para ajustar a quantidade, "usar" para gastar uma unidade (uma tocha, uma ração, uma flecha), "guardar" para deixar uma unidade na cidade durante a expedição (ela aparece em verde, não ocupa espaço nem conta para ataques e CA, e "pegar" a traz de volta) e "×" para tirar o item. Usar e remover sempre pedem confirmação. Quando os espaços chegam ao limite, a caixa "Espaços" ganha borda vermelha e o app não deixa pôr mais nada. Você pode adicionar itens dos livros ou criar um item próprio, como um tesouro encontrado. Cada item ocupa espaços; seu limite é a Força ou 10, o que for maior.',
    page: 35,
  },
  pvAtual: {
    title: 'PV atual e PV máximo',
    text: 'O PV máximo é calculado pelo app (dado de vida + Constituição no nível 1, mais um dado a cada nível). O PV atual é quanto resta agora: use "Dano" quando for ferido e "Cura" quando recuperar. Uma noite de descanso devolve todos os PV. Com 0 PV o personagem cai e morre em 1d4 + modificador de Constituição rodadas (mínimo 1), a menos que seja estabilizado (pág. 9).',
    page: 12,
  },
};
