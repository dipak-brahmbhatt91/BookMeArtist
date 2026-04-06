import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Edit2, Trash2, BookOpen, Eye, EyeOff, Globe, Tag, Bold, Italic, 
  List, ListOrdered, Heading1, Heading2, Quote, Code, Link as LinkIcon, Upload,
  Clock, Search, FileText, Sparkles, X, ExternalLink, Undo, Redo, RefreshCw
} from "lucide-react";
import { apiUrl } from "@/lib/api-base";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

// ─── Types ─────────────────────────────────────────────────────────────────

type BlogPostSummary = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published";
  category: string;
  author: string;
  readingTime: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BlogPostFull = BlogPostSummary & {
  excerpt: string;
  content: string;
  featuredImage: string;
  authorBio: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  noindex: boolean;
};

// ─── Constants ─────────────────────────────────────────────────────────────

const BLOG_CATEGORIES = [
  "general", "tips", "guides", "news", "artists", "events",
  "photography", "music", "dance", "booking",
];

const EMPTY_FORM: Omit<BlogPostFull, "id" | "createdAt" | "updatedAt" | "publishedAt" | "readingTime"> = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  author: "BookMeArtist Team",
  authorBio: "",
  category: "general",
  tags: [],
  status: "draft",
  metaTitle: "",
  metaDescription: "",
  ogImage: "",
  canonicalUrl: "",
  noindex: false,
};

// ─── TipTap Editor Components ──────────────────────────────────────────────

const MenuBar = ({ 
  editor, 
  isHtmlMode, 
  onToggleHtml 
}: { editor: any, isHtmlMode: boolean, onToggleHtml: () => void }) => {
  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt('URL');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const btnClass = (active: boolean) => 
    `p-2 rounded-md transition-colors ${active ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-white/10 hover:text-white'}`;

  return (
    <div className="flex flex-wrap gap-1 p-1 mb-2 border-b border-white/10 bg-black/20 rounded-t-lg sticky top-0 z-10">
      {!isHtmlMode && (
        <>
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}><Bold className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}><Italic className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))}><Heading1 className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}><Heading2 className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}><List className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}><ListOrdered className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))}><Quote className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={btnClass(editor.isActive('code'))}><Code className="w-4 h-4" /></button>
          <button type="button" onClick={setLink} className={btnClass(editor.isActive('link'))}><LinkIcon className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-white/10 self-center mx-1" />
          <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)}><Undo className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)}><Redo className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-white/10 self-center mx-1" />
        </>
      )}
      <button 
        type="button" 
        onClick={onToggleHtml} 
        className={btnClass(isHtmlMode)}
        title={isHtmlMode ? "Switch to Visual Editor" : "Switch to HTML Editor"}
      >
        <div className="flex items-center gap-1.5 px-1">
          <Code className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{isHtmlMode ? "Visual" : "HTML"}</span>
        </div>
      </button>
    </div>
  );
};

