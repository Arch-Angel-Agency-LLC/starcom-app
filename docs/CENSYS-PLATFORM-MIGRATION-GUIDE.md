# 🔑 Censys Platform Migration Guide

## 🚀 **New Censys Platform**
Censys has migrated from `search.censys.io` to the new **Censys Platform** at `platform.censys.io`.

### **✅ Updated URLs:**
- **Registration**: https://platform.censys.io/register
- **API Credentials**: https://platform.censys.io/settings/api
- **Dashboard**: https://platform.censys.io/

---

## 📋 **Step-by-Step API Setup**

### **Step 1: Register Account**
1. Go to: https://platform.censys.io/register
2. Create free account
3. Verify email address

### **Step 2: Get API Credentials**
1. Login to: https://platform.censys.io/
2. Navigate to: **Settings** → **API**
3. You'll see:
   - **API ID** (username-like identifier)
   - **Secret** (password-like credential)

### **Step 3: Add to NetRunner**
Add these credentials to your `.env.local` file:
```bash
VITE_CENSYS_API_ID=your_api_id_from_platform
VITE_CENSYS_SECRET=your_secret_from_platform
```

---

## 🎯 **Free Tier Features**
- **250 queries/month** (≈8 per day)
- **Certificate transparency data**
- **Host discovery and enumeration**
- **Basic infrastructure intelligence**

---

## 🔧 **Testing After Setup**
1. Restart your dev server: `npm run dev`
2. Test Censys searches in NetRunner
3. Monitor Provider Status for green indicators
4. Search targets like: `google.com`, `8.8.8.8`

**🚀 Once configured, you'll have access to Censys's powerful infrastructure intelligence data!**
