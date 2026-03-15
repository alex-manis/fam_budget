import { addTransaction } from '../services/telegram-transaction.service.js';
import { buildAddedMessage } from '../formatters/message.formatter.js';
import type { CommandHandler } from '../telegram.types.js';

export const addCommand: CommandHandler = async (bot, ctx, args) => {
  // args: ["45", "coffee", "at", "work"]  →  amount=45, description="coffee at work"
  const [rawAmount, ...rest] = args;
  const description = rest.join(' ').trim();

  if (!rawAmount) {
    await bot.sendMessage(
      ctx.chatId,
      '➕ Usage: <code>/add [amount] [description]</code>\nExample: <code>/add 45 coffee</code>',
      { parse_mode: 'HTML' },
    );
    return;
  }

  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    await bot.sendMessage(
      ctx.chatId,
      `❌ Invalid amount: <code>${rawAmount}</code>\nPlease use a positive number, e.g. <code>/add 45 coffee</code>`,
      { parse_mode: 'HTML' },
    );
    return;
  }

  if (!ctx.defaultAccountId) {
    await bot.sendMessage(
      ctx.chatId,
      '❌ You have no bank account set up.\nPlease add an account in the FamBudget app first.',
      { parse_mode: 'HTML' },
    );
    return;
  }

  await bot.sendChatAction(ctx.chatId, 'typing');

  const { data } = await addTransaction({
    description: description || 'Manual transaction',
    amount,
    userId: ctx.userId,
    familyId: ctx.familyId,
    accountId: ctx.defaultAccountId,
  });

  await bot.sendMessage(ctx.chatId, buildAddedMessage(data), { parse_mode: 'HTML' });
};
