# Routes Folder

## Purpose
This folder defines **all app-wide routes** using React Router.

## Example Usage
```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Dashboard } from "../pages/Dashboard";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

# Why This Matters for Copilot

Copilot should only generate route logic here and avoid mixing it into Pages.