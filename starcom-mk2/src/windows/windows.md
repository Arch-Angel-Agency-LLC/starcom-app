# Windows Folder

## Purpose
Windows are **interactive UI elements** like **modals, floating panels, and draggable windows**.

## How It Works
- Windows **should not be part of the main screen layout**.
- They are **triggered dynamically** via user interaction.
- They should support **open/close state management**.

## Naming Convention
- Name Windows descriptively and use **PascalCase**.
- Example: `MarketAnalysisWindow.tsx`

## Example Usage
```tsx
export function MarketAnalysisWindow({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="window">
      <h2>Market Analysis</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

# Why This Matters for Copilot

Copilot should generate self-contained, floating UI elements when working in Windows.

## 📂 Windows/ (Floating Interactive UI Elements)
	•	What it is:
	•	Represents draggable, resizable, pop-up interfaces like modal windows or floating data dashboards.
	•	Used when the UI should feel like a software interface rather than a website.
	•	When to use:
	•	For pop-ups, modals, overlays, or floating UI elements.
	•	If a feature needs to be interactive but not part of the main page flow.