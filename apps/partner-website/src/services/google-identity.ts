interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    auto_select: boolean;
    nonce: string;
  }): void;
  renderButton(
    element: HTMLElement,
    options: { theme: string; size: string; text: string; shape: string },
  ): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

let loading: Promise<GoogleIdentity> | undefined;

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  if (loading) return loading;
  loading = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    const timer = window.setTimeout(() => fail(), 20_000);
    function fail() {
      window.clearTimeout(timer);
      script.remove();
      loading = undefined;
      reject(
        new Error(
          'Google sign-in could not load. Check your connection and allow accounts.google.com.',
        ),
      );
    }
    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.google?.accounts.id) resolve(window.google.accounts.id);
      else fail();
    };
    document.head.appendChild(script);
  });
  return loading;
}
