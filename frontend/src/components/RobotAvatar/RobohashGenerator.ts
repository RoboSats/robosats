interface Task {
  robohash: Robohash;
  resolves: Array<(result: string) => void>;
  rejects: Array<(reason?: Error) => void>;
}

interface Robohash {
  hash: string;
  size: 'small' | 'large';
  cacheKey: string;
}

interface RoboWorker {
  worker: Worker;
  busy: boolean;
}

class RoboGenerator {
  private assetsCache: Record<string, string> = {};

  private readonly workers: RoboWorker[] = [];
  private readonly queue: Task[] = [];

  constructor() {
    // limit to 8 workers
    const numCores = 8;

    for (let i = 0; i < numCores; i++) {
      // FIXME
      // const worker = new Worker(new URL('./robohash.worker.ts', import.meta.url));
      // worker.onmessage = this.assignTasksToWorkers.bind(this);
      // this.workers.push({ worker, busy: false });
    }
  }

  private assignTasksToWorkers(): void {
    const availableWorker = this.workers.find((w) => !w.busy);

    if (availableWorker) {
      const task = this.queue.shift();
      if (task) {
        availableWorker.busy = true;
        availableWorker.worker.postMessage(task.robohash);

        // Clean up the event listener and free the worker after receiving the result
        const cleanup = (): void => {
          availableWorker.worker.removeEventListener('message', completionCallback);
          availableWorker.busy = false;
        };

        // Resolve the promise when the task is completed
        const completionCallback = (event: MessageEvent): void => {
          if (event.data.cacheKey === task.robohash.cacheKey) {
            const { cacheKey, imageUrl } = event.data;

            // Update the cache and resolve the promise
            this.assetsCache[cacheKey] = imageUrl;

            cleanup();

            task.resolves.forEach((f) => {
              f(imageUrl);
            });
          }
        };

        availableWorker.worker.addEventListener('message', completionCallback);

        // Reject the promise if an error occurs
        availableWorker.worker.addEventListener('error', (error) => {
          cleanup();

          task.rejects.forEach((f) => {
            f(new Error(error.message));
          });
        });
      }
    }
  }

  public generate: (hash: string, size: 'small' | 'large') => Promise<string> = async (
    hash,
    size,
  ) => {
    // FIXME
    return '';
    const cacheKey = `${size}px;${hash}`;
    if (this.assetsCache[cacheKey]) {
      return this.assetsCache[cacheKey];
    } else {
      return await new Promise((resolve, reject) => {
        let task = this.queue.find((t) => t.robohash.cacheKey === cacheKey);

        if (!task) {
          task = {
            robohash: {
              hash,
              size,
              cacheKey,
            },
            resolves: [],
            rejects: [],
          };
          this.queue.push(task);
        }

        task.resolves.push(resolve);
        task.rejects.push(reject);

        this.assignTasksToWorkers();
      });
    }
  };
}

export const robohash = new RoboGenerator();
