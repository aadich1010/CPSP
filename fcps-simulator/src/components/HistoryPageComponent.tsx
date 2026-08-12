'use client';

interface ExamAttempt {
  id: string;
  subject: string;
  score: number;
  total_questions: number;
  created_at: string;
}

// History Table Row
const HistoryRow = ({ attempt }: { attempt: ExamAttempt }) => {
  const pct = attempt.total_questions > 0
    ? Math.round((attempt.score / attempt.total_questions) * 100)
    : 0;
  const passed = pct >= 60;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <tr className={passed ? 'bg-emerald-50/60 border-l-4 border-emerald-500' : 'bg-red-50/60 border-l-4 border-red-500'}>
      <td className="px-6 py-4 font-medium text-gray-900">{attempt.subject}</td>
      <td className="px-6 py-4 text-gray-600">{formatDate(attempt.created_at)}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">
            {attempt.score}/{attempt.total_questions}
          </span>
          <span className="text-sm text-gray-500">({pct}%)</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {passed ? 'Passed' : 'Failed'}
        </span>
      </td>
    </tr>
  );
};

// Main History Page Component
interface HistoryPageProps {
  initialAttempts: ExamAttempt[];
}

export default function HistoryPageContent({ initialAttempts }: HistoryPageProps) {
  const attempts = initialAttempts;

  const passedCount = attempts.filter(
    (a) => a.total_questions > 0 && Math.round((a.score / a.total_questions) * 100) >= 60
  ).length;
  const failedCount = attempts.length - passedCount;

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
          <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-sm text-gray-600 mb-1">Passed</p>
          <p className="text-2xl font-bold text-emerald-600">{passedCount}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-l-red-600">
          <p className="text-sm text-gray-600 mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-600">{failedCount}</p>
        </div>
      </div>

      {/* History Table */}
      <div className="glass" style={{ overflow: 'hidden' }}>
        {attempts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 text-lg">No exam attempts yet.</p>
            <p className="text-gray-500">Start a new practice exam to see your results here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <HistoryRow key={attempt.id} attempt={attempt} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
