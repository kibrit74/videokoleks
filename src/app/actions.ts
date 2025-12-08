'use server';

// Helper function to decode HTML entities (server-side compatible)
function decodeHtmlEntities(text: string): string {
  if (!text) return text;

  // Common HTML entities
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  let decoded = text;

  // Replace named entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Replace numeric entities (&#123; or &#x7B;)
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decoded;
}

// Helper function to check if the oembed data is valid
function isValidTitle(title: string | undefined | null): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  // Filter out generic login/error titles (English and Turkish)
  if (lower.includes('login') || lower.includes('giriş') || lower.includes('yap') || lower.includes('sign up') || lower.includes('üye ol') || lower.includes('register')) {
    if (lower.includes('instagram') || lower.includes('facebook') || lower.includes('twitter')) return false;
  }
  if (lower === 'instagram') return false;
  if (lower === 'twitter') return false;
  if (lower === 'x') return false;
  // Instagram specific generic titles
  if (lower.includes('instagram photo') || lower.includes('instagram video')) return false;

  return true;
}

// Helper to extract meta content using regex (Server-side compatible)
function extractMeta(html: string, property: string): string | undefined {
  // Try both orderings: property/name before content, and content before property/name
  // Order 1: <meta property="..." content="..." />
  const regex1 = new RegExp(`<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']*?)["']`, 'i');
  const match1 = html.match(regex1);
  if (match1) return match1[1];

  // Order 2: <meta content="..." property="..." />
  const regex2 = new RegExp(`<meta\\s+content=["']([^"']*?)["']\\s+(?:property|name)=["']${property}["']`, 'i');
  const match2 = html.match(regex2);
  if (match2) return match2[1];

  return undefined;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match ? match[1] : undefined;
}


import https from 'https';
import { IncomingMessage } from 'http';

// Helper function to fetch an image and convert it to base64 data URL
async function fetchImageAsBase64(imageUrl: string): Promise<string | undefined> {
  if (!imageUrl) return undefined;

  return new Promise((resolve) => {
    // Parse the URL
    let parsedUrl;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      console.warn('Invalid URL for image fetch');
      resolve(undefined);
      return;
    }

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
      }
    };

    console.log(`[Base64] Fetching image: ${imageUrl}`);

    const req = https.request(options, (res: IncomingMessage) => {
      if (res.statusCode !== 200) {
        console.warn(`[Base64] Native https image fetch failed with status: ${res.statusCode} ${res.statusMessage}`);
        // console.warn(`[Base64] Headers:`, JSON.stringify(res.headers));
        res.resume(); // Consume response to free memory
        resolve(undefined);
        return;
      }

      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        const contentType = res.headers['content-type'] || 'image/jpeg';
        resolve(`data:${contentType};base64,${base64}`);
      });
    });

    req.on('error', (e) => {
      console.warn('Native https image fetch error:', e);
      resolve(undefined);
    });

    req.end();
  });
}

async function getYoutubeMetadata(url: string) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;
    const data = await response.json();

    // Convert thumbnail to Base64
    let thumbnailBase64: string | undefined;
    if (data.thumbnail_url) {
      thumbnailBase64 = await fetchImageAsBase64(data.thumbnail_url);
    }

    return {
      title: data.title,
      thumbnail: thumbnailBase64,
      duration: undefined,
    };
  } catch (error) {
    console.error(`Error fetching YouTube oEmbed for ${url}:`, error);
    return null;
  }
}

async function getTikTokMetadata(url: string) {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);

    let title: string | undefined;
    let thumbnail: string | undefined;

    if (response.ok) {
      const data = await response.json();
      title = data.title;
      thumbnail = data.thumbnail_url;
    }

    // Convert thumbnail to Base64
    let thumbnailBase64: string | undefined;
    if (thumbnail) {
      thumbnailBase64 = await fetchImageAsBase64(thumbnail);
    }

    if (!title && !thumbnail) return null;

    return {
      title: title || 'TikTok Video',
      thumbnail: thumbnailBase64,
      duration: undefined
    };
  } catch (e) {
    console.warn('TikTok metadata failed:', e);
    return null;
  }
}

