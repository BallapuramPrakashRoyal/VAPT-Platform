// Basic hostname/IP validation to stop obviously malformed or shell-unsafe input
// from ever reaching child_process calls (nmap) or outbound HTTP calls (ZAP).

const HOSTNAME_REGEX =
  /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

function isValidTarget(target) {
  if (!target || typeof target !== 'string') return false;
  const t = target.trim();
  if (t.length === 0 || t.length > 253) return false;
  // Reject anything that could be used for command injection - only allow
  // letters, digits, dots and hyphens.
  if (!/^[a-zA-Z0-9.\-]+$/.test(t)) return false;
  return HOSTNAME_REGEX.test(t) || IPV4_REGEX.test(t);
}

const validateTarget = (req, res, next) => {
  const { target, consent } = req.body;

  if (!isValidTarget(target)) {
    return res.status(400).json({
      message:
        'Invalid target. Provide a plain hostname or IPv4 address (no protocol, path, or special characters).',
    });
  }

  if (!consent || consent !== true) {
    return res.status(400).json({
      message:
        'You must confirm you own this target or have written authorization to test it before a scan can be created.',
    });
  }

  req.body.target = target.trim().toLowerCase();
  next();
};

module.exports = { validateTarget, isValidTarget };
