import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SendIntent } from 'capacitor-plugin-send-intent';
import { Capacitor } from '@capacitor/core';

export function useSendIntent() {
    const router = useRouter();

    useEffect(() => {
        if (Capacitor.getPlatform() !== 'android') return;

        const checkIntent = async () => {
            try {
                const intent = await (SendIntent as any).checkSendIntentReceived();
                if (intent && intent.url) {
                    // The plugin returns the shared text in the 'url' field for text/plain intents
                    const sharedText = decodeURIComponent(intent.url);

                    // Basic URL extraction from text (in case user shared "Check this out: https://...")
                    const urlMatch = sharedText.match(/(https?:\/\/[^\s]+)/);
                    const urlToUse = urlMatch ? urlMatch[0] : sharedText;

                    console.log('Shared content received:', urlToUse);

                    // Redirect to home with addVideo param
                    router.push(`/?addVideo=true&url=${encodeURIComponent(urlToUse)}`);
                }
            } catch (error) {
                console.error('Error checking send intent:', error);
            }
        };

        checkIntent();

        // Listen for future intents (if app is already running)
        // Note: The plugin might not support a listener in the standard way, 
        // but checking on mount covers the "Share -> Open App" flow.
        // For singleTask mode, the activity is brought to front, which triggers re-mount/re-check 
        // if the component tree updates or if we listen to app state changes.

        // For now, checking on mount is the primary method.
    }, [router]);
}
