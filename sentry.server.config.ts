// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",
  
  // 過濾敏感信息
  beforeSend(event, hint) {
    // 移除敏感數據
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['authorization'];
      delete event.request.headers?.['cookie'];
    }
    
    // 移除環境變量中的敏感信息
    if (event.extra && typeof event.extra === 'object') {
      Object.keys(event.extra).forEach(key => {
        if (key.toLowerCase().includes('key') || 
            key.toLowerCase().includes('secret') || 
            key.toLowerCase().includes('password') ||
            key.toLowerCase().includes('token')) {
          delete event.extra![key];
        }
      });
    }
    
    return event;
  },
  
  // 忽略某些錯誤
  ignoreErrors: [
    'Unauthorized',
    'ECONNREFUSED',
    'ETIMEDOUT',
  ],
});
