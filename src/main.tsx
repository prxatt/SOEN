import React from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./Routes";

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<AppRoutes />);
}
