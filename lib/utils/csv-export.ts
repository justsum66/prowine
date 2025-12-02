/**
 * CSV/Excel 匯出工具函數
 */

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  encoding?: "utf-8" | "utf-8-bom";
}

/**
 * 將數據轉換為CSV格式
 */
export function convertToCSV(
  data: any[],
  headers: string[],
  options: ExportOptions = {}
): string {
  const { includeHeaders = true, encoding = "utf-8-bom" } = options;

  const rows: string[] = [];

  // 添加BOM（用於Excel正確顯示中文）
  if (encoding === "utf-8-bom") {
    rows.push("\uFEFF");
  }

  // 添加標題行
  if (includeHeaders) {
    rows.push(headers.map((h) => escapeCSVField(h)).join(","));
  }

  // 添加數據行
  data.forEach((item) => {
    const row = headers.map((header) => {
      const value = getNestedValue(item, header);
      return escapeCSVField(value);
    });
    rows.push(row.join(","));
  });

  return rows.join("\n");
}

/**
 * 轉義CSV字段
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // 如果包含逗號、引號或換行符，需要用引號包裹
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * 獲取嵌套對象的值
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split(".");
  let value = obj;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return "";
    }
    value = value[key];
  }

  return value ?? "";
}

/**
 * 下載CSV文件
 */
export function downloadCSV(
  csvContent: string,
  filename: string = "export.csv"
): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 解析CSV文件
 */
export function parseCSV(csvText: string): { headers: string[]; rows: any[] } {
  const lines = csvText.split("\n").filter((line) => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // 移除BOM
  const firstLine = lines[0].replace(/^\uFEFF/, "");
  const headers = parseCSVLine(firstLine);

  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });

  return { headers, rows };
}

/**
 * 解析CSV行
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 轉義的引號
        current += '"';
        i++; // 跳過下一個引號
      } else {
        // 切換引號狀態
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // 字段分隔符
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // 添加最後一個字段
  values.push(current.trim());

  return values;
}

/**
 * 驗證CSV數據格式
 */
export function validateCSVData(
  rows: any[],
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (rows.length === 0) {
    errors.push("CSV文件為空");
    return { valid: false, errors };
  }

  rows.forEach((row, index) => {
    requiredFields.forEach((field) => {
      if (!row[field] || row[field].trim() === "") {
        errors.push(`第 ${index + 2} 行缺少必填字段: ${field}`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

