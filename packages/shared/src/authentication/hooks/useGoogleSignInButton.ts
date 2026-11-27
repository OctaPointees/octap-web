import { useEffect, useRef, useState } from 'react';
import type { ConsoleIdentity } from '../lib/core';
import { assertLoginNonce, loadGoogleIdentity, newLoginNonce } from '../lib/google';
import { verifyGoogleCredential } from '../lib/identity';
import { useAuth } from './useAuth';

/** Google renders its button between 200 and 400 pixels wide. */
const buttonWidth = (available: number) => Math.round(Math.max(200, Math.min(400, available)));

/**
 * Renders Google's sign-in button into `ref` and signs the user in when it succeeds. Build a
 * custom form around it; `GoogleSignInForm` is the default one.
 */
export function useGoogleSignInButton({
  onSignedIn,
}: { onSignedIn?: (identity: ConsoleIdentity) => void } = {}) {
  const { clientId, api, signIn } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const signedIn = useRef(onSignedIn);
  useEffect(() => {
    signedIn.current = onSignedIn;
  });

  useEffect(() => {
    if (!clientId) return;
    let active = true;
    let submitting = false;
    const nonce = newLoginNonce();
    let stopObserving = () => {};
    void loadGoogleIdentity()
      .then((sdk) => {
        if (!active || !ref.current) return;
        sdk.initialize({
          client_id: clientId,
          nonce,
          auto_select: false,
          callback: (response) => {
            if (!active || submitting) return;
            submitting = true;
            setBusy(true);
            setError('');
            void (async () => {
              try {
                assertLoginNonce(response.credential, nonce);
                // The SDK times the request out after 30 seconds.
                const identity = await verifyGoogleCredential(api, response.credential);
                if (!active) return;
                signIn(identity, response.credential);
                signedIn.current?.(identity);
              } catch (cause) {
                if (active)
                  setError(cause instanceof Error ? cause.message : 'Sign-in failed. Try again.');
              } finally {
                if (active) {
                  submitting = false;
                  setBusy(false);
                }
              }
            })();
          },
        });
        // Google draws the button at a fixed pixel width, so draw it again whenever the
        // container's width changes.
        const container = ref.current;
        let width = 0;
        let frame = 0;
        const render = () => {
          const next = buttonWidth(container.clientWidth);
          if (!active || next === width) return;
          width = next;
          container.replaceChildren();
          sdk.renderButton(container, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: next,
          });
        };
        render();
        const observer = new ResizeObserver(() => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(render);
        });
        observer.observe(container);
        stopObserving = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
        };
      })
      .catch((cause) => {
        if (active)
          setError(cause instanceof Error ? cause.message : 'Google sign-in could not load.');
      });
    return () => {
      active = false;
      stopObserving();
    };
  }, [clientId, api, signIn, attempt]);

  return {
    /** Attach to an empty element: Google draws its button inside it. */
    ref,
    /** False when the portal has no Google client ID configured. */
    configured: !!clientId,
    /** True while Core verifies the Google token. */
    busy,
    error,
    /** Loads the button again after an error. */
    retry: () => {
      setError('');
      setAttempt((value) => value + 1);
    },
  };
}
