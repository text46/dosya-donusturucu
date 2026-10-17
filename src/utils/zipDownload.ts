export function downloadSourceZip() {
  const a = document.createElement('a');
  a.href = '/dosya-donusturucu-kaynak-kod.zip';
  a.download = 'dosya-donusturucu-kaynak-kod.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
