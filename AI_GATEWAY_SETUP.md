# AI Gateway Integration Guide

## Overview

Planetary Agents now supports routing all AI requests through an AI Gateway for:
- 💰 **Cost Optimization** - Caching, load balancing, and cost tracking
- 🛡️ **Rate Limiting** - Prevent API quota exhaustion
- 📊 **Monitoring** - Track usage, latency, and errors
- 🔒 **Security** - Centralized API key management

## Supported AI Providers

The gateway integration works with:
- ✅ **OpenAI** (GPT-4, GPT-3.5)
- ✅ **Anthropic** (Claude)
- ✅ **LangChain** (both OpenAI and Anthropic models)
- ✅ **AI SDK** (Vercel AI SDK for streaming)

## Supported Gateway Services

### 1. Cloudflare AI Gateway (Recommended - Free Tier Available)

**Benefits:**
- Free tier: 1M requests/month
- Built-in caching
- Analytics dashboard
- Low latency (Cloudflare edge network)

**Setup:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to AI → AI Gateway
3. Create a new gateway
4. Get your gateway URL and API key

**Configuration:**
```bash
AI_GATEWAY_ENABLED=true
AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}
AI_GATEWAY_API_KEY=your-cloudflare-api-token
```

### 2. Portkey

**Benefits:**
- Advanced caching strategies
- Automatic retries and fallbacks
- Multi-provider load balancing
- Rich analytics