async function getFacebookMetadata(url: string) {
  // Facebook uses similar logic to Instagram (shared infrastructure)
  const normalizedUrl = url.replace(/\?.*$/, ''); // Remove query params

  // Helper function to extract metadata
  const extractFromHtml = (html: string): { title: string; thumbnail?: string } | null => {
    let title = extractMeta(html, 'og:title');
    let thumbnail = extractMeta(html, 'og:image');

    if (!title) title = extractTitle(html);

    // Facebook specific: sometimes title is just "Facebook" or "Log In"
    if (title && (title === 'Facebook' || title === 'Log in or sign up to view')) return null;

    if (title) {
      let cleanTitle = decodeHtmlEntities(title);
      cleanTitle = cleanTitle.replace(/ \| Facebook$/i, '');
      return { title: cleanTitle, thumbnail };
    }
    return null;
  };

  // Direct Fetch with Facebook Bot UA
  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (response.ok) {
      const html = await response.text();
      const result = extractFromHtml(html);
      if (result) {
        let thumbnailBase64: string | undefined;
        if (result.thumbnail) {
          // Same entity decode fix as Instagram
          const cleanThumbnailUrl = decodeHtmlEntities(result.thumbnail).replace(/&amp;/g, '&');
          thumbnailBase64 = await fetchImageAsBase64(cleanThumbnailUrl);
        }
        return { title: result.title, thumbnail: thumbnailBase64, duration: undefined };
      }
    }
  } catch (e) {
    console.warn('Facebook direct fetch failed:', e);
  }

  return null;
}

async function getTwitterMetadata(url: string) {
  try {
    // 1. Try api.fxtwitter.com (Best for media/thumbnails)
    const tweetIdMatch = url.match(/\/status\/(\d+)/);
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;
    let thumbnail: string | undefined;
    let title: string | undefined;

    if (tweetId) {
      try {
        const fxResponse = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)' }
        });
        if (fxResponse.ok) {
          const fxData = await fxResponse.json();
          if (fxData.tweet) {
            title = fxData.tweet.text;
            // Prioritize video thumbnail
            if (fxData.tweet.media?.videos?.[0]?.thumbnail_url) {
              thumbnail = fxData.tweet.media.videos[0].thumbnail_url;
            } else if (fxData.tweet.media?.photos?.[0]?.url) {
              thumbnail = fxData.tweet.media.photos[0].url;
            }
            console.log(`[Twitter] Fetched via fxtwitter: ${title?.substring(0, 20)}...`);
          }
        }
      } catch (fxErr) {
        console.warn('[Twitter] fxtwitter failed, falling back to oEmbed:', fxErr);
      }
    }

    // 2. Fallback to official oEmbed if fxtwitter failed
    if (!title) {
      const publishUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
      const response = await fetch(publishUrl);
      if (response.ok) {
        const data = await response.json();
        title = data.title;
        // oEmbed usually doesn't have video thumbnails, but check anyway
        if (!thumbnail && data.thumbnail_url) thumbnail = data.thumbnail_url;

        if (!title && data.html) {
          const match = data.html.match(/<p lang=".*?" dir=".*?">(.*?)<\/p>/);
          if (match && match[1]) {
            title = match[1].replace(/<br>/g, ' ').replace(/<a.*?>(.*?)<\/a>/g, '$1').substring(0, 100);
          }
        }
        if (!title) title = `Tweet by ${data.author_name}`;
      }
    }

    // 3. Convert thumbnail to Base64 (The "Same System" as Instagram)
    let thumbnailBase64: string | undefined;
    if (thumbnail) {
      console.log(`[Twitter] Fetching thumbnail: ${thumbnail}`);
      thumbnailBase64 = await fetchImageAsBase64(thumbnail);
    }

    if (!title && !thumbnail) return null;

    return {
      title: title || 'Twitter Video',
      thumbnail: thumbnailBase64,
      duration: undefined,
    };
  } catch (e) {
    console.warn('Twitter metadata failed:', e);
    return null;
  }
}

