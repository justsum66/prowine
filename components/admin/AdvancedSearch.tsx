"use client";

import { useState } from "react";
import { Search, X, Save, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast";

export interface SearchCondition {
  field: string;
  operator: "equals" | "contains" | "startsWith" | "endsWith" | "greaterThan" | "lessThan" | "between";
  value: string;
  value2?: string; // 用於between操作
}

export interface AdvancedSearchProps {
  fields: Array<{ label: string; value: string; type: "text" | "number" | "date" | "select"; options?: string[] }>;
  onSearch: (conditions: SearchCondition[]) => void;
  onSave?: (name: string, conditions: SearchCondition[]) => void;
  savedSearches?: Array<{ id: string; name: string; conditions: SearchCondition[] }>;
  onLoadSaved?: (conditions: SearchCondition[]) => void;
}

export default function AdvancedSearch({
  fields,
  onSearch,
  onSave,
  savedSearches = [],
  onLoadSaved,
}: AdvancedSearchProps) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [conditions, setConditions] = useState<SearchCondition[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        field: fields[0]?.value || "",
        operator: "contains",
        value: "",
      },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<SearchCondition>) => {
    setConditions(
      conditions.map((cond, i) => (i === index ? { ...cond, ...updates } : cond))
    );
  };

  const handleSearch = () => {
    const validConditions = conditions.filter((c) => c.value.trim() !== "");
    onSearch(validConditions);
    setIsOpen(false);
  };

  const handleSave = () => {
    if (!saveName.trim() || !onSave) {
      showToast("warning", "請輸入搜索條件名稱");
      return;
    }
    onSave(saveName, conditions);
    setSaveName("");
    setShowSaveDialog(false);
    showToast("success", "搜索條件已保存");
  };

  const handleLoadSaved = (savedConditions: SearchCondition[]) => {
    setConditions(savedConditions);
    onLoadSaved?.(savedConditions);
    setIsOpen(false);
  };

  const getFieldType = (fieldValue: string) => {
    return fields.find((f) => f.value === fieldValue)?.type || "text";
  };

  const getFieldOptions = (fieldValue: string) => {
    return fields.find((f) => f.value === fieldValue)?.options || [];
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-600 flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        高級搜索
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-50 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">高級搜索</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 已保存的搜索 */}
            {savedSearches.length > 0 && (
              <div className="mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">已保存的搜索：</p>
                <div className="space-y-1">
                  {savedSearches.map((saved) => (
                    <button
                      key={saved.id}
                      onClick={() => handleLoadSaved(saved.conditions)}
                      className="w-full text-left px-2 py-1 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
                    >
                      {saved.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 搜索條件 */}
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {conditions.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                  點擊「添加條件」開始
                </p>
              ) : (
                conditions.map((condition, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <select
                      value={condition.field}
                      onChange={(e) => updateCondition(index, { field: e.target.value, value: "" })}
                      className="flex-1 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    >
                      {fields.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, { operator: e.target.value as any })}
                      className="px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="equals">等於</option>
                      <option value="contains">包含</option>
                      <option value="startsWith">開頭為</option>
                      <option value="endsWith">結尾為</option>
                      <option value="greaterThan">大於</option>
                      <option value="lessThan">小於</option>
                      <option value="between">介於</option>
                    </select>

                    {getFieldType(condition.field) === "select" ? (
                      <select
                        value={condition.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        className="flex-1 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="">請選擇</option>
                        {getFieldOptions(condition.field).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : getFieldType(condition.field) === "date" ? (
                      <input
                        type="date"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        className="flex-1 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                      />
                    ) : (
                      <input
                        type={getFieldType(condition.field)}
                        value={condition.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        placeholder="輸入值"
                        className="flex-1 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                      />
                    )}

                    {condition.operator === "between" && (
                      <input
                        type={getFieldType(condition.field)}
                        value={condition.value2 || ""}
                        onChange={(e) => updateCondition(index, { value2: e.target.value })}
                        placeholder="到"
                        className="flex-1 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                      />
                    )}

                    <button
                      onClick={() => removeCondition(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* 操作按鈕 */}
            <div className="flex items-center gap-2">
              <button
                onClick={addCondition}
                className="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-600"
              >
                添加條件
              </button>
              {onSave && conditions.length > 0 && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-600"
                  title="保存搜索條件"
                >
                  <Save className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSearch}
                className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                搜索
              </button>
            </div>

            {/* 保存對話框 */}
            {showSaveDialog && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
                <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 w-64">
                  <h4 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">保存搜索條件</h4>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="輸入名稱"
                    className="w-full px-3 py-2 mb-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


