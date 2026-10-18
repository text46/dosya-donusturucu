/**
 * Helper to download the project zip file reliably across all browsers,
 * mobile WebViews, and sandboxed iframes.
 */
export async function downloadProjectZip(onStatus?: (msg: string) => void): Promise<boolean> {
  try {
    if (onStatus) onStatus('ZIP dosyası hazırlanıyor...');

    // Try fetching the file directly
    const candidateUrls = [
      './dosya-donusturucu-github.zip',
      '/dosya-donusturucu-github.zip',
      './githuba-yukle.zip',
      '/githuba-yukle.zip'
    ];

    let response: Response | null = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          response = res;
          break;
        }
      } catch {
        // try next
      }
    }

    if (!response) {
      // Fallback: direct window location or simulated link
      const fallbackUrl = `${window.location.origin}/dosya-donusturucu-github.zip`;
      const a = document.createElement('a');
      a.href = fallbackUrl;
      a.target = '_blank';
      a.download = 'dosya-donusturucu-github.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'dosya-donusturucu-github.zip';
    link.setAttribute('download', 'dosya-donusturucu-github.zip');
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 1500);

    if (onStatus) onStatus('ZIP dosyası başarıyla indirildi!');
    return true;
  } catch (err) {
    console.error('Download failed:', err);
    // Ultimate fallback: open in new tab
    const url = `${window.location.origin}/dosya-donusturucu-github.zip`;
    window.open(url, '_blank');
    if (onStatus) onStatus('İndirme yeni sekmede başlatıldı.');
    return false;
  }
}
