# Getting Started with Real Threat Intelligence APIs

## Overview
The Starcom CyberCommand visualization system now supports real threat intelligence APIs to enhance data quality beyond mock data. This guide shows you how to configure free API sources.

## 🎯 **Quick Setup: 5 Free APIs in 10 Minutes**

### 1. **VirusTotal (Free: 4 requests/minute)**
- **What it provides**: Malware analysis, IOC reputation, file/URL/domain intelligence
- **Sign up**: https://www.virustotal.com/gui/join-us
- **Get API key**: Profile → API Key section
- **Rate limit**: 4 requests per minute (free tier)

### 2. **AbuseIPDB (Free: 1000 requests/day)**
- **What it provides**: IP reputation, abuse reports, geographic data
- **Sign up**: https://www.abuseipdb.com/register
- **Get API key**: Account → API section
- **Rate limit**: ~60 requests per minute

### 3. **AlienVault OTX (Free: Community access)**
- **What it provides**: Community threat intelligence, IOCs, threat feeds
- **Sign up**: https://otx.alienvault.com/signup
- **Get API key**: Settings → API Integration
- **Rate limit**: 30 requests per minute

### 4. **Shodan (Free: 100 results/month)**
- **What it provides**: Internet-connected device intelligence, infrastructure mapping
- **Sign up**: https://account.shodan.io/register
- **Get API key**: Account Overview → API Key
- **Rate limit**: Very limited free tier

### 5. **MISP Demo (Free: Demo access)**
- **What it provides**: Malware information sharing, threat indicators
- **Access**: https://demo.misp-project.org (no signup required for demo)
- **Rate limit**: 10 requests per minute

## 🛠 **How to Configure APIs in Starcom**

### Step 1: Access API Settings
1. Open Starcom CyberCommand
2. Switch to **CyberThreats** mode
3. Open **Settings Panel** (gear icon)
4. Click **API Configuration** tab

### Step 2: Add Your API Keys
1. Click **"Add Credentials"** for each provider
2. Enter your API key from the provider
3. Click **"Save"**
4. Enable the endpoint by checking the checkbox

### Step 3: Test Connections
1. Click **"Test Connection"** for each configured API
2. Verify green checkmarks appear
3. Monitor rate limit usage in real-time

### Step 4: Configure Data Sources
1. Adjust **Global Rate Limit** (default: 100 req/min)
2. Set **Cache TTL** (default: 15 minutes)
3. Enable/disable specific APIs as needed

## 📊 **What You'll See**

### Before (Mock Data):
- Simulated threat data with realistic patterns
- Geographic clustering based on known threat actors
- Synthetic IOCs and threat intelligence

### After (Real APIs):
- **Live malware detections** from VirusTotal
- **Actual IP abuse reports** from AbuseIPDB  
- **Real threat intelligence** from OTX community
- **Current infrastructure data** from Shodan
- **Shared threat indicators** from MISP

## 🎨 **Visual Improvements**

Real API data enhances the 3D globe visualization:

1. **More Accurate Heat Maps**: Based on actual threat density
2. **Real Attribution**: Actual threat actor intelligence
3. **Current Infrastructure**: Live C2 servers and botnets  
4. **Geographic Precision**: Exact threat source locations
5. **Confidence Indicators**: Real confidence scores from analysts

## ⚡ **Performance & Rate Limits**

The system intelligently manages API usage:

- **Rate Limiting**: Respects each API's limits automatically
- **Caching**: Stores results for 15 minutes (configurable)
- **Fallback**: Uses mock data when APIs are unavailable
- **Load Balancing**: Distributes requests across multiple APIs

## 🔧 **Production Deployment**

### Environment Variables
Add these to your production environment:

```bash
# Optional: Pre-configure API keys
VITE_VIRUSTOTAL_API_KEY=your_vt_key_here
VITE_ABUSEIPDB_API_KEY=your_abuse_key_here
VITE_OTX_API_KEY=your_otx_key_here
VITE_SHODAN_API_KEY=your_shodan_key_here
```

### Security Considerations
- API keys are stored securely in browser localStorage
- All API calls use HTTPS
- Rate limiting prevents API abuse
- Error handling prevents system crashes

## 📈 **Monitoring & Analytics**

The API configuration panel shows:
- **Success/Error Counts**: Track API reliability
- **Rate Limit Usage**: Real-time usage monitoring
- **Last Used**: When each API was last called
- **Connection Status**: Live connection testing

## 🚀 **Next Steps**

1. **Start with VirusTotal**: Easiest to set up, great data quality
2. **Add AbuseIPDB**: Excellent for IP reputation
3. **Join OTX Community**: Free community threat intelligence
4. **Monitor Usage**: Watch rate limits and adjust as needed
5. **Scale Up**: Consider premium tiers for higher volume

## 💡 **Pro Tips**

- **Cache Settings**: Increase cache TTL for development (60 min)
- **Rate Limits**: Start conservative, increase gradually
- **API Priority**: VirusTotal → AbuseIPDB → OTX → Others
- **Error Handling**: System gracefully falls back to mock data
- **Testing**: Use "Test Connection" frequently during setup

## 🎯 **Expected Results**

With all 5 free APIs configured, you'll get:
- **~95 requests/minute** total capacity
- **Real threat intelligence** on the 3D globe
- **Live malware analysis** results
- **Actual geographic threat data**
- **Community threat sharing** insights

The visualization will transform from a demo to a **real cybersecurity intelligence platform** using live threat data from the security community.

---

**Next**: Once comfortable with free APIs, consider premium tiers from Recorded Future, CrowdStrike, or FireEye for enterprise-grade threat intelligence.
