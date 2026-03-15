import { getSpendingForecast } from '../services/telegram-analytics.service.js';
import { buildForecastMessage } from '../formatters/message.formatter.js';
import type { CommandHandler } from '../telegram.types.js';

export const forecastCommand: CommandHandler = async (bot, ctx) => {
  await bot.sendChatAction(ctx.chatId, 'typing');

  const data = await getSpendingForecast(ctx.familyId);
  const text = buildForecastMessage(data);

  await bot.sendMessage(ctx.chatId, text, { parse_mode: 'HTML' });
};
