"use client";

import { useState } from "react";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/lib/utils/logger-production";

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  helpfulCount: number;
  createdAt: string;
  verified?: boolean;
}

interface WineReviewsProps {
  wineId: string;
  averageRating?: number;
  reviewCount?: number;
  reviews?: Review[];
  onReviewSubmit?: (rating: number, comment: string) => Promise<void>;
}

export default function WineReviews({
  wineId,
  averageRating = 0,
  reviewCount = 0,
  reviews = [],
  onReviewSubmit,
}: WineReviewsProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    if (!showReviewForm) {
      setShowReviewForm(true);
    }
  };

  const handleSubmit = async () => {
    if (selectedRating === 0 || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      await onReviewSubmit?.(selectedRating, comment);
      setSelectedRating(0);
      setComment("");
      setShowReviewForm(false);
    } catch (error) {
      logger.error(
        "Failed to submit review",
        error instanceof Error ? error : new Error(String(error)),
        { component: "WineReviews", wineId, rating: selectedRating }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = (reviewId: string) => {
    const newSet = new Set(helpfulReviews);
    if (newSet.has(reviewId)) {
      newSet.delete(reviewId);
    } else {
      newSet.add(reviewId);
    }
    setHelpfulReviews(newSet);
  };

  const renderStars = (rating: number, interactive = false, size = "w-5 h-5") => {
    return (
      <div 
        className="flex items-center gap-1"
        role={interactive ? "radiogroup" : "img"}
        aria-label={interactive ? "評分選擇" : `評分：${rating} 顆星`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => handleRatingClick(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleRatingClick(star);
              }
            }}
            className={`${interactive ? "cursor-pointer min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded" : ""}`}
            aria-label={interactive ? `評分 ${star} 顆星` : undefined}
            aria-pressed={interactive ? star <= selectedRating : undefined}
            tabIndex={interactive ? 0 : undefined}
          >
            <Star
              className={`${size} ${
                star <= (interactive ? hoveredRating || selectedRating : rating)
                  ? "fill-accent-gold text-accent-gold"
                  : "text-neutral-300"
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Review Summary */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-serif font-bold text-neutral-900 mb-2">
              評價與評論
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {renderStars(Math.round(averageRating))}
                <span className="text-2xl font-bold text-neutral-900">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-neutral-600">
                共 {reviewCount} 則評價
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="btn-primary px-6 py-2 flex items-center gap-2 min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label={showReviewForm ? "關閉評價表單" : "開啟評價表單"}
            aria-expanded={showReviewForm}
          >
            <MessageCircle className="w-4 h-4" />
            寫評價
          </button>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviews.filter((r) => r.rating === rating).length;
            const percentage =
              reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm text-neutral-600 w-8">{rating} 星</span>
                <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full bg-accent-gold"
                  />
                </div>
                <span className="text-sm text-neutral-600 w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg border border-neutral-200 p-6"
            role="region"
            aria-label="撰寫評價表單"
          >
            <h4 className="font-semibold text-neutral-900 mb-4">撰寫評價</h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="review-rating" className="block text-sm font-medium text-neutral-700 mb-2">
                  評分 <span className="text-primary-600" aria-label="必填">*</span>
                </label>
                <div id="review-rating">
                  {renderStars(selectedRating, true)}
                </div>
              </div>
              <div>
                <label htmlFor="review-comment" className="block text-sm font-medium text-neutral-700 mb-2">
                  評論內容
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="input w-full min-h-[44px] md:min-h-[auto]"
                  placeholder="分享您對這款葡萄酒的體驗..."
                  aria-required="true"
                  aria-describedby="review-comment-description"
                />
                <p id="review-comment-description" className="sr-only">
                  請分享您對這款葡萄酒的體驗和感受
                </p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setSelectedRating(0);
                    setComment("");
                  }}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-900 min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  aria-label="取消撰寫評價"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedRating === 0 || !comment.trim()}
                  className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label={isSubmitting ? "送出評價中" : "送出評價"}
                  aria-disabled={isSubmitting || selectedRating === 0 || !comment.trim()}
                >
                  {isSubmitting ? (
                    "送出中..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      送出評價
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600">尚無評價，成為第一個評價的人！</p>
          </div>
        ) : (
          reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-neutral-200 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {review.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900">
                        {review.userName}
                      </span>
                      {review.verified && (
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                          已驗證
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating, false, "w-4 h-4")}
                      <span className="text-xs text-neutral-500">
                        {new Date(review.createdAt).toLocaleDateString("zh-TW")}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  className="text-neutral-400 hover:text-neutral-600 min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  aria-label={`檢舉 ${review.userName} 的評價`}
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
              <p className="text-neutral-700 mb-4">{review.comment}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleHelpful(review.id)}
                  className={`flex items-center gap-2 text-sm min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 ${
                    helpfulReviews.has(review.id)
                      ? "text-primary-600"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                  aria-label={helpfulReviews.has(review.id) ? "取消標記為有用" : "標記為有用"}
                  aria-pressed={helpfulReviews.has(review.id)}
                >
                  {helpfulReviews.has(review.id) ? (
                    <ThumbsUp className="w-4 h-4 fill-current" />
                  ) : (
                    <ThumbsUp className="w-4 h-4" />
                  )}
                  <span>有用 ({review.helpfulCount})</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

