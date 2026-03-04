# Cloudinary Integration Notes

This project no longer uses direct unsigned browser uploads for production paths.

## Current Secure Upload Flow

1. Frontend asks backend for a signed upload URL.
2. Frontend uploads file bytes directly to that signed URL.
3. Backend-controlled public URL is stored and used by the app.

This applies to resource uploads and chat image uploads.

## Security Requirements

- Do not enable unrestricted unsigned upload presets for production.
- Do not depend on client-only upload credentials for write access.
- Keep all write authorization in backend-signed flows.

## Environment Guidance

- Keep `VITE_API_URL` pointed at your deployed backend domain in production.
- Never set production `VITE_API_URL` to `localhost`.

## Legacy Setup

If you still use Cloudinary elsewhere, keep it read-only from the frontend where possible.
Any upload capability should be signed server-side.

