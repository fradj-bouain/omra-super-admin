const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Angular application builder : soit dist/<app>/browser, soit dist/<app> (selon version CLI)
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
  console.log(`[server] Static depuis ${distPath} — http://0.0.0.0:${PORT}`);
});
