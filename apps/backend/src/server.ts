import { createApp } from './app.js';
import { env } from './config/env.js';
import { initBot } from './modules/telegram/bot.module.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  // Start the bot after the HTTP server is ready
  initBot();
});
