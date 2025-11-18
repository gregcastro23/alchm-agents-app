# Render MCP Server Setup - Pre-Restart Checklist

## ✅ Completed Preparations

### 1. MCP Configuration Added
- ✅ Updated `.cursor/mcp_settings.json` with Render MCP server
- ✅ Added alongside existing Galileo and Neon servers
- ✅ Configured to use `RENDER_API_KEY` environment variable

### 2. Environment Files Updated
- ✅ Added `RENDER_API_KEY` placeholder to `.env.local`
- ✅ Updated `.gitignore` to protect `.env.render` files
- ✅ All sensitive files are git-ignored

### 3. Documentation Created
- ✅ `backend/.env.render` - Complete Render environment variables
- ✅ `RENDER_DEPLOYMENT_CHECKLIST.md` - Full deployment guide
- ✅ This file - MCP setup instructions

---

## 🚀 Actions Required Before Cursor Restart

### Step 1: Create Render API Key (2 minutes)

1. **Go to Render Account Settings:**
   ```
   https://dashboard.render.com/account/api-keys
   ```

2. **Create New API Key:**
   - Click **"Create API Key"**
   - Name it: `cursor-mcp-integration`
   - Copy the generated key (starts with `rnd_...`)

3. **Save the Key:**
   - Store it securely - you won't see it again!

### Step 2: Add API Key to Environment (1 minute)

Open `.env.local` and replace the placeholder:

```bash
# Before:
RENDER_API_KEY=your_render_api_key_here

# After:
RENDER_API_KEY=rnd_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**File location:** `/Users/GregCastro/Desktop/planetary-agents/.env.local`

### Step 3: Verify Configuration (30 seconds)

Check that these files exist:

```bash
✅ .cursor/mcp_settings.json          # MCP configuration
✅ .env.local                          # Contains RENDER_API_KEY
✅ backend/.env.render                 # Render deployment vars
✅ RENDER_DEPLOYMENT_CHECKLIST.md     # Deployment guide
```

---

## 🔄 Restart Cursor

### Complete Restart (Required!)

**IMPORTANT:** You must **completely quit and restart Cursor**, not just reload the window.

**On macOS:**
1. `Cmd + Q` to quit Cursor completely
2. Relaunch Cursor from Applications or Dock
3. Reopen your workspace

**On Windows/Linux:**
1. File → Exit (or Alt+F4)
2. Relaunch Cursor
3. Reopen your workspace

---

## ✅ Post-Restart Verification

### Test MCP Connection

After restart, try these commands in the Cursor chat:

**1. List Workspaces:**
```
List all my Render workspaces
```

**Expected response:** List of your Render team workspaces

**2. Set Workspace:**
```
Set my Render workspace to [YOUR_WORKSPACE_NAME]
```

**3. List Services:**
```
List my Render services
```

**Expected response:** All your Render web services, databases, etc.

**4. Get Service Details:**
```
Show details for planetary-agents-backend
```

---

## 🎯 What You Can Do With Render MCP

Once configured, you can manage Render using natural language:

### Service Management
```
- "List all my Render services"
- "Show me the logs for planetary-agents-backend"
- "What's the status of my backend service?"
- "Redeploy planetary-agents-backend"
```

### Environment Variables
```
- "List environment variables for planetary-agents-backend"
- "Add FEATURE_FLAG=true to planetary-agents-backend"
- "Update CORS_ORIGINS on my backend"
```

### Deployments
```
- "Show recent deployments for my backend"
- "Deploy the latest commit to production"
- "Roll back my last deployment"
```

### Monitoring
```
- "Show me errors in the backend logs"
- "What's the health status of all my services?"
- "Show memory usage for planetary-agents-backend"
```

---

## 🔧 Troubleshooting

### MCP Not Working After Restart?

**1. Check API Key:**
```bash
# In terminal:
echo $RENDER_API_KEY

# Should show: rnd_xxxxxxxxxxxx
# If empty, API key not loaded
```

**2. Verify MCP Settings:**
```bash
cat .cursor/mcp_settings.json | grep render
```

**3. Check Cursor Logs:**
- Cursor → View → Developer Tools → Console
- Look for MCP connection errors

**4. Try Reloading MCP:**
- Cursor Command Palette (Cmd+Shift+P)
- Type: "Reload MCP Servers"
- Enter

### Common Issues

**"API key not found"**
- Solution: Check `.env.local` has correct `RENDER_API_KEY`

**"Workspace not set"**
- Solution: Run `Set my Render workspace to [name]`

**"Permission denied"**
- Solution: Check API key has correct permissions in Render dashboard

---

## 📋 Quick Reference

### Files Created
```
backend/.env.render                   # Render deployment env vars
RENDER_DEPLOYMENT_CHECKLIST.md       # Full deployment guide
RENDER_MCP_SETUP.md                  # This file
```

### Files Modified
```
.cursor/mcp_settings.json            # Added Render MCP config
.env.local                            # Added RENDER_API_KEY
.gitignore                            # Protected .env.render
```

### Environment Variables
```
RENDER_API_KEY=rnd_xxxxx             # Your Render API key
```

---

## 🚀 Next Steps After Cursor Restart

1. **✅ Verify MCP Connection**
   - Test: `List my Render workspaces`

2. **🔧 Set Your Workspace**
   - Run: `Set my Render workspace to [name]`

3. **📊 Check Service Status**
   - Run: `List my Render services`

4. **🚀 Deploy Backend**
   - Create service in Render Dashboard
   - Or use MCP: `Create a web service named planetary-agents-backend`

5. **🧪 Test Integration**
   - Run: `Show logs for planetary-agents-backend`

---

## 📞 Support Resources

**Render MCP Documentation:**
- https://render.com/docs/mcp

**Render API Docs:**
- https://api-docs.render.com

**Cursor MCP Guide:**
- https://docs.cursor.com/mcp

**Render Dashboard:**
- https://dashboard.render.com

---

## ✨ Benefits of Render MCP Integration

✅ **Deploy from Cursor** - No need to switch to dashboard
✅ **View Logs in Editor** - Debug without leaving your IDE
✅ **Manage Env Vars** - Update configuration instantly
✅ **Monitor Services** - Real-time status in chat
✅ **One-Click Deployments** - Deploy with natural language
✅ **Automated Workflows** - Script complex operations

---

**Status:** Ready for Cursor restart! 🚀

**Next:**
1. Create Render API key
2. Add to `.env.local`
3. Restart Cursor completely
4. Test MCP connection
