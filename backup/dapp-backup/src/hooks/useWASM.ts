import { useContext } from "react";
import { WASMContext } from "../context/WASMContext.tsx";

const useWASM = () => {
  const context = useContext(WASMContext);
  if (!context) {
    throw new Error("useWASM must be used within a WASMProvider");
  }
  return context;
};

export default useWASM;
