
const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({  
  rejectUnauthorized: false
});

const axiosConfig = {
    timeout: 6000,
    maxRedirects: 3,
    httpsAgent: httpsAgent,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    validateStatus: () => true
};

async function test() {
    const urls = [
        'https://google.com',
        'https://github.com',
        'https://vk.com',
        'https://t.me/durov'
    ];

    for (const url of urls) {
        try {
            let res = await axios.head(url, axiosConfig);
            console.log(`HEAD ${url}: ${res.status}`);
            if (res.status === 405 || res.status === 403 || res.status === 406 || res.status >= 500) {
                res = await axios.get(url, { ...axiosConfig, responseType: 'stream' });
                console.log(`GET ${url}: ${res.status}`);
            }
        } catch (e) {
            console.log(`ERROR ${url}: ${e.code}`);
        }
    }
}

test();
