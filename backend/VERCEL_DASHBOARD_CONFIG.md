# Vercel Dashboard Configuration Required

## Problem
The `installCommand` in `vercel.json` is being ignored by Vercel's build system.
This is a known issue: https://community.vercel.com/t/install-command-not-working-on-vercel-json/1106

## Solution
Configure the install command directly in the Vercel Dashboard:

### Steps to Fix

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/gregcastro23s-projects/planetary-agents
   - Click on "Settings" tab

2. **Navigate to Build & Development Settings**
   - In the left sidebar, click "General" (or find "Build & Development Settings")
   - Scroll to the "Build & Development Settings" section

3. **Override Install Command**
   - Find the "INSTALL COMMAND" field
   - Click "OVERRIDE" button
   - Enter: `./install-frontend-only.sh`
   - Click "Save"

4. **Redeploy**
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - **Important**: Uncheck "Use existing Build Cache" to force fresh install

### What to Look For in Build Logs

**✅ Success:**
```
Running "install" command: `./install-frontend-only.sh`...
🔧 Hiding backend directory during install...
✅ Backend hidden
📦 Installing frontend dependencies...
```

**❌ Still failing:**
```
Running "install" command: `yarn install`...
warning swisseph > node-gyp...
```

### Alternative Solution (If Dashboard Override Doesn't Work)

If the dashboard override also doesn't work, we'll need to:
1. Remove swisseph from backend/package.json temporarily
2. Deploy to Vercel successfully
3. Keep a separate backend deployment config for Render

This is the nuclear option but guaranteed to work.

---

**Current Status:**
- ✅ Custom install script created and tested locally
- ✅ Script committed to git (commit 3ee78286)
- ❌ vercel.json installCommand being ignored
- 🔧 Need to configure via Dashboard instead

**Next Steps:**
1. Configure install command in Vercel Dashboard (instructions above)
2. Redeploy and watch build logs
3. If successful, add NEXT_PUBLIC_BACKEND_URL environment variable
