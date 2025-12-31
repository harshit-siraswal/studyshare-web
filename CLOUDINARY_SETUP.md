# Cloudinary PDF Viewer Setup Guide

This guide will walk you through setting up Cloudinary for PDF storage and viewing in your application.

## Step-by-Step Setup Instructions

### Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up" (free tier available with 25GB storage)
3. Complete the registration process

### Step 2: Get Your Cloudinary Credentials

1. After logging in, go to your **Dashboard**
2. You'll see your **Cloud Name** displayed at the top
3. Copy your **Cloud Name** (e.g., `dxyz123abc`)

### Step 3: Create an Upload Preset

1. In the Cloudinary Dashboard, go to **Settings** (gear icon in top right)
2. Click on **Upload** in the left sidebar
3. Scroll down to **Upload presets** section
4. Click **Add upload preset**
5. Configure the preset:
   - **Preset name**: Choose a name (e.g., `studyspace-unsigned`)
   - **Signing mode**: Select **"Unsigned"** (required for client-side uploads)
   - **Folder**: Optional - Enter `studyspace-resources` to organize files
   - **Resource type**: Select **"Raw"** (for PDFs and documents)
   - **Access mode**: Select **"Public"** (so PDFs can be viewed)
6. Click **Save**

### Step 4: Get Your API Key (Optional but Recommended)

1. In Dashboard, go to **Settings** > **Security**
2. Find your **API Key** (you may need to reveal it)
3. Copy the **API Key**

### Step 5: Configure Environment Variables

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add the following variables:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name_here
VITE_CLOUDINARY_API_KEY=your_api_key_here
```

3. Replace the placeholder values with your actual credentials:
   - `your_cloud_name_here` → Your Cloud Name from Step 2
   - `your_upload_preset_name_here` → The preset name you created in Step 3
   - `your_api_key_here` → Your API Key from Step 4

### Step 6: Restart Your Development Server

After adding the environment variables:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
```

## How It Works

### File Upload Flow

1. **User selects a PDF** in `UploadResourceDialog`
2. **File is uploaded to Cloudinary** using the unsigned upload preset
3. **Cloudinary returns a secure URL** (e.g., `https://res.cloudinary.com/your-cloud/raw/upload/v123/file.pdf`)
4. **URL is stored in Supabase database** in the `file_url` field
5. **PDF is ready to view!**

### PDF Viewing Flow

1. **User clicks on a resource** with a PDF
2. **PDFViewer component opens** with the Cloudinary URL
3. **Browser displays PDF** using iframe (Cloudinary serves PDFs efficiently)
4. **User can zoom, rotate, download, or open in new tab**

## Features

✅ **Direct PDF Serving**: Cloudinary serves PDFs directly via CDN
✅ **Fast Loading**: PDFs are cached and delivered via Cloudinary's global CDN
✅ **Secure URLs**: All URLs are HTTPS and secure
✅ **No Backend Required**: Uploads happen directly from the browser
✅ **Progress Tracking**: Upload progress is shown to users
✅ **Error Handling**: Clear error messages if upload fails

## Troubleshooting

### "Cloudinary is not configured" Error

- Make sure your `.env` file exists in the project root
- Verify all three environment variables are set
- Restart your development server after adding variables
- Check that variable names start with `VITE_` (required for Vite)

### Upload Fails

- Verify your upload preset is set to **"Unsigned"**
- Check that the preset resource type is **"Raw"**
- Ensure the preset access mode is **"Public"**
- Check browser console for detailed error messages

### PDF Doesn't Display

- Verify the URL in the database is a valid Cloudinary URL
- Check browser console for CORS or loading errors
- Try opening the URL directly in a new tab
- Ensure the file was uploaded successfully

## Testing

1. Upload a test PDF using the upload dialog
2. Check the browser console for upload progress logs
3. Verify the URL in your Supabase database starts with `https://res.cloudinary.com`
4. Click on the resource to open the PDF viewer
5. Test zoom, rotate, download, and open in new tab features

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload Presets Guide](https://cloudinary.com/documentation/upload_presets)
- [Raw File Upload](https://cloudinary.com/documentation/upload_images#uploading_non_images)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Test with a small PDF file first
4. Check Cloudinary dashboard for uploaded files

