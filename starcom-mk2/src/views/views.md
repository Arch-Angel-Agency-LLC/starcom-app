# Views Folder

## Purpose
Views are **self-contained UI displays** that are used **inside Screens**.

## How It Works
- A View should **not manage complex state or logic**.
- Views **receive props** and focus on displaying **data only**.
- They should be **reusable across multiple Screens**.

## Naming Convention
- Name Views descriptively and use **PascalCase**.
- Example: `StockMarketView.tsx`

## Example Usage
```tsx
export function StockMarketView({ price }: { price: number }) {
  return <p>Stock Price: ${price}</p>;
}
```

# Why This Matters for Copilot

Copilot should generate lightweight, reusable UI components inside Views, not complex logic handlers.

## 📂 Views/ (UI Sections That Render Data)
	•	What it is:
	•	A view is a specific visual representation of data that is often reused across screens.
	•	Views do not contain heavy logic (they only display data).
	•	When to use:
	•	When you need a customized display for different types of data.
	•	When you need a UI representation that doesn’t manage business logic.

Views - UI Sections That Render Data

🔹 What it is:
	•	Represent specific parts of a Screen.
	•	Display pre-processed data (but do NOT manage business logic).
	•	Often used multiple times in different Screens.

🔹 How it connects:
✅ A Screen can contain multiple Views to show different types of data.
✅ A View should be simple and focus on displaying information.