# Render MCP Quick Start Guide

**Status**: ✅ Configured & Tested  
**API Key**: Configured  
**Connection**: ✅ Working

## ✅ Setup Complete

Your Render MCP server is fully configured and tested:

- ✅ MCP configuration file: `.cursor/mcp_settings.json`
- ✅ API key configured and validated
- ✅ Server connectivity confirmed
- ✅ Ready to use in Cursor

## 🚀 Using Render MCP in Cursor

### Step 1: Restart Cursor

After configuration, **completely restart Cursor** to load the MCP server.

### Step 2: Set Your Workspace

The first time you use Render MCP, you need to set your active workspace:

```
Set my Render workspace to [YOUR_WORKSPACE_NAME]
```

If you don't know your workspace name, ask:

```
List all my Render workspaces
```

### Step 3: Start Using It!

Once your workspace is set, you can use natural language prompts:

#### Service Management

```
List my Render services
Show details for service planetary-agents-backend
Create a new web service using https://github.com/render-examples/flask-hello-world
```

#### Database Operations

```
List all my Render databases
Create a new database named user-db with 5 GB storage
Query my database for the top 10 users by signup date
Run this SQL query on my production database: SELECT COUNT(*) FROM users
```

#### Monitoring & Logs

```
Pull the most recent error-level logs for my API service
What was the busiest traffic day for my service this month?
Show me CPU usage for my web service over the last 24 hours
What did my service's autoscaling behavior look like yesterday?
```

#### Metrics & Analytics

```
Using my Render database, tell me which items were the most frequently bought together
Query my read replica for daily signup counts for the last 30 days
Why isn't my site at example.onrender.com working?
```

#### Environment Variables

```
Update environment variables for planetary-agents-backend
Show current environment variables for my API service
```

## 🧪 Testing

### Test MCP Connectivity

```bash
RENDER_API_KEY=rnd_ubGHNTW25Pi62L8AxxmxTb2kKLps yarn render:test-mcp
```

**Expected Output:**
```
✅ MCP Configuration: Valid
✅ Connection: Success
⚠️  Tools: Requires workspace context
```

### Validate Render Configurations

```bash
yarn render:validate
```

## 📋 Available MCP Tools

The Render MCP server provides tools for:

- **Workspaces**: List, set, fetch details
- **Services**: Create, list, retrieve details, update env vars
- **Deploys**: List history, get details
- **Logs**: List with filters, list label values
- **Metrics**: CPU/memory, instance count, response times, bandwidth
- **PostgreSQL**: Create, list, query databases
- **Key Value (Redis)**: List, get details, create instances

## 🔐 Security Notes

- ✅ API key is stored securely (not in code)
- ✅ Uses environment variable: `RENDER_API_KEY`
- ⚠️ API keys grant access to ALL workspaces - use with caution
- ⚠️ Only one destructive operation: modifying environment variables

## 🐛 Troubleshooting

### MCP Server Not Working

1. **Check configuration file exists**: `.cursor/mcp_settings.json`
2. **Verify API key is set**: `echo $RENDER_API_KEY`
3. **Restart Cursor completely** (not just reload window)
4. **Check Cursor's developer console** for MCP errors

### "Workspace not set" Error

Always set your workspace first:
```
Set my Render workspace to [WORKSPACE_NAME]
```

### Connection Issues

Test connectivity:
```bash
RENDER_API_KEY=your_key yarn render:test-mcp
```

## 📚 Additional Resources

- [Render MCP Documentation](https://docs.render.com/mcp)
- [Render API Documentation](https://api-docs.render.com/)
- [Cursor MCP Documentation](https://docs.cursor.com/mcp)
- [Render MCP GitHub Repository](https://github.com/render-oss/render-mcp-server)

## 🎯 Project-Specific Commands

For the Planetary Agents project:

```
List my Render services and show their deployment status
Show me the latest logs from my planetary-agents service
What's the CPU and memory usage for my frontend service?
Update environment variables for my planetary-agents service
```

---

**Last Tested**: 2025-01-XX  
**Status**: ✅ Operational

