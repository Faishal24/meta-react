/**
 * Meta JS SDK loader + Embedded Signup launcher, isolated from the hook.
 * @see https://developers.facebook.com/docs/whatsapp/embedded-signup
 */

interface FacebookLoginResponse {
  authResponse?: { code?: string };
}

interface FacebookSdk {
  init: (config: {
    appId: string;
    autoLogAppEvents: boolean;
    xfbml: boolean;
    version: string;
  }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: object,
  ) => void;
}

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: FacebookSdk;
  }
}

const SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';
const GRAPH_VERSION = 'v23.0';

/** Load + init the FB SDK once; repeat calls reuse the loaded SDK. */
export function loadFacebookSdk(appId: string): Promise<FacebookSdk> {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    window.fbAsyncInit = () => {
      window.FB!.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: GRAPH_VERSION,
      });
      resolve(window.FB!);
    };

    if (!document.querySelector(`script[src*="facebook.net/en_US/sdk.js"]`)) {
      const script = document.createElement('script');
      script.src = SDK_SRC;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    }
  });
}

/** Open the signup popup; resolves the auth code (null if closed). Session info arrives via `message`. */
export function launchEmbeddedSignup(
  fb: FacebookSdk,
  configurationId: string,
  businessPortfolioId?: string | null,
): Promise<string | null> {
  return new Promise((resolve) => {
    const setup: Record<string, unknown> = {};
    if (businessPortfolioId) {
      setup.business = { id: businessPortfolioId };
    }

    fb.login(
      (response) => {
        resolve(response.authResponse?.code ?? null);
      },
      {
        config_id: configurationId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup,
          featureType: 'whatsapp_business_app_onboarding',
          sessionInfoVersion: '3',
        },
      },
    );
  });
}

/** True when a `postMessage` event originates from Facebook. */
export function isFacebookOrigin(origin: string): boolean {
  return origin === 'https://facebook.com' || origin.endsWith('.facebook.com');
}
