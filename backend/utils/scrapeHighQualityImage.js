import axios from 'axios';
import { load } from 'cheerio';
import { URL } from 'url';
import puppeteer from 'puppeteer';

export  async function scrapeHighQualityImage(pageUrl) {
  try {
    const { data: html } = await axios.get(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: 7000,
    });

    const $ = load(html);

    // Resolve relative URLs
    const resolveUrl = (src) => {
      try {
        return new URL(src, pageUrl).href;
      } catch {
        return null;
      }
    };

    // Helper to validate absolute URLs
    const isValidHttp = (url) =>
      url?.startsWith('http://') || url?.startsWith('https://');

    // 1. og:image and og:image:secure_url
    const ogTags = [
      $('meta[property="og:image:secure_url"]').attr('content'),
      $('meta[property="og:image"]').attr('content'),
    ];
    for (const tag of ogTags) {
      if (isValidHttp(tag)) return resolveUrl(tag);
    }

    // 2. twitter:image and twitter:image:src
    const twitterTags = [
      $('meta[name="twitter:image:src"]').attr('content'),
      $('meta[name="twitter:image"]').attr('content'),
    ];
    for (const tag of twitterTags) {
      if (isValidHttp(tag)) return resolveUrl(tag);
    }

    // 3. link[rel=image_src]
    const linkImage = $('link[rel="image_src"]').attr('href');
    if (isValidHttp(linkImage)) return resolveUrl(linkImage);

    // 4. Fallback to highest-resolution <img>
    let bestImg = null;
    let maxArea = 0;

    $('img').each((_, el) => {
      const $img = $(el);

      const candidates = [
        $img.attr('src'),
        $img.attr('data-src'),
        $img.attr('data-lazy-src'),
        $img.attr('data-original'),
        $img.attr('srcset')?.split(',').pop()?.trim().split(' ')[0],
      ].filter(Boolean);

      for (const rawSrc of candidates) {
        const src = resolveUrl(rawSrc);
        if (!isValidHttp(src)) continue;

        const width = parseInt($img.attr('width'), 10) || 0;
        const height = parseInt($img.attr('height'), 10) || 0;
        const area = width * height;

        if (area > maxArea) {
          maxArea = area;
          bestImg = src;
        }
      }
    });

    if (bestImg) return bestImg;

    return null;
  } catch (err) {
    console.warn('⚠️ Failed to scrape high-res image:', pageUrl, err.message);
    return null;
  }
}











export default async function puppeteerScraper(pageUrl) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new', // or `true` for compatibility
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    );

    await page.goto(pageUrl, {
      waitUntil: 'networkidle2', // wait for JS-loaded images
      timeout: 15000,
    });

    // Extract images from the DOM
    const bestImage = await page.evaluate(() => {
      const resolveUrl = (src) => {
        try {
          return new URL(src, window.location.href).href;
        } catch {
          return null;
        }
      };

      const allImages = Array.from(document.querySelectorAll('img'));
      let best = null;
      let maxArea = 0;

      for (const img of allImages) {
        let src =
          img.getAttribute('src') ||
          img.getAttribute('data-src') ||
          img.getAttribute('data-lazy-src') ||
          img.getAttribute('data-original');

        if (!src) continue;

        // Try parsing srcset for better quality
        const srcset = img.getAttribute('srcset');
        if (srcset) {
          const candidates = srcset
            .split(',')
            .map((s) => s.trim().split(' ')[0]);
          src = candidates[candidates.length - 1] || src;
        }

        const resolved = resolveUrl(src);
        if (!resolved?.startsWith('http')) continue;

        const width = img.naturalWidth || img.width || 0;
        const height = img.naturalHeight || img.height || 0;
        const area = width * height;

        if (area > maxArea) {
          maxArea = area;
          best = resolved;
        }
      }

      return best;
    });

    return bestImage || null;
  } catch (err) {
    console.warn('🛑 Puppeteer failed to scrape image:', pageUrl, err.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

