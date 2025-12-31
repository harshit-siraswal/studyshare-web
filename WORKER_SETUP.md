# PDF.js Worker Setup (Alternative Solution)

If the CDN worker still doesn't work, you can download and serve the worker file locally:

## Option 1: Download Worker File Manually

1. Download the worker file:
   - Go to: https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.js
   - Save it as `pdf.worker.min.js` in your `public` folder

2. Update `CustomPDFViewer.tsx`:
   ```typescript
   pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
   ```

## Option 2: Use npm script to copy worker

Add this to your `package.json` scripts:
```json
"postinstall": "copy node_modules\\pdfjs-dist\\build\\pdf.worker.min.js public\\pdf.worker.min.js"
```

Then update the worker path to:
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
```

## Option 3: Use Vite's static asset handling

If the worker file exists in node_modules, you can import it:
```typescript
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
```

