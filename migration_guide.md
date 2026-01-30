# 🚀 MyStudySpace Migration Guide
## From Current Architecture to Student-Optimized Infrastructure

**Date:** January 2026  
**Purpose:** Migrate to cost-effective, scalable architecture for 5,000+ users  
**Target:** ₹400/month infrastructure cost (vs current free tier limitations)

---

## 📊 Current Architecture Analysis

### **Current Stack:**
```
┌─────────────────────────────────────────────────┐
│                  CURRENT                         │
├─────────────────────────────────────────────────┤
│ Frontend:     Vercel (React + Vite)             │
│ Backend:      Render Free (Node.js + Express)   │
│ Database:     Supabase Free (PostgreSQL)        │
│ Auth:         Firebase Auth                     │
│ File Storage: Cloudinary Free                   │
│ CDN:          Cloudflare Free                   │
└─────────────────────────────────────────────────┘

Current Limits:
├─ Render: 512MB RAM, cold starts, limited connections
├─ Supabase: 500MB storage, 2GB bandwidth/month
├─ Cloudinary: 25GB storage, 25GB bandwidth/month
└─ Cost: ₹0/month but NOT VIABLE for production
```

### **Current File Flow:**
```
User Upload Request
    ↓
React Frontend (Vercel)
    ↓
Express Backend (Render) → Validates file
    ↓
Cloudinary API → Upload & Transform
    ↓
Store URL in Supabase
    ↓
Return URL to Frontend
```

### **Current Problems:**
1. ❌ **Render 512MB RAM** → Cannot handle multiple 10MB PDF uploads
2. ❌ **Supabase 2GB bandwidth** → Exhausted in 1 day with 500 users
3. ❌ **Cloudinary 25GB bandwidth** → Exhausted in 5 days with 2,000 users
4. ❌ **Cold starts on Render** → 30-60 second delays when idle
5. ❌ **No file storage strategy** → Files scattered across services
6. ❌ **Expensive at scale** → Need paid tiers immediately for pilot

---

## 🎯 Target Architecture (Optimized)

### **New Stack:**
```
┌─────────────────────────────────────────────────┐
│               OPTIMIZED (STUDENT)                │
├─────────────────────────────────────────────────┤
│ Frontend:     Vercel (NO CHANGE)                │
│ Backend:      Railway 4GB (Student Free)        │
│ Database:     MongoDB Atlas M0 (FREE)           │
│ Auth:         Firebase Auth (NO CHANGE)         │
│ PDF Storage:  DigitalOcean Spaces (₹400/mo)     │
│ Images:       Cloudinary Free (Keep)            │
│ CDN:          DO Spaces CDN (Included FREE)     │
└─────────────────────────────────────────────────┘

Benefits:
├─ Railway: 4GB RAM, NO cold starts, better performance
├─ MongoDB: 512MB enough for metadata only
├─ DO Spaces: 250GB storage + 1TB bandwidth for ₹400/mo
├─ CDN: Included with Spaces, free unlimited bandwidth
└─ Total: ₹400/month for 5,000+ users
```

### **New File Flow:**
```
User Upload Request
    ↓
React Frontend (Vercel)
    ↓
Express Backend (Railway) → Validates file
    ↓
DigitalOcean Spaces (S3-compatible) → Store PDF
    ↓
Store URL in MongoDB
    ↓
Return CDN URL to Frontend
    ↓
User Download → Served from DO CDN (FREE bandwidth)
```

---

## 📋 Migration Plan (4-Week Timeline)

### **Phase 1: Setup New Infrastructure (Week 1)**
### **Phase 2: Migrate Database (Week 2)**
### **Phase 3: Migrate File Storage (Week 3)**
### **Phase 4: Switch & Cleanup (Week 4)**

---

## 🗓️ WEEK 1: Setup New Infrastructure

### **Day 1: Apply for Credits & Create Accounts**

