import { prisma } from '../../../infrastructure/prisma/prisma.client.js';
import type { TelegramContext } from '../telegram.types.js';

/**
 * Resolves a Telegram chat ID to a fully-populated user context.
 *
 * Returns null when:
 *  - no User has this telegramChatId (account not linked yet)
 *  - the user is not a member of any family
 */
export const resolveUserContext = async (chatId: number): Promise<TelegramContext | null> => {
  const user = await prisma.user.findUnique({
    where: { telegramChatId: String(chatId) },
    select: {
      id: true,
      name: true,
      families: {
        select: { familyId: true },
        take: 1,
      },
      accounts: {
        where: { isActive: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user || user.families.length === 0) return null;

  const familyMember = user.families[0];
  if (!familyMember) return null;

  return {
    chatId,
    userId: user.id,
    familyId: familyMember.familyId,
    defaultAccountId: user.accounts[0]?.id ?? null,
    userName: user.name,
  };
};
