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

- **Status**: **NOT RUN** (User is not logged into an Expo / EAS account on this workstation)
- **EAS Authentication Check**: `npx -y eas-cli whoami` returned `Not logged in`.

### Exact Commands to Generate the Standalone Preview APK:
```bash
# 1. Navigate to the mobile directory
cd mobile

# 2. Log in to your Expo account
npx eas-cli login

# 3. If you haven't linked your EAS project yet, run:
npx eas-cli project:init

# 4. Trigger the preview APK cloud build:
npx eas-cli build -p android --profile preview --non-interactive
```

### Downloading & Verifying the APK:
1. When EAS finishes, it outputs a download URL for `khabo-kothay.apk`.
2. Download the generated `.apk` file into the `/release` folder:
   ```bash
   mkdir -p release
   curl -L "<EAS_ARTIFACT_DOWNLOAD_URL>" -o release/khabo-kothay-1.1.0.apk
   ```
3. Compute and record the SHA-256 checksum:
   - **PowerShell (Windows)**:
     ```powershell
     Get-FileHash -Algorithm SHA256 release\khabo-kothay-1.1.0.apk
     ```
   - **Linux / macOS**:
     ```bash
     sha256sum release/khabo-kothay-1.1.0.apk
     ```
4. *Important*: EAS build download URLs expire under Expo's retention policy after 30 days. Always archive the downloaded APK in `/release/` or your company's storage bucket.

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
