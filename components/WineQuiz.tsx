"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, XCircle, Trophy } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const questions: QuizQuestion[] = [
  {
    question: "葡萄酒的單寧主要來自哪裡？",
    options: ["葡萄皮", "葡萄籽", "葡萄果肉", "橡木桶"],
    correct: 0,
    explanation: "單寧主要來自葡萄皮和葡萄籽，紅酒因為帶皮發酵，所以單寧含量較高。",
  },
  {
    question: "哪個產區以生產香檳聞名？",
    options: ["波爾多", "勃艮第", "香檳區", "羅納河谷"],
    correct: 2,
    explanation: "只有法國香檳區生產的氣泡酒才能稱為香檳（Champagne）。",
  },
  {
    question: "適飲溫度最高的葡萄酒類型是？",
    options: ["紅酒", "白酒", "香檳", "粉紅酒"],
    correct: 0,
    explanation: "紅酒通常適飲溫度在 16-18°C，比白酒和香檳的適飲溫度高。",
  },
  {
    question: "葡萄酒的年份指的是什麼？",
    options: ["裝瓶年份", "葡萄採收年份", "上市年份", "釀造完成年份"],
    correct: 1,
    explanation: "葡萄酒的年份指的是葡萄採收的年份，這對葡萄酒的品質和風味有重要影響。",
  },
];

interface WineQuizProps {
  onClose: () => void;
}

export default function WineQuiz({ onClose }: WineQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handleAnswer = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
    if (index === questions[currentQuestion].correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          <Trophy className="w-20 h-20 text-accent-gold mx-auto mb-4" />
          <h3 className="text-3xl font-serif font-bold text-neutral-900 mb-4">
            測驗完成！
          </h3>
          <div className="text-5xl font-bold text-primary-600 mb-2">
            {score} / {questions.length}
          </div>
          <div className="text-xl text-neutral-600 mb-6">
            正確率：{percentage}%
          </div>
          <div className="space-y-2">
            {percentage >= 80 && (
              <p className="text-lg text-primary-600 font-semibold">
                優秀！您對葡萄酒有深入的了解！
              </p>
            )}
            {percentage >= 60 && percentage < 80 && (
              <p className="text-lg text-primary-600 font-semibold">
                不錯！繼續學習會更上一層樓！
              </p>
            )}
            {percentage < 60 && (
              <p className="text-lg text-primary-600 font-semibold">
                繼續加油！多閱讀我們的知識文章會有所幫助！
              </p>
            )}
          </div>
        </motion.div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setCurrentQuestion(0);
              setScore(0);
              setShowResult(false);
              setSelectedAnswer(null);
              setAnswered(false);
            }}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="重新開始測驗"
          >
            再測一次
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="關閉測驗"
          >
            關閉
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold text-neutral-900">
          葡萄酒知識測驗
        </h2>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
          aria-label="關閉測驗"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-600">
            題目 {currentQuestion + 1} / {questions.length}
          </span>
          <span className="text-sm text-neutral-600">
            分數：{score} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            className="bg-primary-600 h-2 rounded-full"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-serif font-semibold text-neutral-900 mb-6">
          {question.question}
        </h3>
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correct;
            const showResult = answered;

            return (
              <motion.button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={answered}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  showResult
                    ? isCorrect
                      ? "border-green-500 bg-green-50"
                      : isSelected && !isCorrect
                      ? "border-red-500 bg-red-50"
                      : "border-neutral-200 bg-white"
                    : isSelected
                    ? "border-primary-600 bg-primary-50"
                    : "border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50/50"
                } disabled:cursor-not-allowed`}
                whileHover={!answered ? { scale: 1.02 } : {}}
                whileTap={!answered ? { scale: 0.98 } : {}}
                aria-label={`選擇答案：${option}${showResult ? (isCorrect ? "（正確）" : isSelected && !isCorrect ? "（錯誤）" : "") : ""}`}
                aria-pressed={isSelected ? "true" : "false"}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900">{option}</span>
                  {showResult && isCorrect && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200"
        >
          <p className="text-sm font-semibold text-primary-700 mb-2">解釋：</p>
          <p className="text-sm text-neutral-700">{question.explanation}</p>
        </motion.div>
      )}

      {answered && (
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label={currentQuestion < questions.length - 1 ? "前往下一題" : "查看測驗結果"}
          >
            {currentQuestion < questions.length - 1 ? "下一題" : "查看結果"}
          </button>
        </div>
      )}
    </div>
  );
}

