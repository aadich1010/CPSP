'use client';

import React from 'react';

interface SkippedQuestionCardProps {
  questionNumber: number;
  questionText: string;
  options?: string[];
  explanation?: string;
}

export const SkippedQuestionCard = ({
  questionNumber,
  questionText,
  options,
  explanation
}: SkippedQuestionCardProps) => {
  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 my-4 animate-fade-in">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-yellow-300 text-yellow-900 font-bold text-lg">
            ⊘
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <p className="font-semibold text-yellow-900 mb-3">
            Question No {questionNumber} — SKIPPED
          </p>

          {/* Question Text */}
          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed">{questionText}</p>
          </div>

          {/* Options (if provided) */}
          {options && options.length > 0 && (
            <div className="mb-4 bg-white p-4 rounded border border-yellow-200">
              <p className="text-sm font-medium text-gray-600 mb-3">Available Options:</p>
              <div className="space-y-2">
                {options.map((option, idx) => (
                  <div key={idx} className="text-sm text-gray-600">
                    <span className="font-medium">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {' '}{option}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div className="bg-white/50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-700 italic">
              ℹ️ You didn't attempt this question during the exam. Review the question and options above to understand what you missed.
            </p>
          </div>

          {/* Optional: Show explanation if available */}
          {explanation && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-yellow-700 hover:text-yellow-900 transition-colors">
                📚 View Explanation
              </summary>
              <div className="mt-2 p-3 bg-white border border-yellow-200 rounded text-sm text-gray-700">
                {explanation}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkippedQuestionCard;
