---
description: How to connect to the various databases (Docker/PostgreSQL) in the VPS
---
# Database Connections (VPS Hostinger)

## Overview
The main database engine for all Chatbots and n8n instances is a single PostgreSQL container running on the Hostinger VPS (IP `31.97.31.53`).

## Credentials
To connect to the database from any PM2 Node.js process (like `ChatBotImprenta`, `MuniOran`), you must use the internal Docker mapping or host binding `127.0.0.1:5432`.

### Known Connection Strings
The credentials for each bot are usually defined as `DATABASE_URL` in their respective `.env` files located at `/var/www/[BotFolder]/.env`.

1. **MuniOran (Este proyecto):**
   - Extraída de `/var/www/MuniOran/.env`
   - Formato: `postgresql://[user]:[password]@127.0.0.1:5432/munioran_chatbot`

2. **CopyShow (ChatBotImprenta):**
   - Extraída de `/var/www/ChatBotImprenta/.env`
   - Formato: `postgresql://user:password@localhost:5432/copyshow_chatbot`

## How to extract credentials on the fly
If you ever lose the precise password and need to connect manually (e.g., via DBeaver or PgAdmin), run the following command on the server via SSH:
```bash
cat /var/www/MuniOran/.env | grep DATABASE_URL
```
*(This returns the raw connection string with the master password).*

## Adding a new Database for a new Bot
1. Connect via SSH to the VPS: `ssh root@31.97.31.53` (Pass: `02177123Im.root`)
2. Enter the PostgreSQL container: `docker exec -it evolution_postgres psql -U postgres`
3. Run: `CREATE DATABASE my_new_bot_db;`
4. Use the new DB name in the connection string of your `.env` file.
