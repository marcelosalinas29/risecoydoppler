import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import { useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FONTS = [
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

const FONT_SIZES = ['10px', '12px', '14px', '16px', '18px', '20px', '24px'];

// Custom FontSize extension
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize || null,
        renderHTML: attributes => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const RichTextEditor = ({ content, onChange, disabled = false, placeholder }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      TextAlign.configure({ types: ['paragraph'] }),
      FontSize,
      FontFamily,
      Color,
    ],
    content: content || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const setFontSize = useCallback((size: string) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {!disabled && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
          {/* Font family */}
          <Select
            value={editor.getAttributes('textStyle').fontFamily || 'Calibri, sans-serif'}
            onValueChange={(v) => editor.chain().focus().setFontFamily(v).run()}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <Type className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map(f => (
                <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Font size */}
          <Select
            value={editor.getAttributes('textStyle').fontSize || '14px'}
            onValueChange={setFontSize}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map(s => (
                <SelectItem key={s} value={s}>{s.replace('px', '')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Bold/Italic/Underline */}
          <Button
            type="button" variant="ghost" size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-accent' : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Alignment */}
          <Button
            type="button" variant="ghost" size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-accent' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          >
            <AlignJustify className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Text color */}
          <input
            type="color"
            className="w-8 h-8 rounded cursor-pointer border border-border"
            value={editor.getAttributes('textStyle').color || '#000000'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            title="Color de texto"
          />
        </div>
      )}

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px]"
        spellCheck
      />
    </div>
  );
};

export default RichTextEditor;
