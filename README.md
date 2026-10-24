# Criador de Personagens Shadowdark

Aplicativo web para criar personagens de **Shadowdark RPG** passo a passo, pensado para celular. Cada campo tem um botão **?** que explica o que aquilo significa, e o app faz todas as contas (modificadores, PV, CA, ataques, espaços de equipamento, título).

Ferramenta de fã, não oficial. Shadowdark RPG é da The Arcane Library. Os textos do app são resumos escritos com palavras próprias, com a página do livro para consulta; tenha seu livro em mãos para as regras completas.

## O que ele faz

- Criação de personagem de **nível 0** ou **nível 1**, etapa por etapa.
- Livro base e os suplementos **Cursed Scroll 1, 2 e 3** (cada livro pode ser ligado ou desligado).
- Rolagens feitas pelo app ou digitadas a partir dos seus dados físicos.
- Talentos aplicados automaticamente, incluindo os casos de escolha (resultado 12, Dádivas Patronais, Lótus Negra).
- Equipamento por **pacote rápido** ou por **compras** com o ouro rolado, controlando dinheiro e espaços.
- Ficha final pronta para jogar, com opção de imprimir.
- **Subir de nível** direto da ficha (até o nível 10): controle de XP, dado de vida, talentos nos níveis 3, 5, 7 e 9, magias novas por grau e título atualizado. Personagens de nível 0 viram nível 1 escolhendo a classe e mantendo os itens.
- **Mochila** na ficha: moedas de ouro, prata e cobre separadas (adicionar e remover), itens com quantidade, "usar", anotações, itens dos livros ou criados pelo jogador, e contagem de espaços.
- Personagens salvos no próprio navegador, com exportar/importar em `.json`.
- **Modo mestre**: gera vários personagens aleatórios de uma vez, do nível 0 ao 10 (por exemplo, para A Provação) e salva todos num grupo.
- Funciona sem internet depois da primeira visita.

## Como rodar localmente

É um site estático, sem etapa de build. Sirva a pasta com qualquer servidor:

```sh
python3 -m http.server 8000
# abra http://localhost:8000
```

## Testes

```sh
node --test tests/*.test.mjs
```

## Publicar no GitHub Pages

Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`. O endereço fica `https://<usuario>.github.io/SD-character-creator/`.

## Estrutura

| Pasta/arquivo | Conteúdo |
| --- | --- |
| `js/data/` | Regras de cada livro (`base.js`, `diabruras.js`, `areias-rubras.js`, `sol-da-meia-noite.js`) e as explicações (`glossary.js`) |
| `js/rules.js` | Motor de regras: rolagens, talentos e valores da ficha |
| `js/random.js` | Geração aleatória (botões "Sortear" e modo mestre) |
| `js/wizard.js` | Etapas do assistente |
| `js/sheet.js` | Ficha final |
| `js/app.js` | Navegação, tela inicial e modo mestre |
| `js/storage.js` | Salvamento local e exportação |

Para adicionar um novo suplemento, crie um arquivo em `js/data/` no mesmo formato e registre-o em `js/data/index.js`.