#### **1. Claim GitHub Student Pack Benefits**
```bash
# You mentioned you already have this ✅
# If not approved yet, check status at:
https://education.github.com/pack

Benefits you'll use:
├─ DigitalOcean: $200 credit (4-5 months free hosting)
├─ MongoDB Atlas: Extended free tier
├─ Railway: Student credits ($5/month)
└─ Name.com: Free domain (if needed)
```

#### **2. Create DigitalOcean Account**
```bash
URL: https://www.digitalocean.com/

Steps:
1. Sign up with college email
2. Go to Billing → Add Promo Code
3. Enter GitHub Student Pack code
4. Verify $200 credit applied

Result: $200 credit valid for 12 months
```

#### **3. Create MongoDB Atlas Account**
```bash
URL: https://www.mongodb.com/cloud/atlas

Steps:
1. Sign up (use same email as GitHub)
2. Create organization: "StudySpace"
3. Don't create cluster yet (we'll do this tomorrow)

Note: M0 FREE tier forever, no credit card needed
```

#### **4. Create Railway Account**
```bash
URL: https://railway.app/

Steps:
1. Sign in with GitHub (important!)
2. Verify student status in settings
3. Join Railway Discord: https://discord.gg/railway
4. Request student plan in #🎓student-developers channel
5. Provide GitHub Student Pack proof

Result: $5/month credits (backend hosting free)
```

---

### **Day 2: Setup MongoDB Atlas**

#### **1. Create M0 Free Cluster**
```bash
1. Login to MongoDB Atlas
2. Click "Build a Database"
3. Select FREE M0 tier (shared)
4. Choose:
   ├─ Provider: AWS
   ├─ Region: Mumbai (ap-south-1) - Closest to Delhi-NCR
   └─ Cluster Name: studyspace-prod

5. Security Setup:
   ├─ Authentication: Username/Password
   ├─ Username: studyspace_admin
   ├─ Password: [Generate strong password, SAVE IT]
   └─ Where would you like to connect from: My Local Environment

6. IP Whitelist:
   ├─ Add 0.0.0.0/0 (allow all) for now
   └─ We'll restrict this later to Railway IP
```

#### **2. Get Connection String**
```bash
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Driver: Node.js, Version: 5.5 or later
4. Copy connection string:

mongodb+srv://studyspace_admin:<password>@studyspace-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority

5. Save this in password manager / secure notes
```

#### **3. Create Database Structure**
```bash
# We'll create collections later when we migrate data
# For now, just verify cluster is running (green status)
```

---

### **Day 3: Setup DigitalOcean Spaces**

#### **1. Create Spaces Bucket**
```bash
1. Login to DigitalOcean
2. Navigate to: Spaces Object Storage
3. Click "Create Spaces Bucket"

Configuration:
├─ Datacenter: Bangalore (BLR1) - Closest to Delhi-NCR
├─ Enable CDN: YES (important!)
├─ Bucket Name: studyspace-resources
├─ Choose Project: Default Project
└─ File Listing: Restricted (don't allow public listing)

Result: Creates bucket with CDN automatically
CDN URL: https://studyspace-resources.blr1.cdn.digitaloceanspaces.com
```

#### **2. Generate API Keys**
```bash
1. Go to: API → Spaces Keys
2. Click "Generate New Key"
3. Name: studyspace-backend-key

SAVE THESE SECURELY (shown only once):
├─ Access Key: XXXXXXXXXXXXXXXX (like AWS access key)
└─ Secret Key: YYYYYYYYYYYYYYYY (like AWS secret)

These are equivalent to AWS S3 credentials
```

#### **3. Configure CORS (Important!)**
```bash
1. Go to your Spaces bucket: studyspace-resources
2. Settings → CORS Configurations
3. Click "Add CORS Configuration"

Add this configuration:
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://mystudyspace.me",
        "https://*.vercel.app",
        "http://localhost:5173"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}

This allows your frontend to upload/download files directly
```

---

### **Day 4: Setup Railway Backend**