**Setup:**
1. Sign up at [portkey.ai](https://portkey.ai)
2. Create a gateway
3. Get API key

**Configuration:**
```bash
AI_GATEWAY_ENABLED=true
AI_GATEWAY_URL=https://api.portkey.ai/v1
AI_GATEWAY_API_KEY=your-portkey-api-key
```

### 3. Helicone

**Benefits:**
- Detailed request logging
- Cost tracking per user/session
- A/B testing support
- Free tier available

**Setup:**
1. Sign up at [helicone.ai](https://helicone.ai)
2. Get API key from dashboard

**Configuration:**
```bash
AI_GATEWAY_ENABLED=true
AI_GATEWAY_URL=https://oai.helicone.ai/v1
AI_GATEWAY_API_KEY=your-helicone-api-key
```

### 4. Custom Gateway

**For self-hosted or custom solutions:**
```bash
AI_GATEWAY_ENABLED=true
AI_GATEWAY_URL=https://your-gateway.example.com/v1
AI_GATEWAY_API_KEY=your-custom-api-key
```

## Environment Variables

### Required Variables

```bash
# Enable gateway routing
AI_GATEWAY_ENABLED=true

# Gateway endpoint URL
AI_GATEWAY_URL=https://gateway.example.com/v1

# Gateway authentication key
AI_GATEWAY_API_KEY=your-gateway-key
```

### Optional - Keep Original API Keys

You still need the original OpenAI/Anthropic keys:
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

The gateway will use these keys to make requests on your behalf, or you can configure the gateway to handle authentication.

## Setup Instructions

### Local Development

1. **Update `.env.local`:**
```bash
AI_GATEWAY_ENABLED=true
AI_GATEWAY_URL=https://your-gateway-url/v1
AI_GATEWAY_API_KEY=your-gateway-key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

2. **Restart dev server:**
```bash
yarn dev
```

3. **Test gateway:**
- Visit `/gallery` and chat with an agent
- Check gateway dashboard for request logs

### Render Deployment

1. **Update Environment Variables:**

Go to Render Dashboard → Frontend Service → Environment:

```bash
AI_GATEWAY_ENABLED=true
AI_GATEWAY_URL=https://your-gateway-url/v1
AI_GATEWAY_API_KEY=your-gateway-key
```

2. **Redeploy Service:**
- Click "Manual Deploy" → "Deploy latest commit"
- Or push to trigger auto-deploy

3. **Verify:**
```bash
# Test health check
curl https://your-frontend.onrender.com/api/health

# Test agent chat through gateway
# Check your gateway dashboard for request logs
```

## Implementation Details

### Files Modified

1. **`lib/anthropic-client.ts`**
   - Routes Anthropic requests through gateway when enabled
   - Falls back to direct API if gateway is disabled

2. **`lib/rag/rag-generator.ts`**
   - Routes OpenAI and streaming requests through gateway
   - Uses `@ai-sdk/openai` with custom `baseURL`

3. **`lib/langchain/agent-router.ts`**
   - Gateway support for LangChain agents
   - Both `ChatOpenAI` and `ChatAnthropic` models

### How It Works

```typescript
// When AI_GATEWAY_ENABLED=true
const client = new OpenAI({
  baseURL: process.env.AI_GATEWAY_URL,
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// When AI_GATEWAY_ENABLED=false (default)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

## Benefits & Use Cases

### Cost Optimization

**Caching:**
- Identical requests return cached responses
- Reduces API costs by 30-70%
- Faster response times

**Load Balancing:**
- Distribute requests across multiple API keys
- Prevent quota exhaustion
- Better rate limit management

### Monitoring

**Request Analytics:**
- Track requests per endpoint
- Monitor latency and errors
- Identify expensive operations

**Cost Tracking:**
- See costs per user/session
- Track token usage
- Set budget alerts

### Security

**Centralized Key Management:**
- API keys stored in gateway only
- Frontend never exposes keys
- Easy key rotation

**Rate Limiting:**
- Per-user rate limits
- Per-endpoint quotas
- DDoS protection

## Troubleshooting

### Gateway Not Working

**Check logs:**
```bash
# Render Dashboard → Service → Logs
# Look for: "Using AI Gateway: [URL]"
```

**Verify env vars:**
```bash
# In Render Dashboard → Environment
AI_GATEWAY_ENABLED=true  # Must be exactly "true"
AI_GATEWAY_URL=https://... # Must include protocol
AI_GATEWAY_API_KEY=...     # Must be set
```

### Requests Still Going Direct

**Possible causes:**
1. `AI_GATEWAY_ENABLED` not set to `true`
2. Missing `AI_GATEWAY_URL` or `AI_GATEWAY_API_KEY`
3. Gateway URL format incorrect
4. Service not restarted after env change

**Solution:**
1. Verify all three env vars are set
2. Check for typos (especially "true" vs "True")
3. Redeploy service
4. Check logs for "Using AI Gateway" message

### Gateway Returns Errors

**401 Unauthorized:**
- Check `AI_GATEWAY_API_KEY` is correct
- Verify gateway account is active

**404 Not Found:**
- Check `AI_GATEWAY_URL` format
- Ensure URL includes path (e.g., `/v1`)
- Verify gateway endpoint supports OpenAI/Anthropic format

**Rate Limit Errors:**
- Check gateway dashboard for quota limits
- Upgrade gateway plan if needed
- Implement request queuing

## Performance Impact

### Latency

- **With Gateway:** +10-50ms (depends on gateway location)
- **With Caching:** -500-2000ms (cache hits are instant)
- **Net Effect:** Usually faster due to caching

### Reliability

- **Gateway Downtime:** Falls back to direct API (optional)
- **Request Retries:** Gateway can auto-retry failed requests
- **Circuit Breaker:** Prevents cascade failures

## Cost Analysis

### Without Gateway

```
100,000 requests/month
Average: 1000 tokens/request
Cost: ~$200/month
```

### With Gateway (50% cache hit rate)

```
100,000 requests/month
50,000 cached (free)
50,000 actual API calls
Cost: ~$100/month + gateway fee
```

**Typical ROI:** 30-70% cost reduction

## Next Steps

1. **Choose Gateway Provider**
   - Start with Cloudflare (free tier)
   - Upgrade if you need advanced features

2. **Set Up Gateway**
   - Create account
   - Configure gateway
   - Get API credentials

3. **Update Environment**
   - Add gateway env vars
   - Deploy changes
   - Verify in logs

4. **Monitor Usage**
   - Check gateway dashboard
   - Track cost savings
   - Optimize cache strategy

5. **Scale Up**
   - Enable for production
   - Configure alerts
   - Set budget limits

## Support

- **Gateway Issues:** Contact your gateway provider
- **Integration Issues:** Check logs and verify env vars
- **Performance:** Monitor gateway dashboard analytics

---

**Gateway Status:** ✅ Fully integrated and production-ready
**Last Updated:** 2025-01-29
