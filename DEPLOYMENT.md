# 🚀 JAI CHAMMUNDA FABRICATION - Invoice Generator Deployment Guide

## 🎯 **Deployment Strategy: Vercel + Render**

### **Frontend**: Vercel (Global CDN)
### **Backend**: Render (Python/Flask)

---

## 📁 **Project Structure**
```
GST/
├── index.html              # Frontend (for Vercel)
├── backend/
│   ├── server.py           # Flask backend
│   ├── drive_service.py    # Google Drive integration
│   └── config/
│       ├── credentials.json
│       ├── drive_config.json
│       └── token.json
├── requirements.txt        # Python dependencies
├── Procfile               # Render configuration
├── runtime.txt            # Python version
└── DEPLOYMENT.md          # This file
```

---

## 🌐 **Step 1: Deploy Backend to Render**

### **1.1 Prepare Repository**
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/invoice-generator.git
git branch -M main
git push -u origin main
```

### **1.2 Deploy to Render**
1. **Go to [render.com](https://render.com)**
2. **Sign up/Login** with GitHub
3. **Click "New +"** → **"Web Service"**
4. **Connect your GitHub repository**
5. **Configure settings:**
   - **Name**: `invoice-generator-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn backend.server:app`
   - **Plan**: Select **Free**

### **1.3 Set Environment Variables**
In Render dashboard, go to **Environment** and add:
```
ENVIRONMENT=production
```

### **1.4 Handle Google Credentials**
**Important**: Never commit `credentials.json` to git!

**Option A: Environment Variables**
```bash
# Convert credentials.json to base64
base64 -i backend/config/credentials.json

# Add to Render Environment Variables:
GOOGLE_CREDENTIALS_BASE64=<your_base64_string>
```

**Option B: Upload after deployment**
1. Deploy without credentials
2. Use Render shell to upload credentials manually

---

## 🎨 **Step 2: Deploy Frontend to Vercel**

### **2.1 Prepare Frontend**
1. **Update Backend URL** in `index.html`:
   ```javascript
   // Change this line:
   let BACKEND_URL = 'http://localhost:5000';
   
   // To your Render URL:
   let BACKEND_URL = 'https://your-app-name.onrender.com';
   ```

### **2.2 Deploy to Vercel**
1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Import your repository**
5. **Configure settings:**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (default)
   - **Build Command**: (leave empty)
   - **Output Directory**: `./` (default)
6. **Deploy!**

### **2.3 Update Backend URL**
After Vercel deployment:
1. **Get your Vercel URL**: `https://your-project.vercel.app`
2. **Update the backend URL** in your frontend to point to Render
3. **Redeploy** if needed

---

## ⚙️ **Step 3: Configure Google OAuth**

### **3.1 Update OAuth Redirect URIs**
In Google Cloud Console:
1. **Go to Credentials** → **OAuth 2.0 Client IDs**
2. **Add your production URLs:**
   ```
   https://your-backend.onrender.com
   https://your-project.vercel.app
   ```

### **3.2 Update CORS Settings**
The backend already has CORS enabled for all origins, but you can restrict it:
```python
# In backend/server.py
CORS(app, origins=["https://your-project.vercel.app"])
```

---

## 🔐 **Step 4: Security & Production Setup**

### **4.1 Environment Variables**
Set these in Render:
```
ENVIRONMENT=production
PORT=10000
GOOGLE_CREDENTIALS_BASE64=<your_base64_credentials>
```

### **4.2 Update Google Drive Config**
Ensure your `drive_config.json` has the correct folder ID:
```json
{
  "folder_id": "1XupXCmHoC-a9en9Cdv4PxMUxsh-ehOQY",
  "auto_upload": true,
  "delete_after_upload": false
}
```

---

## 🧪 **Step 5: Testing Deployment**

### **5.1 Backend Testing**
Test your Render backend:
```bash
curl https://your-backend.onrender.com/api/health
```

### **5.2 Frontend Testing**
1. **Open your Vercel URL**
2. **Test backend connection** using the built-in connection tester
3. **Create a test invoice**
4. **Verify Google Drive upload**

---

## 📝 **Step 6: Post-Deployment**

### **6.1 Custom Domain (Optional)**
- **Vercel**: Add custom domain in dashboard
- **Render**: Upgrade to paid plan for custom domains

### **6.2 Monitoring**
- **Render**: Check logs in dashboard
- **Vercel**: Monitor function executions
- **Google Cloud**: Monitor API usage

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**1. CORS Errors**
```javascript
// Ensure backend URL is correct in frontend
let BACKEND_URL = 'https://your-backend.onrender.com';
```

**2. Google OAuth Errors**
- Check redirect URIs in Google Cloud Console
- Ensure credentials are properly loaded in production

**3. File Upload Issues**
- Verify Google Drive folder permissions
- Check if credentials have proper scopes

**4. Render Cold Starts**
- Free tier sleeps after 15 minutes
- First request after sleep will be slow

---

## 🎉 **Final URLs**

After successful deployment:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **API Health**: `https://your-backend.onrender.com/api/health`

---

## 📞 **Support**

If you encounter issues:
1. **Check Render logs** for backend errors
2. **Check browser console** for frontend errors
3. **Verify Google Cloud Console** settings
4. **Test API endpoints** individually

**Your Invoice Generator is now globally accessible! 🌍**