#### **1. Prepare Your Backend Code**
```bash
# In your local backend directory
cd server/

# Create railway.json configuration
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Make sure your package.json has start script
# package.json should have:
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

#### **2. Push to GitHub (if not already)**
```bash
# Make sure your backend code is in GitHub
# Railway deploys from GitHub

git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

#### **3. Deploy to Railway**
```bash
1. Login to Railway: https://railway.app/
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository: mystudyspace/server (or whatever it's called)
5. Click "Deploy Now"

Railway will:
├─ Auto-detect Node.js
├─ Run npm install
├─ Start your app with npm start
└─ Give you a URL: https://mystudyspace-production.up.railway.app
```

#### **4. Configure Environment Variables**
```bash
In Railway Dashboard:
1. Click your project
2. Go to "Variables" tab
3. Add these (copy from your current .env):

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://studyspace_admin:PASSWORD@studyspace-prod.xxxxx.mongodb.net/studyspace?retryWrites=true&w=majority

# DigitalOcean Spaces
DO_SPACES_ENDPOINT=blr1.digitaloceanspaces.com
DO_SPACES_REGION=blr1
DO_SPACES_BUCKET=studyspace-resources
DO_SPACES_ACCESS_KEY=YOUR_ACCESS_KEY
DO_SPACES_SECRET_KEY=YOUR_SECRET_KEY
DO_SPACES_CDN=https://studyspace-resources.blr1.cdn.digitaloceanspaces.com

# Firebase (copy from current setup)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-service-account-email

# Other
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://mystudyspace.me
```

#### **5. Test Railway Deployment**
```bash
# Railway gives you a URL like:
https://mystudyspace-production.up.railway.app

# Test it:
curl https://mystudyspace-production.up.railway.app/health

# Should return: { "status": "ok" }
```

---

### **Day 5-7: Update Backend Code for New Storage**

#### **1. Install Required Packages**
```bash
cd server/
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
npm install mongodb
npm install multer multer-s3 # For file uploads
```

#### **2. Create Storage Configuration**
```javascript
// server/src/config/storage.js
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT}`,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
  },
  forcePathStyle: false, // Important for DO Spaces
});

// Multer upload configuration
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.DO_SPACES_BUCKET,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueKey = `resources/${Date.now()}-${file.originalname}`;
      cb(null, uniqueKey);
    },
  }),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept PDFs, images, videos
    const allowedTypes = /pdf|jpeg|jpg|png|gif|mp4|mov/;
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

module.exports = { s3Client, upload };
```

#### **3. Create MongoDB Connection**
```javascript
// server/src/config/database.js
const { MongoClient } = require('mongodb');

let db;

async function connectDB() {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    db = client.db('studyspace');
    console.log('✅ Connected to MongoDB Atlas');
    
    // Create indexes
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function createIndexes() {
  // Resources collection indexes
  await db.collection('resources').createIndexes([
    { key: { college_id: 1 } },
    { key: { semester: 1 } },
    { key: { branch: 1 } },
    { key: { subject: 1 } },
    { key: { created_at: -1 } },
    { key: { votes: -1 } },
  ]);
  
  // Users collection indexes
  await db.collection('users').createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { college_id: 1 } },
  ]);
  
  // Chat messages indexes
  await db.collection('chat_messages').createIndexes([
    { key: { room_id: 1, created_at: -1 } },
  ]);
  
  console.log('✅ Database indexes created');
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

module.exports = { connectDB, getDB };
```

#### **4. Update Resource Upload Route**
```javascript
// server/src/routes/resources.js
const express = require('express');
const { upload } = require('../config/storage');
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

const router = express.Router();

