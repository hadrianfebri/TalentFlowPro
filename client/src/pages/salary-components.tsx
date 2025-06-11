import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, AlertTriangle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { queryClient } from "@/lib/queryClient";

interface SalaryComponent {
  id: number;
  companyId: string;
  name: string;
  code: string;
  type: "allowance" | "deduction";
  category: "fixed" | "variable" | "benefit";
  isActive: boolean;
  description?: string;
  defaultAmount: string;
  isTaxable: boolean;
  createdAt: string;
  updatedAt: string;
}

const salaryComponentSchema = z.object({
  name: z.string().min(1, "Nama komponen harus diisi"),
  code: z.string().min(1, "Kode komponen harus diisi").max(20, "Maksimal 20 karakter"),
  type: z.enum(["allowance", "deduction"], { required_error: "Pilih tipe komponen" }),
  category: z.enum(["fixed", "variable", "benefit"], { required_error: "Pilih kategori komponen" }),
  description: z.string().optional(),
  defaultAmount: z.string().min(1, "Jumlah default harus diisi"),
  isTaxable: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

type SalaryComponentFormData = z.infer<typeof salaryComponentSchema>;

function SalaryComponents() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null);
  const { toast } = useToast();
  const { isAdminOrHR } = usePermissions();

  const form = useForm<SalaryComponentFormData>({
    resolver: zodResolver(salaryComponentSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "allowance",
      category: "fixed",
      description: "",
      defaultAmount: "0",
      isTaxable: true,
      isActive: true,
    },
  });

  const { data: components = [], isLoading } = useQuery<SalaryComponent[]>({
    queryKey: ["/api/salary-components"],
    enabled: isAdminOrHR(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: SalaryComponentFormData) => {
      const response = await fetch("/api/salary-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create component");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary-components"] });
      toast({ title: "Komponen gaji berhasil ditambahkan" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Gagal menambahkan komponen gaji", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SalaryComponentFormData }) => {
      const response = await fetch(`/api/salary-components/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update component");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary-components"] });
      toast({ title: "Komponen gaji berhasil diperbarui" });
      setDialogOpen(false);
      setEditingComponent(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Gagal memperbarui komponen gaji", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/salary-components/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete component");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary-components"] });
      toast({ title: "Komponen gaji berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Gagal menghapus komponen gaji", variant: "destructive" });
    },
  });

  const onSubmit = (data: SalaryComponentFormData) => {
    if (editingComponent) {
      updateMutation.mutate({ id: editingComponent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (component: SalaryComponent) => {
    setEditingComponent(component);
    form.reset({
      name: component.name,
      code: component.code,
      type: component.type,
      category: component.category,
      description: component.description || "",
      defaultAmount: component.defaultAmount,
      isTaxable: component.isTaxable,
      isActive: component.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus komponen gaji ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const getTypeColor = (type: string) => {
    return type === "allowance" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "fixed": return "bg-blue-100 text-blue-800";
      case "variable": return "bg-yellow-100 text-yellow-800";
      case "benefit": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!isAdminOrHR()) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header pageTitle="Komponen Gaji" />
          <main className="flex-1 overflow-y-auto p-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Akses Terbatas</h3>
                <p className="text-muted-foreground text-center">
                  Halaman ini hanya dapat diakses oleh Admin atau HR
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header pageTitle="Komponen Gaji" />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Komponen Gaji</h1>
              <p className="text-muted-foreground mt-1">
                Kelola komponen gaji seperti tunjangan, potongan, dan benefit
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingComponent(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Komponen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingComponent ? "Edit Komponen Gaji" : "Tambah Komponen Gaji"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Komponen</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Uang Makan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kode</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., MEAL" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipe</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="allowance">Tunjangan</SelectItem>
                                <SelectItem value="deduction">Potongan</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kategori</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fixed">Tetap</SelectItem>
                                <SelectItem value="variable">Variabel</SelectItem>
                                <SelectItem value="benefit">Benefit</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="defaultAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jumlah Default (IDR)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deskripsi</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Deskripsi komponen gaji..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isTaxable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Kena Pajak</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Komponen ini termasuk dalam perhitungan pajak
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Aktif</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Komponen dapat digunakan dalam payroll
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : "Simpan"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Components List */}
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Memuat komponen gaji...</p>
                  </div>
                </CardContent>
              </Card>
            ) : !components || components.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Belum Ada Komponen Gaji</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Mulai tambahkan komponen gaji seperti tunjangan makan, transport, atau bonus
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Komponen Pertama
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {components.map((component: SalaryComponent) => (
                  <Card key={component.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div>
                            <CardTitle className="text-lg">{component.name}</CardTitle>
                            <CardDescription>Kode: {component.code}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(component.type)}>
                            {component.type === "allowance" ? "Tunjangan" : "Potongan"}
                          </Badge>
                          <Badge className={getCategoryColor(component.category)}>
                            {component.category === "fixed" ? "Tetap" : 
                             component.category === "variable" ? "Variabel" : "Benefit"}
                          </Badge>
                          {!component.isActive && (
                            <Badge variant="secondary">Tidak Aktif</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Jumlah Default: <span className="font-medium text-foreground">
                              {formatCurrency(component.defaultAmount)}
                            </span>
                          </div>
                          {component.description && (
                            <div className="text-sm text-muted-foreground">
                              {component.description}
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Kena Pajak: {component.isTaxable ? "Ya" : "Tidak"}</span>
                            <span>Status: {component.isActive ? "Aktif" : "Tidak Aktif"}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(component)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(component.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SalaryComponents;