import { useSearchParams } from 'react-router';
import { NO_FILTERS, readFilters, writeFilters, type RewardFilters } from '../domain/filters';

/**
 * The voucher filters, kept in the URL. Changing them replaces the history entry instead of adding
 * one, so Back leaves the page rather than stepping through every tick of a slider.
 */
export function useRewardFilters() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const setFilters = (next: RewardFilters) =>
    setParams((current) => writeFilters(current, next), { replace: true });
  return { filters, setFilters, clear: () => setFilters(NO_FILTERS) };
}
