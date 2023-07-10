type PromiseHandler = (resolve: any, reject: any) => any;

export function promises<T>(
  array: any[],
  handler: (item: any) => PromiseHandler
): Promise<T>[] {
  const _promises: Promise<T>[] = [];
  array.forEach(item => _promises.push(new Promise<T>(handler(item))));
  return _promises;
}
