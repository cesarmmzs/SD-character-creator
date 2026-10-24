// Cursed Scroll 3: Sol da Meia-noite. Textos resumidos com palavras próprias.
import { VIDENTE_SUPERIORES } from './magias-suplementos.js';

// Magias conhecidas por grau, do nível 1 ao 10, conforme a tabela da classe.
const SEER_SPELLS = [[1], [2], [2, 1], [2, 2], [2, 2, 1], [2, 2, 2], [2, 2, 2, 1], [2, 2, 2, 2], [2, 2, 2, 2, 1], [2, 2, 2, 2, 2]];

const pick = { min: 12, max: 12, text: 'Escolha um talento desta tabela ou distribua +2 pontos de atributo', effect: { kind: 'pick' } };

export default {
  id: 'sol-da-meia-noite',
  name: 'Cursed Scroll 3: Sol da Meia-noite',
  short: 'Sol da Meia-noite',
  cover: 'img/sd_suplemento_3_cover.jpg',

  classes: [
    {
      id: 'lobo-do-mar', name: 'Lobo do Mar', page: 10, hitDie: 8,
      desc: 'Saqueador nórdico dos mares, que luta para agradar aos Deuses Antigos.',
      weaponsText: 'Adaga, arco longo, espada longa, lança, machadinha, machado grande',
      weapons: ['adaga', 'arco-longo', 'espada-longa', 'lanca', 'machadinha', 'machado-grande'],
      armorText: 'Armadura de couro, cota de malha, escudos', armor: ['couro', 'cota', 'cota-mitral', 'escudo', 'escudo-redondo'],
      features: [
        { name: 'Marinheiro', desc: 'Vantagem em testes de navegação e de tripulação de barcos.' },
        { name: 'Muralha de Escudo', desc: 'Com um escudo, use sua ação para assumir postura defensiva: sua CA vira 20.' },
        { name: 'Deuses Antigos', desc: 'Após cada descanso, escolha um deus até o próximo descanso. Odin: cura 1d4 PV ao matar um inimigo. Freya: uma ficha de sorte por dia, que soma 1d6. Loki: Vantagem para mentir, se esgueirar e esconder.' },
      ],
      talents: 'lobo-do-mar',
      titles: {
        lawful: ['Povo Livre', 'Escudeiro', 'Tano', 'Jarl', 'Rei/Rainha'],
        chaotic: ['Escória', 'Invasor', 'Saqueador', 'Conquistador', 'Usurpador'],
        neutral: ['Errante', 'Explorador', 'Aventureiro', 'Renomado', 'Lendário'],
      },
    },
    {
      id: 'vidente', name: 'Vidente', page: 12, hitDie: 6,
      desc: 'Oráculo nórdico que lê runas, ossos e estrelas para moldar o destino.',
      weaponsText: 'Adaga, bastão, lança', weapons: ['adaga', 'bastao', 'lanca'],
      armorText: 'Armadura de couro', armor: ['couro'],
      features: [
        { name: 'Predestinado', desc: 'Sempre que usar uma ficha de sorte, some 1d6 à rolagem.' },
        { name: 'Presságio', desc: '3 vezes por dia, um teste de Sabedoria CD 9 dá uma ficha de sorte (máximo de uma por vez).' },
        { name: 'Conjuração', desc: 'Conjura magias de vidente com 1d20 + modificador de Sabedoria, CD 10 + grau. Se falhar, não repete até descansar; com um 1 natural, só volta a usá-la após uma Penitência. Conhece 1 magia de grau 1.' },
      ],
      spellcasting: { list: 'vidente', stat: 'SAB', known: 1, byLevel: SEER_SPELLS },
      talents: 'vidente',
      titles: {
        lawful: ['Guia', 'Encantador', 'Leitor de Runas', 'O Sábio', 'Vidente de Odin'],
        chaotic: ['Bruxo da Sebe', 'Sussurrador', 'Leitor de Ossos', 'O Temido', 'Vidente de Loki'],
        neutral: ['Adivinho', 'Entoador', 'Leitor de Estrelas', 'O Abençoado', 'Vidente de Freya'],
      },
    },
  ],

  tables: {
    'class:lobo-do-mar': { dice: '2d6', entries: [
      { min: 2, max: 2, text: '1 vez por dia, entre em fúria: imune a dano por 3 rodadas', effect: { kind: 'note' } },
      { min: 3, max: 6, text: 'Seus ataques causam +1 de dano', effect: { kind: 'dmg', melee: 1, ranged: 1 } },
      { min: 7, max: 9, text: '+2 em Força ou Constituição, ou +1 em ataques', effect: { kind: 'or', options: [
        { label: '+2 em Força ou Constituição', effect: { kind: 'stat', options: ['FOR', 'CON'], amount: 2 } },
        { label: '+1 em ataques', effect: { kind: 'atk', melee: 1, ranged: 1 } },
      ] } },
      { min: 10, max: 11, text: 'Dualidade: escolha 2 Deuses Antigos diferentes por dia', effect: { kind: 'note' } },
      pick,
    ] },
    'class:vidente': { dice: '2d6', entries: [
      { min: 2, max: 2, text: 'Aprenda mais uma magia de vidente', effect: { kind: 'spell' } },
      { min: 3, max: 6, text: 'Mais um uso diário de Presságio', effect: { kind: 'note' } },
      { min: 7, max: 9, text: '+2 em Sabedoria ou Carisma, ou +1 nos testes de conjuração', effect: { kind: 'or', options: [
        { label: '+2 em Sabedoria ou Carisma', effect: { kind: 'stat', options: ['SAB', 'CAR'], amount: 2 } },
        { label: '+1 nos testes de conjuração', effect: { kind: 'cast', amount: 1 } },
      ] } },
      { min: 10, max: 11, text: 'O dado do Predestinado sobe um passo (1d6 vira 1d8)', effect: { kind: 'note' } },
      pick,
    ] },
  },

  backgroundTables: [
    { id: 'nordico', name: 'Antecedentes nórdicos', page: 15, entries: [
      ['Libertado', 'Era escravo, mas fugiu ou conquistou a liberdade.'],
      ['Desalojado', 'Fugiu quando um jarl rival atacou sua vila.'],
      ['Criminoso', 'Foi exilado da sua vila por um crime.'],
      ['Errante', 'Ainda procura um jarl digno da sua lealdade.'],
      ['Agricultor', 'Trabalha a terra e conhece todas as plantas.'],
      ['Criador de Gado', 'Tem boa intuição com animais.'],
      ['Caçador', 'Sabe andar em silêncio pelos ermos.'],
      ['Pescador', 'Conhece as criaturas e lendas do mar.'],
      ['Executor', 'Aplica a lei do jarl na sua vila.'],
      ['Mercador', 'Tem contatos comerciais em todas as vilas.'],
      ['Artesão', 'Constrói e conserta qualquer item útil.'],
      ['Fabricante de Arcos', 'Faz e conserta arcos e flechas.'],
      ['Aprendiz de Vidente', 'Conhece um pouco das artes místicas.'],
      ['Carpinteiro Naval', 'Constrói e conserta dracares.'],
      ['Ferreiro', 'Armas, armaduras, ferraduras: faz de tudo.'],
      ['Viajante Distante', 'Conhece muitos povos e costumes distantes.'],
      ['Skald', 'Poeta que conhece todas as baladas antigas.'],
      ['Estirpe Heroica', 'Descende de um guerreiro famoso.'],
      ['Sangue Nobre', 'É filho de um jarl (ou, com sorte, de um rei).'],
      ['Sangue Divino', 'Descende de um deus e carrega uma marca dele.'],
    ] },
  ],

  deities: [
    { id: 'odin', name: 'Odin', alignment: 'lawful', page: 17, desc: 'O Pai de Todos, caolho, que valoriza força e sabedoria e leva os dignos a Valhala.' },
    { id: 'freya', name: 'Freya', alignment: 'neutral', page: 17, desc: 'Deusa do amor e do ódio, rainha das donzelas do escudo e primeira vidente.' },
    { id: 'loki', name: 'Loki', alignment: 'chaotic', page: 17, desc: 'O Trapaceiro, que vence pela astúcia e pela palavra afiada.' },
  ],

  weapons: [
    { id: 'bastao', name: 'Bastão', cost: 200, type: 'C', range: 'A', damage: '1d6', props: ['2M', 'Ru'] },
    { id: 'machadinha', name: 'Machadinha', cost: 200, type: 'CD', range: 'A/P', damage: '1d6', props: ['Ac', 'Ar'] },
  ],

  armor: [
    { id: 'escudo-redondo', name: 'Escudo redondo', cost: 1500, slots: 1, shield: 2, notes: 'Ocupa uma mão; pode ser destruído para anular o dano de um golpe' },
  ],

  spells: {
    vidente: [
      { id: 'cantico', name: 'Cântico', tier: 1, desc: 'Enquanto se concentra, você vê tudo o que é invisível ou oculto.' },
      { id: 'evocar-furia', name: 'Evocar Fúria', tier: 1, desc: 'Um humanoide voluntário entra em fúria por 1d4 rodadas: imune a moral, Vantagem em Força e ataques corpo a corpo, +1d4 de dano.' },
      { id: 'pocao', name: 'Poção', tier: 1, desc: 'Abençoa uma dose de líquido por 1 dia: quem beber cura um veneno ou é estabilizado a 0 PV.' },
      { id: 'transe', name: 'Transe', tier: 1, desc: 'Um humanoide que você toca (não você) ganha uma ficha de sorte.' },
      ...VIDENTE_SUPERIORES,
    ],
  },

  nordicNames: {
    male: ['Asger', 'Audun', 'Balder', 'Bjorn', 'Canute', 'Eirik', 'Elof', 'Frey', 'Gulbrand', 'Hagen', 'Haldor', 'Hjalmar', 'Ingolf', 'Ivar', 'Jerrik', 'Oluf', 'Rangvald', 'Sigurd', 'Torvald', 'Ulf'],
    female: ['Alva', 'Astrid', 'Aslaug', 'Bodil', 'Brenna', 'Brunhilde', 'Dagny', 'Eira', 'Embla', 'Freja', 'Gunhilde', 'Helka', 'Inge', 'Jorunn', 'Ranga', 'Runa', 'Sigrid', 'Thyra', 'Toril', 'Ylva'],
    surname: ['Aberg', 'Brand', 'Carlson', 'Edman', 'Erling', 'Friberg', 'Helvig', 'Holmen', 'Junge', 'Kron', 'Lund', 'Nyland', 'Olander', 'Risberg', 'Sigmond', 'Toft', 'Trygg', 'Vang', 'Westberg', 'Westergard'],
    epithet: ['Olhos de Fogo', 'Nascido da Tempestade', 'A Águia', 'Ossos de Ferro', 'Nascido do Sol', 'O Feroz', 'Coração de Lobo', 'Braço de Pedra', 'Primogênito', 'O Martelo', 'O Veloz', 'Demônio do Mar', 'O Sortudo', 'Nascido de Odin', 'Quebrador de Escudos', 'Coração de Urso', 'A Serpente', 'Filho da Noite', 'O Assassino', 'O Escolhido'],
  },
};
