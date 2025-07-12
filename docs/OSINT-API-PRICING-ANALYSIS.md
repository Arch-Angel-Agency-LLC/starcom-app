# OSINT API Pricing & Free Tier Analysis

**Date:** July 11, 2025  
**Status:** Cost Analysis for NetRunner Integration  
**Purpose:** Evaluate free vs paid API options for OSINT testing and deployment  

## 📊 Free Tier Summary

### ✅ **Completely Free Options**

#### 🟢 TheHarvester
- **Cost**: 100% FREE (Open Source)
- **Limitations**: None - it's a local tool
- **Source**: https://github.com/laramies/theHarvester
- **Note**: No API key required for basic functionality
- **Best for**: Email enumeration, subdomain discovery, basic OSINT

#### 🟢 Shodan (Free Tier)
- **Cost**: FREE with registration
- **Limitations**: 
  - No query/scan credits on free plan
  - Very limited functionality
  - Monthly reset
- **Upgrade Path**: Paid plans start at $69/month
- **Best for**: Testing integration, limited reconnaissance

---

### 🟡 **Limited Free Tiers**

#### 🟡 VirusTotal (Public API)
- **Cost**: FREE with registration
- **Limitations**: 
  - **500 requests per day**
  - **4 requests per minute** (very restrictive)
  - Cannot be used in commercial products
- **Upgrade Path**: Premium API removes limits
- **Best for**: Small-scale file/URL analysis, testing
- **Commercial Use**: ❌ NOT ALLOWED on free tier

#### � Censys (NO Free API Access)
- **Cost**: FREE account has web interface only
- **API Access**: Requires paid Starter tier ($62/month)
- **Free Limitations**:
  - ❌ NO API access whatsoever
  - Web interface only with 1 page results
  - Basic protocols and certificates only
- **Paid Starter**: 500 queries/month, full API access
- **Recommendation**: Skip for budget-conscious testing

---

### ❌ **No Free Tier**

#### 🔴 Hunter.io
- **Cost**: Paid plans only
- **Minimum**: ~$49/month for starter plan
- **Best for**: Professional email discovery

---

## 🎯 Recommended Strategy for Testing

### Phase 1: Free Development & Testing
```env
# .env.local for free testing (UPDATED - Censys requires paid plan for API)
VITE_ENABLE_REAL_APIS=true
VITE_SHODAN_API_KEY=your_free_shodan_key
VITE_VIRUSTOTAL_API_KEY=your_free_virustotal_key  
# Censys free tier has NO API access - requires paid Starter tier ($62/month)
# VITE_CENSYS_APP_ID=requires_paid_starter_tier
# VITE_CENSYS_SECRET=requires_paid_starter_tier
# TheHarvester requires no API key
```

### Testing Limitations (UPDATED)
- **VirusTotal**: Max 1,000 requests/day (excellent for testing)
- **Shodan**: 100 queries/month (limited but functional)
- **Censys**: ❌ NO API access on free tier (requires paid plan)
- **TheHarvester**: Unlimited local functionality

### Daily Testing Budget (Free Tier - UPDATED)
```
VirusTotal:   33 requests/day (1000/30 days)
Shodan:       3 requests/day (100/30 days)  
Censys:       ❌ NO API access (web interface only)
TheHarvester: Unlimited (open source tool)
```

## 💰 Cost Analysis for Production

### Minimum Viable Production Setup
```
Shodan Freelancer:    $69/month
VirusTotal Premium:   ~$100/month  
Censys Solo:          $62/month
Hunter.io Starter:    $49/month
------------------------
Total:                ~$280/month
```

### Budget-Friendly Production Alternative
```
TheHarvester:         FREE (local tool)
VirusTotal Free:      FREE (500/day limit)
Censys Free:          FREE (250/month limit) 
Shodan Free:          FREE (very limited)
------------------------
Total:                $0/month
```

## 🚀 Implementation Recommendations

### For Development (Phase 4)
1. **Start with completely free options**:
   - TheHarvester (no limits)
   - VirusTotal free tier (500/day)
   - Censys free tier (250/month)
   - Shodan free registration

2. **Focus testing on**:
   - TheHarvester integration (unlimited)
   - VirusTotal basic functionality
   - UI/UX with real vs mock data indicators

### For Production Deployment
1. **Budget Option**: Use free tiers with rate limiting
2. **Professional Option**: Upgrade critical APIs (Shodan + VirusTotal)
3. **Enterprise Option**: Full paid tier across all providers

## 🔧 Rate Limiting Strategy

### Built-in Protection
Our production adapters already include:
- Request queuing
- Rate limit compliance
- Automatic fallback to mock data
- Error handling for quota exceeded

### Code Example
```typescript
// Already implemented in our adapters
if (this.rateLimiter.isLimitExceeded()) {
  console.warn('Rate limit exceeded, falling back to mock data');
  return this.getMockResults(query);
}
```

## ⚖️ Legal Considerations

### Commercial Use Restrictions
- **VirusTotal**: Free tier explicitly prohibits commercial use
- **Others**: Generally allow commercial use with proper attribution
- **Recommendation**: Review terms of service for each provider

### Compliance Requirements
- Ensure target domain authorization for OSINT activities
- Respect robots.txt and API terms of service
- Implement proper attribution where required

## 📝 API Key Acquisition URLs

### ✅ **Free Tier APIs**
- **Shodan**: https://account.shodan.io/register (free account + API key)
- **VirusTotal**: https://www.virustotal.com/gui/join-us (free account + API key)  
- **Censys**: https://platform.censys.io/register (free account)
  - **API Credentials**: https://platform.censys.io/settings/api
- **TheHarvester**: https://github.com/laramies/theHarvester (no API key needed)

## 📋 Next Steps for Phase 4

### Immediate (Today)
1. Sign up for free accounts:
   - Shodan (free registration)
   - VirusTotal (free API key)
   - Censys (free tier)

2. Add API keys to `.env.local`:
```bash
# Free tier API keys
VITE_SHODAN_API_KEY=your_free_key_here
VITE_VIRUSTOTAL_API_KEY=your_free_key_here  
# VITE_CENSYS_APP_ID=requires_paid_starter_tier
# VITE_CENSYS_SECRET=requires_paid_starter_tier
```

3. Test with free tier limitations:
   - VirusTotal: 16 requests/day max
   - Censys: 8 requests/day max
   - TheHarvester: Unlimited

### Week 1-2
1. Validate all integrations work with real APIs
2. Test rate limiting and error handling
3. Document actual vs expected performance

### Future Scaling
- Monitor usage patterns
- Evaluate upgrade needs based on actual usage
- Consider paid tiers for critical production features

## 🏆 Conclusion

**The good news**: You can absolutely test the NetRunner integration with free API tiers! 

**The reality check**: Production usage will likely require some paid subscriptions for optimal performance, but the free tiers provide excellent testing capabilities.

**Recommended approach**: Start with free tiers for all development and testing, then selectively upgrade based on actual usage patterns and requirements.
