# Neon Database (`neondb`) - Usage & Best Practices
napi_2flxml1onrbpt9542z6fj3j86hgga4gni1rvb2kpxz9xp6rqf8yvtj59ha8rfdb0
## 📊 Current Database Usage

Your Neon PostgreSQL database (`neondb`) is the **core data layer** for the Planetary Agents platform, storing everything from user profiles to real-time consciousness evolution data.

### Database Statistics
- **Current Size**: ~34.64 MB
- **Total Tables**: 54 (including new Feedback table)
- **Total Indexes**: 100+ (optimized for performance)
- **Compute Usage**: 0.09 CU-hrs (well within free tier)
- **Status**: ✅ Active and optimized
- **Connection**: Pooled via PgBouncer with Prisma Accelerate for edge caching
- **Last Updated**: January 18, 2025 (added Feedback model)

---

## 🗂️ What's Stored in `neondb`

### 1. **Historical Agents System** (35 Agents)
**Tables**: `historical_agents`, `agent_evolution`, `agent_knowledge`, `agent_attachments`

- **35 historical figures** with complete consciousness profiles
- Birth charts, natal data, personality traits
- Consciousness levels (Dormant → Transcendent)
- Evolution tracking and wisdom accumulation
- Agent attachments (birth charts, runes, moments)
- Popularity scores and interaction metrics

**Best Use**: 
- ✅ Primary storage for all historical agent data
- ✅ Real-time consciousness evolution tracking
- ✅ Agent knowledge base and wisdom domains
- ✅ Attachment management (charts, runes, artifacts)

---

### 2. **User & Profile Management**
**Tables**: `users`, `user_profiles`, `profiles`, `subscriptions`

- User accounts and authentication
- Birth chart data and natal charts
- User preferences and settings
- Subscription tiers and features
- Profile avatars and personalization

**Best Use**:
- ✅ User account management
- ✅ Birth chart storage and retrieval
- ✅ Subscription and billing data
- ✅ Profile personalization

---

### 3. **Agent Conversations & Interactions**
**Tables**: `agent_conversation`, `consciousness_interactions`, `consciousness_snapshots`

- Complete chat history with all agents
- Response times, token counts, model usage
- Consciousness level changes during conversations
- Quality scores and user feedback
- Session tracking and context preservation

**Best Use**:
- ✅ Conversation history and context
- ✅ Performance analytics (response times, quality)
- ✅ Consciousness evolution during chats
- ✅ User interaction patterns

---

### 4. **Consciousness Evolution System**
**Tables**: `agent_consciousness`, `agent_evolution_states`, `consciousness_profiles`, `consciousness_surveys`, `consciousness_states`

- Real-time consciousness level tracking
- Evolution stages and transitions
- Monica Constant calculations
- Sacred 7 stats (Power, Resonance, Wisdom, etc.)
- Kinetic evolution metrics (velocity, momentum, trajectory)
- Alchemical values (Spirit, Essence, Matter, Substance)

**Best Use**:
- ✅ Real-time consciousness tracking
- ✅ Evolution analytics and insights
- ✅ User-agent compatibility scoring
- ✅ Training and personalization data

---

### 5. **Planetary Transit System**
**Tables**: `planetary_transit`, `planetary_memory`, `transit_pattern`, `transit_significances`, `transit_notifications`, `agent_transit_events`

- Historical and current planetary positions
- Transit patterns and cycles
- Transit significance calculations
- Notification scheduling and delivery
- Agent-specific transit impacts
- Elemental reinforcement tracking

**Best Use**:
- ✅ Transit monitoring and notifications
- ✅ Historical transit analysis
- ✅ Pattern recognition and predictions
- ✅ Agent-transit relationship mapping

---

### 6. **Temporal Analysis (Time Laboratory)**
**Tables**: `temporal_analysis_cache`, `temporal_bookmarks`, `temporal_patterns`, `historical_event`, `collaborative_time_sessions`

- Time Laboratory query caching
- Bookmarked temporal analyses
- Pattern detection across time periods
- Historical event correlations
- Collaborative session management
- Query performance optimization

**Best Use**:
- ✅ Time Laboratory data persistence
- ✅ Query result caching (performance)
- ✅ Pattern analysis and insights
- ✅ Collaborative exploration sessions

---

