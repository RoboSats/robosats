import { async_generate_robohash } from 'robo-identities-wasm';

self.onmessage = async (event) => {
  if (!event.data) return;
  try {
    const { hash, size, cacheKey } = event.data.robohash;
    // Generate the image using async_image_base
    const avatarB64: string = await async_generate_robohash(hash, size === 'small' ? 80 : 256);
    const imageUrl = `data:image/png;base64,${avatarB64}`;
    // Send the result back to the main thread
    self.postMessage({ cacheKey, imageUrl });
  } catch (error) {
    console.error('Wasm error:', error);
  }
};
