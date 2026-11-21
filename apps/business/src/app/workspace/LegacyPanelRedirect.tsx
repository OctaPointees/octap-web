import { Navigate, useLocation, useParams } from 'react-router';

/**
 * `/organizations/:slug/merchant/…` and `/organizations/:slug/developer/…`, from before pages were
 * grouped by feature: the same page without the panel segment, keeping the query and hash.
 */
export function LegacyPanelRedirect() {
  const { slug = '', '*': page = '' } = useParams();
  const { search, hash } = useLocation();
  const to = ['/organizations', slug, page].filter(Boolean).join('/');
  return <Navigate to={to + search + hash} replace />;
}
