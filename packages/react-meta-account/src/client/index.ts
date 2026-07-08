import axios from 'axios';
import type {AxiosInstance} from 'axios';

export interface MetaAccountClientConfig {
  /** Backend route prefix, matching `config('whatsapp.route.prefix')`. Default: `api/whatsapp`. */
  baseUrl?: string;
  /** Defaults to the global axios, inheriting any auth interceptors the host set up. */
  axios?: AxiosInstance;
}

const DEFAULT_BASE_URL = 'api/whatsapp';

export interface ResolvedClient {
  instance: AxiosInstance;
  url: (path: string) => string;
}

export function resolveClient(
  config: MetaAccountClientConfig = {},
): ResolvedClient {
  const instance = config.axios ?? axios;
  const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');

  return {
    instance,
    url: (path) => `${baseUrl}/${path.replace(/^\/+/, '')}`,
  };
}