### 7. **RAG (Retrieval-Augmented Generation) System**
**Tables**: `rag_queries`, `rag_sources`, `rag_feedback`

- Semantic search query logging
- Retrieved source tracking
- Relevance scores and feedback
- Performance metrics (retrieval time, success rates)
- User feedback on RAG quality

**Best Use**:
- ✅ RAG query analytics
- ✅ Source relevance tracking
- ✅ Performance optimization
- ✅ User feedback collection

---

### 8. **Monica Assistant System**
**Tables**: `monica_user_settings`, `monica_user_progress`, `monica_interactions`, `monica_knowledge`, `monica_module_progress`, `monica_contextual_help`

- User assistance preferences
- Learning progress and XP tracking
- Interaction history and helpfulness
- Knowledge base for personalized help
- Tutorial and module completion
- Contextual tips and guidance

**Best Use**:
- ✅ Personalized user assistance
- ✅ Learning progress tracking
- ✅ Contextual help system
- ✅ User onboarding and education

---

### 9. **AI Personality & Training**
**Tables**: `ai_personality`, `training_interaction`, `achievement`, `consciousness_profile`

- Personalized AI personality creation
- Training interactions and XP
- Achievement unlocking
- Consciousness profile matching
- User-AI compatibility scoring

**Best Use**:
- ✅ Personalized AI creation
- ✅ Training and evolution tracking
- ✅ Achievement system
- ✅ Compatibility analysis

---

### 10. **User Natal Charts**
**Tables**: `user_natal_charts`

