# Neon MCP Server Setup for Cursor

## Overview

This guide will help you integrate the Neon MCP (Model Context Protocol) server into Cursor, enabling AI-assisted database queries and management for your Neon PostgreSQL database.

## Prerequisites

- Cursor IDE installed
- Neon account with database access
- Neon API Key (required for MCP server)
- Node.js 18+ installed (for local MCP server option)

## Your Current Database Connection

**Connection String:**
```
postgresql://neondb_owner:npg_J8CabeXrt50d@ep-mute-thunder-ahui2n87-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Database Details:**
- Database: `neondb`
- Host: `ep-mute-thunder-ahui2n87-pooler.c-3.us-east-1.aws.neon.tech`
- Region: `us-east-1` (AWS)
- User: `neondb_owner`

## Setup Options

You have two options for connecting to Neon's MCP server:

### Option 1: Neon's Managed MCP Server (Recommended - Easiest)

This method uses Neon's hosted MCP server with OAuth authentication.

#### Steps:

1. **Open Cursor Settings**:
   - Navigate to Cursor Settings
   - Go to the Features section
   - Select MCP

2. **Add Neon MCP Server**:
   - Click the "+ Add New MCP Server" button
   - Configure with:
     - **Name**: `neon`
     - **Type**: `SSE` (Server-Sent Events)
     - **URL**: `https://mcp.neon.tech/mcp`

3. **Save and Refresh**:
   - Save the configuration
   - Click the refresh button in the MCP toolbar

4. **Authorize Access**:
   - An OAuth window will open in your browser
   - Follow the prompts to authorize Cursor to access your Neon account

✅ **Advantages:**
- No API key needed
- OAuth-based authentication
- Managed by Neon
- Easy setup

---

### Option 2: Local MCP Server (More Control)

This method runs the Neon MCP server locally using npx and requires a Neon API key.

#### Step 1: Get Your Neon API Key

