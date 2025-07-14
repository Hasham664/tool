// controllers/imageController.js

import { uploadOnCloudinary } from '../utils/cloudinary.js';
import scrapeHighQualityImage from '../utils/scrapeHighQualityImage.js';
import { compareFaces } from '../utils/compareFaces.js';
import { detectFace } from '../utils/detectFace.js';
import axios from 'axios';
import puppeteerScraper from '../utils/scrapeHighQualityImage.js';

const SIMILARITY_THRESHOLD = 70;


async function processWithFaces(rawResults, uploadedBuffer) {
  const enhanced = [];

  for (const item of rawResults) {
    // 1️⃣ Try scraping high-res image using Cheerio first
    let scrapedImage = await scrapeHighQualityImage(item.link);

    // 2️⃣ If Cheerio fails, fallback to Puppeteer
    if (!scrapedImage) {
      scrapedImage = await puppeteerScraper(item.link);
    }

    // 3️⃣ Choose best available image
    const candidateUrl = scrapedImage || item.highResImage || item.thumbnail;

    // 4️⃣ Log for debugging
    console.log('🔗 Link:', item.link);
    console.log('🔍 Scraped Image:', scrapedImage);
    console.log('📸 HighRes from SerpAPI:', item.highResImage);
    console.log('🧩 Final Image Used:', candidateUrl);

    // 5️⃣ Filter out unsupported or broken URLs
    if (!candidateUrl || !/\.(jpe?g|png|webp|gif)$/i.test(candidateUrl)) {
      enhanced.push({
        ...item,
        highResImage: candidateUrl,
        similarity: 0,
        isSimilar: false,
      });
      continue;
    }

    // 6️⃣ Compare face similarity (if available)
    let similarity = 0;
    try {
      const { data } = await axios.get(candidateUrl, {
        responseType: 'arraybuffer',
      });
      const score = await compareFaces(uploadedBuffer, data);
      similarity = score || 0;
    } catch (err) {
      console.warn('Face compare failed for', candidateUrl, err.message);
    }

    // 7️⃣ Push enhanced result
    enhanced.push({
      ...item,
      highResImage: candidateUrl,
      similarity,
      isSimilar: similarity >= SIMILARITY_THRESHOLD,
    });
  }

  return enhanced;
}



/**
 * If no face detected in upload, we just return thumbnails.
 */
function processWithoutFaces(rawResults) {
  return rawResults.map((item) => ({
    ...item,
    highResImage: item.thumbnail,
    similarity: 0,
    isSimilar: false,
  }));
}

/**
 * Main controller for file uploads.
 */
const imageController = async (req, res) => {
  try {
    const uploadRes = await uploadOnCloudinary(req.file.path);
    if (!uploadRes?.secure_url) {
      return res.status(500).json({ error: 'Upload failed' });
    }

    const serp = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_reverse_image',
        image_url: uploadRes.secure_url,
        api_key: process.env.SERP_API_KEY,
        num: 100, // Request up to 100 results (if supported by plan)
      },
    });
    const rawResults = serp.data.image_results || [];

    const uploadedBuffer = (
      await axios.get(uploadRes.secure_url, {
        responseType: 'arraybuffer',
      })
    ).data;

    const hasFace = await detectFace(uploadedBuffer);

    const enhanced = hasFace
      ? await processWithFaces(rawResults, uploadedBuffer)
      : processWithoutFaces(rawResults);

    return res.json({ originalResults: enhanced });
  } catch (err) {
    console.error('imageController error:', err);
    return res.status(500).json({ error: 'Reverse image search failed' });
  }
};

export default imageController;

/**
 * Controller for URL‑based search.
 */
export const urlSearch = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'No image URL provided' });
    }

    const serp = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_reverse_image',
        image_url: imageUrl,
        api_key: process.env.SERP_API_KEY,
        num: 100, 
      },
    });
    const rawResults = serp.data.image_results || [];

    const uploadedBuffer = (
      await axios.get(imageUrl, {
        responseType: 'arraybuffer',
      })
    ).data;

    const hasFace = await detectFace(uploadedBuffer);

    const enhanced = hasFace
      ? await processWithFaces(rawResults, uploadedBuffer)
      : processWithoutFaces(rawResults);

    return res.json({ originalResults: enhanced });
  } catch (err) {
    console.error('urlSearch error:', err);
    return res
      .status(500)
      .json({ error: 'Failed to perform reverse image search' });
  }
};
