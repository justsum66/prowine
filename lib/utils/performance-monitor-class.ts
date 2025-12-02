"use client";

/**
 * 性能監控類（用於 PerformanceDashboard 組件）
 */

interface PerformanceReport {
  api: {
    average: number;
    fastest: number;
    slowest: number;
    count: number;
  };
  render: {
    average: number;
    fastest: number;
    slowest: number;
    count: number;
  };
  image: {
    average: number;
    fastest: number;
    slowest: number;
    count: number;
  };
}

class PerformanceMonitor {
  private apiTimes: number[] = [];
  private renderTimes: number[] = [];
  private imageTimes: number[] = [];

  recordApi(time: number) {
    this.apiTimes.push(time);
    // 只保留最近 100 個記錄
    if (this.apiTimes.length > 100) {
      this.apiTimes.shift();
    }
  }

  recordRender(time: number) {
    this.renderTimes.push(time);
    if (this.renderTimes.length > 100) {
      this.renderTimes.shift();
    }
  }

  recordImage(time: number) {
    this.imageTimes.push(time);
    if (this.imageTimes.length > 100) {
      this.imageTimes.shift();
    }
  }

  private calculateStats(times: number[]) {
    if (times.length === 0) {
      return { average: 0, fastest: 0, slowest: 0, count: 0 };
    }
    const sum = times.reduce((a, b) => a + b, 0);
    return {
      average: sum / times.length,
      fastest: Math.min(...times),
      slowest: Math.max(...times),
      count: times.length,
    };
  }

  getReport(): PerformanceReport {
    return {
      api: this.calculateStats(this.apiTimes),
      render: this.calculateStats(this.renderTimes),
      image: this.calculateStats(this.imageTimes),
    };
  }

  clear() {
    this.apiTimes = [];
    this.renderTimes = [];
    this.imageTimes = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

