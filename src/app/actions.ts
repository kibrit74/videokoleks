
// Removed 'use server' to support static export
// import https from 'https'; // NOT supported in browser

// Helper function to decode HTML entities (client-side compatible)
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

// Helper to extract meta content using regex
function extractMeta(html: string, property: string): string | undefined {
  // Try both orderings: property/name before content, and content before property/name
  const regex1 = new RegExp(`<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']*?)["']`, 'i');
  const match1 = html.match(regex1);
  if (match1) return match1[1];

  const regex2 = new RegExp(`<meta\\s+content=["']([^"']*?)["']\\s+(?:property|name)=["']${property}["']`, 'i');
  const match2 = html.match(regex2);
  if (match2) return match2[1];

  return undefined;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match ? match[1] : undefined;
}

// Helper function to fetch an image and convert it to base64 data URL (Client-Side)
async function fetchImageAsBase64(imageUrl: string): Promise<string | undefined> {
  if (!imageUrl) return undefined;

  try {
    // Use proxy to avoid CORS on images (especially Instagram/Facebook)
    // Note: corsproxy.io is a public proxy, might have limits.
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) return undefined;

    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('[Base64] Conversion failed:', e);
    return undefined;
  }
}

async function getYoutubeMetadata(url: string) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl); // YouTube oEmbed supports CORS usually
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
    console.warn(`Error fetching YouTube oEmbed for ${url}:`, error);
    return null;
  }
}

async function getTikTokMetadata(url: string) {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    // TikTok oEmbed usually supports CORS
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
  const normalizedUrl = url.replace(/\?.*$/, '');

  // Helper function to extract metadata
  const extractFromHtml = (html: string): { title: string; thumbnail?: string } | null => {
    let title = extractMeta(html, 'og:title');
    let thumbnail = extractMeta(html, 'og:image');

    if (!title) title = extractTitle(html);

    if (title && (title === 'Facebook' || title === 'Log in or sign up to view')) return null;

    if (title) {
      let cleanTitle = decodeHtmlEntities(title);
      cleanTitle = cleanTitle.replace(/ \| Facebook$/i, '');
      return { title: cleanTitle, thumbnail };
    }
    return null;
  };

  // Browser cannot do "User-Agent" spoofing directly. We MUST use Proxies.
  const proxies = [
    {
      // corsproxy.io simply tunnels the request. It uses its own UA. 
      // It often bypasses some basic checks or allows CORS.
      getUrl: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      extractHtml: async (res: Response) => await res.text()
    },
    {
      // allorigins.win returns JSON
      getUrl: (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
      extractHtml: async (res: Response) => (await res.json()).contents
    }
  ];

  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy.getUrl(normalizedUrl));
      if (!res.ok) continue;
      const html = await proxy.extractHtml(res);
      if (!html) continue;

      const result = extractFromHtml(html);
      if (result) {
        let thumbnailBase64: string | undefined;
        if (result.thumbnail) {
          const cleanThumbnailUrl = decodeHtmlEntities(result.thumbnail).replace(/&amp;/g, '&');
          thumbnailBase64 = await fetchImageAsBase64(cleanThumbnailUrl);
        }
        return { title: result.title, thumbnail: thumbnailBase64, duration: undefined };
      }
    } catch (e) { console.warn('FB Proxy failed', e); }
  }

  return null;
}

async function getTwitterMetadata(url: string) {
  try {
    // 1. Try api.fxtwitter.com (Best for media/thumbnails, usually CORS friendly)
    const tweetIdMatch = url.match(/\/status\/(\d+)/);
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;
    let thumbnail: string | undefined;
    let title: string | undefined;

    if (tweetId) {
      try {
        // api.fxtwitter.com supports CORS
        const fxResponse = await fetch(`https://api.fxtwitter.com/status/${tweetId}`);
        if (fxResponse.ok) {
          const fxData = await fxResponse.json();
          if (fxData.tweet) {
            title = fxData.tweet.text;
            if (fxData.tweet.media?.videos?.[0]?.thumbnail_url) {
              thumbnail = fxData.tweet.media.videos[0].thumbnail_url;
            } else if (fxData.tweet.media?.photos?.[0]?.url) {
              thumbnail = fxData.tweet.media.photos[0].url;
            }
          }
        }
      } catch (fxErr) {
        console.warn('[Twitter] fxtwitter failed', fxErr);
      }
    }

    // 2. Fallback to official oEmbed (Usually supports CORS)
    if (!title) {
      const publishUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
      const response = await fetch(publishUrl); // CORS?
      if (response.ok) {
        const data = await response.json();
        title = data.title;
        if (!thumbnail && data.thumbnail_url) thumbnail = data.thumbnail_url;

        if (!title) title = `Tweet by ${data.author_name}`;
      }
    }

    // 3. Convert thumbnail to Base64
    let thumbnailBase64: string | undefined;
    if (thumbnail) {
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
  const normalizedUrl = url.replace(/\?.*$/, '');

  const extractFromHtml = (html: string): { title: string; thumbnail?: string } | null => {
    let title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title');
    let thumbnail = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image');

    // JSON-LD backup
    if (!title || !thumbnail) {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
      if (jsonLdMatch && jsonLdMatch[1]) {
        try {
          const j = JSON.parse(jsonLdMatch[1]);
          if (j.name && !title) title = j.name;
          if (j.thumbnailUrl && !thumbnail) thumbnail = j.thumbnailUrl;
        } catch { }
      }
    }

    if (title && isValidTitle(title)) {
      // Clean title
      let cleanTitle = decodeHtmlEntities(title);
      cleanTitle = cleanTitle.replace(/ on Instagram:?\s*[""]?/i, ': ').replace(/^.*? on Instagram:?\s*/i, '').replace(/[""]$/, '').trim();
      return { title: cleanTitle, thumbnail };
    }
    return null;
  };

  // Browser/Client-Side: Must use Proxy
  const proxies = [
    {
      name: 'corsproxy',
      getUrl: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      extractHtml: async (response: Response) => await response.text()
    },
    {
      name: 'allorigins',
      getUrl: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      extractHtml: async (response: Response) => await response.text()
    }
  ];

  for (const proxy of proxies) {
    try {
      const response = await fetch(proxy.getUrl(normalizedUrl));
      if (!response.ok) continue;

      const html = await proxy.extractHtml(response);
      if (!html) continue;

      const result = extractFromHtml(html);
      if (result) {
        let thumbnailBase64: string | undefined;
        if (result.thumbnail) {
          const cleanThumbnailUrl = decodeHtmlEntities(result.thumbnail).replace(/&amp;/g, '&');
          thumbnailBase64 = await fetchImageAsBase64(cleanThumbnailUrl);
        }
        return { title: result.title, thumbnail: thumbnailBase64, duration: undefined };
      }
    } catch (e) {
      console.warn(`Instagram scraping via ${proxy.name} failed:`, e);
      continue;
    }
  }

  return null;
}

export async function getVideoMetadata(url: string) {
  // Reverted to Client-Side function (No 'use server')

  try {
    let metadata: { title: string; thumbnail?: string; duration?: string | undefined } | null = null;

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

    // Generic Fallback (Noembed)
    try {
      const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
      const response = await fetch(noembedUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.title && isValidTitle(data.title)) {
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
    } catch (e) { }

    return null;

  } catch (error) {
    console.warn(`Error fetching metadata for ${url}:`, error);
    return null;
  }
}
