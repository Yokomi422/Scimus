import { useEffect, useState } from "react";
import type { Note } from "@scimus/shared-types";
import axios from "axios";
import { toast } from "sonner";
import { RefreshCw, Plus, Trash2, Edit, X, Check } from "lucide-react";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", tags: "" });

  const fetchNotes = async (showToast = false) => {
    try {
      setRefreshing(true);
      const response = await axios.get<{ success: boolean; data: Note[] }>(
        "http://localhost:3001/api/v1/notes"
      );

      if (response.data.success) {
        setNotes(response.data.data);
        if (showToast) {
          toast.success("ノート一覧を更新しました");
        }
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("ノート一覧の取得に失敗しました");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      toast.error("タイトルと内容は必須です");
      return;
    }

    try {
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const response = await axios.post("http://localhost:3001/api/v1/notes", {
        title: formData.title,
        content: formData.content,
        tags,
      });

      if (response.data.success) {
        toast.success("ノートを作成しました");
        setShowCreateModal(false);
        setFormData({ title: "", content: "", tags: "" });
        fetchNotes();
      }
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("ノートの作成に失敗しました");
    }
  };

  const handleUpdate = async () => {
    if (!editingNote) return;

    try {
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const response = await axios.put(
        `http://localhost:3001/api/v1/notes/${editingNote.id}`,
        {
          title: formData.title,
          content: formData.content,
          tags,
        }
      );

      if (response.data.success) {
        toast.success("ノートを更新しました");
        setEditingNote(null);
        setFormData({ title: "", content: "", tags: "" });
        fetchNotes();
      }
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("ノートの更新に失敗しました");
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!confirm("このノートを削除しますか？")) return;

    try {
      const response = await axios.delete(
        `http://localhost:3001/api/v1/notes/${noteId}`
      );

      if (response.data.success) {
        toast.success("ノートを削除しました");
        fetchNotes();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("ノートの削除に失敗しました");
    }
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags?.join(", ") || "",
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
            <p className="mt-2 text-gray-600">テキストノートとMarkdownファイル</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              新規作成
            </button>
            <button
              onClick={() => fetchNotes(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              更新
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">ノートがありません</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {note.title}
                  </h3>
                  <p className="line-clamp-3 text-sm text-gray-600">
                    {note.content}
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    {formatDate(note.updatedAt)}
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {note.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block rounded bg-blue-100 px-2 py-1 text-xs text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(note)}
                    className="flex flex-1 items-center justify-center gap-2 rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                  >
                    <Edit className="h-4 w-4" />
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="rounded bg-red-600 p-2 text-white hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingNote) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingNote ? "ノートを編集" : "新規ノート"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingNote(null);
                    setFormData({ title: "", content: "", tags: "" });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="ノートのタイトル"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    内容
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    rows={10}
                    placeholder="ノートの内容"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    タグ (カンマ区切り)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="例: 研究, アイデア, TODO"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={editingNote ? handleUpdate : handleCreate}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                  >
                    <Check className="h-4 w-4" />
                    {editingNote ? "更新" : "作成"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingNote(null);
                      setFormData({ title: "", content: "", tags: "" });
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
