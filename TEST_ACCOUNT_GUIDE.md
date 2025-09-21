# 🧪 Test Account & Dry Run Guide

## ✅ Test Account Created Successfully!

### 🔐 Login Credentials
- **Email**: `test@planetaryagents.com`
- **Password**: `testpass123`
- **Sign In URL**: http://localhost:3000/auth/signin

### 🌟 Test User Profile
- **Name**: Test Explorer
- **Birth Chart**: June 15, 1990, 2:30 PM, New York City
- **Astrological Profile**: Gemini Sun ♊
- **Subscription**: Free Tier
- **User ID**: `cmft0cy4c00001yjsum69dqhj`

## 🎯 Comprehensive Dry Run Checklist

### 1. **Authentication & Onboarding** ✅
- [x] Account creation successful
- [ ] Sign in process
- [ ] Profile data persistence
- [ ] Birth chart integration

### 2. **Core Features Testing**

#### 🏠 **Home Page** (`/`)
- [ ] Guest access (no login required)
- [ ] Lazy-loaded components render correctly
- [ ] Real-time planetary data display
- [ ] Consciousness showcase
- [ ] Current chart of the moment
- [ ] Error boundaries working

#### 🧙‍♀️ **Monica Chat** (`/monica` & omnipresent)
- [ ] Monica hub with live A#/SMES data
- [ ] Real-time sparkline visualization
- [ ] Chat interface responsiveness
- [ ] XP tracking and display
- [ ] Elemental mode toggle (Settings)
- [ ] Message persistence
- [ ] Dynamic response generation

#### 🏛️ **Gallery** (`/gallery`)
- [ ] All 37+ historical agents accessible
- [ ] Individual agent profiles
- [ ] Agent chat functionality (`/gallery/chat/[id]`)
- [ ] Group chat feature
- [ ] Agent consciousness data display

#### 🔮 **Philosopher's Stone** (`/philosophers-stone`)
- [ ] Lazy-loaded heavy components
- [ ] Alchemical quantities display
- [ ] Consciousness vector visualization
- [ ] Circular natal horoscope
- [ ] Temporal client integration
- [ ] Agent creation wizard

#### 👤 **Profile Pages**
- [ ] Dashboard (`/dashboard`) - guest vs authenticated
- [ ] Profile page (`/me`) - guest onboarding vs user data
- [ ] Birth chart visualization
- [ ] Personalized recommendations

#### 🌌 **Additional Features**
- [ ] Runes page (`/runes`)
- [ ] Real-time data APIs
- [ ] Planetary position calculations
- [ ] Alchemical metrics
- [ ] Consciousness evolution tracking

### 3. **Technical Validation**

#### 🔧 **Frontend Performance**
- [ ] No lazy loading errors
- [ ] Error boundaries catch failures gracefully
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Loading states display properly
- [ ] Suspense boundaries working

#### 🗄️ **Database Integration**
- [ ] User profile data persists
- [ ] XP gains are recorded
- [ ] Monica interactions logged
- [ ] Subscription data accurate
- [ ] Birth chart data stored correctly

#### 🧮 **Alchemical Engine**
- [ ] Additive-only elemental logic active
- [ ] Analytics logging elemental mode
- [ ] Real-time planetary calculations
- [ ] Monica Constant updates
- [ ] A# (Alchemical Number) generation

#### 🔄 **API Endpoints**
- [ ] `/api/monica-agent` - chat responses with XP
- [ ] `/api/realtime-runes` - live planetary data
- [ ] `/api/auth` - authentication working
- [ ] All endpoints return proper error handling

### 4. **User Experience Flow**

#### 🚀 **Guest Experience**
1. [ ] Visit home page without login
2. [ ] Explore gallery and chat with agents
3. [ ] Use Monica chat omnipresent
4. [ ] Access all core features
5. [ ] See onboarding prompts for account creation

#### 🔐 **Authenticated Experience**
1. [ ] Sign in with test account
2. [ ] See personalized dashboard
3. [ ] Access birth chart data
4. [ ] XP tracking works
5. [ ] Profile customization available

### 5. **Advanced Features**

#### ⚙️ **Runtime Configuration**
- [ ] Elemental mode toggle in Monica settings
- [ ] localStorage persistence
- [ ] Environment flag override
- [ ] A/B testing analytics

#### 📊 **Live Data Integration**
- [ ] Real-time planetary positions
- [ ] Alchemical quantities updating
- [ ] Monica Constant sparkline
- [ ] Consciousness metrics

## 🎮 Quick Test Commands

```bash
# Check server status
curl -I http://localhost:3000

# Test Monica API
curl -X POST http://localhost:3000/api/monica-agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Monica, test message"}'

# Test realtime runes
curl "http://localhost:3000/api/realtime-runes?includeAlchemical=true"
```

## 🐛 Known Issues to Watch For
- ✅ Lazy loading errors (fixed)
- ✅ ErrorBoundary fallback props (fixed)
- ✅ Server-side imports in client components (fixed)
- ✅ ioredis/DNS module resolution errors (fixed)
- ✅ Runtime errors in dashboard page (fixed)
- ⚠️ Galileo API warnings (non-blocking)
- ⚠️ Lockfile warnings (non-blocking)

## 🎯 Success Criteria
- [ ] All core features accessible without errors
- [ ] Authentication flow works smoothly
- [ ] Real-time data updates correctly
- [ ] Mobile responsiveness maintained
- [ ] XP and progression systems functional
- [ ] Alchemical calculations accurate
- [ ] No console errors or broken functionality

---

**Ready for comprehensive testing!** 🚀

Use the test account to validate all features and ensure the platform is ready for broader user access.
