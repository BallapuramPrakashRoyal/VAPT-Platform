const { execFile } = require('child_process');
const xml2js = require('xml2js');

const NMAP_PATH = process.env.NMAP_PATH || 'nmap';

/**
 * Runs an nmap service/version scan against a single validated target and
 * returns a normalized array of open ports.
 *
 * Uses execFile (not exec) with an argument array so the target can never
 * be interpreted as a shell command, and -oX - to get parseable XML on stdout.
 */
function runPortScan(target, { timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const args = [
      '-sV', // service/version detection
      '-T4', // faster timing template
      '--top-ports',
      '100', // scan the 100 most common ports - keep it fast for a web demo
      '-oX',
      '-', // XML output to stdout
      target,
    ];

    execFile(
      NMAP_PATH,
      args,
      { timeout: timeoutMs, maxBuffer: 1024 * 1024 * 10 },
      async (error, stdout, stderr) => {
        if (error) {
          return reject(
            new Error(
              `nmap execution failed: ${error.message}. Make sure nmap is installed on the server (see backend/Dockerfile).`
            )
          );
        }
        try {
          const parsed = await xml2js.parseStringPromise(stdout);
          const ports = extractPorts(parsed);
          resolve(ports);
        } catch (parseErr) {
          reject(new Error(`Failed to parse nmap output: ${parseErr.message}`));
        }
      }
    );
  });
}

function extractPorts(parsedXml) {
  const results = [];
  const hosts = parsedXml?.nmaprun?.host;
  if (!hosts) return results;

  const hostList = Array.isArray(hosts) ? hosts : [hosts];
  for (const host of hostList) {
    const portsBlock = host?.ports?.[0]?.port;
    if (!portsBlock) continue;
    for (const p of portsBlock) {
      const portId = Number(p.$.portid);
      const protocol = p.$.protocol;
      const state = p.state?.[0]?.$.state;
      const service = p.service?.[0]?.$ || {};
      results.push({
        port: portId,
        protocol,
        state,
        service: service.name || 'unknown',
        product: service.product || '',
        version: service.version || '',
      });
    }
  }
  // Only surface open (or open|filtered) ports in the report
  return results.filter((r) => r.state && r.state.includes('open'));
}

module.exports = { runPortScan };
