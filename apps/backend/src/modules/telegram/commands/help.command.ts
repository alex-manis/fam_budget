import type { CommandHandler } from '../telegram.types.js';

export const helpCommand: CommandHandler = async (bot, ctx) => {
  const msg = [
    `👋 Hello, <b>${ctx.userName}</b>!`,
    '',
    'Here are the available commands:',
    '',
    '📊 <b>/summary</b>',
    '  Monthly budget overview — income, expenses, top categories',
    '',
    '💸 <b>/spent [category]</b>',
    '  Spending for a category this month',
    '  Example: <code>/spent groceries</code>',
    '',
    '🔮 <b>/forecast</b>',
    '  3-month rolling average expense forecast',
    '',
    '➕ <b>/add [amount] [description]</b>',
    '  Add a manual expense (AI-classified automatically)',
    '  Example: <code>/add 45 coffee</code>',
  ].join('\n');

  await bot.sendMessage(ctx.chatId, msg, { parse_mode: 'HTML' });
};
