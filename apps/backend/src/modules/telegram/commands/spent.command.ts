import { getCategorySpending } from '../services/telegram-analytics.service.js';
import { buildSpentMessage } from '../formatters/message.formatter.js';
import type { CommandHandler } from '../telegram.types.js';

export const spentCommand: CommandHandler = async (bot, ctx, args) => {
  const categoryQuery = args.join(' ').trim();

  if (!categoryQuery) {
    await bot.sendMessage(
      ctx.chatId,
      '📂 Please specify a category.\nExample: <code>/spent groceries</code>',
      { parse_mode: 'HTML' },
    );
    return;
  }

  await bot.sendChatAction(ctx.chatId, 'typing');

  const data = await getCategorySpending(ctx.familyId, categoryQuery);

  if (!data) {
    await bot.sendMessage(
      ctx.chatId,
      `❌ Category "<b>${categoryQuery}</b>" not found.\n\nTry: groceries, fuel, telecom, rent, restaurants…`,
      { parse_mode: 'HTML' },
    );
    return;
  }

  await bot.sendMessage(ctx.chatId, buildSpentMessage(data), { parse_mode: 'HTML' });
};
