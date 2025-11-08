'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { firebaseConfig } from '@/firebase/config';

interface FacebookVideoPlayerProps {
  videoUrl: string;
}

export function FacebookVideoPlayer({ videoUrl }: FacebookVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializePlayer = () => {
      if (!isMounted || !window.FB) return;
      setLoading(false);
      if (containerRef.current) {
        window.FB.XFBML.parse(containerRef.current);
      }
    };
    
    if (window.FB) {
      initializePlayer();
    } else {
      window.fbAsyncInit = function() {
        if (!window.FB) return;
        window.FB.init({
          appId: firebaseConfig.facebookAppId,
          xfbml: true,
          version: 'v20.0'
        });
        initializePlayer();
      };
      
      if (!document.getElementById('facebook-jssdk')) {
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        document.body.appendChild(script);
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [videoUrl]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-black relative">
       {loading && (
         <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-10">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span>Facebook oynatıcı yükleniyor...</span>
        </div>
       )}
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
