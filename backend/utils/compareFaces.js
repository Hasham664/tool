import axios from 'axios';

// Pass buffers or URLs of two images to compare
export const compareFaces = async (image1, image2) => {
  const API_KEY = process.env.LUXAND_API_KEY;

  const detectFace = async (imageBuffer) => {
    const res = await axios.post(
      'https://api.luxand.cloud/photo/detect',
      imageBuffer,
      {
        headers: {
          'Content-Type': 'application/octet-stream',
          token: API_KEY,
        },
      }
    );
    return res.data[0]?.id; // face ID
  };

  try {
    const id1 = await detectFace(image1);
    const id2 = await detectFace(image2);

    if (!id1 || !id2) return null;

    const res = await axios.get(
      `https://api.luxand.cloud/photo/verify?photo1=${id1}&photo2=${id2}`,
      {
        headers: {
          token: API_KEY,
        },
      }
    );

    return res.data?.confidence || 0; // confidence score (0-100)
  } catch (err) {
    console.error('Face comparison failed:', err.message);
    return 0;
  }
};
