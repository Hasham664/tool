import axios from 'axios';

const API_KEY = process.env.LUXAND_API_KEY; // ✅ Safer for production
console.log('Luxand API Key:', API_KEY);

/**
 * Returns true if Luxand detects at least one face in the image buffer.
 */
export async function detectFace(buffer) {
  try {
    const res = await axios.post(
      'https://api.luxand.cloud/photo/detect',
      buffer,
      {
        headers: {
          'Content-Type': 'application/octet-stream',
          token: API_KEY,
        },
      }
    );
    // res.data is an array of face objects; non‑empty means face found
    return Array.isArray(res.data) && res.data.length > 0;
  } catch (err) {
    console.warn('Face detection failed:', err.message);
    return false;
  }
}
