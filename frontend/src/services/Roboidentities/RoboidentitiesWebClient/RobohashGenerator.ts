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
    for (let i = 0; i < this.numberOfWorkers; i++) {
      this.workers.push(this.createWorker(i));
    }

    setTimeout(() => {
      this.waitingForLibrary = false;
      this.drainQueue();
    }, 3000);
  }

  public getFromCache = (hash: string, size: 'small' | 'large'): string | undefined => {
    const cacheKey = `${hash};${size}`;
    return this.assetsCache[cacheKey];
  };

  public generate: (hash: string, size: 'small' | 'large') => Promise<string> = async (
    hash,
    size,
  ) => {
    const cacheKey = `${hash};${size}`;
    if (this.assetsCache[cacheKey]) {
      return this.assetsCache[cacheKey];
    } else {
      return await new Promise((resolve, reject) => {
        const alreadyInFlight = (this.resolves[cacheKey]?.length ?? 0) > 0;

        this.resolves[cacheKey] = [...(this.resolves[cacheKey] ?? []), resolve];
        this.rejects[cacheKey] = [...(this.rejects[cacheKey] ?? []), reject];

        if (!alreadyInFlight) {
          this.addTask({
            robohash: {
              hash,
              size,
              cacheKey,
            },
          });
        }
      });
    }
  };

  createWorker = (id: number): RoboWorker => {
    // @ts-expect-error — webpack resolves this Worker URL at build time; tsc can't verify it
    const worker = new Worker(new URL('./robohash.worker.ts', import.meta.url));

    worker.onmessage = (event) => {
      const { cacheKey, imageUrl } = event.data;
      this.assetsCache[cacheKey] = imageUrl;

      const callbacks = this.resolves[cacheKey] ?? [];
      delete this.resolves[cacheKey];
      delete this.rejects[cacheKey];
      callbacks.forEach((f) => {
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
      availableWorker.busy = true;
      availableWorker.worker.postMessage(task);
    } else {
      this.taskQueue.push(task);
    }
  };

  private drainQueue = (): void => {
    for (const worker of this.workers) {
      if (this.taskQueue.length === 0) break;
      if (!worker.busy) {
        const nextTask = this.taskQueue.shift()!;
        worker.busy = true;
        worker.worker.postMessage(nextTask);
      }
    }
  };
}

export const robohash = new RoboGenerator();
