# Solar Flare Event Popup Issues - Diagnosis

> **Date:** June 22, 2025  
> **Type:** Issue Diagnosis  
> **Status:** ✅ Resolved  
> **Related:** [Solar Flare Fixes Summary](./2025-06-22-solar-flare-fixes-summary.md)

## Overview
This document provides detailed diagnosis of performance and UX issues with the Solar Flare Event popup system identified during testing.

## Issue 1: UI Drag is Super Sluggish
**Root Cause:** The drag implementation in FloatingPanelManager.tsx has performance issues:
- `handleDragMove` updates React state on every mousemove event 
- setState inside Map operations is heavy and causes re-renders
- No throttling/debouncing on mouse events
- Transform and positioning calculations happen on every mouse move

**Location:** `/src/components/HUD/FloatingPanels/FloatingPanelManager.tsx` lines 181-210

## Issue 2: Popups Show by Default 
**Root Cause:** Solar visualizations are enabled by default in config:
- `NOAAVisualizationConfig.ts` line 44: `enabled: true` for 'xray-sun-glow'
- `NOAAFloatingIntegration.tsx` automatically activates solar panels when visualization is enabled
- No feature flag or user setting to control auto-popup behavior
- Panels appear immediately on component mount

**Location:** 
- `/src/components/HUD/Bars/LeftSideBar/NOAAVisualizationConfig.ts` line 44
- `/src/components/HUD/FloatingPanels/NOAAFloatingIntegration.tsx` lines 46-50

## Issue 3: Poor Positioning (Too High and Right)
**Root Cause:** Fixed positioning doesn't account for UI layout:
- Solar panel positioned at `x: window.innerWidth - 200, y: 150`
- No consideration for TopBar height or RightSideBar width
- `transform: translate(-50%, -50%)` centers panel at position, causing overlap
- No boundary checking or responsive positioning

**Location:** `/src/components/HUD/FloatingPanels/NOAAFloatingIntegration.tsx` lines 56-60

## Issue 4: Covers UI Elements
**Root Cause:** High z-index and no collision detection:
- Panels use `z-index: 2000+` which is higher than most UI elements
- No smart positioning to avoid TopBar and RightSideBar
- Panel positioning doesn't respect UI boundaries

**Location:** `/src/components/HUD/FloatingPanels/FloatingPanelManager.tsx` line 79

## Additional Issues Found:
- No throttling of drag events causing performance degradation
- No touch/mobile support for dragging
- Panels don't respect viewport boundaries
- Alert animation pulses indefinitely (distracting)
