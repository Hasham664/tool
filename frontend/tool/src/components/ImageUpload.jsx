import React, { useState } from 'react';
import axios from 'axios';

function ImageUpload() {
  const [file, setFile] = useState(null);
  const [imageURL, setImageURL] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file && !imageURL) {
      return alert('Please upload an image or paste an image URL.');
    }

    setLoading(true);

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('image', file);

        res = await axios.post(
          'http://localhost:4000/api/images/reverse-search',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
      } else {
        res = await axios.post('http://localhost:4000/api/images/url-search', {
          imageUrl: imageURL,
        });
      }

      console.log('API response:', res.data);
      // Backend returns { similarPeople, others, originalResults }
      setResults(res.data.originalResults || []);
    } catch (err) {
      console.error(err);
      alert('Reverse image search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#e9ecef] flex flex-col items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl border border-gray-200'>
        <h1 className='text-3xl font-semibold text-center mb-6 text-gray-800'>
          Reverse Image Search
        </h1>

        <form
          onSubmit={handleSubmit}
          className='flex flex-col items-center gap-4 w-full'
        >
          {/* File Upload */}
          <input
            type='file'
            accept='image/*'
            onChange={(e) => {
              setFile(e.target.files[0]);
              setImageURL('');
            }}
            className='block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-600
                       hover:file:bg-indigo-100'
          />

          {/* Image URL input */}
          <input
            type='text'
            placeholder='Or paste image URL here...'
            value={imageURL}
            onChange={(e) => {
              setImageURL(e.target.value);
              setFile(null);
            }}
            className='w-full p-2 border rounded-md text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300'
          />

          <button
            type='submit'
            className='bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition duration-200'
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Show uploaded or pasted image */}
        {(file || imageURL) && (
          <div className='mt-6 text-center'>
            <h2 className='text-lg font-semibold text-gray-700 mb-2'>
              Preview Image
            </h2>
            <img
              src={file ? URL.createObjectURL(file) : imageURL}
              alt='Preview'
              className='w-64 h-64 object-contain mx-auto rounded-lg shadow border'
            />
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className='mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl'>
          {results.map((item, index) => (
            <a
              href={item.link}
              key={index}
              target='_blank'
              rel='noopener noreferrer'
              className='bg-white p-4 rounded-xl shadow hover:shadow-md transition border border-gray-200'
            >
              <img
                src={item.highResImage || item.thumbnail}
                alt={item.title}
                className='w-full h-96 object-cover rounded-md mb-2'
              />
              <p className='text-sm font-medium text-gray-700'>{item.title}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
