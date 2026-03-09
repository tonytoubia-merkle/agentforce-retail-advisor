import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface LoyaltyMember {
  id: string;
  accountId: string;
  pointsBalance: number;
  tier?: string;
  program?: string;
  enrolled: boolean;
}

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  currency: string;
}

interface LoyaltyTier {
  id: string;
  name: string;
  description: string;
  minPoints: number;
  programId: string;
}

interface LoyaltyWidgetProps {
  accountId: string;
  onEnroll: () => void;
  onRedeem: () => void;
}

export const LoyaltyWidget: React.FC<LoyaltyWidgetProps> = ({ 
  accountId, 
  onEnroll,
  onRedeem
}) => {
  const [loyaltyMember, setLoyaltyMember] = useState<LoyaltyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');

  // Mock data for demonstration
  const mockPrograms: LoyaltyProgram[] = [
    {
      id: 'prog1',
      name: 'Beauty Rewards',
      description: 'Earn points on every purchase and redeem for discounts',
      currency: 'USD'
    },
    {
      id: 'prog2',
      name: 'Premium Beauty Club',
      description: 'Exclusive rewards for our most valued customers',
      currency: 'USD'
    }
  ];

  const mockTiers: LoyaltyTier[] = [
    {
      id: 'tier1',
      name: 'Bronze',
      description: 'Entry level tier',
      minPoints: 0,
      programId: 'prog1'
    },
    {
      id: 'tier2',
      name: 'Silver',
      description: 'Mid-tier benefits',
      minPoints: 1000,
      programId: 'prog1'
    },
    {
      id: 'tier3',
      name: 'Gold',
      description: 'Premium benefits',
      minPoints: 2500,
      programId: 'prog1'
    },
    {
      id: 'tier4',
      name: 'Platinum',
      description: 'Exclusive benefits',
      minPoints: 5000,
      programId: 'prog2'
    }
  ];

  useEffect(() => {
    // Simulate fetching loyalty member data
    const fetchLoyaltyMember = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be an API call to /api/loyalty/member/:accountId
        // For demo purposes, we'll simulate with mock data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if user is enrolled
        const isEnrolled = Math.random() > 0.3; // 70% chance of being enrolled
        
        if (isEnrolled) {
          // Simulate getting member data
          const randomTier = mockTiers[Math.floor(Math.random() * mockTiers.length)];
          const randomPoints = Math.floor(Math.random() * 3000);
          
          setLoyaltyMember({
            id: 'member1',
            accountId,
            pointsBalance: randomPoints,
            tier: randomTier.name,
            program: mockPrograms[0].name,
            enrolled: true
          });
        } else {
          setLoyaltyMember({
            id: 'member1',
            accountId,
            pointsBalance: 0,
            enrolled: false
          });
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load loyalty information');
        console.error('Error fetching loyalty member:', err);
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchLoyaltyMember();
    }
  }, [accountId]);

  const handleEnroll = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would be an API call to /api/loyalty/enroll
      // For demo purposes, we'll simulate success
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate successful enrollment
      setLoyaltyMember({
        id: 'member1',
        accountId,
        pointsBalance: 0,
        enrolled: true,
        program: selectedProgram
      });
      
      setShowEnrollForm(false);
      setSelectedProgram('');
    } catch (err) {
      setError('Failed to enroll in loyalty program');
      console.error('Error enrolling in loyalty program:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
        <div className="animate-pulse">
          <div className="h-4 bg-stone-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-stone-200 rounded w-1/2 mb-6"></div>
          <div className="h-4 bg-stone-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-stone-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!loyaltyMember) {
    return null;
  }

  if (!loyaltyMember.enrolled) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-purple-50 rounded-xl shadow-sm p-6 border border-stone-200">
        <h3 className="text-lg font-semibold text-stone-900 mb-2">Join Our Loyalty Program</h3>
        <p className="text-stone-600 mb-4">
          Earn points on every purchase and redeem for exclusive discounts!
        </p>
        
        {!showEnrollForm ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setShowEnrollForm(true)}
              variant="primary"
              className="flex-1"
            >
              Enroll Now
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Select Program
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                <option value="">Choose a program</option>
                {mockPrograms.map((program) => (
                  <option key={program.id} value={program.name}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleEnroll}
                variant="primary"
                disabled={!selectedProgram || loading}
                className="flex-1"
              >
                {loading ? 'Enrolling...' : 'Confirm Enrollment'}
              </Button>
              <Button 
                onClick={() => setShowEnrollForm(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Loyalty Points</h3>
          <div className="flex items-center mt-1">
            <span className="text-3xl font-bold text-rose-600">
              {loyaltyMember.pointsBalance.toLocaleString()}
            </span>
            <span className="ml-2 text-stone-500">points</span>
          </div>
        </div>
        <Badge>
          {loyaltyMember.tier || 'Bronze'} Tier
        </Badge>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-stone-600 mb-1">
          <span>Program: {loyaltyMember.program}</span>
        </div>
        <div className="w-full bg-stone-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-rose-500 to-purple-500 h-2 rounded-full" 
            style={{ width: `${Math.min(loyaltyMember.pointsBalance / 100, 100)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={onRedeem}
          variant="primary"
          className="flex-1"
        >
          Redeem Points
        </Button>
        <Button 
          variant="secondary"
          className="flex-1"
        >
          View Details
        </Button>
      </div>
    </div>
  );
};
