const asyncHandler = require('express-async-handler');
const Scan = require('../models/Scan');
const { runPortScan } = require('../services/portScanService');
const { runSubdomainEnum } = require('../services/subdomainService');
const { runWebVulnScan } = require('../services/webVulnService');

// @desc  Create a new scan and kick off the selected modules in the background
// @route POST /api/scans
const createScan = asyncHandler(async (req, res) => {
  const { target, label, modules = {} } = req.body;

  const scan = await Scan.create({
    target,
    label: label || target,
    modules: {
      portScan: !!modules.portScan,
      webVulnScan: !!modules.webVulnScan,
      subdomainEnum: !!modules.subdomainEnum,
    },
    consent: { confirmed: true, confirmedAt: new Date() },
    overallStatus: 'pending',
  });

  // Fire and forget - the frontend polls GET /api/scans/:id for progress.
  executeScan(scan._id).catch((err) =>
    console.error(`[scan ${scan._id}] unhandled execution error:`, err.message)
  );

  res.status(201).json(scan);
});

// @desc  List all scans (most recent first)
// @route GET /api/scans
const getScans = asyncHandler(async (req, res) => {
  const scans = await Scan.find().sort({ createdAt: -1 }).select('-results');
  res.json(scans);
});

// @desc  Get one scan with full results
// @route GET /api/scans/:id
const getScanById = asyncHandler(async (req, res) => {
  const scan = await Scan.findById(req.params.id);
  if (!scan) {
    res.status(404);
    throw new Error('Scan not found');
  }
  res.json(scan);
});

// @desc  Delete a scan
// @route DELETE /api/scans/:id
const deleteScan = asyncHandler(async (req, res) => {
  const scan = await Scan.findById(req.params.id);
  if (!scan) {
    res.status(404);
    throw new Error('Scan not found');
  }
  await scan.deleteOne();
  res.json({ message: 'Scan deleted' });
});

// ---- Orchestration ----------------------------------------------------

async function executeScan(scanId) {
  const scan = await Scan.findById(scanId);
  if (!scan) return;

  scan.overallStatus = 'running';
  await scan.save();

  const jobs = [];
  if (scan.modules.portScan) jobs.push(runModule(scan, 'portScan', doPortScan));
  if (scan.modules.subdomainEnum) jobs.push(runModule(scan, 'subdomainEnum', doSubdomainEnum));
  if (scan.modules.webVulnScan) jobs.push(runModule(scan, 'webVulnScan', doWebVulnScan));

  await Promise.all(jobs);

  const fresh = await Scan.findById(scanId);
  const statuses = Object.values(fresh.moduleStatus).map((m) => m.status);
  const anyFailed = statuses.includes('failed');
  const anyRan = statuses.some((s) => s === 'completed');

  fresh.overallStatus = anyFailed ? (anyRan ? 'partial' : 'failed') : 'completed';
  computeSummary(fresh);
  await fresh.save();
}

async function runModule(scan, key, fn) {
  scan.moduleStatus[key].status = 'running';
  scan.moduleStatus[key].startedAt = new Date();
  await scan.save();

  try {
    await fn(scan);
    const fresh = await Scan.findById(scan._id);
    fresh.moduleStatus[key].status = 'completed';
    fresh.moduleStatus[key].completedAt = new Date();
    await fresh.save();
  } catch (err) {
    console.error(`[scan ${scan._id}] module ${key} failed:`, err.message);
    const fresh = await Scan.findById(scan._id);
    fresh.moduleStatus[key].status = 'failed';
    fresh.moduleStatus[key].completedAt = new Date();
    fresh.moduleStatus[key].error = err.message;
    await fresh.save();
  }
}

async function doPortScan(scan) {
  const ports = await runPortScan(scan.target);
  await Scan.findByIdAndUpdate(scan._id, { $set: { 'results.ports': ports } });
}

async function doSubdomainEnum(scan) {
  const subdomains = await runSubdomainEnum(scan.target);
  await Scan.findByIdAndUpdate(scan._id, { $set: { 'results.subdomains': subdomains } });
}

async function doWebVulnScan(scan) {
  const vulns = await runWebVulnScan(scan.target);
  await Scan.findByIdAndUpdate(scan._id, { $set: { 'results.vulnerabilities': vulns } });
}

function computeSummary(scan) {
  const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0, Informational: 0 };
  for (const v of scan.results.vulnerabilities) {
    if (severityCounts[v.riskLevel] !== undefined) severityCounts[v.riskLevel]++;
  }
  scan.summary = {
    totalOpenPorts: scan.results.ports.length,
    totalSubdomainsFound: scan.results.subdomains.filter((s) => s.resolved).length,
    totalVulnerabilities: scan.results.vulnerabilities.length,
    severityCounts,
  };
}

module.exports = { createScan, getScans, getScanById, deleteScan };
