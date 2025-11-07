'use client';

import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface FacebookVideoPlayerProps {
  videoUrl: string;
}

// Helper function to initialize the Facebook SDK
const initializeFacebookSDK = () => {
  if (document.getElementById('facebook-jssdk')) return;

  const script = document.createElement('script');
  script.id = 'facebook-jssdk';
  script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v19.0";
  script.async = true;
  script.defer = true;
  script.crossOrigin = 'anonymous';
  document.body.appendChild(script);
};

export function FacebookVideoPlayer({ videoUrl }: FacebookVideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    initializeFacebookSDK();

    const checkSdkAndRender = () => {
      if (window.FB) {
        // The SDK is loaded, re-parse the container to render the video
        if (videoRef.current) {
          window.FB.XFBML.parse(videoRef.current.parentElement);
        }
      } else {
        // If SDK is not ready, check again shortly
        setTimeout(checkSdkAndRender, 100);
      }
    };
    
    // Listen for the SDK to load
    window.fbAsyncInit = function () {
        window.FB.init({
            xfbml: true,
            version: 'v19.0'
        });
        // The SDK is ready, parse the XFBML tags
        if (videoRef.current) {
           window.FB.XFBML.parse(videoRef.current.parentElement);
        }
    };

    // Fallback in case fbAsyncInit has already fired
    checkSdkAndRender();

  }, [videoUrl]); // Re-run effect if the videoUrl changes

  return (
    <div ref={videoRef} className="w-full h-full flex items-center justify-center bg-black">
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
      {/* Fallback loader */}
      <div className="absolute inset-0 flex items-center justify-center -z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
