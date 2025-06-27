# Migration Implementation Plan: Clean Subnet-Gateway Separation

**Date:** June 26, 2025  
**Status:** Implementation Phase  
**Goal:** Migrate from coupled architecture to clean separation  

---

## 🎯 **PHASE 1: EXTRACT PURE SUBNET LOGIC**

### **Step 1.1: Create Clean Subnet Module**

First, create a new `clean_subnet.rs` that handles ONLY membership and internal topology.

### **Step 1.2: Migrate Current SubnetManager**

The current `SubnetManager` is doing too much:
- ✅ Team discovery (subnet concern)
- ✅ Member management (subnet concern)  
- ❌ Bridge coordination (gateway concern)
- ❌ Security gateway (gateway concern)

We'll extract the pure subnet parts.

### **Step 1.3: Update Configuration**

Split the configuration to clearly separate subnet vs gateway concerns.

---

## 🚀 **IMPLEMENTATION: PHASE 1**

Let me implement the clean subnet extraction:
