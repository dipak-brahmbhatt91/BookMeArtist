import { AdminLayout } from "@/components/admin-layout";
import { useState } from "react";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminCategories() {
  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ name: "", icon: "🎨" });

  const resetForm = () => {
    setFormData({ name: "", icon: "🎨" });
    setEditingId(null);
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });
  };

  const handleOpenDialog = (cat?: any) => {
    if (cat) {
      setEditingId(cat.id);
      setFormData({ name: cat.name, icon: cat.icon });
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = { ...formData, slug };

      if (editingId) {
        await updateCategory.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Category updated successfully" });
      } else {
        await createCategory.mutateAsync({ data: payload });
        toast({ title: "Category created successfully" });
      }
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      setIsOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Error saving category" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory.mutateAsync({ id });
      toast({ title: "Category deleted" });
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
    } catch (err) {
      toast({ variant: "destructive", title: "Cannot delete category in use" });
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Categories</h1>
            <p className="text-muted-foreground mt-1">Manage artist classifications</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f0f1a] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Category" : "New Category"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Name</label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="bg-background border-white/10 focus-visible:ring-primary"
                    placeholder="e.g. Musicians"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Icon (Emoji)</label>
                  <Input 
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    required
                    maxLength={5}
                    className="bg-background border-white/10 focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Slug (Auto-generated)</label>
                  <Input 
                    value={formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                    disabled
                    className="bg-background border-white/5 opacity-50"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-primary hover:bg-primary/90 w-full" disabled={createCategory.isPending || updateCategory.isPending}>
                    Save Category
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold w-16">Icon</th>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Slug</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : categories && categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-2xl">{category.icon}</td>
                    <td className="px-6 py-4 font-medium text-white">{category.name}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{category.slug}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="hover:bg-white/10 text-muted-foreground hover:text-white" onClick={() => handleOpenDialog(category)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  No categories found. Create one to get started.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
