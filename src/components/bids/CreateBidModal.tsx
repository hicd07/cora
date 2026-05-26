import React, { useState } from "react";
import { Calendar, Check, DollarSign, FileText, HardHat, Info, Map, MapPin, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BidRequest, QuoteItem } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { dismissToast, showError, showLoading, showSuccess } from "@/utils/toast";

interface CreateBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (newRequest: BidRequest) => void;
}

const CATEGORIES = [
  { id: "Cemento y Agregados", label: "Cemento y Agregados" },
  { id: "Metales y Estructuras", label: "Metales y Estructuras" },
  { id: "Plomería", label: "Plomería" },
  { id: "Bloques y Ladrillos", label: "Bloques y Ladrillos" },
  { id: "Electricidad", label: "Electricidad" },
];

const SECTORS = ["Alma Rosa I", "Alma Rosa II", "Ensanche Ozama", "Lucerna", "San Isidro", "El Almirante"];
const UNITS = ["Fundas", "Varillas", "Metros Cúbicos", "Unidades", "Pies", "Cajas", "Quintales"];

const MAP_LANDMARKS = [
  { name: "Calle Club de Leones #12, Alma Rosa I", sector: "Alma Rosa I", x: 40, y: 45 },
  { name: "Av. San Vicente de Paul #88, Ensanche Ozama", sector: "Ensanche Ozama", x: 30, y: 60 },
  { name: "Calle Costa Rica #5, Lucerna", sector: "Lucerna", x: 65, y: 35 },
  { name: "Av. Coronel Rafael Tomás Fernández #102, San Isidro", sector: "San Isidro", x: 80, y: 50 },
  { name: "Calle Primera #14, Alma Rosa II", sector: "Alma Rosa II", x: 50, y: 30 },
  { name: "Av. Mella Esq. Calle Respaldo, El Almirante", sector: "El Almirante", x: 85, y: 70 },
];

const fieldClassName = "h-11 rounded-md border border-input bg-muted px-3 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring/25";
const textareaClassName = "min-h-[88px] w-full rounded-md border border-input bg-muted px-3 py-3 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring/25 resize-none";

