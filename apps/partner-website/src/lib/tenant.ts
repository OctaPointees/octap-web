export interface Tenant {
  slug: string;
  organizationId: string;
  name: string;
  initials: string;
  headline: string;
  description: string;
  theme: 'berry' | 'forest';
}

const demoTenants: Tenant[] = [
  {
    slug: 'octap-demo',
    organizationId: '11111111-1111-4111-8111-111111111111',
    name: 'Starbucks Coffee',
    initials: '★',
    theme: 'forest',
    headline: 'Good coffee.\nGreat rewards.',
    description:
      'Your favorite coffee, with a little something extra. Make every visit count and turn your daily ritual into your next treat.',
  },
];

export function getTenants(): Tenant[] {
  if (!process.env.PARTNER_TENANTS_JSON)
    return process.env.NODE_ENV === 'production' ? [] : demoTenants;
  const tenants: unknown = JSON.parse(process.env.PARTNER_TENANTS_JSON);
  if (!Array.isArray(tenants)) throw new Error('PARTNER_TENANTS_JSON must be an array');
  const slugs = new Set<string>();
  for (const tenant of tenants) {
    if (
      !tenant ||
      typeof tenant !== 'object' ||
      !['slug', 'organizationId', 'name', 'initials', 'headline', 'description'].every(
        (key) => typeof tenant[key] === 'string' && tenant[key].length > 0,
      ) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenant.slug) ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(tenant.organizationId) ||
      !['berry', 'forest'].includes(tenant.theme) ||
      slugs.has(tenant.slug)
    ) {
      throw new Error('Invalid or duplicate partner tenant configuration');
    }
    slugs.add(tenant.slug);
  }
  return tenants as Tenant[];
}

export function tenantSlug(host: string, rootDomain: string): string | null {
  const hostname = host.toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  const root = rootDomain.toLowerCase().replace(/\.$/, '');
  const suffix = `.${root}`;
  if (!hostname.endsWith(suffix)) return null;
  const slug = hostname.slice(0, -suffix.length);
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

export function resolveTenant(host: string): Tenant | undefined {
  // Google OAuth supports plain localhost for local testing. Never apply this alias in production.
  if (process.env.NODE_ENV === 'development' && /^localhost(:\d+)?$/i.test(host)) {
    return getTenants().find((tenant) => tenant.slug === process.env.DEV_TENANT_SLUG);
  }
  const slug = tenantSlug(host, process.env.PARTNER_ROOT_DOMAIN ?? 'localhost');
  return getTenants().find((tenant) => tenant.slug === slug);
}
