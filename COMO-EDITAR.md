# Site DoremiArtz: como publicar e editar

## O que tem nesta pasta

| Arquivo | Para que serve | Precisa mexer? |
|---|---|---|
| `conteudo.json` | **Todos os textos, preços, imagens, links e o status das comissões** | Sim, é aqui que você edita |
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
  "tipo": "Flat Colors · Fullbody",
  "descricao": "O que aparece na imagem, para quem usa leitor de tela"
}
```

Artes deitadas (mais largas que altas) ocupam a linha inteira automaticamente.

**Cuidados com o JSON:** cada item de uma lista é separado por vírgula, mas o último não leva vírgula depois. Textos ficam sempre entre aspas `" "`. Se o site mostrar "Não consegui carregar o conteúdo", quase sempre é uma vírgula ou aspas sobrando/faltando. Cole o arquivo em **jsonlint.com** para achar o erro.

**Dica para imagens:** salve em JPG com no máximo ~2000 px no lado maior. Fica nítido e carrega rápido.

---

## Ver o site no seu computador antes de publicar

O site precisa de um servidor local para ler o `conteudo.json` (abrir o `index.html` com dois cliques não funciona). Com Python instalado, abra o terminal nesta pasta e rode:

```
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.
