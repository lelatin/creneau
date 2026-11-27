// Lance l'appli avec une base de démo séparée (data/demo.db) : npm run demo:serve
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.DB_PATH ||= path.join(root, 'data', 'demo.db');
process.chdir(root);
await import('./demo.js');
const { createServer } = await import('../src/server.js');
const port = Number(process.env.PORT || 3000);
createServer().listen(port, () => console.log(`Démo sur http://localhost:${port}/camille-yoga`));
