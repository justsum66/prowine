// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",
  
  replaysOnErrorSampleRate: 1.0,
  
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
  
  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // 過濾敏感信息
  beforeSend(event, hint) {
    // 移除敏感數據
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['authorization'];
      delete event.request.headers?.['cookie'];
    }
    return event;
  },
  
  // 忽略某些錯誤
  ignoreErrors: [
    // 瀏覽器擴展錯誤
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // 網絡錯誤
    'NetworkError',
    'Failed to fetch',
  ],
});
