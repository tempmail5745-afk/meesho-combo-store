import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { classifyClient } from '../lib/cloak';
import SafePage from './SafePage';

/**
 * CloakGate Component for Next.js
 * Automatically routes bots, crawlers, and ad reviewers to the 100% compliant
 * Safe Website ("The Kitchen Notebook"), while allowing authentic users to access the store.
 */
export default function CloakGate({ children }) {
  const router = useRouter();
  const [isBot, setIsBot] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // 1. Direct path /lp always shows the Safe Page
    if (router.pathname === '/lp' || router.asPath.startsWith('/lp')) {
      setIsBot(true);
      setChecked(true);
      return;
    }

    // 2. Immediate client-side fingerprinting & URL parameter override (?cl=bot / ?cl=human)
    const clientVerdict = classifyClient();
    if (clientVerdict.isBot) {
      setIsBot(true);
      setChecked(true);
      return;
    }

    // 3. Asynchronously consult serverless IP crawler range checker (/api/cloak-check)
    let isMounted = true;
    const checkServer = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const force = queryParams.get('cl');
        const endpoint = force ? `/api/cloak-check?cl=${force}` : '/api/cloak-check';

        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.isBot) {
            setIsBot(true);
          }
        }
      } catch (_) {
        // Fall back to client classification
      } finally {
        if (isMounted) setChecked(true);
      }
    };

    checkServer();
    return () => {
      isMounted = false;
    };
  }, [router.pathname, router.asPath]);

  if (isBot) {
    return <SafePage />;
  }

  return <>{children}</>;
}

