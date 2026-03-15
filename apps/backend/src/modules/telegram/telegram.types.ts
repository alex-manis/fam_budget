import type TelegramBot from 'node-telegram-bot-api';

/** Resolved user context attached to every authenticated command invocation. */
export interface TelegramContext {
  chatId: number;
  userId: string;
  familyId: string;
  /** First active account — null when user has no accounts set up. */
  defaultAccountId: string | null;
  userName: string;
}

/** Signature for a parsed, authenticated command handler. */
export type CommandHandler = (
  bot: TelegramBot,
  ctx: TelegramContext,
  args: string[],
) => Promise<void>;
