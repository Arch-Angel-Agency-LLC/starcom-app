# Components Folder

## Purpose
Components are **small, reusable UI elements** used across the app.

## How It Works
- Components should be **stateless and presentational**.
- They should not contain **business logic** or handle API calls.

## Naming Convention
- Use **PascalCase** for components.
- Example: `Button.tsx`, `StockChart.tsx`

## Example Usage
```tsx
export function Button({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick}>{label}</button>;
}
```

# Why This Matters for Copilot

Copilot should only generate presentational UI elements in this folder.

## 📂 Components/ (Reusable UI Elements)
	•	What it is:
	•	The smallest UI building blocks that make up Screens, Views, and Windows.
	•	Components are purely presentational and do not handle complex logic.
	•	When to use:
	•	When you need a button, card, chart, table, form, or other small UI elements.
	•	When you want to ensure maximum reusability.