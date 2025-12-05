'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export function useSendIntent() {
    const router = useRouter();

    useEffect(() => {
        if (Capacitor.getPlatform() !== 'android') return;

        const checkIntent = async () => {
            try {
                // Dynamically import the plugin to avoid SSR/Build issues
                const { SendIntent } = await import('capacitor-plugin-send-intent');

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
    }, [router]);
}
