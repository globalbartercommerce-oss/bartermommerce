import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "../build/server";

export const onRequest = async (context: any) => {
  // Simple shim for process.env
  if (typeof process === "undefined") {
    globalThis.process = { env: context.env } as any;
  } else {
    Object.assign(process.env, context.env);
  }

  const handler = createPagesFunctionHandler({
    build: build as any,
    getLoadContext: (context: any) => ({ env: context.env }),
  });

  try {
    return await handler(context);
  } catch (error: any) {
    console.error("Runtime Error in Pages Function:", error);
    return new Response(
      `Internal Server Error\n\n${error.message}\n${error.stack}`,
      { status: 500 }
    );
  }
};