// Upload resource
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { semester, branch, subject, type, title, description } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // File is already uploaded to DO Spaces by multer-s3
    // req.file contains the location (CDN URL)
    const fileUrl = file.location;
    
    // Insert metadata into MongoDB
    const db = getDB();
    const resource = {
      title,
      description,
      type,
      semester: parseInt(semester),
      branch,
      subject,
      file_url: fileUrl,
      file_size: file.size,
      file_name: file.originalname,
      uploader_email: req.user.email,
      uploader_name: req.user.name,
      college_id: req.user.college_id,
      votes: 0,
      downloads: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const result = await db.collection('resources').insertOne(resource);
    
    res.status(201).json({
      message: 'Resource uploaded successfully',
      resource: {
        id: result.insertedId,
        ...resource,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get resources (with filters)
router.get('/', async (req, res) => {
  try {
    const { college_id, semester, branch, subject, type, page = 1, limit = 20 } = req.query;
    
    const db = getDB();
    const query = { college_id };
    
    if (semester) query.semester = parseInt(semester);
    if (branch) query.branch = branch;
    if (subject) query.subject = subject;
    if (type) query.type = type;
    
    const skip = (page - 1) * limit;
    
    const resources = await db.collection('resources')
      .find(query)
      .sort({ votes: -1, created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const total = await db.collection('resources').countDocuments(query);
    
    res.json({
      resources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Download resource (track downloads)
router.get('/:id/download', async (req, res) => {
  try {
    const db = getDB();
    const resource = await db.collection('resources').findOne({
      _id: new ObjectId(req.params.id),
    });
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Increment download count
    await db.collection('resources').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $inc: { downloads: 1 } }
    );
    
    // Redirect to CDN URL (DO Spaces handles the actual file serving)
    res.redirect(resource.file_url);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;
```

---

## 🗓️ WEEK 2: Migrate Database from Supabase to MongoDB

### **Day 1: Export Data from Supabase**

#### **1. Export Users Table**
```bash
# Login to Supabase Dashboard
# Go to: Table Editor → users

# Export as CSV (or use SQL editor)
```

SQL Export Script:
```sql
-- In Supabase SQL Editor
COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER;
```

Save as: `users_export.csv`

#### **2. Export Resources Table**
```sql
COPY (SELECT * FROM resources) TO STDOUT WITH CSV HEADER;
```

Save as: `resources_export.csv`

#### **3. Export Chat Rooms & Messages**
```sql
COPY (SELECT * FROM chat_rooms) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM room_members) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM room_messages) TO STDOUT WITH CSV HEADER;
```

#### **4. Export Bookmarks, Votes, etc.**
```sql
COPY (SELECT * FROM bookmarks) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM votes) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM follows) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM notifications) TO STDOUT WITH CSV HEADER;
```

---

### **Day 2-3: Transform and Import Data**

#### **1. Create Import Script**
```javascript
// scripts/import-to-mongodb.js
const { MongoClient } = require('mongodb');
const fs = require('fs');
const csv = require('csv-parser');

const MONGODB_URI = 'your-mongodb-connection-string';

async function importData() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('studyspace');
  
  console.log('Connected to MongoDB');
  
  // Import Users
  console.log('Importing users...');
  const users = [];
  fs.createReadStream('users_export.csv')
    .pipe(csv())
    .on('data', (row) => {
      users.push({
        email: row.email,
        name: row.name,
        college_id: row.college_id,
        branch: row.branch,
        semester: parseInt(row.semester),
        bio: row.bio,
        avatar_url: row.avatar_url,
        is_verified: row.email.includes(row.college_id), // Check domain
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      });
    })
    .on('end', async () => {
      if (users.length > 0) {
        await db.collection('users').insertMany(users);
        console.log(`✅ Imported ${users.length} users`);
      }
    });
  
  // Import Resources
  console.log('Importing resources...');
  const resources = [];
  fs.createReadStream('resources_export.csv')
    .pipe(csv())
    .on('data', (row) => {
      resources.push({
        title: row.title,
        description: row.description,
        type: row.type,
        semester: parseInt(row.semester),
        branch: row.branch,
        subject: row.subject,
        file_url: row.file_url, // We'll update these URLs later
        file_size: parseInt(row.file_size),
        file_name: row.file_name,
        uploader_email: row.uploader_email,
        uploader_name: row.uploader_name,
        college_id: row.college_id,
        votes: parseInt(row.votes) || 0,
        downloads: parseInt(row.downloads) || 0,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      });
    })
    .on('end', async () => {
      if (resources.length > 0) {
        await db.collection('resources').insertMany(resources);
        console.log(`✅ Imported ${resources.length} resources`);
      }
    });
  
  // Import Chat Rooms
  // ... similar pattern for other collections
  
  await client.close();
  console.log('✅ Migration complete');
}

importData().catch(console.error);
```

#### **2. Run Import**
```bash
npm install csv-parser
node scripts/import-to-mongodb.js
```

---

## 🗓️ WEEK 3: Migrate Files from Cloudinary to DO Spaces

### **Day 1-2: Download Files from Cloudinary**

#### **Script to Download All Files**
```javascript
// scripts/download-cloudinary-files.js
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function downloadAllFiles() {
  const resources = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'mystudyspace/', // Your folder in Cloudinary
    max_results: 500,
  });
  
  const downloadDir = './cloudinary-downloads';
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  
  for (const resource of resources.resources) {
    const filename = path.basename(resource.public_id);
    const filepath = path.join(downloadDir, filename);
    
    console.log(`Downloading: ${filename}`);
    
    const response = await axios({
      method: 'GET',
      url: resource.secure_url,
      responseType: 'stream',
    });
    
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log(`✅ Downloaded: ${filename}`);
  }
  
  console.log('All files downloaded');
}

downloadAllFiles().catch(console.error);
```

Run it:
```bash
node scripts/download-cloudinary-files.js
```

---

### **Day 3-5: Upload Files to DigitalOcean Spaces**

#### **Bulk Upload Script**
```javascript
// scripts/upload-to-spaces.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT}`,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
  },
});

async function uploadDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  const urlMap = {}; // Old URL -> New URL mapping
  
  for (const file of files) {
    const filepath = path.join(dirPath, file);
    const fileContent = fs.readFileSync(filepath);
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (file.endsWith('.pdf')) contentType = 'application/pdf';
    if (file.endsWith('.jpg') || file.endsWith('.jpeg')) contentType = 'image/jpeg';
    if (file.endsWith('.png')) contentType = 'image/png';
    
    const key = `resources/${file}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,
      Body: fileContent,
      ACL: 'public-read',
      ContentType: contentType,
    });
    
    try {
      await s3Client.send(command);
      const newUrl = `${process.env.DO_SPACES_CDN}/${key}`;
      urlMap[file] = newUrl;
      console.log(`✅ Uploaded: ${file} → ${newUrl}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error);
    }
  }
  
  // Save URL mapping for database update
  fs.writeFileSync('url-mapping.json', JSON.stringify(urlMap, null, 2));
  console.log('✅ All files uploaded. URL mapping saved to url-mapping.json');
}

