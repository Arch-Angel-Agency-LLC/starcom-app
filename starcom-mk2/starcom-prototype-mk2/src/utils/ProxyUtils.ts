const PROXY_URL = 'http://localhost:8081/';

export const getProxiedUrl = (url: string): string => {
  return `${PROXY_URL}${url}`;
};