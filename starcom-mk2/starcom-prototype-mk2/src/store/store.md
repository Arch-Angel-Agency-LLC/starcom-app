# Store Folder

## Purpose
This folder contains **global state management logic**.

## How It Works
- Stores manage **app-wide state** that multiple Screens or Components need.
- We use **Zustand** for lightweight global state.

## Example Usage
```tsx
import { create } from "zustand";

export const useMarketStore = create((set) => ({
  marketData: [],
  setMarketData: (data) => set({ marketData: data }),
}));
```

# Why This Matters for Copilot

Copilot should use this folder for stateful logic and avoid mixing business logic into UI files.

## Store/ (State Management - Redux, Zustand, or Context API)
	•	What it is: Global state management.

