import { toPng } from 'html-to-image';

export async function downloadElementAsPng(el: HTMLElement, filename: string) {
  const dataUrl = await toPng(el, {
    cacheBust: true,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
