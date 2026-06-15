/**
 * Admin stats endpoint — basic subscription dashboard data
 * Protected by ADMIN_SECRET env var
 */

import path from 'path';
import { fileURLToPath } from 'url';

export function createAdminRoutes(app, store) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

  app.get('/admin', (req, res) => {
    if (!ADMIN_SECRET) {
      return res.status(503).send('Admin not configured. Set ADMIN_SECRET env var.');
    }
    res.sendFile(path.join(publicDir, 'admin.html'));
  });

  app.get('/api/admin/stats', (req, res) => {
    if (req.headers['x-admin-secret'] !== ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const licenses = [...store.licenses.values()];
    const active = licenses.filter(l => l.status === 'active' && new Date(l.expiry) > new Date());
    const mrr = active.length * (parseInt(process.env.SUBSCRIPTION_AMOUNT || '10000') / 100);

    res.json({
      totalLicenses: licenses.length,
      activeSubscriptions: active.length,
      estimatedMRR: `₹${mrr}`,
      demoLicenses: licenses.filter(l => l.demo).length,
      recent: licenses
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20)
        .map(l => ({
          email: l.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
          status: l.status,
          createdAt: l.createdAt,
          expiry: l.expiry,
          demo: l.demo || false
        }))
    });
  });
}
