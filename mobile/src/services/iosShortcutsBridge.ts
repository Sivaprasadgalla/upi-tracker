import { Linking } from 'react-native';

export class IosShortcutsBridge {
  /**
   * Initializes deep link listener for Apple Shortcuts
   * Scheme format: upitracker://log?text=Paid%20Rs%20450%20to%20Swiggy...
   */
  public static initDeepLinkListener(onNotificationTextReceived: (text: string) => void): () => void {
    const handleUrl = (event: { url: string }) => {
      const { url } = event;
      if (!url) return;

      try {
        const parsedUrl = new URL(url);
        const textParam = parsedUrl.searchParams.get('text') || parsedUrl.searchParams.get('log');
        if (textParam) {
          onNotificationTextReceived(decodeURIComponent(textParam));
          if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (e) {
        // Fallback simple parsing
        if (url.includes('text=')) {
          const rawText = url.split('text=')[1].split('&')[0];
          if (rawText) {
            onNotificationTextReceived(decodeURIComponent(rawText));
          }
        } else if (url.includes('log=')) {
          const rawText = url.split('log=')[1].split('&')[0];
          if (rawText) {
            onNotificationTextReceived(decodeURIComponent(rawText));
          }
        }
      }
    };

    // Check initial launch URL
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }

  /**
   * Explanatory text and instructions for iOS Apple Shortcuts integration
   */
  public static getShortcutSetupInstructions(): { step: number; title: string; desc: string }[] {
    return [
      {
        step: 1,
        title: 'Open Apple Shortcuts App',
        desc: 'Go to the Automation tab at the bottom of the Shortcuts app and tap "+ New Automation".'
      },
      {
        step: 2,
        title: 'Select Trigger: Message / Transaction',
        desc: 'Choose "Transaction" (for Apple Pay/Wallet) or "Message" (when receiving SMS from your Bank e.g. HDFC, SBI, ICICI).'
      },
      {
        step: 3,
        title: 'Add Action: Open URL / Send Webhook',
        desc: 'Set action to: Open URL "upitracker://log?text=[Shortcut Input]" to log automatically, or trigger the webhook.'
      },
      {
        step: 4,
        title: 'Enable "Run Immediately"',
        desc: 'Turn off "Ask Before Running" and enable "Notify When Run: Off" for seamless background tracking.'
      }
    ];
  }
}
