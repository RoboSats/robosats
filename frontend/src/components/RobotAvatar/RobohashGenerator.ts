class RoboGenerator {
  private assetsCache: Record<string, string> = {};
  private assetsPromises: Record<string, Promise<string>> = {};
  private workers: Worker[] = [];

  constructor() {
    // limit to 16 workers
    const numCores = Math.min(navigator.hardwareConcurrency || 2, 16);

    for (let i = 0; i < numCores; i++) {
      this.workers.push(new Worker(new URL('./robohash.worker.ts', import.meta.url)));
    }
  }

  public generate: (hash: string, size: number) => Promise<string> = async (hash, size) => {
    const cacheKey = `${size}px;${hash}`;
    if (this.assetsCache[cacheKey]) {
      return this.assetsCache[cacheKey];
    } else if (cacheKey in this.assetsPromises) {
      return await this.assetsPromises[cacheKey];
    }

    const workerIndex = Object.keys(this.assetsPromises).length % this.workers.length;
    const worker = this.workers[workerIndex];

    this.assetsPromises[cacheKey] = new Promise<string>((resolve, reject) => {
      // Create a message object with the necessary data
      const message = { hash, size, cacheKey, workerIndex };

      // Listen for messages from the worker
      const handleMessage = (event: MessageEvent) => {
        const { cacheKey, imageUrl } = event.data;

        // Update the cache and resolve the promise
        this.assetsCache[cacheKey] = imageUrl;
        delete this.assetsPromises[cacheKey];
        resolve(imageUrl);
      };

      // Add the event listener for messages
      worker.addEventListener('message', handleMessage);

      // Send the message to the worker
      worker.postMessage(message);

      // Clean up the event listener after receiving the result
      const cleanup = () => {
        worker.removeEventListener('message', handleMessage);
      };

      // Reject the promise if an error occurs
      worker.addEventListener('error', (error) => {
        cleanup();
        reject(error);
      });

      // Reject the promise if the worker times out
      setTimeout(() => {
        cleanup();
        reject(new Error('Generation timed out'));
      }, 10000); // Adjust the timeout duration if needed
    });

    return await this.assetsPromises[cacheKey];
  };
}

export const robohash = new RoboGenerator();
