import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('Cloudinary API Key:', process.env.CLOUDINARY_API_KEY);
console.log('Cloudinary API Secret:', process.env.CLOUDINARY_API_SECRET);

const uploadOnCloudinary = async (localFilePath, options = {}) => {
  try {
    if (!localFilePath) return null;
    const uploadOptions = { resource_type: 'auto', ...options };
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(
      localFilePath,
      uploadOptions
    );
    return response;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export { uploadOnCloudinary };

export default cloudinary;
