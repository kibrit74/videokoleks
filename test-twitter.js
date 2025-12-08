const https = require('https');

// Helper to fetch url
function fetchUrl(url, headers = {}) {
    return new Promise((resolve, reject) => {
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return reject(e);
        }

        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });

        req.on('error', reject);
        req.end();
    });
}

async function run() {
    // A known public tweet (NASA)
    const targetUrl = 'https://twitter.com/NASA/status/1826723224716804595'; // Verify this is a recent public video
    console.log(`Testing URL: ${targetUrl}`);

    // Test api.fxtwitter.com (JSON)
    console.log('\n--- Testing api.fxtwitter.com (JSON) ---');
    try {
        const apiUrl = targetUrl.replace('twitter.com', 'api.fxtwitter.com').replace('x.com', 'api.fxtwitter.com');
        console.log(`Fetching: ${apiUrl}`);

        const res = await fetchUrl(apiUrl, {
            'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)'
        });
        console.log(`Status: ${res.status}`);

        if (res.status === 200) {
            const data = JSON.parse(res.body);

            if (data.tweet && data.tweet.media && data.tweet.media.videos) {
                console.log('Found video media:', data.tweet.media.videos[0]?.thumbnail_url);
            } else {
                console.log('API: No video media found');
            }
        } else {
            console.log('api.fxtwitter failed:', res.status);
        }
    } catch (e) {
        console.log('api.fxtwitter error:', e);
    }

    // 2. Try Direct Scrape with Facebook Bot UA (The Instagram Trick)
    console.log('\n--- Testing Direct Scrape (Facebook Bot) ---');
    try {
        const scrapeUrl = targetUrl.replace('twitter.com', 'x.com');
        const res = await fetchUrl(scrapeUrl, {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
        });
        console.log(`Status: ${res.status}`);

        if (res.status === 200) {
            const ogImageMatch = res.body.match(/<meta property="og:image" content="([^"]+)"/);
            if (ogImageMatch) {
                console.log('SUCCESS! Direct Scrape found og:image:', ogImageMatch[1]);
            } else {
                console.log('Direct Scrape: No og:image found');
            }
        }
    } catch (e) {
        console.log('Scrape error:', e);
    }
}

run();
