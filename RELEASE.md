# Release Information: Khabo Kothay? (খাবো কোথায়?)

## Summary
- **App Name**: Khabo Kothay? (খাবো কোথায়?)
- **Version**: `1.1.0`
- **Package Identifier**: `com.khabokothay.app`
- **Release Date**: October 8, 2026
- **Architecture**: Full-stack traffic-aware dining intelligence system (Express + Vanilla JS + React Native Expo)

---

## 1. Live Web & API Deployment Status

- **Status**: **NOT RUN** (No authenticated Render CLI or git remote found in local environment)
- **Target Backend API Base URL**: `https://khabo-kothay.onrender.com`
- **Local Dev URL**: `http://localhost:3000`

### Exact Steps to Deploy Live to Render:
1. Initialize or push your Git repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete Khabo Kothay? v1.1.0 release"
   git remote add origin https://github.com/<your-username>/khabo-kothay.git
   git branch -M main
   git push -u origin main
   ```
2. Open your [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Blueprint** (or **Web Service**).
3. Connect the repository. Render will automatically parse [render.yaml](file:///render.yaml).
4. Configure the following environment variables in the Render settings:
   - `PORT`: `10000`
   - `USE_MOCK_DATA`: `true` (or `false` when connecting live Google Cloud keys)
   - `GOOGLE_SERVER_KEY`: `<your_google_cloud_server_key>`
   - `GOOGLE_BROWSER_KEY`: `<your_google_cloud_browser_key>`
   - `APP_CLIENT_TOKEN`: `gulshan_app_secret_token_2026`
5. Click **Apply / Deploy**. Once deployed, your service will be live at `https://khabo-kothay.onrender.com`.
6. Verify live deployment:
   ```bash
   curl https://khabo-kothay.onrender.com/api/health
   # Expected output: {"ok":true,"app":"Khabo Kothay?","version":"1.1.0",...}
   ```
7. Run the smoke test against the live URL:
   ```bash
   TEST_API_URL=https://khabo-kothay.onrender.com node scripts/smoke-test.js
   ```

---

## 2. Android APK Build Status

- **Status**: **BUILT & VERIFIED** (Expo EAS Cloud Preview Build)
- **EAS Account**: `rahat69x`
- **Build ID**: `6f1c0f91-8011-4bea-a61e-543920fe6fd5`
- **Build Page**: https://expo.dev/accounts/rahat69x/projects/khabo-kothay/builds/6f1c0f91-8011-4bea-a61e-543920fe6fd5
- **Direct Download URL**: https://expo.dev/artifacts/eas/VIA-_8HvfmRAKwBoLU0-dCa9ZrPrwxBkNa7Z0nKmooY.apk
- **Expiration Date**: 2026-10-22T21:13:25.609Z
- **Git Commit**: `99f9a87d4e0da9696e1a7832260f18167bd34baf` ("fix(mobile): load custom fonts with useFonts and ensure robust React Navigation theme font mapping")

---

## 3. Android Installation Steps for Users

1. Open the direct APK download link on your Android phone's browser (e.g. Chrome).
2. Download `khabo-kothay-1.1.0.apk`.
3. Tap the downloaded file in your browser or Downloads folder.
4. When prompted with **"For your security, your phone is not allowed to install unknown apps from this source"**:
   - Tap **Settings**.
   - Toggle on **Allow from this source**.
5. Return to the installer and tap **Install**.
6. Tap **Open**. When prompted, grant **Location Permission** ("While using the app") so Khabo Kothay? can query real-time Dhaka traffic congestion from your location.
