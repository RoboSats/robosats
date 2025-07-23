export function arraysAreDifferent(arr1: string[], arr2: string[]): boolean {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  if (set1.size !== set2.size) {
    return true;
  }

  for (const item of set1) {
    if (!set2.has(item)) {
      return true;
    }
  }

  return false;
}

export default arraysAreDifferent;
