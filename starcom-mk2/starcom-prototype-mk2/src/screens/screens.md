📂 Screens/ (Large UI Containers with Business Logic)
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