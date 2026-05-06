"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useState, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  X,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function BlogEditor({ content, onChange, placeholder = "Start writing your story..." }: BlogEditorProps) {
  const supabase = createClient();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showMediaUpload, setShowMediaUpload] = useState<"image" | "video" | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: "rounded-xl max-w-full h-auto my-4" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-red-600 underline hover:text-red-700" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: content || "<p></p>",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none min-h-[400px] focus:outline-none px-4 py-3",
        style: "color: #111827;",
      },
    },
  });

  const getTextContent = () => editor?.getText() || "";

  const wordCount = () => {
    const text = getTextContent();
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const charCount = () => getTextContent().length;

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      });

      const result = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(xhr.statusText));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("POST", "/api/admin/upload");
        xhr.send(formData);
      });

      editor?.chain().focus().setImage({ src: result.url }).run();
      setShowMediaUpload(null);
      setMediaUrl("");
      setUploadProgress(0);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [editor]);

  const handleVideoEmbed = useCallback(() => {
    if (!mediaUrl) return;

    let embedUrl = mediaUrl;
    if (mediaUrl.includes("youtube.com/watch?v=")) {
      const videoId = mediaUrl.split("v=")[1]?.split("&")[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (mediaUrl.includes("youtu.be/")) {
      const videoId = mediaUrl.split("youtu.be/")[1]?.split("?")[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (mediaUrl.includes("vimeo.com/")) {
      const videoId = mediaUrl.split("vimeo.com/")[1]?.split("?")[0];
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }

    const videoHtml = `<div class="relative w-full aspect-video my-4 rounded-xl overflow-hidden bg-gray-900"><iframe src="${embedUrl}" class="absolute inset-0 w-full h-full" frameborder="0" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe></div>`;
    editor?.chain().focus().insertContent(videoHtml).run();
    setShowMediaUpload(null);
    setMediaUrl("");
  }, [editor, mediaUrl]);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-2 rounded-lg transition-all",
        active ? "bg-red-100 text-red-600" : "hover:bg-gray-100 text-gray-600"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex flex-wrap items-center gap-1 bg-gray-50/50">
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
            <Italic className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2">
          <ToolbarButton onClick={() => setShowLinkInput(true)} active={editor.isActive("link")} title="Add Link">
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setShowMediaUpload("image")} title="Insert Image">
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setShowMediaUpload("video")} title="Embed Video">
            <Film className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 outline-none text-sm"
            autoFocus
          />
          <button
            onClick={() => {
              if (linkUrl) editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
              setShowLinkInput(false);
              setLinkUrl("");
            }}
            className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Add
          </button>
          <button onClick={() => { setShowLinkInput(false); setLinkUrl(""); }} className="p-2 rounded-lg hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Media Upload */}
      {showMediaUpload && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          {showMediaUpload === "image" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Upload Image</p>
              <div className="flex items-center gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); }} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-red-500 text-gray-600 hover:text-red-600 transition-all">
                  <Upload className="w-4 h-4" />
                  {uploading ? `Uploading... ${uploadProgress}%` : "Choose File"}
                </button>
                <span className="text-xs text-gray-500">or paste URL:</span>
              </div>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 outline-none text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") { editor?.chain().focus().setImage({ src: mediaUrl }).run(); setShowMediaUpload(null); setMediaUrl(""); } }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Embed Video</p>
              <p className="text-xs text-gray-500">Paste YouTube or Vimeo URL</p>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 outline-none text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleVideoEmbed} disabled={!mediaUrl} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50">
                  Embed
                </button>
                <button onClick={() => { setShowMediaUpload(null); setMediaUrl(""); }} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Stats */}
      <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 bg-gray-50">
        <div className="flex items-center gap-4">
          <span>{charCount()} characters</span>
          <span>{wordCount()} words</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50" title="Undo">↶</button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50" title="Redo">↷</button>
        </div>
      </div>
    </div>
  );
}