uploadDirectory('./cloudinary-downloads').catch(console.error);
```

Run it:
```bash
node scripts/upload-to-spaces.js
```

---

### **Day 6: Update Database with New URLs**

```javascript
// scripts/update-file-urls.js
const { MongoClient } = require('mongodb');
const fs = require('fs');

const MONGODB_URI = 'your-mongodb-connection-string';
const urlMap = JSON.parse(fs.readFileSync('url-mapping.json'));

async function updateURLs() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('studyspace');
  
  const resources = await db.collection('resources').find({}).toArray();
  
  for (const resource of resources) {
    const oldUrl = resource.file_url;
    const filename = path.basename(oldUrl);
    const newUrl = urlMap[filename];
    
    if (newUrl) {
      await db.collection('resources').updateOne(
        { _id: resource._id },
        { $set: { file_url: newUrl } }
      );
      console.log(`✅ Updated: ${resource.title}`);
    } else {
      console.log(`⚠️ No mapping found for: ${filename}`);
    }
  }
  
  // Also update user avatar URLs if stored in Cloudinary
  const users = await db.collection('users').find({ avatar_url: { $exists: true } }).toArray();
  
  for (const user of users) {
    const oldUrl = user.avatar_url;
    const filename = path.basename(oldUrl);
    const newUrl = urlMap[filename];
    
    if (newUrl) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { avatar_url: newUrl } }
      );
      console.log(`✅ Updated avatar: ${user.name}`);
    }
  }
  
  await client.close();
  console.log('✅ All URLs updated');
}

