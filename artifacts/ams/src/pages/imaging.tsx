import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Plus, X, ZoomIn, Download, Filter, Search } from "lucide-react";
import {
  useListImages, getListImagesQueryKey,
  useDeleteImage,
  useListPatients, getListPatientsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const IMAGE_TYPES = ["panoramic", "periapical", "bitewing", "cephalometric", "cbct", "intraoral", "other"];

const TYPE_COLORS: Record<string, string> = {
  panoramic: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  periapical: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  bitewing: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  cephalometric: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  cbct: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  intraoral: "bg-green-500/10 text-green-500 border-green-500/20",
  other: "bg-muted text-muted-foreground",
};

export default function ImagingPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("all");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    patientId: 0, type: "panoramic", url: "", date: "", description: "",
  });
  const queryClient = useQueryClient();
  const { t, tr } = useI18n();

  const { data: images, isLoading } = useListImages(
    patientFilter !== "all" ? { patientId: parseInt(patientFilter) } : undefined,
    { query: { queryKey: getListImagesQueryKey() } }
  );
  const { data: patients } = useListPatients(undefined, { query: { queryKey: getListPatientsQueryKey() } });

  const deleteMutation = useDeleteImage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListImagesQueryKey() });
        toast.success(t.imageDeleted);
      },
    },
  });

  const filteredImages = typeFilter === "all"
    ? images
    : images?.filter((img) => img.type === typeFilter);

  const groupedImages = IMAGE_TYPES.reduce((acc, type) => {
    const group = filteredImages?.filter((img) => img.type === type) ?? [];
    if (group.length > 0) acc[type] = group;
    return acc;
  }, {} as Record<string, typeof images>);

  return (
    <div className="p-6 space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="ams-page-title">{t.medicalImaging}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{images?.length ?? 0} {t.imagesOnFile}</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)} data-testid="button-add-image">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> {t.addImage}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={patientFilter} onValueChange={setPatientFilter}>
          <SelectTrigger className="w-44" data-testid="select-patient-filter">
            <SelectValue placeholder={t.allPatients} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allPatients}</SelectItem>
            {patients?.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1 flex-wrap">
          {["all", ...IMAGE_TYPES].map((ty) => (
            <button
              key={ty}
              onClick={() => setTypeFilter(ty)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all capitalize",
                typeFilter === ty
                  ? ty === "all" ? "bg-primary text-primary-foreground border-primary" : cn(TYPE_COLORS[ty], "border-transparent")
                  : "border-border text-muted-foreground hover:border-border/60"
              )}
            >
              {ty === "all" ? t.all : tr(ty)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      )}

      {Object.keys(groupedImages).length === 0 && !isLoading && (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <ImageIcon className="w-14 h-14 mb-4 opacity-15" />
          <p className="font-medium">{t.noImagesFound}</p>
          <p className="text-sm mt-1">{t.uploadToStart}</p>
        </div>
      )}

      {Object.entries(groupedImages).map(([type, imgs]) => (
        <div key={type}>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={cn("text-xs capitalize", TYPE_COLORS[type])}>{tr(type)}</Badge>
            <span className="text-xs text-muted-foreground">{imgs?.length} {t.imagesLabel}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {imgs?.map((img) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-square rounded-xl overflow-hidden border border-card-border bg-muted relative group cursor-pointer"
                onClick={() => setLightboxImage(img.url)}
                data-testid={`card-image-${img.id}`}
              >
                <img
                  src={img.url}
                  alt={`${img.type} - ${img.date}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <ZoomIn className="w-5 h-5 text-white" />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs truncate">{img.date}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: img.id }); }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all"
                  data-testid={`button-delete-image-${img.id}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Medical image"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add image dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t.addMedicalImage}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t.patient}</Label>
              <Select value={String(form.patientId)} onValueChange={(v) => setForm(f => ({ ...f, patientId: parseInt(v) }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectPatient} />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.imageType}</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_TYPES.map((ty) => (
                    <SelectItem key={ty} value={ty} className="capitalize">{tr(ty)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.imageUrl}</Label>
              <Input value={form.url} onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>{t.date}</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>{t.cancel}</Button>
              <Button
                className="flex-1"
                disabled={!form.patientId || !form.url || !form.date}
                onClick={async () => {
                  const { useCreateImage } = await import("@workspace/api-client-react");
                  toast.error("Use the API directly to add images. URL-based uploads coming soon.");
                  setShowAddForm(false);
                }}
              >
                {t.add}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
