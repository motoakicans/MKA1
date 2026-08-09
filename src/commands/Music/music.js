import { SlashCommandBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import {
    skipTrack,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    shuffleQueue,
    setLoopMode,
    setVolume,
    seekTrack,
    removeFromQueue,
    moveInQueue,
    clearQueue,
    setTwentyFourSeven,
    leaveVoiceChannel,
    replyMusicSuccess,
} from '../../services/music/musicActions.js';
import { deferMusicCommand } from '../../services/music/prefixSupport.js';

export default {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('şarkı')
        .setDescription('Oynatma, kuyruk ve ses oturumu ayarlarını yönetin')
        .addSubcommand((sub) =>
            sub.setName('pause').setDescription('Müziği duraklatır'),
        )
        .addSubcommand((sub) =>
            sub.setName('resume').setDescription('Duraklatılan müziği devam ettirir'),
        )
        .addSubcommand((sub) =>
            sub.setName('skip').setDescription('Çalan mevcut parçayı geçer'),
        )
        .addSubcommand((sub) =>
            sub.setName('stop').setDescription('Müziği durdurur ve kuyruğu temizler'),
        )
        .addSubcommand((sub) =>
            sub.setName('shuffle').setDescription('Kuyruktaki şarkıları karıştırır'),
        )
        .addSubcommand((sub) =>
            sub
                .setName('loop')
                .setDescription('Döngü modunu ayarlar')
                .addStringOption((opt) =>
                    opt
                        .setName('mode')
                        .setDescription('Döngü modu')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Kapalı', value: 'none' },
                            { name: 'Parça', value: 'track' },
                            { name: 'Kuyruk', value: 'queue' },
                        ),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName('volume')
                .setDescription('Oynatma ses seviyesini ayarlar')
                .addIntegerOption((opt) =>
                    opt.setName('level').setDescription('Ses Seviyesi (0-100)').setRequired(true).setMinValue(0).setMaxValue(100),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName('seek')
                .setDescription('Mevcut parçada belirli bir süreye gider')
                .addIntegerOption((opt) =>
                    opt.setName('seconds').setDescription('Saniye cinsinden konum').setRequired(true).setMinValue(0),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName('remove')
                .setDescription('Kuyruktan bir parça kaldırır')
                .addIntegerOption((opt) =>
                    opt.setName('position').setDescription('Kuyruktaki sıra numarası').setRequired(true).setMinValue(1),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName('move')
                .setDescription('Kuyruktaki bir parçanın yerini değiştirir')
                .addIntegerOption((opt) =>
                    opt.setName('from').setDescription('Mevcut sıra numarası').setRequired(true).setMinValue(1),
                )
                .addIntegerOption((opt) =>
                    opt.setName('to').setDescription('Yeni sıra numarası').setRequired(true).setMinValue(1),
                ),
        )
        .addSubcommand((sub) =>
            sub.setName('clear').setDescription('Kuyruğu tamamen temizler'),
        )
        .addSubcommand((sub) =>
            sub.setName('leave').setDescription('Botu ses kanalından çıkartır'),
        )
        .addSubcommand((sub) =>
            sub
                .setName('247')
                .setDescription('7/24 modunu açar/kapatır (boşta kalındığında kanalda kalır)')
                .addBooleanOption((opt) =>
                    opt.setName('enabled').setDescription('7/24 modunu etkinleştir veya devre dışı bırak').setRequired(true),
                ),
        ),

    async execute(interaction, config, client) {
        await deferMusicCommand(interaction);
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'pause': {
                const embed = await pausePlayback(client, interaction);
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case 'resume': {
                const embed = await resumePlayback(client, interaction);
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case 'skip': {
                const embed = await skipTrack(client, interaction);
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case 'stop': {
                const embed = await stopPlayback(client, interaction);
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case 'shuffle': {
                const embed = await shuffleQueue(client, interaction);
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case 'loop': {
                const embed = await setLoopMode(client, interaction, interaction.options.getString('mode'));
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case 'volume': {
                const embed = await setVolume(client, interaction, interaction.options.getInteger('level'));
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case 'seek': {
                const embed = await seekTrack(client, interaction, interaction.options.getInteger('seconds'));
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case 'remove': {
                const embed = await removeFromQueue(client, interaction, interaction.options.getInteger('position'));
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case 'move': {
                const embed = await moveInQueue(
                    client,
                    interaction,
                    interaction.options.getInteger('from'),
                    interaction.options.getInteger('to'),
                );
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case 'clear': {
                const embed = await clearQueue(client, interaction);
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case 'leave': {
                const embed = await leaveVoiceChannel(client, interaction);
                await replyMusicSuccess(interaction, embed);
                break;
            }
            case '247': {
                const embed = await setTwentyFourSeven(client, interaction, interaction.options.getBoolean('enabled'));
                await replyMusicSuccess(interaction, embed);
                break;
            }
            default:
                await InteractionHelper.safeEditReply(interaction, {
                    content: 'Bilinmeyen müzik alt komutu.',
                });
        }
    },
};
