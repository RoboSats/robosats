// FIXME
// import { async_generate_robohash } from 'robo-identities-wasm';

// // Listen for messages from the main thread
// self.addEventListener('message', (event) => {
//   void (async () => {
//     const { hash, size, cacheKey } = event.data;

//     // Generate the image using async_image_base
//     const t0 = performance.now();
//     const avatarB64: string = await async_generate_robohash(hash, size === 'small' ? 80 : 256);
//     const imageUrl = `data:image/png;base64,${avatarB64}`;
//     const t1 = performance.now();
//     console.log(`Avatar generated in: ${t1 - t0} ms`);
//     // Send the result back to the main thread
//     self.postMessage({ cacheKey, imageUrl });
//   })();
// });