updateURLs().catch(console.error);
```

---

## 🗓️ WEEK 4: Switch Frontend & Cleanup

### **Day 1-2: Update Frontend Configuration**

#### **1. Update API Base URL**
```javascript
// client/src/config/api.js

// OLD
// const API_BASE_URL = 'https://mystudyspace-backend.onrender.com';

// NEW
const API_BASE_URL = 'https://mystudyspace-production.up.railway.app';

export default API_BASE_URL;
```

#### **2. Update Environment Variables**
```bash
# client/.env.production

# OLD
# VITE_API_URL=https://mystudyspace-backend.onrender.com

# NEW
VITE_API_URL=https://mystudyspace-production.up.railway.app
VITE_CDN_URL=https://studyspace-resources.blr1.cdn.digitaloceanspaces.com
```

#### **3. Test Frontend Locally**
```bash
cd client/
npm run build
npm run preview

# Verify:
# - Login works
# - Resources load
# - File uploads work
# - Downloads work from new CDN
```

---

### **Day 3: Deploy Frontend to Vercel**

```bash
# Frontend is on Vercel (no change needed usually)
# Just redeploy with new environment variables

# In Vercel Dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Update VITE_API_URL to Railway URL
4. Redeploy
```

---

### **Day 4-5: Parallel Running & Testing**

#### **Run Both Systems in Parallel**
```
OLD (Render + Supabase):
- Keep running for 48 hours
- Monitor for any users still using it

NEW (Railway + MongoDB + DO Spaces):
- All new traffic goes here
- Monitor errors, performance
```

#### **Testing Checklist**
```
✅ User Registration & Login
✅ Resource Upload (10MB PDF)
✅ Resource Download (fast CDN delivery)
✅ Image uploads (profile pictures)
✅ Chat messaging
✅ Voting on resources
✅ Bookmarking
✅ Following users
✅ Notifications
✅ Search & filters
✅ Mobile responsiveness
```

---

### **Day 6-7: Cleanup Old Infrastructure**

#### **1. Backup Everything from Supabase**
```bash
# Final backup before deletion
# Download all data as CSV
# Keep in secure storage for 30 days
```

#### **2. Delete Render App**
```bash
1. Login to Render
2. Go to your backend service
3. Settings → Delete Service
4. Confirm deletion

Result: No more cold starts, no more crashes!
```

#### **3. Downgrade Supabase (Optional)**
```bash
# You can keep Supabase free tier for backups
# Or delete project entirely

If keeping:
- Delete all data (tables)
- Keep project for emergency rollback
- No cost
```

#### **4. Keep Cloudinary Free Tier**
```bash
# Don't delete Cloudinary account
# Still useful for profile pictures, thumbnails
# Use for small images only, not PDFs
```

---

## 📊 Before & After Comparison

### **Performance Comparison**

| Metric | BEFORE (Old Stack) | AFTER (New Stack) |
|--------|-------------------|-------------------|
| **Backend RAM** | 512MB (crashes) | 4GB (smooth) |
| **Cold Starts** | 30-60 seconds | None (always-on) |
| **File Upload Speed** | 5-10 seconds | 2-3 seconds |
| **File Download Speed** | 500-1000ms | 20-50ms (CDN) |
| **Concurrent Users** | ~100 (crashes after) | 5,000+ |
| **Storage Limit** | 500MB (Supabase) | 250GB (DO Spaces) |
| **Bandwidth Limit** | 2GB/month (Supabase) | 1TB/month (DO Spaces) |
| **Cost** | ₹0 but broken | ₹400/month working |

### **Cost Comparison (5,000 Users)**

| Service | OLD | NEW | Savings/Cost |
|---------|-----|-----|--------------|
| Backend | ₹0 (broken) | ₹0 (Railway student) | ₹0 |
| Database | ₹1,875 (need Pro) | ₹0 (MongoDB M0) | **-₹1,875** |
| Storage | ₹2,200 (need Plus) | ₹400 (DO Spaces) | **-₹1,800** |
| CDN | ₹1,600 (need Pro) | ₹0 (included) | **-₹1,600** |
| **TOTAL** | **₹5,675/month** | **₹400/month** | **-₹5,275 (93% cheaper!)** |

---

## 🚨 Rollback Plan (If Something Goes Wrong)

### **Emergency Rollback Steps**

If migration fails or has critical issues:

```bash
1. Immediate Actions (5 minutes):
   ├─ Change Vercel env var back to Render URL
   ├─ Redeploy frontend on Vercel
   └─ Old system becomes active again

