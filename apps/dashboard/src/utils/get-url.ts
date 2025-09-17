const TRAILING_SLASHES_REGEX = /\/+$/;
const LEADING_SLASHES_REGEX = /^\/+/;

export function getURL(path = '') {
  // Get the base URL, defaulting to localhost if not set.
  const baseURL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(TRAILING_SLASHES_REGEX, '') ||
    'http://localhost:3000';

  // Ensure HTTPS for non-localhost URLs and format the path.
  const formattedURL = baseURL.startsWith('http')
    ? baseURL
    : `https://${baseURL}`;
  const cleanPath = path.replace(LEADING_SLASHES_REGEX, '');

  // Return the full URL.
  return cleanPath ? `${formattedURL}/${cleanPath}` : formattedURL;
}
