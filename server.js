import { config } from './config/index.js';
import { createApp } from './app.js';
import { getDb } from './db/connection.js';
import { migrate } from './db/migrate.js';

migrate(getDb());
const app = createApp();

app.listen(config.port, () => {
  console.log(JSON.stringify({
    service: 'sarkari-saathi-api',
    port: config.port,
    env: config.nodeEnv,
    message: `Listening on http://localhost:${config.port}`,
  }));
});
