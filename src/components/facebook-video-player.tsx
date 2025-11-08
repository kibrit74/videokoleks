'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

interface FacebookVideoPlayerProps {
  videoUrl: string;
}

// Global script yükleme durumunu yönetmek için bir Promise
let sdkLoadingPromise: Promise<void> | null = null;

const loadFacebookSDK = (): Promise<void> => {
    if (sdkLoadingPromise) {
        return sdkLoadingPromise;
    }

    sdkLoadingPromise = new Promise((resolve, reject) => {
        if (document.getElementById('facebook-jssdk')) {
            resolve();
            return;
        }

        window.fbAsyncInit = function () {
            window.FB.init({
                xfbml: true,
                version: 'v19.0'
            });
            resolve();
        };

        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            // fbAsyncInit'in çağrıldığından emin olmak için küçük bir gecikme
            // Bazen onload, fbAsyncInit'den önce tetiklenebilir.
            setTimeout(() => {
                if (window.FB) {
                    resolve();
                }
            }, 100);
        };
        script.onerror = () => {
            reject(new Error('Facebook SDK could not be loaded.'));
            sdkLoadingPromise = null; // Hata durumunda yeniden denemeye izin ver
        };
        document.body.appendChild(script);
    });

    return sdkLoadingPromise;
};


export function FacebookVideoPlayer({ videoUrl }: FacebookVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;
    setLoadingState('loading');

    loadFacebookSDK()
      .then(() => {
        if (isMounted && window.FB) {
          // SDK yüklendi, XFBML'yi ayrıştırma zamanı
          if (containerRef.current) {
            window.FB.XFBML.parse(containerRef.current, () => {
                // Ayrıştırma tamamlandığında yükleyiciyi gizle
                setLoadingState('loaded');
            });
          }
        }
      })
      .catch(error => {
        console.error(error);
        if (isMounted) {
          setLoadingState('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [videoUrl]); // videoUrl değiştiğinde efekti yeniden çalıştır

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-black relative">
       {loadingState === 'loading' && (
         <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-10">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span>Facebook oynatıcı yükleniyor...</span>
        </div>
       )}
       {loadingState === 'error' && (
         <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive-foreground p-4 bg-destructive z-10">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <span>Video oynatıcı yüklenemedi.</span>
        </div>
       )}
       {/* data-href değiştiğinde FB.XFBML.parse'ın yeniden çalışması gerekir, useEffect bunu yönetir */}
      <div 
        className="fb-video" 
        data-href={videoUrl}
        data-width="auto"
        data-height="auto"
        data-allowfullscreen="true"
        data-autoplay="false"
        data-lazy="true"
      >
        <blockquote cite={videoUrl} className="fb-xfbml-parse-ignore">
          <a href={videoUrl}>Facebook Video</a>
        </blockquote>
      </div>
    </div>
  );
}