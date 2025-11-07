'use server';

import { unfurl } from 'unfurl.js';

export async function getVideoMetadata(url: string) {
  try {
    const result = await unfurl(url, {
        oembed: true, // Fetch oEmbed data
        compress: true, // Compress images
    });

    // Extract the most relevant data
    const ogp = result.open_graph || {};

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