const RichTextEditor = ({ content, onChange }: { content: string, onChange: (val: string) => void }) => {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [localHtml, setLocalHtml] = useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your story...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (!isHtmlMode) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4 text-sm',
      },
    },
  });

  // Sync content only if changed externally (e.g. when switching posts)
  useEffect(() => {
    if (editor && !isHtmlMode && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
    // If content changes externally while in HTML mode, sync localHtml
    if (isHtmlMode && content !== localHtml) {
      setLocalHtml(content);
    }
  }, [content, editor, isHtmlMode, localHtml]);

  const handleToggle = () => {
    if (isHtmlMode) {
      // Switching from HTML to Visual: Push current HTML back to the editor
      // This is where Tiptap will parse and "normalize" the HTML
      editor?.commands.setContent(localHtml);
      onChange(localHtml);
    } else {
      // Switching from Visual to HTML: Capture current editor content
      setLocalHtml(editor?.getHTML() || "");
    }
    setIsHtmlMode(!isHtmlMode);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <MenuBar 
        editor={editor} 
        isHtmlMode={isHtmlMode} 
        onToggleHtml={handleToggle} 
      />
      {isHtmlMode ? (
        <Textarea
          value={localHtml}
          onChange={(e) => {
            setLocalHtml(e.target.value);
            onChange(e.target.value);
          }}
          className="w-full min-h-[400px] bg-[#0a0a0f] border-none focus-visible:ring-0 font-mono text-sm p-4 text-emerald-400/90 rounded-none shadow-none leading-relaxed"
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function calcReadingTime(content: string) {
  const words = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(apiUrl(path), {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body.detail ? `${body.error}: ${body.detail}` : (body.error || "Request failed");
    throw new Error(msg);
  }
  return res.json();
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function AdminBlog() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Load list
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/blog");
      setPosts(data);
    } catch (err: any) {
      toast({ title: "Failed to load posts", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Open create form
  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setTagInput("");
    setIsOpen(true);
  }

  // Open edit form
  async function openEdit(id: number) {
    try {
      const post: BlogPostFull = await apiFetch(`/api/admin/blog/${id}`);
      setEditingId(id);
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        featuredImage: post.featuredImage,
        author: post.author,
        authorBio: post.authorBio,
        category: post.category,
        tags: post.tags ?? [],
        status: post.status,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        ogImage: post.ogImage,
        canonicalUrl: post.canonicalUrl,
        noindex: post.noindex,
      });
      setTagInput("");
      setIsOpen(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load post", variant: "destructive" });
    }
  }

  // Handle title → auto slug
  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: editingId ? f.slug : toSlug(title),
    }));
  }

  // Tags
  function addTag() {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || form.tags.includes(tag)) { setTagInput(""); return; }
    setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  const getImageUrl = (url: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : apiUrl(url);
  };

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(apiUrl("/api/admin/blog/upload"), {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      if (data.url) {
        setForm((f) => ({ ...f, featuredImage: data.url }));
        toast({ title: "Success", description: "Image uploaded successfully" });
      }
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message || "Could not connect to server", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // Save
  async function handleSave() {
    if (!form.title.trim()) {
      toast({ title: "Validation", description: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (editingId) {
        await apiFetch(`/api/admin/blog/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast({ title: "Saved", description: "Post updated successfully" });
      } else {
        await apiFetch("/api/admin/blog", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({ title: "Created", description: "Post created successfully" });
      }
      setIsOpen(false);
      loadPosts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  // Delete
  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Post deleted" });
      loadPosts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete post", variant: "destructive" });
    }
  }

  // Quick status toggle
  async function toggleStatus(post: BlogPostSummary) {
    try {
      const newStatus = post.status === "published" ? "draft" : "published";
      await apiFetch(`/api/admin/blog/${post.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast({ title: newStatus === "published" ? "Published" : "Unpublished", description: post.title });
      loadPosts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update status", variant: "destructive" });
    }
  }

  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(filter.toLowerCase()) ||
      p.category.toLowerCase().includes(filter.toLowerCase()) ||
      p.author.toLowerCase().includes(filter.toLowerCase()),
  );

  const readingTime = calcReadingTime(form.content);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Blog Posts
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage SEO-optimized blog articles
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Post</span>
          </Button>
        </div>

        {/* Filter */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter posts…"
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-white font-semibold mb-1">No posts yet</p>
            <p className="text-sm">Create your first blog post to get started.</p>
          </div>
        ) : (
          <div className="bg-card border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3">Title</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Author</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3 hidden md:table-cell">Read</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr key={post.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white line-clamp-1">{post.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono">/blog/{post.slug}</div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <Badge variant="secondary" className="capitalize text-xs">{post.category}</Badge>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-muted-foreground">{post.author}</td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleStatus(post)}
                        title={post.status === "published" ? "Click to unpublish" : "Click to publish"}
                      >
                        <Badge
                          variant={post.status === "published" ? "default" : "outline"}
                          className={`text-xs cursor-pointer ${
                            post.status === "published"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "border-white/20 text-muted-foreground"
                          }`}
                        >
                          {post.status === "published" ? (
                            <><Eye className="w-3 h-3 mr-1" />Published</>
                          ) : (
                            <><EyeOff className="w-3 h-3 mr-1" />Draft</>
                          )}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center hidden md:table-cell text-muted-foreground text-xs">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readingTime}m
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === "published" && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                            title="View post"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => openEdit(post.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-[#0a0a0f] border-white/10">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white font-display text-xl">
              {editingId ? "Edit Post" : "New Post"}
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10 w-full">
              <TabsTrigger value="content" className="flex-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                <FileText className="w-3.5 h-3.5" /> Content
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Globe className="w-3.5 h-3.5" /> SEO
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Sparkles className="w-3.5 h-3.5" /> Settings
              </TabsTrigger>
            </TabsList>

            {/* ── Content Tab ── */}
            <TabsContent value="content" className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white">Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Your compelling blog title…"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">/blog/</span>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="auto-generated-from-title"
                    className="bg-white/5 border-white/10 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Excerpt</Label>
                <Textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="A brief summary shown in listings and search results (140–160 chars recommended)…"
                  rows={3}
                  className="bg-white/5 border-white/10 resize-none"
                />
                <p className="text-xs text-muted-foreground">{form.excerpt.length} chars</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Content (HTML)</Label>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~{readingTime} min read
                  </span>
                </div>
                <RichTextEditor 
                  content={form.content} 
                  onChange={(val) => setForm(f => ({ ...f, content: val }))} 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Featured Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.featuredImage}
                    onChange={(e) => setForm((f) => ({ ...f, featuredImage: e.target.value }))}
                    placeholder="https://… or upload below"
                    className="bg-white/5 border-white/10"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      id="blog-image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={uploading}
                      onClick={() => document.getElementById('blog-image-upload')?.click()}
                    >
                      {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {form.featuredImage && (
                  <div className="mt-2 rounded-lg overflow-hidden aspect-[16/9] max-w-xs bg-white/5 relative group">
                    <img src={getImageUrl(form.featuredImage)} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, featuredImage: "" }))}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── SEO Tab ── */}
            <TabsContent value="seo" className="space-y-5">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary">
                These fields override the default title and description for search engines and social sharing.
              </div>

              <div className="space-y-2">
                <Label className="text-white">Meta Title</Label>
                <Input
                  value={form.metaTitle}
                  onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                  placeholder="Leave blank to use the post title"
                  className="bg-white/5 border-white/10"
                  maxLength={70}
                />
                <p className="text-xs text-muted-foreground">
                  {form.metaTitle.length}/70 chars
                  {form.metaTitle.length > 60 && (
                    <span className="text-yellow-400 ml-2">Getting long — Google may truncate this</span>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Meta Description</Label>
                <Textarea
                  value={form.metaDescription}
                  onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                  placeholder="Leave blank to use the excerpt (recommended 140–160 chars)"
                  rows={3}
                  className="bg-white/5 border-white/10 resize-none"
                  maxLength={165}
                />
                <p className="text-xs text-muted-foreground">
                  {form.metaDescription.length}/165 chars
                  {form.metaDescription.length > 160 && (
                    <span className="text-yellow-400 ml-2">May be truncated in search results</span>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">OG / Social Share Image URL</Label>
                <Input
                  value={form.ogImage}
                  onChange={(e) => setForm((f) => ({ ...f, ogImage: e.target.value }))}
                  placeholder="Leave blank to use featured image (1200×630 recommended)"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Canonical URL</Label>
                <Input
                  value={form.canonicalUrl}
                  onChange={(e) => setForm((f) => ({ ...f, canonicalUrl: e.target.value }))}
                  placeholder={`/blog/${form.slug || "post-slug"} (leave blank for default)`}
                  className="bg-white/5 border-white/10 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Use only if this content is also published elsewhere.</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <Label className="text-white">No-Index</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Prevent search engines from indexing this post</p>
                </div>
                <Switch
                  checked={form.noindex}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, noindex: v }))}
                />
              </div>

              {/* SERP Preview */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">SERP Preview</Label>
                <div className="p-4 bg-white rounded-xl text-sm space-y-1">
                  <p className="text-blue-600 font-medium truncate">
                    {form.metaTitle || form.title || "Post Title"}
                  </p>
                  <p className="text-green-700 text-xs">
                    bookmeartist.replit.app/blog/{form.slug || "post-slug"}
                  </p>
                  <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                    {form.metaDescription || form.excerpt || "Post description will appear here in search results."}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ── Settings Tab ── */}
            <TabsContent value="settings" className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOG_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v as "draft" | "published" }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Author Name</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Author Bio</Label>
                <Textarea
                  value={form.authorBio}
                  onChange={(e) => setForm((f) => ({ ...f, authorBio: e.target.value }))}
                  placeholder="Short author biography shown at the bottom of the post…"
                  rows={3}
                  className="bg-white/5 border-white/10 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="Add a tag and press Enter"
                    className="bg-white/5 border-white/10"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={addTag}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2 py-1 bg-primary/20 border border-primary/30 rounded-full text-xs text-primary"
                      >
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {saving ? "Saving…" : editingId ? "Update Post" : "Create Post"}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="border-white/10">
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
