const axios = require('axios');
const dns = require('dns').promises;

/**
 * Enumerates subdomains using certificate transparency logs (crt.sh) - this
 * is passive recon (no packets sent to the target itself for discovery) and
 * does not require an external tool binary. Each candidate is then resolved
 * via DNS to confirm it is live.
 */
async function runSubdomainEnum(target, { concurrency = 10, dnsTimeoutMs = 4000 } = {}) {
  const candidates = await queryCrtSh(target);
  candidates.add(target); // always include the apex domain itself

  const list = Array.from(candidates);
  const results = [];

  // Resolve in small batches to avoid hammering DNS / getting rate limited
  for (let i = 0; i < list.length; i += concurrency) {
    const batch = list.slice(i, i + concurrency);
    const resolved = await Promise.all(
      batch.map((sub) => resolveSubdomain(sub, dnsTimeoutMs))
    );
    results.push(...resolved);
  }

  return results.sort((a, b) => a.subdomain.localeCompare(b.subdomain));
}

async function queryCrtSh(target) {
  const set = new Set();
  try {
    const { data } = await axios.get(
      `https://crt.sh/?q=%25.${encodeURIComponent(target)}&output=json`,
      { timeout: 15000 }
    );
    if (Array.isArray(data)) {
      for (const entry of data) {
        const names = String(entry.name_value || '')
          .split('\n')
          .map((n) => n.trim().toLowerCase())
          .filter(Boolean);
        for (const n of names) {
          if (!n.includes('*') && n.endsWith(target)) {
            set.add(n);
          }
        }
      }
    }
  } catch (err) {
    // crt.sh can be slow/rate-limited - don't fail the whole scan, just
    // return what we have (possibly just the apex domain).
    console.warn(`[subdomainEnum] crt.sh lookup failed: ${err.message}`);
  }
  return set;
}

async function resolveSubdomain(subdomain, timeoutMs) {
  try {
    const addresses = await Promise.race([
      dns.resolve4(subdomain),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('dns timeout')), timeoutMs)
      ),
    ]);
    return { subdomain, resolved: true, ipAddresses: addresses };
  } catch {
    return { subdomain, resolved: false, ipAddresses: [] };
  }
}

module.exports = { runSubdomainEnum };
