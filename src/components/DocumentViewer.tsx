import { Badge, Banner, Button, EmptyState, IconButton, Modal } from '@app/ui';
import { Download, ExternalLink, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Attachment } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import quotePdf from '../assets/documents/licence-quote-demo.pdf?url';
import quotePreview from '../assets/documents/licence-quote-demo.png';
import { loadAttachmentFile } from '../lib/attachment-files';

export function DocumentViewer({ attachment, requestId, onClose }: { attachment: Attachment; requestId: string; onClose: () => void }) {
  const { t: tr } = useLocale();
  const [zoom, setZoom] = useState(100);
  const [imageError, setImageError] = useState(false);
  const [stored, setStored] = useState<{ url: string; type: string }>();
  const [loading, setLoading] = useState(Boolean(attachment.fileId));
  useEffect(() => {
    if (!attachment.fileId) return;
    let disposed = false;
    let url: string | undefined;
    setLoading(true);
    loadAttachmentFile(attachment.fileId).then(file => {
      if (!file || disposed) return;
      const type = attachment.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : file.type;
      url = URL.createObjectURL(new Blob([file], { type }));
      setStored({ url, type });
    }).catch(() => { /* Unavailable content uses the same honest fallback below. */ })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; if (url) URL.revokeObjectURL(url); };
  }, [attachment.fileId]);
  const sample = !attachment.fileId && requestId === 'PR-1044' && attachment.name === 'Licence_Quote.pdf' && attachment.size === 96_000;
  const pdf = stored?.type === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf');
  const image = stored && /^image\/(png|jpeg|gif|webp|avif)$/.test(stored.type);
  return <Modal open onOpenChange={open => { if (!open) onClose(); }} title={attachment.name} description={`${requestId} · ${tr('Document preview')}`} size="xl" className="an-document-viewer">
    {loading ? <p role="status" className="p-8 text-center text-muted-foreground">{tr('Loading document')}</p> : stored ? <>
      <div className="an-document-toolbar"><Badge>{tr('Saved on this device')}</Badge><div className="flex flex-wrap gap-2">
        {(pdf || image) && <Button size="sm" asChild><a href={stored.url} target="_blank" rel="noopener noreferrer">{tr('Open file')}</a></Button>}
        <Button size="sm" asChild><a href={stored.url} download={attachment.name}><Download aria-hidden className="size-4" />{tr('Download file')}</a></Button>
      </div></div>
      {pdf ? <iframe src={stored.url} title={tr('Document preview')} className="h-[58dvh] w-full rounded-lg border border-border" /> : image ? <div className="an-document-canvas"><img src={stored.url} alt={attachment.name} style={{ width: '100%' }} onError={() => setImageError(true)} />{imageError && <Banner>{tr('The preview could not load. Download the file to view it.')}</Banner>}</div> : <Banner>{tr('Preview is not supported for this file type. Download the file to open it in a compatible app.')}</Banner>}
    </> : sample ? <>
      <div className="an-document-toolbar">
        <Badge>{tr('Demo preview')}</Badge>
        <div className="flex items-center gap-1">
          <IconButton icon={<ZoomOut />} label={tr('Zoom out')} disabled={zoom <= 50} onClick={() => setZoom(value => Math.max(50, value - 25))} size="sm" />
          <span className="w-12 text-center text-xs tabular-nums" aria-live="polite">{zoom}%</span>
          <IconButton icon={<ZoomIn />} label={tr('Zoom in')} disabled={zoom >= 200} onClick={() => setZoom(value => Math.min(200, value + 25))} size="sm" />
          <IconButton icon={<RotateCcw />} label={tr('Fit to width')} onClick={() => setZoom(100)} size="sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild><a href={quotePdf} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden className="size-4" />{tr('Open PDF')}</a></Button>
          <Button size="sm" asChild><a href={quotePdf} download="Licence_Quote_Demo.pdf"><Download aria-hidden className="size-4" />{tr('Download PDF')}</a></Button>
        </div>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{tr('This sample is generated from the request details. The original supplier file is not stored in this prototype.')}</p>
      {imageError ? <Banner tone="info">{tr('The preview could not load. Open or download the PDF to view it.')}</Banner> : <div className="an-document-canvas" role="region" aria-label={tr('Document preview')} tabIndex={0}>
        <img src={quotePreview} alt={tr('Demo document for PR-1044: annual design software licences for three designers, requested amount $2,160.00.')} width="1190" height="1684" style={{ width: `${zoom}%` }} onError={() => setImageError(true)} />
      </div>}
      <p className="mt-3 text-center text-xs text-muted-foreground">{tr('Page {page} of {total}', { page: 1, total: 1 })}</p>
    </> : <EmptyState heading={tr('No file content available')}><p>{tr('This prototype saved only the file name and size for this attachment. The original document is not available to preview or download.')}</p></EmptyState>}
  </Modal>;
}
