/**
 * 觸控事件處理工具函數測試
 */

import { describe, it, expect, vi } from "vitest";
import {
  createClickHandler,
  createTouchHandler,
  createChangeHandler,
  navigateToUrl,
  createToggleHandler,
  TOUCH_STYLES,
  TOUCH_CLASSES,
} from "../touch-handlers";

describe("touch-handlers", () => {
  describe("TOUCH_STYLES", () => {
    it("應該包含 WebkitTapHighlightColor", () => {
      expect(TOUCH_STYLES).toHaveProperty("WebkitTapHighlightColor", "transparent");
    });
  });

  describe("TOUCH_CLASSES", () => {
    it("應該包含觸控優化類名", () => {
      expect(TOUCH_CLASSES).toContain("touch-manipulation");
      expect(TOUCH_CLASSES).toContain("min-h-[44px]");
      expect(TOUCH_CLASSES).toContain("min-w-[44px]");
    });
  });

  describe("createClickHandler", () => {
    it("應該執行回調函數", () => {
      const callback = vi.fn();
      const handler = createClickHandler(callback);
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as any;

      handler(mockEvent);

      expect(callback).toHaveBeenCalledWith(mockEvent);
    });

    it("應該阻止默認行為當 preventDefault 為 true", () => {
      const callback = vi.fn();
      const handler = createClickHandler(callback, { preventDefault: true });
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as any;

      handler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it("應該阻止事件冒泡當 stopPropagation 不為 false", () => {
      const callback = vi.fn();
      const handler = createClickHandler(callback, { stopPropagation: true });
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as any;

      handler(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it("不應該阻止事件冒泡當 stopPropagation 為 false", () => {
      const callback = vi.fn();
      const handler = createClickHandler(callback, { stopPropagation: false });
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as any;

      handler(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe("createTouchHandler", () => {
    it("應該阻止事件冒泡", () => {
      const handler = createTouchHandler();
      const mockEvent = {
        stopPropagation: vi.fn(),
      } as any;

      handler(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it("不應該阻止事件冒泡當 stopPropagation 為 false", () => {
      const handler = createTouchHandler({ stopPropagation: false });
      const mockEvent = {
        stopPropagation: vi.fn(),
      } as any;

      handler(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe("createChangeHandler", () => {
    it("應該執行回調函數", () => {
      const callback = vi.fn();
      const handler = createChangeHandler(callback);
      const mockEvent = {
        currentTarget: { value: "test" },
        stopPropagation: vi.fn(),
      } as any;

      handler(mockEvent);

      expect(callback).toHaveBeenCalledWith(mockEvent);
    });

    it("應該阻止事件冒泡", () => {
      const callback = vi.fn();
      const handler = createChangeHandler(callback);
      const mockEvent = {
        currentTarget: { value: "test" },
        stopPropagation: vi.fn(),
      } as any;

      handler(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe("navigateToUrl", () => {
    it("應該使用 router.push 當 router 存在", () => {
      const mockRouter = {
        push: vi.fn(),
      };
      const url = "/test";

      navigateToUrl(url, mockRouter);

      expect(mockRouter.push).toHaveBeenCalledWith(url);
    });

    it("應該使用 window.location.href 當 router 不存在且 window 存在", () => {
      const url = "/test";
      const originalLocation = window.location;
      const originalHref = originalLocation.href;

      // Mock window.location.href
      Object.defineProperty(window, "location", {
        writable: true,
        value: { ...originalLocation, href: "" },
      });

      navigateToUrl(url);

      expect((window.location as any).href).toBe(url);

      // Restore
      Object.defineProperty(window, "location", {
        writable: true,
        value: originalLocation,
      });
    });
  });

  describe("createToggleHandler", () => {
    it("應該切換狀態", () => {
      const setter = vi.fn();
      const handler = createToggleHandler(setter, false);
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as any;

      handler(mockEvent);

      expect(setter).toHaveBeenCalledWith(true);
    });
  });
});

