/**
 * 按鈕屬性工具測試
 */

import { describe, it, expect, vi } from "vitest";
import { createButtonProps, createLinkProps, StandardButtonProps } from "../button-props";

describe("button-props", () => {
  describe("createButtonProps", () => {
    it("應該創建標準按鈕屬性", () => {
      const onClick = vi.fn();
      const props = createButtonProps(onClick);

      expect(props.onClick).toBeDefined();
      expect(props.onTouchStart).toBeDefined();
      expect(props.className).toContain("touch-manipulation");
      expect(props.style).toHaveProperty("WebkitTapHighlightColor", "transparent");
      expect(props.type).toBe("button");
    });

    it("應該包含自定義類名", () => {
      const onClick = vi.fn();
      const props = createButtonProps(onClick, {
        className: "custom-class",
      });

      expect(props.className).toContain("custom-class");
    });

    it("應該設置 aria-label", () => {
      const onClick = vi.fn();
      const props = createButtonProps(onClick, {
        "aria-label": "測試按鈕",
      });

      expect(props["aria-label"]).toBe("測試按鈕");
    });

    it("應該設置 disabled 狀態", () => {
      const onClick = vi.fn();
      const props = createButtonProps(onClick, {
        disabled: true,
      });

      expect(props.disabled).toBe(true);
    });

    it("應該設置 type", () => {
      const onClick = vi.fn();
      const props = createButtonProps(onClick, {
        type: "submit",
      });

      expect(props.type).toBe("submit");
    });

    it("應該執行 onClick 回調", () => {
      const onClick = vi.fn();
      const props = createButtonProps(onClick);
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as any;

      props.onClick?.(mockEvent);

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("createLinkProps", () => {
    it("應該創建標準連結屬性", () => {
      const props = createLinkProps();

      expect(props.onTouchStart).toBeDefined();
      expect(props.className).toContain("touch-manipulation");
      expect(props.style).toHaveProperty("WebkitTapHighlightColor", "transparent");
    });

    it("應該包含 onClick 當提供時", () => {
      const onClick = vi.fn();
      const props = createLinkProps(onClick);

      expect(props.onClick).toBeDefined();
    });

    it("應該執行 onClick 回調", () => {
      const onClick = vi.fn();
      const props = createLinkProps(onClick);
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as any;

      props.onClick?.(mockEvent);

      expect(onClick).toHaveBeenCalled();
    });

    it("應該包含自定義類名", () => {
      const props = createLinkProps(undefined, {
        className: "custom-link-class",
      });

      expect(props.className).toContain("custom-link-class");
    });
  });
});

