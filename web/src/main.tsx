import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { themeCss } from "./model/theme";
import "./styles.css";

const style = document.createElement("style");
style.textContent = themeCss();
document.head.appendChild(style);

const demo = new URLSearchParams(window.location.search).has("demo");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App demo={demo} />
  </StrictMode>,
);
