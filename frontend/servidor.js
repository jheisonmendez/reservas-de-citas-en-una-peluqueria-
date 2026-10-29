// ============================================================
//  FRONTEND WEB - servidor estatico (sin dependencias)
//  Sirve los archivos del panel del administrador en el puerto 5173.
//  No contiene logica de negocio: solo entrega HTML, CSS y JS.
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');

const PUERTO = Number(process.env.PORT || 5173);
const RAIZ = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const servidor = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let ruta = path.join(RAIZ, url === '/' ? 'index.html' : url);
  ruta = path.resolve(ruta);

  // Evita salirse de la carpeta del proyecto
  if (!ruta.startsWith(path.resolve(RAIZ))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Prohibido');
  }

  if (fs.existsSync(ruta) && fs.statSync(ruta).isDirectory()) {
    ruta = path.join(ruta, 'index.html');
  }

  if (!fs.existsSync(ruta)) {
    console.log(`404 ${req.method} ${url}`);
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<h1>404 - Recurso no encontrado</h1>');
  }

  const ext = path.extname(ruta).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(ruta).pipe(res);
  console.log(`${new Date().toISOString()}  ${req.method} ${url}`);
});

servidor.listen(PUERTO, () => {
  console.log('-------------------------------------------------');
  console.log('  FRONTEND WEB (administrador)');
  console.log('  Inicio:        http://localhost:' + PUERTO + '/');
  console.log('  Panel web:     http://localhost:' + PUERTO + '/web/');
  console.log('  Conectado a:   http://localhost:4000/api (backend)');
  console.log('-------------------------------------------------');
});
