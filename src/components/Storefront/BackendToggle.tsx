import { useCallback } from 'react';
import { useRevalidator } from 'react-router-dom';
import {
  useCommerceBackendId,
  setCommerceBackend,
  commerceBackendLabel,
} from '@/services/commerce';
import { demoLog } from '@/services/demoLog';

/**
 * Small two-state pill that displays the active commerce backend and lets the
 * user flip it at runtime. Triggers a router revalidation on switch so any
 * active loaders (root catalog, /shop/* loaders, /p/:salesforceId) re-fetch
 * through the new backend — flipping to SFCC surfaces the licensing stub's
 * friendly "provision a B2C Commerce instance" error in the route's error
 * boundary; flipping back to Core restores the working catalog.
 */
export const BackendToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const id = useCommerceBackendId();
  const revalidator = useRevalidator();

  const handleToggle = useCallback(() => {
    const next = id === 'core' ? 'sfcc' : 'core';
    setCommerceBackend(next);
    demoLog.log({
      category: 'system',
      title: 'Commerce backend switched',
      subtitle: `${commerceBackendLabel(id)} -> ${commerceBackendLabel(next)}`,
    });
    revalidator.revalidate();
  }, [id, revalidator]);

  const isCore = id === 'core';

  return (
    <button
      onClick={handleToggle}
      title={`Active commerce backend: ${commerceBackendLabel(id)}. Click to switch — the router will revalidate active loaders against the new backend.`}
      className={`inline-flex items-center gap-2 text-xs ${className}`}
    >
      <span className="opacity-70">Backend:</span>
      <span className="inline-flex items-center rounded-full border border-current/30 overflow-hidden">
        <span
          className={`px-2 py-0.5 transition-colors ${
            isCore ? 'bg-emerald-500/20 text-emerald-300' : 'opacity-50'
          }`}
        >
          Commerce on Core
        </span>
        <span
          className={`px-2 py-0.5 transition-colors ${
            !isCore ? 'bg-sky-500/20 text-sky-300' : 'opacity-50'
          }`}
        >
          Storefront Next
        </span>
      </span>
    </button>
  );
};
