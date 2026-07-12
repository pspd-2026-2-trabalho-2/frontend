import useSWR, { type Key } from "swr";

export function useApi<T>(key: Key, fetcher: () => Promise<T>) {
  const { data, error, isLoading } = useSWR<T>(key, fetcher);
  return {
    data: data ?? null,
    error: error instanceof Error ? error.message : error ? "Erro inesperado." : null,
    isLoading,
  };
}
