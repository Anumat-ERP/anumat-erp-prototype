import { Button, Field, Input } from '@app/ui';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline, Strikethrough, Heading2, List, ListOrdered, Quote, Code, Link, Undo2, Redo2, RemoveFormatting } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale } from '../i18n/LocaleProvider';

export function plainTextDocument(text = ''): JSONContent {
  return { type: 'doc', content: text.split('\n').map((line) => ({ type: 'paragraph', content: line ? [{ type: 'text', text: line }] : undefined })) };
}
function safeLink(value: string) {
  try { return ['http:', 'https:', 'mailto:'].includes(new URL(value).protocol); } catch { return false; }
}

/** Stores schema-based JSON; pasted content is parsed through the editor schema. */
export function RichTextEditor({ document: value, legacyText, onChange, disabled, documentKey }: { document?: JSONContent; legacyText?: string; onChange: (document: JSONContent, text: string) => void; disabled?: boolean; documentKey: string }) {
  const { t: tr } = useLocale();
  const translate = useRef(tr);
  translate.current = tr;
  const change = useRef(onChange);
  change.current = onChange;
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [linkError, setLinkError] = useState<string>();
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' }, isAllowedUri: (value, context) => context.defaultValidate(value) && safeLink(value) } }), Placeholder.configure({ placeholder: () => translate.current('Describe the work, context, and approach…') })],
    content: value ?? plainTextDocument(legacyText),
    editable: !disabled,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { role: 'textbox', 'aria-label': tr('Description'), 'aria-multiline': 'true', class: 'work-rich-content' } },
    onUpdate: ({ editor }) => change.current(editor.getJSON(), editor.getText()),
  }, [documentKey]);
  useEffect(() => { editor?.setEditable(!disabled, false); }, [editor, disabled]);
  useEffect(() => { editor?.setOptions({ editorProps: { attributes: { role: 'textbox', 'aria-label': tr('Description'), 'aria-multiline': 'true', 'aria-readonly': String(Boolean(disabled)), class: 'work-rich-content' } } }); }, [editor, disabled, tr]);
  if (!editor) return null;
  const tool = (label: string, icon: ReactNode, action: () => void, active = false, unavailable = false) => <Button variant="tertiary" key={label} type="button" className="h-auto p-0 justify-start whitespace-normal work-rich-tool" title={tr(label)} aria-label={tr(label)} aria-pressed={active} disabled={unavailable} onMouseDown={(event) => event.preventDefault()} onClick={action}>{icon}</Button>;
  return <div className="work-rich-editor" data-readonly={disabled || undefined}>
    {!disabled && <div className="work-rich-toolbar" role="toolbar" aria-label={tr('Description formatting')} onKeyDown={(event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const at = buttons.indexOf(globalThis.document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (at + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault(); buttons[next]?.focus();
    }}>
      {tool('Bold', <Bold />, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {tool('Italic', <Italic />, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {tool('Underline', <Underline />, () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
      {tool('Strikethrough', <Strikethrough />, () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
      <span className="work-rich-divider" aria-hidden />
      {tool('Heading', <Heading2 />, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading'))}
      {tool('Bullet list', <List />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {tool('Numbered list', <ListOrdered />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      {tool('Quote', <Quote />, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
      {tool('Code block', <Code />, () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'))}
      {tool('Insert link', <Link />, () => { setUrl(editor.getAttributes('link').href ?? ''); setLinkError(undefined); setLinkOpen(true); }, editor.isActive('link'))}
      <span className="work-rich-divider" aria-hidden />
      {tool('Clear formatting', <RemoveFormatting />, () => editor.chain().focus().unsetAllMarks().clearNodes().run())}
      {tool('Undo', <Undo2 />, () => editor.chain().focus().undo().run(), false, !editor.can().undo())}
      {tool('Redo', <Redo2 />, () => editor.chain().focus().redo().run(), false, !editor.can().redo())}
    </div>}
    {linkOpen && !disabled && <div className="work-rich-link">
      <Field label={tr('Link address')} error={linkError}><Input autoFocus type="url" placeholder="https://" value={url} onChange={(event) => { setUrl(event.target.value); setLinkError(undefined); }} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setLinkOpen(false); editor.commands.focus(); } }} /></Field>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => { if (!safeLink(url.trim())) { setLinkError(tr('Enter an http, https, or email link.')); return; } editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run(); setLinkOpen(false); }}>{tr('Apply link')}</Button>
        <Button size="sm" onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setLinkOpen(false); }}>{tr('Remove link')}</Button>
        <Button size="sm" variant="plain" onClick={() => { setLinkOpen(false); editor.commands.focus(); }}>{tr('Cancel')}</Button>
      </div>
    </div>}
    <EditorContent editor={editor} />
  </div>;
}
