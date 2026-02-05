import { useCustomer } from '@/contexts/CustomerContext';

export const WelcomeBar: React.FC = () => {
  const { customer, isAuthenticated, signIn, selectPersona } = useCustomer();

  const isKnown = customer?.merkuryIdentity?.identityTier === 'known';
  const isAppended = customer?.merkuryIdentity?.identityTier === 'appended';
  const isPseudonymous = (isKnown || isAppended) && !isAuthenticated;

  if (!isPseudonymous) return null;

  const firstName = customer?.name?.split(' ')[0];

  return (
    <div className="bg-gradient-to-r from-rose-50 via-purple-50 to-rose-50 border-b border-rose-100 py-1.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-3 text-sm">
        <span className="text-stone-600">
          {isKnown && firstName && firstName !== 'Guest'
            ? `Welcome back, ${firstName}!`
            : 'Welcome!'
          }
          {' '}Sign in to access your account and rewards.
        </span>
        <button
          onClick={signIn}
          className="px-3 py-0.5 text-xs font-medium bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
        >
          Sign In
        </button>
        {isKnown && firstName && firstName !== 'Guest' && (
          <button
            onClick={() => selectPersona('anonymous')}
            className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            Not you?
          </button>
        )}
      </div>
    </div>
  );
};
