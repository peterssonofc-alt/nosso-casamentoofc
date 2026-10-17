// Envia os dados do seu PC (../dados.json) para a versão na nuvem.
// Uso: node migrar-dados.js https://SEU-SITE.onrender.com SENHA
const fs = require('fs'), path = require('path');
const [url, senha] = process.argv.slice(2);
if (!url || !senha) { console.log('Uso: node migrar-dados.js https://SEU-SITE.onrender.com SENHA'); process.exit(1); }
const arquivo = process.env.DADOS || path.join(__dirname, '..', 'dados.json');
const dados = fs.readFileSync(arquivo, 'utf8');
const auth = 'Basic ' + Buffer.from('casal:' + senha).toString('base64');
const base = url.replace(/\/+$/, '');
(async () => {
  const atual = await fetch(base + '/api/backup', { headers: { authorization: auth } });
  if (atual.status === 401) return console.log('Senha incorreta.');
  const hoje = await atual.json();
  const n = Object.values(hoje).reduce((a, c) => a + Object.keys(c).length, 0);
  if (n > 0) {
    fs.writeFileSync(path.join(__dirname, 'backup-nuvem-antes.json'), JSON.stringify(hoje));
    console.log('A nuvem já tinha ' + n + ' registros. Guardei uma cópia em backup-nuvem-antes.json antes de substituir.');
  }
  const r = await fetch(base + '/api/restore', { method: 'POST', headers: { authorization: auth, 'content-type': 'application/json' }, body: dados });
  console.log(r.ok ? 'Pronto! Dados enviados para a nuvem.' : 'Falhou: ' + (await r.text()));
})();
