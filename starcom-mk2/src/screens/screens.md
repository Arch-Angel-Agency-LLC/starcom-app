# Screens Folder

## Purpose
Screens are **major UI sections** of Starcom, typically **rendered inside a Page**.
They serve as **containers for Views, Components, and Windows**.

## How It Works
- Screens manage **data fetching, state, and interactions**.
- A Screen should **not define global routes** (that's the job of Pages).
- Screens typically handle business logic **specific to their section** of the app.

## Naming Convention
- Screen components should be named **PascalCase** and end with `Screen`.
- Example: `ThreatAnalysisScreen.tsx`

## Example Usage
```tsx
import { ThreatGraphView } from "../views/ThreatGraphView";
import { MarketSentimentView } from "../views/MarketSentimentView";

export function ThreatAnalysisScreen() {
  return (
    <div>
      <ThreatGraphView />
      <MarketSentimentView />
    </div>
  );
}
```

# Why This Matters for Copilot

Copilot should treat Screens as the main UI sections that contain Views and Components, not as global route handlers.

## 📂 Screens/ (Large UI Containers with Business Logic)
	•	What it is:
	•	Screens exist within Pages and represent major sections of a Page.
	•	Usually contain multiple components, data fetching, and UI logic.
	•	When to use:
	•	When the UI needs context-aware logic, such as data fetching, state management, and UI composition.
	•	Screens can contain Windows & Components but should not contain route logic.

📌 Note:
	•	Pages are major sections like MainPage, SettingsPage, etc.
	•	Screens are interactive overlays, menus, dashboards, and HUD elements found within these pages.
	•	Screens can stack dynamically, meaning users can have multiple screens open at once for maximum multitasking (like Stellaris’ layered UI).

Screens - Large UI Containers with Business Logic

🔹 What it is:
	•	Represent major sections of a Page.
	•	Handle data fetching, logic, state management.
	•	Screens can contain multiple Views, Components, and Windows.

🔹 How it connects:
✅ Screens render Views and Components to form a complete UI section.
✅ Screens handle API calls (fetching stock data, OSINT reports).