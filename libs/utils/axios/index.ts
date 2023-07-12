import axios, {AxiosInstance, CreateAxiosDefaults} from 'axios';
import {Agent} from 'https';

declare module 'axios' {
  interface AxiosRequestConfig {
    urlParams?: Record<string, string>;
  }
}

export function createAxiosInstance(
  config: CreateAxiosDefaults<any>
): AxiosInstance {
  const axiosInstance: AxiosInstance = axios.create({
    httpsAgent: new Agent({rejectUnauthorized: false}),
    ...config,
  });
  axiosInstance.interceptors.request.use(config => {
    if (!config.url) return config;
    let pathname = config.url;
    Object.entries(config.urlParams || {}).forEach(
      ([k, v]) => (pathname = pathname.replace(`:${k}`, encodeURIComponent(v)))
    );
    return {
      ...config,
      url: pathname,
    };
  });
  axiosInstance.interceptors.response.use(response => {
    if (response.headers['x-access-token']) {
      axiosInstance.defaults.headers['authorization'] =
        response.headers['x-access-token'];
    }
    return response;
  });
  return axiosInstance;
}