- Multiple natal charts per user
- Birth data and planetary positions
- Alchemical calculations (A#, SMES, etc.)
- Transit analysis history
- Notification preferences

**Best Use**:
- ✅ Natal chart storage
- ✅ Transit analysis
- ✅ Multi-chart management
- ✅ User chart preferences

---

### 11. **Created Agents**
**Tables**: `created_agents`

- User-created custom agents
- Birth chart synthesis
- Moment chart generation
- Blueprint storage
- Agent activation status

**Best Use**:
- ✅ Custom agent creation
- ✅ Chart synthesis data
- ✅ User-generated content

---

### 12. **Notifications & Monitoring**
**Tables**: `notifications`, `transit_notifications`, `transit_monitoring_jobs`, `notification_interaction_events`

- Transit notifications
- System notifications
- Notification delivery tracking
- User interaction events
- Job scheduling and monitoring

**Best Use**:
- ✅ Notification delivery
- ✅ User engagement tracking
- ✅ Transit alert system
- ✅ Job scheduling

---

### 13. **User Feedback System** ✨ **NEW**
**Tables**: `Feedback`

- User feedback collection
- Bug reports and feature requests
- 5-star rating system
- Feedback categorization
- Status tracking (new, reviewed, resolved)
- URL context and user agent tracking

**Best Use**:
- ✅ Beta feedback collection
- ✅ Bug tracking and reporting
- ✅ Feature request management
- ✅ User satisfaction monitoring
- ✅ Product improvement insights

---

## 🎯 Best Use Cases for Neon MCP Server

With the Neon MCP server configured, you can now use AI-assisted queries for:

### 1. **Database Analytics & Insights**
```
Show me the consciousness level distribution across all agents
What's the average conversation quality score this month?
Which agents have the highest evolution velocity?
Analyze user engagement patterns by element
```

### 2. **Performance Monitoring**
```
What are the slowest queries in my database?
Show me RAG query performance trends
Which tables are growing fastest?
Analyze database connection patterns
```

### 3. **Data Quality & Maintenance**
```
Find duplicate or orphaned records
Check for missing indexes
Analyze table sizes and growth
Identify unused or deprecated data
```

### 4. **User & Agent Insights**
```
Which users are most active?
Show me agent popularity trends
What's the average consciousness level by era?
Analyze transit notification engagement rates
```

### 5. **Schema & Structure Queries**
```
Show me the Prisma schema
What are the relationships between tables?
List all indexes and their usage
What foreign keys exist?
```

---

## 💡 Recommended Database Practices

### ✅ **DO Use Neon For:**

1. **Persistent User Data**
   - User accounts, profiles, preferences
   - Birth charts and natal data
   - Subscription and billing info

2. **Agent & Consciousness Data**
   - Historical agent profiles
   - Consciousness evolution tracking
   - Agent knowledge and wisdom
   - Evolution states and metrics

3. **Conversation History**
   - Chat logs and context
   - Interaction analytics
   - Quality metrics and feedback

4. **Analytics & Tracking**
   - RAG query logs
   - Performance metrics
   - User engagement data
   - Transit event tracking

5. **Caching & Performance**
   - Temporal analysis cache
   - Query result caching
   - Pattern recognition data

### ❌ **DON'T Use Neon For:**

1. **Real-Time Vector Search**
   - Use ChromaDB or Pinecone for vector embeddings
   - Neon stores RAG metadata, not vectors

2. **File Storage**
   - Use S3, Cloudinary, or similar for images/files
   - Store only file metadata/URLs in Neon

3. **Session Data**
   - Use Redis for session storage
   - Neon for persistent session history only

4. **Temporary/Cache Data**
   - Use Redis for temporary caching
   - Neon for persistent cache (like temporal_analysis_cache)

5. **Large Binary Data**
   - Store JSON metadata, not large binaries
   - Use external storage for large files

---

## 🚀 Optimization Recommendations

### Current Status: ✅ Well Optimized

Your database is already well-structured with:
- ✅ Comprehensive indexing (100+ indexes)
- ✅ Proper foreign key relationships
- ✅ JSON columns for flexible data
- ✅ Partitioning-ready structure
- ✅ Connection pooling (PgBouncer)
- ✅ Edge caching (Prisma Accelerate)

### Future Optimizations:

1. **Query Performance**
   - Monitor slow queries via Neon dashboard
   - Use EXPLAIN ANALYZE for optimization
   - Consider materialized views for complex aggregations

2. **Storage Management**
   - Archive old conversation data (>1 year)
   - Clean up expired cache entries
   - Compress JSON columns if needed

3. **Indexing**
   - Monitor index usage
   - Add composite indexes for common query patterns
   - Remove unused indexes

4. **Connection Management**
   - Use Prisma Accelerate for production (already configured)
   - Monitor connection pool usage
   - Set appropriate connection limits

---

## 📈 Database Growth Projections

Based on current usage patterns:

- **Current**: ~34.64 MB
- **Estimated Growth**:
  - **Conversations**: ~1-5 MB/month (depending on usage)
  - **Consciousness Snapshots**: ~500 KB/month
  - **Transit Events**: ~2-10 MB/month (if transit monitoring active)
  - **RAG Queries**: ~1-3 MB/month

**Free Tier Limit**: 3 GB storage
**Projected Time to Limit**: ~2-3 years at current growth rate

---

## 🔍 Useful MCP Queries for Your Database

Once Neon MCP is configured, try these:

```
# Agent Analytics
Show me all agents with consciousness level above 4.0
What's the average Monica Constant across all agents?
Which agents have the most conversations?

# User Insights
How many users have created natal charts?
What's the distribution of dominant elements among users?
Show me users with the highest interaction counts

# Performance
What are the largest tables in my database?
Show me query performance for the last 24 hours
Which indexes are being used most?

# Data Quality
Find any orphaned records in agent_attachments
Check for missing consciousness levels
Verify all foreign key relationships
```

---

## 🎯 Summary

Your `neondb` database is the **foundation** of the Planetary Agents platform, storing:

1. ✅ **35 Historical Agents** with complete consciousness profiles
2. ✅ **User Data** including profiles, charts, and preferences
3. ✅ **Conversation History** with full context and analytics
4. ✅ **Consciousness Evolution** with real-time tracking
5. ✅ **Planetary Transits** with monitoring and notifications
6. ✅ **Temporal Analysis** with caching and bookmarks
7. ✅ **RAG System** with query tracking and feedback
8. ✅ **Monica Assistant** with personalized help
9. ✅ **Analytics & Metrics** for performance monitoring
10. ✅ **User Feedback** ✨ **NEW** - Beta feedback collection system

**Best Use**: Primary persistent data storage for all platform features, with Redis for caching and ChromaDB for vector search.

**Current Status**: ✅ Well-optimized, within free tier limits, production-ready

---

**Last Updated**: January 18, 2025
**Database**: `neondb` on Neon PostgreSQL
**Total Tables**: 54
**Status**: Active and Optimized ✅

