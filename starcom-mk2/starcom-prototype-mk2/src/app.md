App.tsx (Entry Point)
 ├── Pages (Route-based containers)
 │    ├── Screens (Major sections of a Page)
 │    │    ├── Views (Specific UI Displays inside a Screen)
 │    │    │    ├── Components (Reusable UI elements inside a View)
 │    │    ├── Windows (Pop-ups, floating interfaces)
 │    ├── Interfaces (TypeScript definitions for data)

 🔎 How Each Layer Works Together

1️⃣ Pages contain Screens (like the main sections of the app).
2️⃣ Screens organize Views (which structure the UI into logical parts).
3️⃣ Views render Components (reusable UI elements like buttons and charts).
4️⃣ Windows provide interactive floating interfaces (modals, pop-ups).
5️⃣ Interfaces define TypeScript data structures that connect everything.

Folder - Purpose
Pages/ - Full-route containers
Screens/ - UI sections inside Pages
Views/ - Specific data representations
Windows/ - Pop-ups & floating UI
Components/ - Reusable UI elements
Interfaces/ - TypeScript type definitions
Hooks/ - Reusable state logic
Store/ - Global state management
Services/ - API handlers