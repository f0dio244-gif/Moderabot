require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ]
});

const app = express();
const PORT = process.env.PORT || 5000;
const PREFIX = '%';

const warnings = new Map();

let warningCounter = 0;

function generateWarningId() {
  warningCounter++;
  return `warn-${warningCounter}`;
}

client.once('ready', () => {
  console.log(`✅ Bot is online! Logged in as ${client.user.tag}`);
  console.log(`✅ Serving ${client.guilds.cache.size} servers`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'help') {
    const helpEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📋 Moderation Bot Commands')
      .setDescription('All commands use the `%` prefix')
      .addFields(
        { name: '%help', value: 'Shows this help message', inline: false },
        { name: '%warn @user reason', value: 'Warns a user and stores the warning', inline: false },
        { name: '%warnings @user', value: 'Shows all warnings for a user with interactive removal', inline: false },
        { name: '%kick @user reason', value: 'Kicks a user from the server', inline: false },
        { name: '%ban @user reason', value: 'Bans a user from the server', inline: false },
        { name: '%unban @user', value: 'Unbans a user by mention or ID', inline: false }
      )
      .setFooter({ text: 'Moderation Bot | Prefix: %' })
      .setTimestamp();

    return message.reply({ embeds: [helpEmbed] });
  }

  if (command === 'warn') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ You do not have permission to use this command.');
      return message.reply({ embeds: [errorEmbed] });
    }

    const user = message.mentions.users.first();
    if (!user) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ Please mention a user to warn.\n\n**Usage:** `%warn @user reason`');
      return message.reply({ embeds: [errorEmbed] });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    if (!warnings.has(user.id)) {
      warnings.set(user.id, []);
    }

    const warningId = generateWarningId();
    const warning = {
      id: warningId,
      reason: reason,
      timestamp: new Date(),
      moderator: message.author.tag
    };

    warnings.get(user.id).push(warning);

    const warnEmbed = new EmbedBuilder()
      .setColor('#ffcc00')
      .setTitle('⚠️ User Warned')
      .setDescription(`${user} has been warned.`)
      .addFields(
        { name: 'Reason', value: reason, inline: false },
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Warning ID', value: warningId, inline: true }
      )
      .setTimestamp();

    return message.reply({ embeds: [warnEmbed] });
  }

  if (command === 'warnings') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ You do not have permission to view warnings.');
      return message.reply({ embeds: [errorEmbed] });
    }

    const user = message.mentions.users.first();
    if (!user) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ Please mention a user.\n\n**Usage:** `%warnings @user`');
      return message.reply({ embeds: [errorEmbed] });
    }

    const userWarnings = warnings.get(user.id) || [];

    if (userWarnings.length === 0) {
      const infoEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setDescription(`ℹ️ No warnings found for ${user.tag}.`);
      return message.reply({ embeds: [infoEmbed] });
    }

    const warningsEmbed = new EmbedBuilder()
      .setColor('#ff6600')
      .setTitle(`⚠️ Warnings for ${user.tag}`)
      .setDescription(`Total warnings: ${userWarnings.length}`)
      .setTimestamp();

    userWarnings.forEach((warn, index) => {
      warningsEmbed.addFields({
        name: `Warning ${index + 1} - ID: ${warn.id}`,
        value: `**Reason:** ${warn.reason}\n**Moderator:** ${warn.moderator}\n**Date:** ${warn.timestamp.toLocaleDateString()}`,
        inline: false
      });
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`remove-warning-${user.id}`)
      .setPlaceholder('Select a warning to remove')
      .addOptions(
        userWarnings.map((warn, index) => ({
          label: `Warning ${index + 1}: ${warn.reason.substring(0, 50)}`,
          description: `ID: ${warn.id} | By: ${warn.moderator}`,
          value: warn.id
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return message.reply({ embeds: [warningsEmbed], components: [row] });
  }

  if (command === 'kick') {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ You do not have permission to kick members.');
      return message.reply({ embeds: [errorEmbed] });
    }

    const user = message.mentions.users.first();
    if (!user) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ Please mention a user to kick.\n\n**Usage:** `%kick @user reason`');
      return message.reply({ embeds: [errorEmbed] });
    }

    const member = message.guild.members.cache.get(user.id);
    if (!member) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ User not found in this server.');
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!member.kickable) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ I cannot kick this user. They may have higher permissions than me.');
      return message.reply({ embeds: [errorEmbed] });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.kick(reason);
      
      const kickEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('👢 User Kicked')
        .setDescription(`${user.tag} has been kicked from the server.`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setTimestamp();

      return message.reply({ embeds: [kickEmbed] });
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ Failed to kick the user. Please check my permissions.');
      return message.reply({ embeds: [errorEmbed] });
    }
  }

  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ You do not have permission to ban members.');
      return message.reply({ embeds: [errorEmbed] });
    }

    const user = message.mentions.users.first();
    if (!user) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ Please mention a user to ban.\n\n**Usage:** `%ban @user reason`');
      return message.reply({ embeds: [errorEmbed] });
    }

    const member = message.guild.members.cache.get(user.id);
    if (member && !member.bannable) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ I cannot ban this user. They may have higher permissions than me.');
      return message.reply({ embeds: [errorEmbed] });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await message.guild.members.ban(user, { reason });
      
      const banEmbed = new EmbedBuilder()
        .setColor('#990000')
        .setTitle('🔨 User Banned')
        .setDescription(`${user.tag} has been banned from the server.`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setTimestamp();

      return message.reply({ embeds: [banEmbed] });
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ Failed to ban the user. Please check my permissions.');
      return message.reply({ embeds: [errorEmbed] });
    }
  }

  if (command === 'unban') {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ You do not have permission to unban members.');
      return message.reply({ embeds: [errorEmbed] });
    }

    const userId = args[0];
    if (!userId) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ Please provide a user ID or mention.\n\n**Usage:** `%unban @user` or `%unban userId`');
      return message.reply({ embeds: [errorEmbed] });
    }

    const id = userId.replace(/[<@!>]/g, '');

    try {
      await message.guild.members.unban(id);
      
      const unbanEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ User Unbanned')
        .setDescription(`User with ID ${id} has been unbanned.`)
        .addFields(
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setTimestamp();

      return message.reply({ embeds: [unbanEmbed] });
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ Failed to unban the user. Make sure they are banned and the ID is correct.');
      return message.reply({ embeds: [errorEmbed] });
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId.startsWith('remove-warning-')) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ You do not have permission to remove warnings.');
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const userId = interaction.customId.replace('remove-warning-', '');
    const warningId = interaction.values[0];

    const userWarnings = warnings.get(userId);
    if (!userWarnings) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ No warnings found for this user.');
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const warningIndex = userWarnings.findIndex(w => w.id === warningId);
    if (warningIndex === -1) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ Warning not found.');
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const removedWarning = userWarnings.splice(warningIndex, 1)[0];

    if (userWarnings.length === 0) {
      warnings.delete(userId);
    }

    await interaction.deferUpdate();
    await interaction.message.delete();

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Warning Removed')
      .setDescription(`Warning ID ${warningId} has been successfully removed.`)
      .addFields(
        { name: 'Removed Reason', value: removedWarning.reason, inline: false },
        { name: 'Removed By', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.followUp({ embeds: [successEmbed] });
  }
});

app.get('/', (req, res) => {
  res.send('Moderation Bot is running.');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    bot: client.user ? client.user.tag : 'Not connected'
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Express server is running on port ${PORT}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
