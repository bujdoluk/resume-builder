
export function findOrFirst<T, K extends keyof T>(array: T[], key: K, value: T[K]): T {
  return array.find((item) => item[key] === value) ?? array[0]!;
}
