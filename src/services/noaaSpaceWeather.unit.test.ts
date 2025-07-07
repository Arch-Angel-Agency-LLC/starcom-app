import { describe, it, expect } from 'vitest';
import { extractLatestFilename } from './noaaSpaceWeather';

// Unit tests for filename extraction and error handling

describe('NOAA Filename Extraction', () => {
  it('should extract latest InterMag filename from real directory HTML', async () => {
    const response = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/');
    const html = await response.text();
    const filename = extractLatestFilename(html, 'InterMag');
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\d{8}T\d{6}-\d{2}-Efield-empirical-EMTF-[\d.-]+x[\d.-]+\.json/);
  }, 30000);

  it('should extract latest US-Canada filename from real directory HTML', async () => {
    const response = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/');
    const html = await response.text();
    const filename = extractLatestFilename(html, 'US-Canada');
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\d{8}T\d{6}-\d{2}-Efield-US-Canada\.json/);
  }, 30000);

  it('should handle malformed HTML and empty directory listings', () => {
    const malformedHtml = '<html><body>No JSON files here</body></html>';
    const emptyDirHtml = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<html>
 <head>
  <title>Index of /json/lists/rgeojson/InterMagEarthScope</title>
 </head>
 <body>
<h1>Index of /json/lists/rgeojson/InterMagEarthScope</h1>
<pre><a href="?C=N;O=D">Name</a>
<hr><a href="/json/lists/rgeojson/">Parent Directory</a>
</pre>
 </body>
</html>`;
    expect(extractLatestFilename(malformedHtml, 'InterMag')).toBeNull();
    expect(extractLatestFilename(malformedHtml, 'US-Canada')).toBeNull();
    expect(extractLatestFilename(emptyDirHtml, 'InterMag')).toBeNull();
  });
});
