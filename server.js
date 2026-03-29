const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

const onRailway = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY_SERVICE_ID
);

/** Railway injecte PORT : il faut l’utiliser tel quel. Ne pas retomber sur 8080 en prod. */
function resolveListenPort() {
  const raw = process.env.PORT;
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const p = parseInt(String(raw).trim(), 10);
    if (Number.isFinite(p) && p > 0) {
      return p;
    }
    console.error('[server] PORT invalide:', raw);
    process.exit(1);
  }
  if (onRailway) {
    console.error(
      '[server] Variable PORT absente sur Railway. Vérifiez que le service est de type « Web » (pas Worker).'
    );
    process.exit(1);
  }
  return 8080;
}

const PORT = resolveListenPort();

function resolveDistDir() {
  const root = path.join(__dirname, 'dist', 'admin-omra');
  const browser = path.join(root, 'browser');
  if (fs.existsSync(path.join(browser, 'index.html'))) {
    return browser;
  }
  if (fs.existsSync(path.join(root, 'index.html'))) {
    return root;
  }
  console.error(
    '[server] Aucun index.html trouvé. Attendu : dist/admin-omra/browser/ ou dist/admin-omra/. Lancez « npm run build » avant le démarrage.'
  );
  process.exit(1);
}

const distPath = resolveDistDir();
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[server] OK — static: ${distPath} | écoute 0.0.0.0:${PORT} | env.PORT=${JSON.stringify(process.env.PORT)}`
  );
});
