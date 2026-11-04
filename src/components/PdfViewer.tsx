import { useEffect, useRef, useState } from 'react';
import { Loader2, Minus, Plus } from 'lucide-react';

/**
 * Muestra un PDF dibujando sus hojas en pantalla, sin usar el visor del navegador
 * (que algunas extensiones o configuraciones bloquean). Usa la versión "legacy" de pdf.js para que funcione también en navegadores viejos. La librería se carga solo al abrir un PDF.
 */
const MAX_PAGES = 40;

const PdfViewer = ({ url, name }: { url: string; name?: string }) => {
  const box = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [zoom, setZoom] = useState(1);
  const [info, setInfo] = useState('');
  const [why, setWhy] = useState('');

  useEffect(() => {
    let cancelled = false;
    let doc: any = null;
    setState('cargando'); setInfo(''); setWhy('');
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const worker = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const data = new Uint8Array(await (await fetch(url)).arrayBuffer());
        doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;
        const host = pagesRef.current!;
        host.innerHTML = '';
        const width = (box.current?.clientWidth || 600) - 8;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const total = Math.min(doc.numPages, MAX_PAGES);
        for (let n = 1; n <= total; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const scale = (width / base.width) * zoom;
          const viewport = page.getViewport({ scale: scale * dpr });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
          canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
          canvas.className = 'block mx-auto mb-2 shadow bg-white';
          host.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
          if (n === 1) setState('listo');
        }
        if (doc.numPages > MAX_PAGES) setInfo(`Se muestran las primeras ${MAX_PAGES} de ${doc.numPages} hojas. Descargá el archivo para verlas todas.`);
        setState('listo');
      } catch (e) {
        console.error('PdfViewer:', e);
        if (!cancelled) { setWhy(String((e as any)?.message || e).slice(0, 120)); setState('error'); }
      }
    })();
    return () => { cancelled = true; doc?.destroy?.(); };
  }, [url, zoom]);

  return (
    <div className="bg-muted/30">
      <div className="flex items-center justify-end gap-2 px-2 py-1 text-xs border-b border-border">
        <button className="p-1 rounded hover:bg-muted" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.25).toFixed(2)))} aria-label="Achicar"><Minus className="w-3 h-3" /></button>
        <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button className="p-1 rounded hover:bg-muted" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} aria-label="Agrandar"><Plus className="w-3 h-3" /></button>
      </div>
      <div ref={box} className="max-h-[65vh] overflow-auto p-1" aria-label={name}>
        {state === 'cargando' && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
        {state === 'error' && <p className="text-sm text-destructive text-center py-8">No se pudo mostrar el PDF. Usá "Descargar".{why && <span className="block text-xs text-muted-foreground mt-1">({why})</span>}</p>}
        <div ref={pagesRef} />
        {info && <p className="text-xs text-muted-foreground text-center py-2">{info}</p>}
      </div>
    </div>
  );
};

export default PdfViewer;
