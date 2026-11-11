/**
 * Is this request from an app's built-in (embedded) browser?
 *
 * Google refuses "Continue with Google" in those (`disallowed_useragent`),
 * by policy, with no workaround. The login page uses this to hide the
 * Google button and say why. Email and password still work there.
 *
 * Errs towards NOT matching: a false positive hides Google from someone who
 * could have used it; a false negative just shows the button as before.
 * So only tokens that these apps put in their own agent string are listed.
 */
const IN_APP_TOKENS: RegExp[] = [
  /\bFBAN\b/, // Facebook app (iOS)
  /\bFBAV\//, // Facebook / Messenger (iOS and Android)
  /\bFB_IAB\b/, // Facebook in-app browser (Android)
  /\bFBIOS\b/,
  /\bMessengerForiOS\b/,
  /\bMessengerLite/,
  /\bLine\/\d/, // LINE
  /\bInstagram\b/,
  /\bMicroMessenger\//, // WeChat
  /\bBytedanceWebview\b|\bmusical_ly\b|\bTikTok\b/,
  /\bSnapchat\b/,
  /\bKAKAOTALK\b/i,
];

export function isInAppBrowser(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  if (IN_APP_TOKENS.some((re) => re.test(userAgent))) return true;
  // Generic Android WebView marker, only alongside Android.
  return /\bAndroid\b/.test(userAgent) && /; wv\)/.test(userAgent);
}
