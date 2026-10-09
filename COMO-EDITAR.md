# Site DoremiArtz: como publicar e editar

## O que tem nesta pasta

| Arquivo | Para que serve | Precisa mexer? |
|---|---|---|
| `conteudo.json` | **Todos os textos (em português), preços, imagens, links e o status das comissões** | Sim, é aqui que você edita |
| `traducoes.json` | Textos em inglês e espanhol | Só quando mudar um texto e quiser traduzir |
| `imagens/` | Artes, tabelas de preço, fundo e vídeo | Só para adicionar ou trocar arquivos |
| `.pages.yml` | Configura o painel de edição visual (Pages CMS) | Não |
| `index.html`, `estilo.css`, `script.js` | Estrutura, visual e animações | Não (cores ficam no topo do `estilo.css`) |

---

## 1. Colocar o site no ar (uma vez só, grátis)

1. Crie uma conta em **github.com**.
2. Clique em **New repository**, dê o nome `doremiartz`, deixe **Public** e crie.
3. Na página do repositório, clique em **uploading an existing file** e arraste **todo o conteúdo desta pasta** (incluindo a pasta `imagens`). Clique em **Commit changes**.
   - O arquivo `.pages.yml` começa com ponto e pode ficar oculto no Windows. Se ele não subir, crie no GitHub com **Add file → Create new file**, nome `.pages.yml`, e cole o conteúdo.
4. Vá em **Settings → Pages**. Em *Source*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)** e salve.
5. Em 1 ou 2 minutos o site estará em `https://SEU-USUARIO.github.io/doremiartz/`.

Quer um endereço próprio (tipo `doremiartz.com.br`)? Compre o domínio e informe em **Settings → Pages → Custom domain**.

---

## 2. Editar o site

### Jeito mais fácil: painel visual (Pages CMS)

1. Entre em **app.pagescms.org** e faça login com a sua conta do GitHub.
2. Escolha o repositório `doremiartz`.
3. Abra **Conteúdo do site**. Você vê formulários para tudo: status das comissões, galeria, preços, avisos, redes.
4. Para trocar ou adicionar uma arte, use o campo de imagem, que faz o upload para a pasta `imagens`.
5. Clique em **Save**. O site atualiza sozinho em 1 ou 2 minutos.

### Jeito direto: pelo próprio GitHub

Abra `conteudo.json` no GitHub, clique no lápis (✏️), edite e clique em **Commit changes**.

---

## Edições comuns

**Abrir ou fechar comissões:** troque `"abertas": false` por `"abertas": true`. O selo no topo muda de vermelho para verde e o aviso de "fechadas" some.

**Mudar um preço:** procure o estilo (ex.: `"nome": "Render"`) e troque o número em `"preco"`. Não use aspas nem "R$" no número.

**Adicionar uma arte na galeria:** envie a imagem para `imagens/` e adicione um bloco dentro de `"obras"`:

```json
{
  "imagem": "imagens/minha-arte-nova.jpg",
  "titulo": "Nome da arte",
  "descricao": "O que aparece na imagem, para quem usa leitor de tela",
  "estilo": "Flat Colors",
  "tamanho": "Fullbody",
  "personagensExtras": 0,
  "background": "simples",
  "precoManual": ""
}
```

- **Preço estimado:** o site calcula sozinho com a tabela de preços: preço do estilo + tamanho, mais 70% por personagem extra, mais o background (`"nenhum"`, `"simples"` ou `"complexo"`). Se você mudar um preço na tabela, as estimativas mudam junto.
- Se `estilo` não existir na tabela (ex.: `"Ref sheet"`), aparece **"sob consulta"**.
- Para escrever um valor na mão, preencha `precoManual` (ex.: `"R$ 150"`). Ele substitui a estimativa.
- A galeria monta as linhas sozinha, deixando as artes de cada linha com a mesma altura. A ordem na lista é a ordem no site.

**"Monte seu pedido":** usa a mesma tabela de preços e os mesmos adicionais, então não precisa configurar nada à parte. No painel, em **Monte seu pedido**, dá para mudar os textos, as formas de pagamento e o máximo de personagens extras (coloque 0 para não ter limite). O botão do Telegram usa o link do Telegram que está em **Contato → Redes**.

**Perguntas frequentes:** no painel, em **Perguntas frequentes**, dá para adicionar, editar ou remover perguntas. As versões em inglês e espanhol ficam no `traducoes.json`, em `"faq"`.

**Mudar os adicionais (personagem extra e backgrounds):** ficam em `"precos" → "extras"`. Mudou ali, muda no quadro "Adicionais" e nas estimativas.

---

## Idiomas (português, inglês e espanhol)

O site abre no idioma do navegador do visitante: português para Brasil e Portugal, espanhol para países de língua espanhola e inglês para o resto do mundo. O visitante também pode trocar no seletor **PT / EN / ES** no topo.

- O **português** fica no `conteudo.json` (é o que você edita no painel).
- O **inglês e o espanhol** ficam no `traducoes.json`, em `"conteudo" → "en"` e `"es"`. Cada lista segue a mesma ordem do português (a 1ª arte traduzida é a 1ª arte da galeria, e assim por diante).
- Se algo não estiver traduzido, o site mostra em português. Então, ao adicionar uma arte nova, ela aparece em português para todo mundo até você adicionar a tradução.
- Preços, imagens e links vêm sempre do `conteudo.json`. Não precisa repetir nas traduções.
- Para testar um idioma: `https://doremiartz.github.io/?lang=en` (ou `?lang=es`, `?lang=pt`).

**Cuidados com o JSON:** cada item de uma lista é separado por vírgula, mas o último não leva vírgula depois. Textos ficam sempre entre aspas `" "`. Se o site mostrar "Não consegui carregar o conteúdo", quase sempre é uma vírgula ou aspas sobrando/faltando. Cole o arquivo em **jsonlint.com** para achar o erro.

**Dica para imagens:** salve em JPG com no máximo ~2000 px no lado maior. Fica nítido e carrega rápido.

---

## Ver o site no seu computador antes de publicar

O site precisa de um servidor local para ler o `conteudo.json` (abrir o `index.html` com dois cliques não funciona). Com Python instalado, abra o terminal nesta pasta e rode:

```
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.
