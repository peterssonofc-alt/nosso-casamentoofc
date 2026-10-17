# Nosso Casamento no Netlify (grátis)

O Netlify serve a página e uma função cuida dos dados, que ficam guardados no Netlify Blobs (incluído no plano grátis). O acesso tem senha (usuário `casal`). Não precisa de cartão.

## 1. Repositório novo no GitHub

1. Em github.com, clique em **New repository**.
2. Nome: `nosso-casamento-netlify`. Marque **Private**. Clique em **Create repository**.
3. Clique em **uploading an existing file**.
4. Abra a pasta `nuvem-netlify` e arraste **tudo o que está dentro dela**, incluindo as pastas `netlify` e `public`: `app.html`, `build.js`, `shim.html`, `netlify.toml`, `package.json`, `migrar-dados.js`, `netlify` e `public`.
5. Clique em **Commit changes**.

## 2. Site no Netlify

1. Entre em app.netlify.com (pode ser com o GitHub).
2. Clique em **Add new site → Import an existing project → GitHub** e escolha `nosso-casamento-netlify`. Autorize o acesso se pedir.
3. Os campos de build vêm do arquivo `netlify.toml`, não precisa mudar nada.
4. Em **Add environment variables**, crie **APP_PASSWORD** com a senha que vocês dois vão usar. Use uma senha longa.
5. Clique em **Deploy**. Aguarde terminar (1 a 2 minutos).
6. O endereço aparece no topo (`https://algo-aleatorio.netlify.app`). Para trocar o nome, vá em **Site configuration → Change site name**.

Ao abrir o endereço, o navegador pede usuário e senha: usuário `casal` e a senha que você definiu.

## 3. Levar os dados do seu PC

Na pasta `nuvem-netlify`, abra o PowerShell e rode (troque o endereço e a senha):

```
node migrar-dados.js https://SEU-SITE.netlify.app SUA-SENHA
```

## Backup

Logado no site, acesse `/api/backup` (por exemplo `https://SEU-SITE.netlify.app/api/backup`) para baixar todos os dados.

## Atualizar depois

Envie o `app.html` novo ao GitHub (**Add file → Upload files**). O Netlify publica sozinho.
