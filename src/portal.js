// One build serves every host. Which portal you get is decided by the subdomain:
//
//   admin.mrbites.in   -> 'admin'   (admin console at the root path)
//   vendor.mrbites.in  -> 'vendor'  (vendor dashboard at the root path)
//   mrbites.in / www   -> 'main'    (landing page + the full legacy route tree)
//
// 'main' is also what localhost gets, so local development keeps working exactly
// as before. Two ways to exercise the subdomain routing without DNS:
//   - browse to admin.localhost:3000 (browsers resolve *.localhost themselves)
//   - append ?portal=admin to any URL — needed on Vercel preview deployments,
//     whose hostnames have no admin./vendor. prefix.
//
// This is presentation only. It changes which routes exist, never who is allowed
// in — the server decides that from the token.

const PORTALS = ['admin', 'vendor'];

export const resolvePortal = () => {
  const override = new URLSearchParams(window.location.search).get('portal');
  if (PORTALS.includes(override)) return override;

  const firstLabel = window.location.hostname.split('.')[0].toLowerCase();
  if (PORTALS.includes(firstLabel)) return firstLabel;

  return 'main';
};

/**
 * Absolute URL to another portal — a different host, so this is a real
 * navigation rather than a router push. Works in every environment:
 *   mrbites.in      -> vendor.mrbites.in
 *   www.mrbites.in  -> vendor.mrbites.in
 *   localhost:3000  -> vendor.localhost:3000
 */
export const portalUrl = (portal, path = '/') => {
  const { protocol, hostname, port } = window.location;
  const base = hostname.replace(/^www\./, '').replace(/^(admin|vendor)\./, '');
  return `${protocol}//${portal}.${base}${port ? `:${port}` : ''}${path}`;
};
