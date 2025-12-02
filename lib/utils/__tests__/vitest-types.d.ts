/**
 * Vitest 類型定義補充
 * 為測試文件提供類型支持
 */

declare module "vitest" {
  export const describe: any;
  export const it: any;
  export const expect: any;
  export const vi: any;
  export const beforeEach: any;
  export const afterEach: any;
}

