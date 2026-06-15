import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson(file, fallback = {}) {
  ensureDataDir();
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export class LicenseStore {
  constructor() {
    this.licenses = new Map(Object.entries(readJson(LICENSES_FILE)));
    this.subscriptions = new Map(Object.entries(readJson(SUBSCRIPTIONS_FILE)));
  }

  save() {
    writeJson(LICENSES_FILE, Object.fromEntries(this.licenses));
    writeJson(SUBSCRIPTIONS_FILE, Object.fromEntries(this.subscriptions));
  }

  setLicense(key, data) {
    this.licenses.set(key, { ...data, expiry: data.expiry instanceof Date ? data.expiry.toISOString() : data.expiry });
    this.save();
  }

  getLicense(key) {
    return this.licenses.get(key) || null;
  }

  findBySubscription(subId) {
    for (const [key, license] of this.licenses) {
      if (license.subscriptionId === subId) return { key, license };
    }
    return null;
  }

  setSubscription(id, data) {
    this.subscriptions.set(id, data);
    this.save();
  }

  getSubscription(id) {
    return this.subscriptions.get(id) || null;
  }

  extendLicense(subId, months = 1) {
    const found = this.findBySubscription(subId);
    if (!found) return false;

    const expiry = new Date(found.license.expiry);
    expiry.setMonth(expiry.getMonth() + months);
    found.license.expiry = expiry.toISOString();
    found.license.status = 'active';
    this.licenses.set(found.key, found.license);
    this.save();
    return true;
  }

  cancelLicense(subId) {
    const found = this.findBySubscription(subId);
    if (!found) return false;
    found.license.status = 'cancelled';
    this.licenses.set(found.key, found.license);
    this.save();
    return true;
  }
}