2. Investigate Issues (1 hour):
   ├─ Check Railway logs: railway logs
   ├─ Check MongoDB Atlas logs
   ├─ Check DO Spaces access logs
   └─ Identify root cause

3. Fix Forward or Rollback (2 hours):
   ├─ If fixable: Fix issue and re-switch
   └─ If not: Keep old system, retry next week
```

### **Rollback Safety**
- Keep Render app running for 7 days after migration
- Keep Supabase data for 30 days
- Can rollback within 5 minutes if needed

---

## ✅ Post-Migration Checklist

### **Week 1 After Migration**
```
☐ Monitor Railway metrics daily
☐ Check MongoDB Atlas performance
☐ Verify DO Spaces bandwidth usage
☐ Test all features thoroughly
☐ Gather user feedback
☐ Fix any bugs found
☐ Document any issues
```

### **Week 2-4 After Migration**
```
☐ Optimize database queries if needed
☐ Add database indexes for slow queries
☐ Configure automatic backups
☐ Setup monitoring alerts
☐ Delete old infrastructure
☐ Update documentation
☐ Celebrate successful migration! 🎉
```

---

## 📞 Support & Resources

### **Railway**
- Docs: https://docs.railway.app/
- Discord: https://discord.gg/railway (very helpful community!)
- Status: https://status.railway.app/

### **MongoDB Atlas**
- Docs: https://docs.atlas.mongodb.com/
- University: https://university.mongodb.com/ (free courses)
- Support: support@mongodb.com

### **DigitalOcean Spaces**
- Docs: https://docs.digitalocean.com/products/spaces/
- Community: https://www.digitalocean.com/community
- Support: https://cloudsupport.digitalocean.com/

### **Emergency Contacts**
- Railway Discord: Fastest support (usually <1 hour)
- MongoDB Support: 24-48 hours response
- DO Support: 24-48 hours response

---

## 🎯 Success Criteria

Migration is successful when:

```
✅ Zero downtime for users
✅ All files accessible via new CDN URLs
✅ Upload/download speeds improved
✅ No more cold starts
✅ Cost reduced to ₹400/month
✅ Can handle 5,000 concurrent users
✅ All features working correctly
✅ No critical bugs
```

---

## 📝 Final Notes

### **Key Advantages of New Architecture**
1. **4GB RAM** - Can handle multiple 10MB uploads simultaneously
2. **Always-on** - No cold starts, instant response
3. **CDN Included** - Free unlimited bandwidth for downloads
4. **Predictable Costs** - ₹400/month regardless of usage (up to 1TB)
5. **Scalable** - Can easily upgrade as you grow
6. **Student-Friendly** - Using GitHub Student Pack benefits

### **When to Upgrade Further**
- **10,000+ users**: Upgrade DO Droplet, add Redis cache
- **50,000+ users**: Move to AWS/GCP with proper DevOps
- **100,000+ users**: Multi-region deployment, CDN optimization

### **First Paying College Should Fund**
Once you get your first paying college (₹60,000-1,00,000):
- ₹400 × 12 months = ₹4,800/year infrastructure
- Remaining ₹55,000+ goes to growth and team
- You're now self-sustainable!

---

**Good luck with the migration! 🚀**

Feel free to ask questions at any step of the process.