export const CreateBidModal: React.FC<CreateBidModalProps> = ({ isOpen, onClose, onPublish }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [sector, setSector] = useState(SECTORS[0]);
  const [address, setAddress] = useState("");
  const [budget, setBudget] = useState("");
  const [expiresIn, setExpiresIn] = useState("24");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState(MAP_LANDMARKS[0]);
  const [items, setItems] = useState<QuoteItem[]>([{ name: "", quantity: 1, unit: UNITS[0] }]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { name: "", quantity: 1, unit: UNITS[0] }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, currentIndex) => currentIndex !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === "quantity" ? Number.parseFloat(String(value)) || 0 : value,
    };
    setItems(newItems);
  };

  const handleConfirmMapLocation = () => {
    setAddress(selectedLandmark.name);
    setSector(selectedLandmark.sector);
    setIsMapOpen(false);
    showSuccess(`Ubicación fijada en ${selectedLandmark.sector}`);
  };

  const resetForm = () => {
    setTitle("");
    setCategory(CATEGORIES[0].id);
    setSector(SECTORS[0]);
    setAddress("");
    setBudget("");
    setExpiresIn("24");
    setNotes("");
    setItems([{ name: "", quantity: 1, unit: UNITS[0] }]);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title || !address) {
      showError("Completa el nombre del proyecto y la dirección de entrega.");
      return;
    }

    const validItems = items.filter((item) => item.name.trim() !== "" && item.quantity > 0);
    if (validItems.length === 0) {
      showError("Añade al menos un material válido.");
      return;
    }

    setIsSubmitting(true);
    const toastId = showLoading("Buscando ferreterías aliadas en SDE...");

    setTimeout(() => {
      dismissToast(toastId);

      const newRequest: BidRequest = {
        id: `req-${Date.now()}`,
        title,
        category,
        deliveryAddress: address.includes(sector) ? address : `${address}, ${sector}`,
        sector,
        status: "active",
        items: validItems,
        itemsCount: validItems.length,
        budgetLimit: budget ? Number.parseFloat(budget) : undefined,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + Number.parseInt(expiresIn, 10) * 60 * 60 * 1000).toISOString(),
        bidsCount: 0,
      };

      onPublish(newRequest);
      setIsSubmitting(false);
      showSuccess(`¡Solicitud publicada! Notificando a ferreterías en ${sector} en tiempo real.`);
      onClose();
      resetForm();
    }, 1500);
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center">
      <div className="modal-sheet max-h-[92vh] w-full max-w-md overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-[hsl(var(--primary)/0.14)] text-primary">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">Nueva subasta</p>
              <h3 className="font-display text-base font-semibold text-foreground">Solicitar cotización</h3>
              <p className="mt-1 text-xs text-muted-foreground">Múltiples materiales en un solo pedido.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 pb-10">
          <div className="space-y-1.5">
            <label className="section-label block">Nombre de la obra o proyecto</label>
            <Input
              type="text"
              required
              placeholder="Ej: Vaciado de techo - segunda planta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="section-label block">Categoría principal</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClassName}>
              {CATEGORIES.map((categoryItem) => (
                <option key={categoryItem.id} value={categoryItem.id}>
                  {categoryItem.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="section-label block">Lista de materiales</label>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="h-8 px-2 text-primary hover:bg-transparent">
                <Plus className="h-3.5 w-3.5" />Añadir
              </Button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div key={index} className="panel-muted rounded-lg p-3">
                  <div className="grid grid-cols-[1fr_72px_92px_auto] items-center gap-2">
                    <Input
                      type="text"
                      required
                      placeholder="Material"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                    />
                    <Input
                      type="number"
                      required
                      min="1"
                      placeholder="Cant."
                      value={item.quantity || ""}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      className="text-center"
                    />
                    <select value={item.unit} onChange={(e) => handleItemChange(index, "unit", e.target.value)} className={fieldClassName}>
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    {items.length > 1 ? (
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} aria-label="Eliminar material">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : (
                      <div className="h-10 w-10" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-muted rounded-lg p-4">
            <div className="space-y-1.5">
              <label className="section-label flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />Sector de entrega (SDE)
              </label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className={fieldClassName}>
                {SECTORS.map((sectorItem) => (
                  <option key={sectorItem} value={sectorItem}>
                    {sectorItem}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 space-y-1.5">
              <label className="section-label block">Dirección exacta de obra</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  required
                  placeholder="Calle, número y referencia"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" onClick={() => setIsMapOpen(true)} className="px-3" aria-label="Ubicar en mapa">
                  <Map className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="section-label flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />Presupuesto máximo
              </label>
              <Input type="number" placeholder="Opcional (RD$)" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="section-label flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />Duración de subasta
              </label>
              <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} className={fieldClassName}>
                <option value="12">12 horas</option>
                <option value="24">24 horas</option>
                <option value="48">48 horas</option>
                <option value="72">72 horas</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="section-label flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />Notas e instrucciones especiales
            </label>
            <textarea
              placeholder="Ej: entregar en segundo nivel, se requiere camión con grúa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={textareaClassName}
            />
          </div>

          <div className="rounded-lg border border-primary/20 bg-[hsl(var(--primary)/0.1)] p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 text-primary" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Al publicar, notificaremos instantáneamente a las ferreterías verificadas que cubren <strong className="text-foreground">{sector}</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Publicar"}
            </Button>
          </div>
        </form>
      </div>

      {isMapOpen && (
        <div className="modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="app-shell w-full max-w-sm overflow-hidden rounded-2xl bg-card">
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="section-label">Mapa de obra</p>
                <h4 className="font-display text-sm font-semibold text-foreground">Fijar ubicación</h4>
                <p className="mt-1 text-xs text-muted-foreground">Toca un punto de referencia en Santo Domingo Este.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsMapOpen(false)} aria-label="Cerrar mapa">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative h-64 overflow-hidden border-b border-border bg-[hsl(var(--surface-2))]">
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
              <div className="absolute bottom-0 left-0 right-0 flex h-8 items-center justify-center border-t border-sky-300/50 bg-sky-300/30">
                <span className="section-label text-sky-700 dark:text-sky-200">Mar Caribe (Av. España)</span>
              </div>
              <div className="absolute bottom-0 left-0 top-0 flex w-8 items-center justify-center border-r border-sky-300/50 bg-sky-200/40">
                <span className="section-label -rotate-90 whitespace-nowrap text-sky-700 dark:text-sky-200">Río Ozama</span>
              </div>

              {MAP_LANDMARKS.map((landmark, index) => {
                const isSelected = selectedLandmark.name === landmark.name;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedLandmark(landmark)}
                    style={{ left: `${landmark.x}%`, top: `${landmark.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <div className="relative flex items-center justify-center">
                      {isSelected && <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-primary/30" />}
                      <MapPin className={cn("h-6 w-6 transition-transform", isSelected ? "scale-125 text-primary" : "text-muted-foreground hover:scale-110 hover:text-foreground")} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="panel-muted rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.14)] text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="section-label">Dirección detectada</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{selectedLandmark.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Sector: {selectedLandmark.sector}</p>
                  </div>
                </div>
              </div>

              <Button type="button" onClick={handleConfirmMapLocation} className="w-full justify-center">
                <Check className="h-4 w-4" />Confirmar ubicación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBidModal;
