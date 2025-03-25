#!/usr/bin/env bun

import { serve } from "bun";
import { readFileSync } from "fs";
import { join } from "path";

const PORT = process.env.PORT || 3000;

console.log(`Starting dashboard server on port ${PORT}...`);

// Define MIME types for common files
const MIME_TYPES: { [key: string]: string } = {
  ".html": "text/html",
  ".json": "application/json",
  ".js": "text/javascript",
  ".css": "text/css",
};

serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    // Normalize path
    if (path === "/" || path === "") {
      path = "/index.html";
    }

    try {
      let filePath: string;
      let contentType: string;

      // Handle data files
      if (path.startsWith("/data/")) {
        filePath = path.slice(1); // Remove leading slash
        contentType = "application/json";
      }
      // Handle dashboard files
      else {
        filePath = join("dashboard", path.replace(/^\//, ""));
        const ext = path.match(/\.[^.]+$/)?.[0] || "";
        contentType = MIME_TYPES[ext] || "text/plain";
      }

      console.log(`Serving ${filePath} as ${contentType}`);

      try {
        const content = readFileSync(filePath, "utf-8");
        return new Response(content, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          console.warn(`File not found: ${filePath}`);
          return new Response("Not Found", { status: 404 });
        }
        throw error;
      }

    } catch (error) {
      console.error("Error serving request:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`Dashboard available at http://localhost:${PORT}`);
