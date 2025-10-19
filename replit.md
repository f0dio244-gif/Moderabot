# Discord Moderation Bot

## Overview
A Discord moderation bot built with Node.js and discord.js. Uses prefix-based commands (%) for moderation tasks including warnings, kicks, bans, and interactive warning management via dropdown menus. Includes an Express keepalive server for deployment on Render.

## Current State
- **Status**: Development complete, ready for deployment
- **Last Updated**: October 19, 2025
- **Commands**: All core moderation commands implemented
- **Storage**: In-memory warning system (resets on restart)

## Features
- **Prefix Commands**: All commands use the `%` prefix
- **Moderation Tools**: warn, kick, ban, unban
- **Interactive Warnings**: Dropdown menu for removing specific warnings
- **Keepalive Server**: Express server on port 10000 for Render deployment
- **Permission Checks**: Commands require appropriate Discord permissions

## Project Architecture

### Main Files
- `bot.js` - Main bot file containing Discord client, Express server, and all command logic
- `.env` - Environment variables (not committed to git)
- `.env.example` - Template for environment variables
- `package.json` - Node.js dependencies

### Dependencies
- **discord.js** - Discord API wrapper
- **express** - Web server for keepalive
- **dotenv** - Environment variable management

### Commands Implemented
1. `%help` - Display all available commands
2. `%warn @user reason` - Add a warning to a user
3. `%warnings @user` - View warnings with interactive removal dropdown
4. `%mute @user duration reason` - Mute (timeout) a user for a specified duration
5. `%unmute @user` - Unmute (remove timeout from) a user
6. `%kick @user reason` - Kick a user from the server
7. `%ban @user reason` - Ban a user from the server
8. `%unban @user` - Unban a user by mention or ID

### Warning System
- **Storage**: In-memory Map structure (resets on bot restart)
- **Structure**: User ID → Array of warning objects
- **Warning Object**: Contains ID, reason, timestamp, moderator
- **Interactive Removal**: Dropdown menu allows moderators to select and remove specific warnings

## Deployment on Render

### Environment Variables Required
- `DISCORD_BOT_TOKEN` - Your Discord bot token from Discord Developer Portal
- `PORT` - Port for Express server (Render provides this, defaults to 10000)

### Start Command
```bash
node bot.js
```

### Setup Steps
1. Create a bot in Discord Developer Portal
2. Enable required intents: Server Members, Message Content, Guilds
3. Copy bot token and set as DISCORD_BOT_TOKEN environment variable
4. Deploy to Render as a Node.js service
5. Invite bot to your Discord server with proper permissions

### Required Bot Permissions
- Send Messages
- Embed Links
- Kick Members
- Ban Members
- Moderate Members (for timeout features)
- Read Message History

## Future Enhancements
- Persistent storage (JSON files or database)
- Moderation logging channel
- Role-based permission system
- Mute/unmute commands with timeouts
- Auto-moderation features
- Warning expiration system
