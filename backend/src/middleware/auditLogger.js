import { logAudit } from '../utils/audit.js';

// Hook po CRUD: jei vartotojas autentifikuotas ir request baigiasi <400,
// automatiškai užrašo audit įrašą.
export function auditLogger(req, res, next) {
  res.on('finish', () => {
    const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!methods.includes(req.method)) return;
    if (res.statusCode >= 400) return;
    if (!req.user) return;

    const entity_type = (req.baseUrl || '').replace('/api/', '') || 'unknown';
    const action = `${req.method.toLowerCase()}_${req.path}`;

    logAudit({
      user_id: req.user.id,
      action,
      entity_type,
      entity_id: null,
      details: { status: res.statusCode }
    }).catch(() => {});
  });

  next();
}
