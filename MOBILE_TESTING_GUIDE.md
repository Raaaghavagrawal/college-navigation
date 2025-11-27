# Mobile Testing Setup Guide

## Problem
The app shows "Failed to fetch" error on mobile devices because it's trying to connect to `http://localhost:4000`, which doesn't work on mobile.

## Solution

### Step 1: Find Your Computer's IP Address

**On Windows:**
1. Open Command Prompt (Win + R, type `cmd`, press Enter)
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter
   - Usually looks like: `192.168.1.100` or `10.0.0.100`

**On Mac/Linux:**
1. Open Terminal
2. Type: `ifconfig` or `ip addr`
3. Look for your local IP address

### Step 2: Update the .env File

1. Open the `.env` file in the root directory
2. Replace `localhost` with your computer's IP address:

```env
VITE_API_URL=http://YOUR_IP_ADDRESS:4000
```

**Example:**
```env
VITE_API_URL=http://192.168.1.100:4000
```

### Step 3: Update Backend to Accept External Connections

The backend needs to listen on all network interfaces, not just localhost.

In `backend/index.js`, make sure the server is configured like this:
```javascript
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 4: Restart Everything

1. **Stop all running processes** (Ctrl+C in terminals)
2. **Restart the backend:**
   ```bash
   cd backend
   node index.js
   ```
3. **Restart the build watcher:**
   ```bash
   npm run build:watch
   ```
4. **Restart the preview server:**
   ```bash
   npm run preview
   ```

### Step 5: Test on Mobile

1. Make sure your mobile device is on the **same Wi-Fi network** as your computer
2. Open your mobile browser
3. Navigate to: `http://YOUR_IP_ADDRESS:4173` (or whatever port your preview server uses)
4. The login should now work!

## Important Notes

- **Firewall:** You may need to allow port 4000 and 4173 through your Windows Firewall
- **Network:** Both devices MUST be on the same Wi-Fi network
- **Security:** This setup is for development only. For production, use proper HTTPS and domain names

## Troubleshooting

### Still getting "Failed to fetch"?

1. **Check if backend is running:**
   - Open browser on your computer
   - Go to: `http://YOUR_IP_ADDRESS:4000/api/login`
   - You should see some response (even if it's an error)

2. **Check firewall:**
   - Windows: Search for "Windows Defender Firewall"
   - Allow Node.js through the firewall

3. **Verify IP address:**
   - Make sure you're using the correct IP
   - IP addresses can change, especially on DHCP networks

4. **Check .env is loaded:**
   - After changing .env, you MUST restart the build process
   - The changes won't apply until you restart

## For Production/APK Build

When building an APK for production:

1. **Use a proper backend URL:**
   ```env
   VITE_API_URL=https://your-domain.com
   ```

2. **Deploy your backend** to a cloud service (AWS, Heroku, etc.)

3. **Update the .env** before building the APK

4. **Build the app:**
   ```bash
   npm run build
   ```

The built files will be in the `dist` folder and will use the API URL from your .env file.
