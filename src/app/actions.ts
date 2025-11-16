'use server';

import { unfurl } from 'unfurl.js';
import type { Oembed } from 'unfurl.js/dist/types';

// Helper function to check if the oembed data is valid
function isValidOembed(oembed: Oembed): boolean {
  return !!(oembed && oembed.title && oembed.thumbnail_url);
}


async function getYoutubeMetadata(url: string) {
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        return {
            title: data.title,
            thumbnail: data.thumbnail_url,
            // oEmbed for YouTube doesn't provide duration, so we can't get it this way.
            duration: undefined, 
        };
    } catch (error) {
        console.error(`Error fetching YouTube oEmbed for ${url}:`, error);
        return null;
    }
}


export async function getVideoMetadata(url: string) {
  try {

    // First, try to get metadata using platform-specific logic if available
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const youtubeData = await getYoutubeMetadata(url);
        if (youtubeData && youtubeData.title) {
            return youtubeData;
        }
    }
      
    // Fallback to unfurl.js for other platforms or if YouTube oEmbed fails
    const result = await unfurl(url, {
      oembed: true,
      compress: true,
    });

    const oembedData = result.oembed;
    const ogp = result.open_graph || {};
    
    if (isValidOembed(oembedData)) {
      return {
        title: oembedData.title,
        thumbnail: oembedData.thumbnail_url,
        duration: ogp.videos?.[0]?.duration,
      };
    }

    const title = ogp.title || result.title;
    const thumbnail = ogp.images?.[0]?.url || result.favicon;
    const duration = ogp.videos?.[0]?.duration;

    if (!title) {
      return null;
    }

    return {
      title,
      thumbnail,
      duration,
    };
  } catch (error) {
    console.error(`Error unfurling ${url}:`, error);
    return null;
  }
}
