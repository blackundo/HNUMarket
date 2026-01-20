'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import { useImperativeHandle, forwardRef } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { uploadApi } from '@/lib/api/products';
import { generateText } from '@/lib/services/ai-text-generation';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/image';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Quote,
  Code,
  LinkIcon,
  ImageIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ListTodo,
  Table as TableIcon,
  Minus,
  Type,
  Palette,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  ChevronDown,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export interface TipTapEditorRef {
  editor: Editor | null;
  setContent: (content: string) => void;
  insertContent: (content: string) => void;
}

const COLORS = [
  { name: 'Đen', value: '#000000' },
  { name: 'Xám đậm', value: '#374151' },
  { name: 'Xám', value: '#6B7280' },
  { name: 'Xám nhạt', value: '#9CA3AF' },
  { name: 'Đỏ', value: '#EF4444' },
  { name: 'Cam', value: '#F97316' },
  { name: 'Vàng', value: '#EAB308' },
  { name: 'Xanh lá', value: '#22C55E' },
  { name: 'Xanh dương', value: '#3B82F6' },
  { name: 'Tím', value: '#A855F7' },
  { name: 'Hồng', value: '#EC4899' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Vàng', value: '#FEF08A' },
  { name: 'Xanh lá', value: '#BBF7D0' },
  { name: 'Xanh dương', value: '#BFDBFE' },
  { name: 'Hồng', value: '#FCE7F3' },
  { name: 'Cam', value: '#FED7AA' },
  { name: 'Tím', value: '#E9D5FF' },
];

/**
 * TipTap Rich Text Editor
 *
 * Editor chuyên nghiệp cho bài đăng blog với đầy đủ tính năng định dạng.
 * Hỗ trợ: bold, italic, underline, strikethrough, headings, lists, alignment,
 * colors, highlights, links, images, tables, và nhiều tính năng khác.
 */
export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
  ({ content, onChange }, ref) => {
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [showAiDialog, setShowAiDialog] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },
        }),
        Image.configure({
          inline: true,
          allowBase64: false,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 underline cursor-pointer',
          },
        }),
        Placeholder.configure({
          placeholder: '',
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        Highlight.configure({
          multicolor: true,
        }),
        Underline,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        Subscript,
        Superscript,
      ],
      content,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
    });

    // Expose editor instance via ref
    useImperativeHandle(ref, () => ({
      editor,
      setContent: (newContent: string) => {
        if (editor) {
          editor.commands.setContent(newContent);
        }
      },
      insertContent: (newContent: string) => {
        if (editor) {
          editor.chain().focus().insertContent(newContent).run();
        }
      },
    }));

    if (!editor) {
      return null;
    }

    const addImage = async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        try {
          const { url } = await uploadApi.uploadFile(file);
          editor.chain().focus().setImage({ src: getImageUrl(url) }).run();
        } catch (error) {
          console.error('Failed to upload image:', error);
          toast.error('Không thể tải ảnh lên');
        }
      };
      input.click();
    };

    const handleSetLink = () => {
      const previousUrl = editor.getAttributes('link').href;
      setLinkUrl(previousUrl || '');
      setShowLinkDialog(true);
    };

    const confirmLink = () => {
      if (linkUrl) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      } else {
        editor.chain().focus().unsetLink().run();
      }
      setShowLinkDialog(false);
      setLinkUrl('');
    };

    const removeLink = () => {
      editor.chain().focus().unsetLink().run();
      setShowLinkDialog(false);
      setLinkUrl('');
    };

    const insertTable = () => {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    };

    const handleAiGenerate = async () => {
      if (!aiPrompt.trim()) {
        toast.error('Vui lòng nhập yêu cầu cho AI');
        return;
      }

      setAiLoading(true);
      try {
        // Get current editor content as context
        const context = editor.getHTML();

        // Call AI service directly from client
        const result = await generateText({
          prompt: aiPrompt,
          context: context.length > 500 ? '' : context, // Only send context if it's short
          maxTokens: 2048,
          temperature: 0.7,
        });

        // Insert generated content into editor
        editor.chain().focus().insertContent(result.content).run();

        // Close dialog and reset
        setShowAiDialog(false);
        setAiPrompt('');
      } catch (error) {
        console.error('AI generation error:', error);

        let errorMessage = 'Không thể tạo nội dung. Vui lòng thử lại.';

        if (error instanceof Error) {
          if (error.message.includes('API key not configured')) {
            errorMessage = 'Chưa cấu hình Google GenAI API key. Vui lòng thêm NEXT_PUBLIC_GOOGLE_GENAI_API_KEY vào file .env.local';
          } else {
            errorMessage = error.message;
          }
        }

        toast.error(errorMessage);
      } finally {
        setAiLoading(false);
      }
    };

    const ToolbarButton = ({
      onClick,
      active,
      disabled,
      children,
      title,
    }: {
      onClick: () => void;
      active?: boolean;
      disabled?: boolean;
      children: React.ReactNode;
      title?: string;
    }) => (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {children}
      </button>
    );

    const ToolbarSeparator = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

    const getActiveHeading = () => {
      if (editor.isActive('heading', { level: 1 })) return 1;
      if (editor.isActive('heading', { level: 2 })) return 2;
      if (editor.isActive('heading', { level: 3 })) return 3;
      if (editor.isActive('heading', { level: 4 })) return 4;
      if (editor.isActive('heading', { level: 5 })) return 5;
      if (editor.isActive('heading', { level: 6 })) return 6;
      return null;
    };

    const getActiveAlignment = () => {
      if (editor.isActive({ textAlign: 'left' })) return 'left';
      if (editor.isActive({ textAlign: 'center' })) return 'center';
      if (editor.isActive({ textAlign: 'right' })) return 'right';
      if (editor.isActive({ textAlign: 'justify' })) return 'justify';
      return 'left';
    };

    const currentColor = editor.getAttributes('textStyle').color || '#000000';
    const currentHighlight = editor.getAttributes('highlight').color || null;

    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 items-center">

          {/* AI Generate */}
          <ToolbarButton
            onClick={() => setShowAiDialog(true)}
            title="Tạo nội dung với AI"
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
          </ToolbarButton>
          <ToolbarSeparator />
          {/* Text Format */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="In đậm (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="In nghiêng (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Gạch chân (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Gạch ngang"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Code nội tuyến"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarSeparator />

          {/* Headings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600 flex items-center gap-1"
                title="Tiêu đề"
              >
                {getActiveHeading() ? (
                  <>
                    {getActiveHeading() === 1 && <Heading1 className="h-4 w-4" />}
                    {getActiveHeading() === 2 && <Heading2 className="h-4 w-4" />}
                    {getActiveHeading() === 3 && <Heading3 className="h-4 w-4" />}
                    {getActiveHeading() === 4 && <Heading4 className="h-4 w-4" />}
                    {getActiveHeading() === 5 && <Heading5 className="h-4 w-4" />}
                    {getActiveHeading() === 6 && <Heading6 className="h-4 w-4" />}
                  </>
                ) : (
                  <Type className="h-4 w-4" />
                )}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                <Heading1 className="h-4 w-4 mr-2" />
                Tiêu đề 1
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <Heading2 className="h-4 w-4 mr-2" />
                Tiêu đề 2
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                <Heading3 className="h-4 w-4 mr-2" />
                Tiêu đề 3
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
              >
                <Heading4 className="h-4 w-4 mr-2" />
                Tiêu đề 4
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
              >
                <Heading5 className="h-4 w-4 mr-2" />
                Tiêu đề 5
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
              >
                <Heading6 className="h-4 w-4 mr-2" />
                Tiêu đề 6
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                Đoạn văn
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolbarSeparator />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Danh sách gạch đầu dòng"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Danh sách đánh số"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive('taskList')}
            title="Danh sách công việc"
          >
            <ListTodo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarSeparator />

          {/* Alignment */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600 flex items-center gap-1"
                title="Căn chỉnh"
              >
                {getActiveAlignment() === 'left' && <AlignLeft className="h-4 w-4" />}
                {getActiveAlignment() === 'center' && <AlignCenter className="h-4 w-4" />}
                {getActiveAlignment() === 'right' && <AlignRight className="h-4 w-4" />}
                {getActiveAlignment() === 'justify' && <AlignJustify className="h-4 w-4" />}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
              >
                <AlignLeft className="h-4 w-4 mr-2" />
                Căn trái
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
              >
                <AlignCenter className="h-4 w-4 mr-2" />
                Căn giữa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
              >
                <AlignRight className="h-4 w-4 mr-2" />
                Căn phải
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              >
                <AlignJustify className="h-4 w-4 mr-2" />
                Căn đều
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolbarSeparator />

          {/* Colors */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600 flex items-center gap-1"
                title="Màu chữ"
              >
                <Palette className="h-4 w-4" />
                <div
                  className="w-4 h-4 rounded border border-gray-300"
                  style={{ backgroundColor: currentColor }}
                />
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                }}
              >
                Mặc định
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {COLORS.map((color) => (
                <DropdownMenuItem
                  key={color.value}
                  onClick={() => {
                    editor.chain().focus().setColor(color.value).run();
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: color.value }}
                    />
                    <span>{color.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600 flex items-center gap-1"
                title="Đánh dấu"
              >
                <Highlighter className="h-4 w-4" />
                {currentHighlight && (
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: currentHighlight }}
                  />
                )}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                }}
              >
                Bỏ đánh dấu
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {HIGHLIGHT_COLORS.map((color) => (
                <DropdownMenuItem
                  key={color.value}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: color.value }).run();
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: color.value }}
                    />
                    <span>{color.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolbarSeparator />

          {/* More Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
                title="Thêm tùy chọn"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleSubscript().run()}
              >
                <SubscriptIcon className="h-4 w-4 mr-2" />
                Chỉ số dưới
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
              >
                <SuperscriptIcon className="h-4 w-4 mr-2" />
                Chỉ số trên
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <Quote className="h-4 w-4 mr-2" />
                Trích dẫn
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              >
                <Code className="h-4 w-4 mr-2" />
                Khối code
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              >
                <Minus className="h-4 w-4 mr-2" />
                Đường ngang
              </DropdownMenuItem>
              <DropdownMenuItem onClick={insertTable}>
                <TableIcon className="h-4 w-4 mr-2" />
                Chèn bảng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolbarSeparator />

          {/* Links & Images */}
          <ToolbarButton
            onClick={handleSetLink}
            active={editor.isActive('link')}
            title="Liên kết"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="Chèn ảnh">
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* History */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Làm lại (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Link Dialog */}
        {showLinkDialog && (
          <div className="border-b bg-white p-3 flex gap-2">
            <input
              type="text"
              placeholder="Nhập URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmLink();
                } else if (e.key === 'Escape') {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                }
              }}
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="button"
              onClick={confirmLink}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Áp dụng
            </button>
            {editor.isActive('link') && (
              <button
                type="button"
                onClick={removeLink}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Bỏ liên kết
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowLinkDialog(false);
                setLinkUrl('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Hủy
            </button>
          </div>
        )}

        {/* AI Generate Dialog */}
        {showAiDialog && (
          <div className="border-b bg-white p-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yêu cầu AI tạo nội dung
              </label>
              <textarea
                placeholder="Ví dụ: Viết một đoạn giới thiệu về lợi ích của sản phẩm này..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAiGenerate();
                  } else if (e.key === 'Escape') {
                    setShowAiDialog(false);
                    setAiPrompt('');
                  }
                }}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                autoFocus
                disabled={aiLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nhấn Ctrl+Enter để tạo nội dung, Esc để hủy
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Đang tạo nội dung...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Tạo nội dung
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAiDialog(false);
                  setAiPrompt('');
                }}
                disabled={aiLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Editor Content */}
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[400px] [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ul_ul]:list-[circle] [&_.ProseMirror_ul_ul_ul]:list-[square] [&_.ProseMirror_ul,.ProseMirror_ol]:pl-6 [&_.ProseMirror_li_p]:mt-0 [&_.ProseMirror_li_p]:mb-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mt-6 [&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-5 [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_code]:bg-gray-100 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_pre]:bg-gray-900 [&_.ProseMirror_pre]:text-gray-100 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:text-inherit [&_.ProseMirror_pre_code]:p-0 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded [&_.ProseMirror_img]:my-4 [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:table-auto [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:my-4 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:bg-gray-100 [&_.ProseMirror_th]:px-4 [&_.ProseMirror_th]:py-2 [&_.ProseMirror_th]:text-left [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:px-4 [&_.ProseMirror_td]:py-2 [&_.ProseMirror_ul[data-type='taskList']]:list-none [&_.ProseMirror_ul[data-type='taskList']_li]:flex [&_.ProseMirror_ul[data-type='taskList']_li]:gap-2 [&_.ProseMirror_ul[data-type='taskList']_li_input[type='checkbox']]:mt-1"
        />
      </div>
    );
  });

TipTapEditor.displayName = 'TipTapEditor';
