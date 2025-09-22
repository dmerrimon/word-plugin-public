import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";

/* global document, Office, module, require */

const title = "Protocol Assistant";

const rootElement = document.getElementById("container");
const root = createRoot(rootElement!);

/* Render application after Office initializes */
Office.onReady((info) => {
  console.log("Office is ready:", info);
  root.render(<App title={title} isOfficeInitialized={true} />);
});

if ((module as any).hot) {
  (module as any).hot.accept("./components/App", () => {
    const NextApp = require("./components/App").App;
    root.render(<NextApp title={title} isOfficeInitialized={true} />);
  });
}