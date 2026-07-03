const axios = require('axios');

const ZAP_API_URL = process.env.ZAP_API_URL || 'http://localhost:8080';
const ZAP_API_KEY = process.env.ZAP_API_KEY || '';

const zap = axios.create({ baseURL: ZAP_API_URL, timeout: 20000 });

function withKey(params = {}) {
  return { ...params, apikey: ZAP_API_KEY };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Runs an OWASP ZAP spider (crawl) followed by an active scan against the
 * target, polls until both complete, then pulls structured alerts.
 *
 * Requires a ZAP daemon reachable at ZAP_API_URL (see docker-compose.yml,
 * service "zap"). If ZAP is unreachable this throws a clear error instead
 * of silently returning no results.
 */
async function runWebVulnScan(target, { maxWaitMs = 10 * 60 * 1000, pollMs = 5000 } = {}) {
  const targetUrl = target.startsWith('http') ? target : `http://${target}`;

  await ensureZapReachable();

  // 1. Spider the target to discover URLs
  const spiderStart = await zap.get('/JSON/spider/action/scan/', {
    params: withKey({ url: targetUrl, recurse: true }),
  });
  const spiderScanId = spiderStart.data.scan;
  await pollUntilComplete(
    () => zap.get('/JSON/spider/view/status/', { params: withKey({ scanId: spiderScanId }) }),
    (res) => Number(res.data.status) >= 100,
    maxWaitMs,
    pollMs
  );

  // 2. Active scan (actually probes for XSS, SQLi, etc.)
  const activeStart = await zap.get('/JSON/ascan/action/scan/', {
    params: withKey({ url: targetUrl, recurse: true, inScopeOnly: false }),
  });
  const activeScanId = activeStart.data.scan;
  await pollUntilComplete(
    () => zap.get('/JSON/ascan/view/status/', { params: withKey({ scanId: activeScanId }) }),
    (res) => Number(res.data.status) >= 100,
    maxWaitMs,
    pollMs
  );

  // 3. Pull structured alerts
  const alertsRes = await zap.get('/JSON/core/view/alerts/', {
    params: withKey({ baseurl: targetUrl }),
  });
  const alerts = alertsRes.data.alerts || [];

  return alerts.map((a) => ({
    name: a.alert || a.name,
    riskLevel: mapRisk(a.risk),
    confidence: a.confidence,
    description: stripHtml(a.description),
    url: a.url,
    param: a.param,
    evidence: a.evidence,
    solution: stripHtml(a.solution),
    cweId: a.cweid,
    reference: stripHtml(a.reference),
  }));
}

async function ensureZapReachable() {
  try {
    await zap.get('/JSON/core/view/version/', { params: withKey() });
  } catch (err) {
    throw new Error(
      `Cannot reach OWASP ZAP daemon at ${ZAP_API_URL}. Start it via docker-compose (service "zap") before running a web vuln scan.`
    );
  }
}

async function pollUntilComplete(fetchStatus, isDone, maxWaitMs, pollMs) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await fetchStatus();
    if (isDone(res)) return;
    if (Date.now() - start > maxWaitMs) {
      throw new Error('ZAP scan timed out - target may be slow or unreachable.');
    }
    await sleep(pollMs);
  }
}

function mapRisk(risk) {
  const map = {
    High: 'High',
    Medium: 'Medium',
    Low: 'Low',
    Informational: 'Informational',
  };
  return map[risk] || 'Informational';
}

function stripHtml(str = '') {
  return String(str).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = { runWebVulnScan };
