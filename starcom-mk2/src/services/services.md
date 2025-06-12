# Services Folder

## Purpose
This folder contains **functions for fetching and processing data**.

## Naming Convention
- Name service files after **their data type**.
- Example: `marketService.ts`

## Example Usage
```tsx
export async function fetchMarketData() {
  const res = await fetch("/api/market");
  return res.json();
}
```

# Why This Matters for Copilot

Copilot should only generate API handling logic in this folder.

## Services/ (API Handlers & Data Fetching)
	•	What it is: A centralized place for API calls.