'use server';

import { unfurl } from 'unfurl.js';
import type { Oembed } from 'unfurl.js/dist/types';

// Helper function to check if the oembed data is valid
function isValidOembed(oembed: Oembed): boolean {
  return !!(oembed && oembed.title && oembed.thumbnail_url);
}

export async function getVideoMetadata(url: string) {
  try {
    const result = await unfurl(url, {
      oembed: true, // Fetch oEmbed data
      compress: true, // Compress images
    });

    const oembedData = result.oembed;
    const ogp = result.open_graph || {};
    
    // Prioritize oEmbed data, especially for platforms like YouTube
    if (isValidOembed(oembedData)) {
      return {
        title: oembedData.title,
        thumbnail: oembedData.thumbnail_url,
        duration: ogp.videos?.[0]?.duration, // oEmbed doesn't always provide duration
      };
    }

    // Fallback to Open Graph or general metadata if oEmbed is not sufficient
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
