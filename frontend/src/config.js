// Central place for environment-driven config.
// Set VITE_API_URL in a .env file to point at your deployed backend
// (e.g. VITE_API_URL=https://cysecsphere-api.onrender.com).
// Falls back to localhost for local development if not set.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Uploaded photos (e.g. gallery images) are stored on the backend and
// returned as relative paths like "/uploads/gallery/xyz.jpg". This resolves
// them to a full URL. External URLs (http/https) are returned unchanged,
// so it's safe to use on both uploaded files and legacy/sample image URLs.
export const resolveMediaUrl = (path) => {
  if (!path) return path;
  return /^https?:\/\//i.test(path) ? path : `${API_URL}${path}`;
};
