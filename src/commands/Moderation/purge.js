import { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField, ChannelType, MessageFlags } from 'discord.js';
import { createEmbed, successEmbed } from '../../utils/embeds.js';
import { logEvent } from '../../utils/moderation.js';
import { logger } from '../../utils/logger.js';
import { getColor } from '../../config/bot.js';

import { InteractionHelper } from '../../utils/interactionHelper.js';
import { replyUserError, ErrorTypes } from '../../utils/errorHandler.js';
export default {
    data: new SlashCommandBuilder()
    .setName("temizle")
    .setDescription("Belirli miktarda mesajı siler")
    .addIntegerOption((option) =>
      option
        .setName("miktar")
        .setDescription("Mesaj sayısı (1-100)")
        .setRequired(true),
    )
.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  category: "moderation",
  abuseProtection: { maxAttempts: 5, windowMs: 60_000 },

  async execute(interaction, config, client) {
    const deferSuccess = await InteractionHelper.safeDefer(interaction, {
      flags: MessageFlags.Ephemeral,
    });
    if (!deferSuccess) {
      logger.warn(`Temizle komutu erteleme başarısız oldu`, {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        commandName: 'temizle'
      });
      return;
    }

    const amount = interaction.options.getInteger("miktar");
    const channel = interaction.channel;

    if (amount < 1 || amount > 100)
      return await replyUserError(interaction, { type: ErrorTypes.VALIDATION, message: 'Lütfen 1 ile 100 arasında bir sayı belirtin.' });

    try {
      const fetched = await channel.messages.fetch({ limit: amount });
      const deleted = await channel.bulkDelete(fetched, true);
      const deletedCount = deleted.size;

      await logEvent({
        client,
        guild: interaction.guild,
        event: {
          action: "Mesajlar Temizlendi",
          target: `${channel} (${deletedCount} mesaj)`,
          executor: `${interaction.user.tag} (${interaction.user.id})`,
          reason: `${deletedCount} mesaj silindi`,
          metadata: {
            channelId: channel.id,
            messageCount: deletedCount,
            requestedAmount: amount,
            moderatorId: interaction.user.id
          }
        }
      });

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [
          successEmbed(
            "Mesajlar Temizlendi",
            `${channel} kanalında ${deletedCount} mesaj silindi.`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });

      setTimeout(() => {
        interaction.deleteReply().catch(err => 
          logger.debug('Temizle yanıtı otomatik silinemedi:', err)
        );
      }, 3000);
    } catch (error) {
      logger.error('Temizle komutu hatası:', error);
      await replyUserError(interaction, { type: ErrorTypes.UNKNOWN, message: 'Mesaj silinirken beklenmeyen bir hata oluştu. Not: 14 günden eski mesajlar toplu olarak silinemez.' });
    }
  }
};
