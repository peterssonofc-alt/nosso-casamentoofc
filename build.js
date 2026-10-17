// Gera netlify/functions/page.mjs (a página completa) a partir de app.html + shim.html.
// O Netlify roda isto no deploy: "node build.js".
const fs = require('fs'), path = require('path');
const shim = fs.readFileSync(path.join(__dirname, 'shim.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8');
const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow">'
  + '<style>html{color-scheme:light dark}body{margin:0}</style></head><body>' + shim + app + '</body></html>';
fs.mkdirSync(path.join(__dirname, 'netlify', 'functions'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'netlify', 'functions', 'page.mjs'), 'export default ' + JSON.stringify(html) + ';\n');
console.log('page.mjs gerado (' + html.length + ' caracteres)');
