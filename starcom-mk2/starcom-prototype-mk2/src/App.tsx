import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/routes";
import { WASMProvider } from "./context/WASMContext";
import "./styles/globals.css";

const App: React.FC = () => {
  return (
    <WASMProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </WASMProvider>
  );
};

export default App;