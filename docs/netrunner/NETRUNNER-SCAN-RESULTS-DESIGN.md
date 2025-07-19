# NetRunner Web Crawler Scan Results - Design Patterns

## 🎯 **Overview**
Comprehensive visualization system for NetRunner's web crawler scan results, designed to help operators identify intelligence gathering opportunities and navigation pathways.

## 🏗️ **Architecture**

### **Component Structure**
```
NetRunnerRightSideBar
├── Tabs (Scan Results | System Status)
├── WebCrawlerResults
    ├── Header (Progress, Stats, Controls)
    ├── Results Content
    │   ├── PathwayGroups (Collapsible Categories)
    │   └── ResultCards (Individual Discoveries)
    └── Controls (Navigation, Deep Scan, Export)
```

### **Data Models**
- **ScanResult**: Individual discovered pathway with intel classification
- **PathwayGroup**: Categorized collections of similar results
- **TaskStatus**: System status and progress tracking

## 🎨 **Design Patterns**

### **1. Intelligence Value Classification**
Results are color-coded by intelligence value:
- 🔴 **Critical** (`#ff4444`): Admin panels, credentials, sensitive files
- 🟠 **High** (`#ff8800`): API endpoints, restricted directories
- 🟡 **Medium** (`#ffaa00`): Contact forms, public APIs
- 🟢 **Low** (`#00ff88`): Standard web pages, public content

### **2. Security Status Indicators**
Visual security assessment:
- 🔓 **Vulnerable** (`#ff4444`): Open security holes, exposed data
- 🔒 **Restricted** (`#ff8800`): Protected but accessible
- 🛡️ **Protected** (`#ffaa00`): Standard authentication
- ✅ **Open** (`#00ff88`): Public access, no restrictions

### **3. Pathway Categorization**
Organized by discovery type:
- **Admin Panels**: Dashboard access, control interfaces
- **API Endpoints**: Data access points, service interfaces
- **Databases**: Data storage access points
- **Login Pages**: Authentication portals
- **Directories**: File system access points
- **Files**: Individual documents, configs
- **Forms**: Data input/collection points
- **Web Pages**: Standard content pages

### **4. Intel Indicators**
Smart tagging system:
- 🔑 **Credentials**: Password files, API keys
- 👥 **Personal Data**: User information, contacts
- 🛡️ **Admin Access**: Elevated privilege points
- 💻 **APIs**: Service endpoints count
- ✉️ **Emails**: Contact information discovered
- 📊 **Depth**: Crawl depth indicator

## 🔍 **User Experience Patterns**

### **Progressive Disclosure**
- **Collapsed Groups**: Show category overview with counts
- **Expanded Groups**: Reveal individual pathway details
- **Hover States**: Preview additional information
- **Click Actions**: Navigate or deep scan pathways

### **Action Hierarchy**
Primary actions per result:
1. **Navigate** (Primary): Load URL in center scanner
2. **Deep Scan** (Secondary): Trigger detailed analysis
3. **External Link** (Tertiary): Open in new browser tab

### **Visual Feedback**
- **Progress Bars**: Real-time scan progress
- **Status Chips**: Current scan state
- **Color Coding**: Instant threat/value assessment
- **Animations**: Smooth hover and selection states

## 📊 **Data Visualization**

### **Summary Statistics**
- Total pathways discovered
- Critical findings count
- Vulnerable endpoints count
- AI/Bot controlled indicators

### **Grouping Strategy**
Results automatically grouped by:
1. **Type similarity** (admin, API, file, etc.)
2. **Intel value** (highest value bubbles to top)
3. **Security status** (vulnerable items prioritized)

### **Filtering & Sorting**
Planned features:
- Filter by security status
- Sort by intel value, depth, or discovery time
- Search within results
- Export filtered results

## 🎯 **Intelligence Gathering Focus**

### **Primary Objectives**
The design specifically targets:
1. **Access Point Discovery**: Admin panels, login pages
2. **Data Exposure**: APIs, databases, file access
3. **Vulnerability Identification**: Security weaknesses
4. **Contact Intelligence**: Email, phone, social links
5. **Technology Mapping**: Framework and service identification

### **Pathway Prioritization**
Smart highlighting of:
- **High-value targets**: Admin access, credentials
- **Easy wins**: Open directories, exposed files
- **Intelligence goldmines**: APIs with personal data
- **Expansion opportunities**: Deep crawl candidates

## 🚀 **Integration Points**

### **Center Scanner Integration**
- Click pathway → Load in center view
- Deep scan → Trigger detailed analysis
- Progress sync → Real-time scan updates

### **AI Agent Integration**
- Bot-controlled scan indicators
- Automated threat assessment
- Smart pathway recommendation

### **Export Capabilities**
- JSON results export
- Filtered data export
- Report generation ready

---

**Result**: A comprehensive, cyberpunk-styled intelligence gathering interface that transforms raw web crawl data into actionable reconnaissance information for NetRunner operators.
