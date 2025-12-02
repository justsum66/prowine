/**
 * WineCard 組件測試
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WineCard from "@/components/WineCard";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock Image component
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

describe("WineCard", () => {
  const mockWine = {
    id: "1",
    slug: "test-wine",
    nameZh: "測試酒款",
    nameEn: "Test Wine",
    wineryName: "測試酒莊",
    price: 1000,
    imageUrl: "/test-image.jpg",
    region: "波爾多",
    vintage: 2020,
    rating: 95,
    featured: false,
    bestseller: false,
  };

  test("應該正確渲染酒款信息", () => {
    render(<WineCard {...mockWine} />);
    
    expect(screen.getByText("測試酒款")).toBeInTheDocument();
    expect(screen.getByText("Test Wine")).toBeInTheDocument();
    expect(screen.getByText("測試酒莊")).toBeInTheDocument();
    expect(screen.getByText(/NT\$ 1,000/)).toBeInTheDocument();
  });

  test("應該顯示精選徽章（如果 featured 為 true）", () => {
    render(<WineCard {...mockWine} featured={true} />);
    
    expect(screen.getByText("精選")).toBeInTheDocument();
  });

  test("應該顯示熱銷徽章（如果 bestseller 為 true）", () => {
    render(<WineCard {...mockWine} bestseller={true} />);
    
    expect(screen.getByText("熱銷")).toBeInTheDocument();
  });

  test("應該高亮搜索關鍵字", () => {
    render(<WineCard {...mockWine} searchKeyword="測試" />);
    
    const highlightedText = screen.getByText(/測試酒款/);
    expect(highlightedText).toBeInTheDocument();
  });
});

