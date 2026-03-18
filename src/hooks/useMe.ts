import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/lib/api';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export default useMe;
