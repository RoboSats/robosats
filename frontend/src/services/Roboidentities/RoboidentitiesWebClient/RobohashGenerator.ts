interface Task {
  robohash: Robohash;
}

interface RoboWorker {
  id: number;
  worker: Worker;
  busy: boolean;
}

interface Robohash {
  hash: string;
  size: 'small' | 'large';
  cacheKey: string;
}

class RoboGenerator {
  private assetsCache: Record<string, string> = {};

  private readonly workers: RoboWorker[] = [];
  private readonly taskQueue: Task[] = [];
  private readonly numberOfWorkers: number = 8;
  private waitingForLibrary: boolean = true;

  private resolves: Record<string, Array<(result: string) => void>> = {};
  private rejects: Record<string, Array<(reason?: Error) => void>> = {};

  constructor() {
    setTimeout(() => {
      this.waitingForLibrary = false;
      for (let i = 0; i < this.numberOfWorkers; i++) {
        this.workers.push(this.createWorker(i));
      }
    }, 3000);
  }

  public generate: (hash: string, size: 'small' | 'large') => Promise<string> = async (
    hash,
    size,
  ) => {
    const cacheKey = `${hash};${size}`;
    if (this.assetsCache[cacheKey]) {
      return this.assetsCache[cacheKey];
    } else {
      return await new Promise((resolve, reject) => {
        let task = this.taskQueue.find((task) => task.robohash.cacheKey === cacheKey);
        if (!task) {
          task = {
            robohash: {
              hash,
              size,
              cacheKey,
            },
          };
        }

        this.resolves[cacheKey] = [...(this.resolves[cacheKey] ?? []), resolve];
        this.rejects[cacheKey] = [...(this.rejects[cacheKey] ?? []), reject];

        this.addTask(task);
      });
    }
  };

  createWorker = (id: number): RoboWorker => {
    const worker = new Worker(new URL('./robohash.worker.ts', import.meta.url));

    worker.onmessage = (event) => {
      const { cacheKey, imageUrl } = event.data;
      // Update the cache and resolve the promise
      this.assetsCache[cacheKey] = imageUrl;
      this.resolves[cacheKey].forEach((f) => {
        f(imageUrl);
      });

      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift();
        this.workers[id].busy = true;
        this.workers[id].worker.postMessage(nextTask);
      } else {
        this.workers[id].busy = false;
      }
    };

    return { id, worker, busy: false };
  };

  addTask = (task: Task): void => {
    const availableWorker = this.workers.find((w) => !w.busy);
    if (availableWorker && !this.waitingForLibrary) {
      availableWorker.worker.postMessage(task);
    } else {
      this.taskQueue.push(task);
    }
  };
}

export const robohash = new RoboGenerator();
