import { useState } from 'react';
import { LoyaltyWidget } from '@/components/LoyaltyWidget';

interface LoyaltyPanelProps {
  accountId: string;
  onEnroll: () => void;
  onRedeem: () => void;
}

export const LoyaltyPanel: React.FC<LoyaltyPanelProps> = ({ 
  accountId, 
  onEnroll,
  onRedeem
}) => {
  const [showWidget, setShowWidget] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowWidget(!showWidget)}
        className="p-2 text-stone-600 hover:text-stone-900 transition-colors relative"
        aria-label="Loyalty program"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {showWidget && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-stone-200 z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-stone-900">Your Loyalty Status</h3>
            <button 
              onClick={() => setShowWidget(false)}
              className="text-stone-400 hover:text-stone-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <LoyaltyWidget 
            accountId={accountId} 
            onEnroll={onEnroll} 
            onRedeem={onRedeem} 
          />
        </div>
      )}
    </div>
  );
};
