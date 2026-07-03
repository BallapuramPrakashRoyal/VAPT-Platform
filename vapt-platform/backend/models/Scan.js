const mongoose = require('mongoose');

const PortResultSchema = new mongoose.Schema(
  {
    port: Number,
    protocol: String,
    state: String,
    service: String,
    product: String,
    version: String,
  },
  { _id: false }
);

const SubdomainResultSchema = new mongoose.Schema(
  {
    subdomain: String,
    resolved: Boolean,
    ipAddresses: [String],
  },
  { _id: false }
);

const VulnerabilityResultSchema = new mongoose.Schema(
  {
    name: String,
    riskLevel: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
      default: 'Informational',
    },
    confidence: String,
    description: String,
    url: String,
    param: String,
    evidence: String,
    solution: String,
    cweId: String,
    reference: String,
  },
  { _id: false }
);

const ModuleStatusSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'skipped'],
      default: 'pending',
    },
    startedAt: Date,
    completedAt: Date,
    error: String,
  },
  { _id: false }
);

const ScanSchema = new mongoose.Schema(
  {
    target: {
      type: String,
      required: [true, 'Target host/domain is required'],
      trim: true,
    },
    label: {
      type: String,
      trim: true,
      default: '',
    },
    modules: {
      portScan: { type: Boolean, default: false },
      webVulnScan: { type: Boolean, default: false },
      subdomainEnum: { type: Boolean, default: false },
    },
    consent: {
      confirmed: { type: Boolean, required: true },
      confirmedAt: { type: Date, required: true },
    },
    overallStatus: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'partial'],
      default: 'pending',
    },
    moduleStatus: {
      portScan: { type: ModuleStatusSchema, default: () => ({}) },
      webVulnScan: { type: ModuleStatusSchema, default: () => ({}) },
      subdomainEnum: { type: ModuleStatusSchema, default: () => ({}) },
    },
    results: {
      ports: [PortResultSchema],
      subdomains: [SubdomainResultSchema],
      vulnerabilities: [VulnerabilityResultSchema],
    },
    summary: {
      totalOpenPorts: { type: Number, default: 0 },
      totalSubdomainsFound: { type: Number, default: 0 },
      totalVulnerabilities: { type: Number, default: 0 },
      severityCounts: {
        Critical: { type: Number, default: 0 },
        High: { type: Number, default: 0 },
        Medium: { type: Number, default: 0 },
        Low: { type: Number, default: 0 },
        Informational: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scan', ScanSchema);
