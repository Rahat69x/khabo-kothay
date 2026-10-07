# Operations Runbook: Khabo Kothay? (খাবো কোথায়?)

This runbook guides production operations, cost control, incident handling, and emergency response for the Khabo Kothay? API and mobile application.

---

## 1. Google Cloud Quotas, Budget Alerts & Cost Control

### Google Maps Platform Pricing & Budgeting
Google Maps Platform charges per API request:
- **Places API (New) - Text Search**: ~$32.00 per 1,000 requests.
- **Places API (New) - Place Details**: ~$17.00 per 1,000 requests.
- **Routes API - Route Matrix**: ~$5.00 per 1,000 elements (with traffic).

### Setting Hard Quotas & Alerts in Google Cloud Console
To prevent accidental overdrafts or runaway billing:
1. Open the [Google Cloud Console Billing section](https://console.cloud.google.com/billing).
2. Navigate to **Budgets & Alerts** → **Create Budget**:
   - Scope: Target your `Khabo Kothay?` GCP project.
   - Budget Amount: Set a monthly ceiling (e.g. $50.00 or $100.00).
   - Alert Thresholds: Configure notifications at **50%**, **80%**, **90%**, and **100%**.
   - Email recipients: Set your engineering alert list.
3. Configure Daily API Quotas:
   - Go to **APIs & Services** → **Places API (New)** → **Quotas & System Limits**.
   - Cap **Requests per day** to your safe limit (e.g., 2,500 requests/day).
   - Repeat for **Routes API**.

---

## 2. Emergency Incident Runbooks

### Incident A: Google Cloud Quota Exceeded or Billing Capped
**Symptoms**:
- Users receive cached results with the message: `"Global search capacity limit reached for this period. Showing cached dining options."`
- Logs report `403 Quota Exceeded` from Google Places or Routes APIs.

**Action Steps**:
1. Check `/api/v1/admin/usage` to inspect total requests and monthly budget consumption:
   ```bash
   curl -s http://localhost:3000/api/v1/admin/usage | jq .
   ```
2. The server's built-in **kill-switch** automatically trips when monthly budget thresholds are reached, serving cached ~300m coarse grid candidates and mock data without crashing.
3. If you increased quotas in GCP and want to re-enable live requests:
   ```bash
   curl -X POST http://localhost:3000/api/v1/admin/killswitch \
     -H "Content-Type: application/json" \
     -d '{"active": false}'
   ```
4. If you need to manually activate the kill-switch to immediately stop GCP charges:
   ```bash
   curl -X POST http://localhost:3000/api/v1/admin/killswitch \
     -H "Content-Type: application/json" \
     -d '{"active": true}'
   ```

---

### Incident B: An API Key Leaks (Emergency Rotation)
**Symptoms**:
- Automated security scanners trigger an alert or unauthorized traffic is detected.

**Immediate Steps**:
1. Go to [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials).
2. Locate the leaked key (`GOOGLE_SERVER_KEY` or `GOOGLE_BROWSER_KEY`).
3. Click **Regenerate Key** (or create a new key and delete the old one).
4. Restrict the new server key:
   - **API restrictions**: Restrict strictly to `Places API (New)` and `Routes API`.
   - **IP restrictions**: Restrict to your Render / cloud server static outbound IPs.
5. Update your deployment environment variables on Render:
   - Update `GOOGLE_SERVER_KEY` with the newly generated secret.
   - Click **Manual Deploy** → **Deploy latest commit**.
6. Verify service health immediately:
   ```bash
   curl -i https://<your-service>.onrender.com/api/v1/health
   ```

---

### Incident C: Server Down or Idle Spin-Up
**Symptoms**:
- Mobile app shows *"Waking up the server... Please hold on while the free instance boots."* banner.
- Liveness probe returns connection timeout or 503.

**Resolution Steps**:
1. Free tiers on Render sleep after 15 minutes of inactivity. Both the web client (`public/js/api.js`) and the mobile app (`HomeScreen.js`) automatically ping `/api/v1/health` with exponential backoff (retrying up to 60 seconds) until the instance wakes.
2. For zero-downtime production deployments, upgrade the Render instance from Free to Starter tier ($7/month) to prevent idle sleep.
3. Check probe endpoints:
   ```bash
   curl https://<your-service>.onrender.com/health     # Liveness probe (200 OK)
   curl https://<your-service>.onrender.com/ready      # Readiness probe (200 OK)
   ```
4. Inspect structured application logs:
   - Render dashboard → Logs → Search by `req.id` or `level: error`.
   - Notice that personal data (GPS, phone numbers, auth tokens) are automatically redacted in pino output.

---

## 3. Maintenance Checklist
- [ ] **Monthly**: Review GCP Billing reports and verify cache hit ratios via `/api/v1/admin/usage`.
- [ ] **Quarterly**: Audit Google Maps Platform pricing changes and adjust `thresholds.json` cost control parameters if needed.
- [ ] **Semi-annually**: Rotate `APP_CLIENT_TOKEN` and review EAS Update channels.