1. Log in to your [Neon Console](https://console.neon.tech/)
2. Navigate to your profile settings
3. Go to API Keys section
4. Generate a new API key
5. **Copy and save the API key** (you won't be able to see it again)

#### Step 2: Configure Cursor MCP Settings

The configuration has already been added to `.cursor/mcp_settings.json`:

```json
{
  "mcpServers": {
    "galileo_mcp_server": {
      "url": "https://api.galileo.ai/mcp/http/mcp",
      "headers": {
        "Galileo-API-Key": "${GALILEO_API_KEY}",
        "Accept": "text/event-stream"
      }
    },
    "neon": {
      "command": "npx",
      "args": [
        "-y",
        "@neondatabase/mcp-server-neon",
        "start",
        "${NEON_API_KEY}"
      ]
    }
  }
}
```

#### Step 3: Set Environment Variable

Add your Neon API key to your environment:

**For local development** (`.env.local`):
```bash
NEON_API_KEY=your_neon_api_key_here
```

**For Cursor** (system environment or Cursor's environment):
- macOS/Linux: Add to `~/.zshrc` or `~/.bashrc`:
  ```bash
  export NEON_API_KEY=your_neon_api_key_here
  ```
- Windows: Add to System Environment Variables

#### Step 4: Restart Cursor

**Completely restart Cursor** (not just reload window) for the MCP server to be recognized.

✅ **Advantages:**
- More control over the connection
- Works offline (after initial setup)
- Can use environment variables for security

---

## Verification

After setup, test the connection with natural language prompts in Cursor:

```
List all my Neon databases
Show me the tables in my neondb database
What's the schema of my neondb database?
```

## Available Commands & Examples

Once configured, you can use natural language prompts to interact with your Neon database:

### Database Information

```
List all my Neon projects
Show me all databases in my project
What tables are in my neondb database?
Describe the schema of the User table
```

### Query Operations

```
Query my neondb database: SELECT COUNT(*) FROM users
Show me the top 10 users by created_at
What's the average consciousness level across all agents?
Run this SQL query: SELECT * FROM agents WHERE consciousness_level > 3
```

### Schema Operations

```
Show me the Prisma schema for my database
What are the relationships between tables?
List all indexes in my database
```

### Data Analysis

```
Analyze my database usage
What's the size of my neondb database?
Show me database connection statistics
```

## Project-Specific Context

### Current Database Setup

Your Planetary Agents project uses:

- **Database**: Neon PostgreSQL (`neondb`)
- **Connection**: Pooled connection via PgBouncer
- **Prisma**: Schema management via `prisma/schema.prisma`
- **Region**: AWS us-east-1

### Environment Variables

Your project already has these database-related variables:

```bash
# Primary connection (Prisma Accelerate)
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=...

# Direct pooled connection
POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_J8CabeXrt50d@ep-mute-thunder-ahui2n87-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true

# Direct non-pooled (migrations)
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_J8CabeXrt50d@ep-mute-thunder-ahui2n87.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Useful Commands for This Project

```
Show me all agents in my database
What's the consciousness level distribution across agents?
Query: SELECT name, consciousness_level, dominant_element FROM agents ORDER BY consciousness_level DESC LIMIT 10
Show me the Prisma schema
What tables store agent interactions?
```

## Security Best Practices

1. **Protect Your API Key**: 
   - Never commit `mcp_settings.json` with actual API keys to version control
   - Use environment variables (already configured)
   - The current setup uses `${NEON_API_KEY}` placeholder

2. **Database Access**:
   - The MCP server uses read-only queries by default
   - Review any write operations before confirming
   - Monitor your Neon dashboard for unexpected activity

3. **Connection String Security**:
   - Your connection string contains credentials
   - Keep it secure and never share publicly
   - Rotate passwords periodically in Neon console

## Troubleshooting

### MCP Server Not Appearing

1. **Check Configuration File**:
   - Verify `~/.cursor/mcp_settings.json` exists and has correct JSON syntax
   - For local server: Ensure `NEON_API_KEY` environment variable is set

2. **Restart Cursor**:
   - Completely quit and restart Cursor (not just reload window)
   - Check Cursor's developer console for MCP errors

3. **Verify Node.js**:
   - For local server: Ensure Node.js 18+ is installed
   - Test: `node --version` should show v18 or higher

### API Key Issues

If you get authentication errors:

1. **Verify API Key**:
   - Check that the key is correct in your environment
   - Ensure no extra spaces or characters
   - Regenerate key in Neon console if needed

2. **Environment Variable**:
   - Verify `NEON_API_KEY` is set: `echo $NEON_API_KEY`
   - Restart terminal/Cursor after setting environment variable

### Connection Errors

If queries fail:

1. **Check Database Status**:
   - Verify database is active in Neon console
   - Check if database has auto-slept (will wake on first query)

2. **Connection String**:
   - Verify connection string is correct
   - Test connection with `psql` or Prisma Studio

3. **Network Issues**:
   - Check firewall settings
   - Verify SSL mode is set correctly (`sslmode=require`)

## Additional Resources

- [Neon MCP Server Documentation](https://neon.com/docs/ai/neon-mcp-server)
- [Get Started with Cursor and Neon Postgres MCP Server](https://neon.com/guides/cursor-mcp-neon)
- [Neon API Documentation](https://neon.tech/docs/api)
- [Cursor MCP Documentation](https://docs.cursor.com/mcp)
- [Neon MCP Server GitHub](https://github.com/neondatabase/mcp-server-neon)

## Quick Start Checklist

### For Managed Server (Option 1):
- [ ] Open Cursor Settings → Features → MCP
- [ ] Add new MCP server: Name `neon`, Type `SSE`, URL `https://mcp.neon.tech/mcp`
- [ ] Save and refresh MCP toolbar
- [ ] Authorize via OAuth in browser
- [ ] Test with: `List all my Neon databases`

### For Local Server (Option 2):
- [ ] Get Neon API key from console.neon.tech
- [ ] Set `NEON_API_KEY` environment variable
- [ ] Verify `.cursor/mcp_settings.json` has neon configuration
- [ ] Completely restart Cursor
- [ ] Test with: `List all my Neon databases`

---

**Setup Date**: January 2025  
**Configuration File**: `~/.cursor/mcp_settings.json`  
**Database**: `neondb` on Neon PostgreSQL  
**Status**: Ready for configuration

