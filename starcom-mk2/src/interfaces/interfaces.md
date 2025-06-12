# Interfaces Folder

## Purpose
This folder contains **TypeScript interfaces and types** to define data structures.

## Naming Convention
- Interfaces should be named in **PascalCase**.
- Example: `MarketData.ts`

## Example Usage
```tsx
export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
}
```

# Why This Matters for Copilot

Copilot should use this folder to reference type definitions when generating functions and components.

## 📂 Interfaces/ (TypeScript Type Definitions)
	•	What it is:
	•	Stores TypeScript interfaces & types for props, API responses, and global state.
	•	Keeps TypeScript code organized & maintainable.
	•	When to use:
	•	When you need a consistent contract for data across components.
	•	When your app interacts with external APIs or complex data structures.

Interfaces - TypeScript Data Definitions

🔹 What it is:
	•	Stores TypeScript types & interfaces for props, API responses, and state.
	•	Keeps data structures organized and avoids type duplication.

🔹 How it connects:
✅ Screens, Views, and Components import these interfaces for type safety.
✅ Interfaces create a contract between the UI and API data.