async function getInstagramMetadata(url: string) {
  // Instagram oEmbed API now requires authentication, so we scrape OG meta tags instead

  // Normalize Instagram URL to ensure we get the embed-friendly version
  const normalizedUrl = url.replace(/\?.*$/, ''); // Remove query params

  // Helper function to extract metadata from HTML
  const extractFromHtml = (html: string): { title: string; thumbnail?: string } | null => {
    // Extract OG meta tags from the HTML
    let title = extractMeta(html, 'og:title');
    let thumbnail = extractMeta(html, 'og:image');

    // Also try twitter:title as fallback
    if (!title) {
      title = extractMeta(html, 'twitter:title');
    }
    if (!thumbnail) {
      thumbnail = extractMeta(html, 'twitter:image');
    }

    // Try to extract from JSON-LD script if OG tags are missing
    if (!title || !thumbnail) {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
      if (jsonLdMatch && jsonLdMatch[1]) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          if (jsonData.name && !title) title = jsonData.name;
          if (jsonData.description && !title) title = jsonData.description.substring(0, 100);
          if (jsonData.thumbnailUrl && !thumbnail) thumbnail = jsonData.thumbnailUrl;
          if (jsonData.image && !thumbnail) thumbnail = typeof jsonData.image === 'string' ? jsonData.image : jsonData.image.url;
        } catch {
          // JSON-LD parsing failed, continue
        }
      }
    }

    // Try to find description as title fallback
    if (!title) {
      // Try both attribute orderings for description
      const descMatch = html.match(/<meta\s+(?:property|name)=["'](?:og:description|description)["']\s+content=["']([^"']*?)["']/i) ||
        html.match(/<meta\s+content=["']([^"']*?)["']\s+(?:property|name)=["'](?:og:description|description)["']/i);
      if (descMatch && descMatch[1]) {
        // Truncate description to reasonable title length
        title = descMatch[1].substring(0, 100);
        if (descMatch[1].length > 100) title += '...';
      }
    }

    if (title && isValidTitle(title)) {
      // Decode HTML entities
      let cleanTitle = decodeHtmlEntities(title);

      // Clean up Instagram-specific title patterns like "Username on Instagram: "
      cleanTitle = cleanTitle.replace(/ on Instagram:?\s*[""]?/i, ': ');
      cleanTitle = cleanTitle.replace(/^.*? on Instagram:?\s*/i, '');

      // Remove trailing quotes if present
      cleanTitle = cleanTitle.replace(/[""]$/, '').trim();

      return { title: cleanTitle, thumbnail };
    }
    return null;
  };

  // Method 1: Try direct fetch from server with Facebook Bot headers
  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (response.ok) {
      const html = await response.text();
      const result = extractFromHtml(html);
      if (result) {
        // Fetch image as base64 to bypass client-side CORS/403
        let thumbnailBase64: string | undefined;
        if (result.thumbnail) {
          // CRITICAL: decode HTML entities (e.g. &amp;) in URL or signature validation fails (403)
          // We use explicit replace in addition to helper to be 100% sure
          const cleanThumbnailUrl = decodeHtmlEntities(result.thumbnail).replace(/&amp;/g, '&');

          console.log(`[Instagram] Decoded URL for fetch: ${cleanThumbnailUrl}`);
          thumbnailBase64 = await fetchImageAsBase64(cleanThumbnailUrl);
        }

        console.log('Instagram metadata extracted via direct fetch:', {
          title: result.title,
          thumbnail: thumbnailBase64 ? 'converted to base64' : 'failed to convert'
        });

        return { title: result.title, thumbnail: thumbnailBase64, duration: undefined };
      }
    }
  } catch (e) {
    console.warn('Instagram direct fetch failed:', e);
  }

  // Method 2: Try proxy services as fallback
  const proxies = [
    {
      name: 'allorigins',
      getUrl: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      extractHtml: async (response: Response) => await response.text()
    },
    {
      name: 'corsproxy',
      getUrl: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      extractHtml: async (response: Response) => await response.text()
    },
    {
      name: 'codetabs',
      getUrl: (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
      extractHtml: async (response: Response) => await response.text()
    }
  ];

  for (const proxy of proxies) {
    try {
      const proxyUrl = proxy.getUrl(normalizedUrl);
      const response = await fetch(proxyUrl);

      if (!response.ok) continue;

      const html = await proxy.extractHtml(response);
      if (!html) continue;

      const result = extractFromHtml(html);
      if (result) {
        // Fetch image as base64 to bypass client-side CORS/403
        let thumbnailBase64: string | undefined;
        if (result.thumbnail) {
          thumbnailBase64 = await fetchImageAsBase64(result.thumbnail);
        }

        console.log(`Instagram metadata extracted via ${proxy.name}:`, {
          title: result.title,
          thumbnail: thumbnailBase64 ? 'converted to base64' : 'failed to convert'
        });
        return { title: result.title, thumbnail: thumbnailBase64, duration: undefined };
      }
    } catch (e) {
      console.warn(`Instagram scraping via ${proxy.name} failed:`, e);
      continue;
    }
  }

  console.warn('All Instagram metadata extraction methods failed for:', url);
  return null;
}

export async function getVideoMetadata(url: string) {
  try {
    // NOTE: This function is now a Server Action ('use server' at top).
    // Requests originate from the Next.js server, avoiding browser CORS.

    let metadata: { title: string; thumbnail?: string; duration?: string | undefined } | null = null;

    // 1. Platform Specific Checks
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      metadata = await getYoutubeMetadata(url);
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      metadata = await getTwitterMetadata(url);
    } else if (url.includes('instagram.com')) {
      metadata = await getInstagramMetadata(url);
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
      metadata = await getFacebookMetadata(url);
    } else if (url.includes('tiktok.com')) {
      metadata = await getTikTokMetadata(url);
    }

    if (metadata && isValidTitle(metadata.title)) {
      return metadata;
    }

    // 2. Try Noembed (Generic fallback)
    try {
      const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
      const response = await fetch(noembedUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.title && isValidTitle(data.title)) {
          // Attempt Base64 conversion even for generic fallbacks
          let thumbnailBase64 = data.thumbnail_url || data.thumbnail;
          if (thumbnailBase64 && !thumbnailBase64.startsWith('data:')) {
            thumbnailBase64 = await fetchImageAsBase64(thumbnailBase64);
          }

          return {
            title: data.title,
            thumbnail: thumbnailBase64,
            duration: undefined,
          };
        }
      }
    } catch (e) {
      // console.warn('Noembed failed:', e);
    }

    // 3. Last Result: Scrape Open Graph data using proxies
    const proxies = [
      (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    ];

    let html: string | null = null;

    for (const proxyGen of proxies) {
      try {
        const proxyUrl = proxyGen(url);
        const response = await fetch(proxyUrl);
        if (response.ok) {
          if (proxyUrl.includes('allorigins')) {
            const data = await response.json();
            html = data.contents;
          } else {
            html = await response.text();
          }
          if (html) break;
        }
      } catch (e) {
        // console.warn(`Proxy failed:`, e);
      }
    }

    if (!html) return null;

    // Server-side parsing using Regex instead of DOMParser
    const title = extractMeta(html, 'og:title') || extractTitle(html);
    const thumbnail = extractMeta(html, 'og:image');

    if (!title || !isValidTitle(title)) {
      return null;
    }

    // Attempt Base64 for generic fallback too
    let thumbnailBase64 = thumbnail;
    if (thumbnailBase64) {
      thumbnailBase64 = await fetchImageAsBase64(thumbnailBase64);
    }

    return {
      title,
      thumbnail: thumbnailBase64,
      duration: undefined,
    };

  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, error);
    return null;
  }
}
