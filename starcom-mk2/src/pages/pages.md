# Pages

## Purpose
This folder contains **top-level route components** that define the **main sections** of the Starcom App.

## How It Works
- Each Page corresponds to a **unique route** in the app.
- Pages should only be responsible for **high-level layout and routing**.
- Pages should delegate content to **Screens** instead of containing complex logic.

## Naming Convention
- Page components should be named **PascalCase** (e.g., `Dashboard.tsx`, `Market.tsx`).
- Each Page should import necessary **Screens** and **Windows**.

## Example Usage
```tsx
import { MarketScreen } from "../screens/MarketScreen";

export function MarketPage() {
  return <MarketScreen />;
}
```

# Why This Matters for Copilot

Copilot should understand that Pages are for routing and should not contain complex UI logic.

## Pages - Route-Based Containers (Top Level)

🔹 What it is:
	•	Top-level UI units corresponding to routes (/dashboard, /market).
	•	Entry points into the app’s main sections.
	•	Each Page is registered in React Router (App.tsx or routes.tsx).

🔹 How it connects:
✅ A Page can contain multiple Screens.
✅ Pages determine navigation behavior (e.g., useNavigate()).