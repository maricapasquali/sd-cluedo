import {ResponseStatus} from '../rest-api/responses';

export function handlerResponseErrorCheck(
  err: any,
  status: ResponseStatus
): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((err?.response?.status as ResponseStatus) === status) {
      resolve();
    } else {
      reject(err);
    }
  });
}

type PromiseHandler = (resolve: any, reject: any) => any;

export function promises<T>(
  array: any[],
  handler: (item: any, index: number) => PromiseHandler
): Promise<T>[] {
  const _promises: Promise<T>[] = [];
  array.forEach((item, index) =>
    _promises.push(new Promise<T>(handler(item, index)))
  );
  return _promises;
}
