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
