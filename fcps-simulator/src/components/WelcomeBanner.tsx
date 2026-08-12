'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X } from 'lucide-react';

interface WelcomeBannerProps {
  onDismiss: () => void;
}

export const WelcomeBanner = ({ onDismiss }: WelcomeBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const supabase = createClient();

  const handleDismiss = async () => {
    setIsVisible(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ has_seen_welcome: true })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Failed to update welcome status:', error);
    }
    
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="animate-slide-down bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-6 text-white shadow-lg relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🎉</span>
            <div>
              <h2 className="text-2xl font-bold">Welcome to FCPS Premium!</h2>
              <p className="text-emerald-100 mt-1">
                Your subscription is now active. Let's prepare for success!
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close welcome banner"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>Unlimited Practice Tests</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>Full Question Bank</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>Detailed Analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>Performance Tracking</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleDismiss}
            className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
          >
            Dismiss
          </button>
          <a
            href="/dashboard"
            className="px-6 py-2 bg-white text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-colors"
          >
            Start Studying
          </a>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
