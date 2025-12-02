"use client";

/**
 * 飛行動畫工具（P1 BATCH7）
 * 實現商品加入購物車的飛行動畫效果
 */

export interface FlyAnimationOptions {
  fromElement: HTMLElement;
  toElement: HTMLElement | null;
  onComplete?: () => void;
  duration?: number;
}

/**
 * 創建飛行動畫元素
 */
export function createFlyingElement(
  element: HTMLElement,
  options: { width: number; height: number; imageUrl?: string }
): HTMLElement {
  const rect = element.getBoundingClientRect();
  const flyingElement = document.createElement("div");
  
  flyingElement.style.position = "fixed";
  flyingElement.style.left = `${rect.left}px`;
  flyingElement.style.top = `${rect.top}px`;
  flyingElement.style.width = `${options.width}px`;
  flyingElement.style.height = `${options.height}px`;
  flyingElement.style.zIndex = "9999";
  flyingElement.style.pointerEvents = "none";
  flyingElement.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
  
  if (options.imageUrl) {
    flyingElement.style.backgroundImage = `url(${options.imageUrl})`;
    flyingElement.style.backgroundSize = "cover";
    flyingElement.style.backgroundPosition = "center";
    flyingElement.style.borderRadius = "8px";
  } else {
    flyingElement.style.backgroundColor = "var(--gold)";
    flyingElement.style.borderRadius = "50%";
  }
  
  document.body.appendChild(flyingElement);
  
  // 觸發重排以確保初始位置正確
  flyingElement.offsetHeight;
  
  return flyingElement;
}

/**
 * 執行飛行動畫
 */
export function flyToCart(options: FlyAnimationOptions): Promise<void> {
  return new Promise((resolve) => {
    const { fromElement, toElement, onComplete, duration = 600 } = options;
    
    if (!toElement) {
      // 如果沒有目標元素，只顯示一個簡單的動畫
      const rect = fromElement.getBoundingClientRect();
      const flyingElement = createFlyingElement(fromElement, {
        width: 40,
        height: 40,
      });
      
      // 飛到屏幕右上角
      setTimeout(() => {
        flyingElement.style.transform = "translate(calc(100vw - 100px), 20px) scale(0.3)";
        flyingElement.style.opacity = "0";
      }, 10);
      
      setTimeout(() => {
        flyingElement.remove();
        onComplete?.();
        resolve();
      }, duration);
      return;
    }
    
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();
    
    // 創建飛行元素
    const flyingElement = createFlyingElement(fromElement, {
      width: fromRect.width,
      height: fromRect.height,
    });
    
    // 計算目標位置
    const targetX = toRect.left + toRect.width / 2;
    const targetY = toRect.top + toRect.height / 2;
    
    // 執行動畫
    requestAnimationFrame(() => {
      flyingElement.style.transform = `translate(${targetX - fromRect.left - fromRect.width / 2}px, ${targetY - fromRect.top - fromRect.height / 2}px) scale(0.3)`;
      flyingElement.style.opacity = "0";
    });
    
    setTimeout(() => {
      flyingElement.remove();
      onComplete?.();
      resolve();
    }, duration);
  });
}

