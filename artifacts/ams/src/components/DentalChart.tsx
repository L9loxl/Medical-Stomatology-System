import { useState } from "react";
import { motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToothStatus = "healthy" | "decayed" | "filled" | "crowned" | "missing" | "implant" | "extracted" | "root_canal" | "bridge" | "fractured";

const STATUS_CONFIG: Record<ToothStatus, { label: string; fill: string; stroke: string; textColor: string }> = {
  healthy: { label: "Healthy", fill: "transparent", stroke: "#22c55e", textColor: "#22c55e" },
  decayed: { label: "Decayed", fill: "#ef4444", stroke: "#dc2626", textColor: "#fff" },
  filled: { label: "Filled", fill: "#f59e0b", stroke: "#d97706", textColor: "#fff" },
  crowned: { label: "Crowned", fill: "#8b5cf6", stroke: "#7c3aed", textColor: "#fff" },
  missing: { label: "Missing", fill: "#6b7280", stroke: "#4b5563", textColor: "#fff" },
  implant: { label: "Implant", fill: "#0ea5e9", stroke: "#0284c7", textColor: "#fff" },
  extracted: { label: "Extracted", fill: "#374151", stroke: "#1f2937", textColor: "#9ca3af" },
  root_canal: { label: "Root Canal", fill: "#f97316", stroke: "#ea580c", textColor: "#fff" },
  bridge: { label: "Bridge", fill: "#06b6d4", stroke: "#0891b2", textColor: "#fff" },
  fractured: { label: "Fractured", fill: "#dc2626", stroke: "#b91c1c", textColor: "#fff" },
};

// FDI notation: upper right (18-11), upper left (21-28), lower left (31-38), lower right (41-48)
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];

interface DentalChartProps {
  chartData: Array<{ toothNumber: number; status: string }>;
  onToothClick?: (toothNumber: number, status: ToothStatus) => void;
  interactive?: boolean;
}

function ToothSVG({
  number, status, onClick, interactive,
}: {
  number: number; status: ToothStatus; onClick: () => void; interactive: boolean;
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.healthy;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.div
          whileHover={interactive ? { scale: 1.1 } : undefined}
          whileTap={interactive ? { scale: 0.95 } : undefined}
          onClick={onClick}
          className={cn("flex flex-col items-center gap-0.5", interactive && "cursor-pointer")}
          data-testid={`tooth-${number}`}
        >
          <span className="text-[9px] text-muted-foreground font-medium">{number}</span>
          <svg width="24" height="28" viewBox="0 0 24 28">
            {/* Tooth shape */}
            <path
              d="M4 4 Q12 1 20 4 L22 16 Q18 26 12 26 Q6 26 2 16 Z"
              fill={config.fill}
              stroke={config.stroke}
              strokeWidth="1.5"
              className="transition-all duration-200"
            />
            {/* X for extracted */}
            {status === "extracted" && (
              <>
                <line x1="8" y1="10" x2="16" y2="18" stroke="#6b7280" strokeWidth="2" />
                <line x1="16" y1="10" x2="8" y2="18" stroke="#6b7280" strokeWidth="2" />
              </>
            )}
            {/* Diamond for implant */}
            {status === "implant" && (
              <path d="M12 8 L16 14 L12 20 L8 14 Z" fill="none" stroke="#fff" strokeWidth="1" />
            )}
            {/* Circle for root canal */}
            {status === "root_canal" && (
              <circle cx="12" cy="14" r="3" fill="none" stroke="#fff" strokeWidth="1.5" />
            )}
            {/* Crown mark */}
            {status === "crowned" && (
              <path d="M8 8 L12 6 L16 8 L15 13 L9 13 Z" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
            )}
          </svg>
        </motion.div>
      </PopoverTrigger>
      {interactive && (
        <PopoverContent className="w-48 p-2" align="center">
          <p className="text-xs font-semibold mb-2">Tooth #{number}</p>
          <div className="text-xs text-muted-foreground mb-2 capitalize">
            Current: <span className="text-foreground font-medium">{STATUS_CONFIG[status]?.label}</span>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}

export default function DentalChart({ chartData, onToothClick, interactive = true }: DentalChartProps) {
  const getStatus = (num: number): ToothStatus => {
    const entry = chartData.find((e) => e.toothNumber === num);
    return (entry?.status as ToothStatus) ?? "healthy";
  };

  const renderRow = (teeth: number[], label: string) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-8 text-right">{label}</span>
      <div className="flex gap-1">
        {teeth.map((num) => (
          <ToothSVG
            key={num}
            number={num}
            status={getStatus(num)}
            onClick={() => onToothClick?.(num, getStatus(num))}
            interactive={interactive}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-1">
      {/* Upper arch */}
      <div className="flex flex-col items-center gap-1">
        {renderRow(UPPER_RIGHT, "UR")}
        {renderRow(UPPER_LEFT, "UL")}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 py-1">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground px-2">Midline</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Lower arch */}
      <div className="flex flex-col items-center gap-1">
        {renderRow(LOWER_LEFT, "LL")}
        {renderRow(LOWER_RIGHT, "LR")}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-3 h-3 rounded-sm border"
              style={{ backgroundColor: config.fill === "transparent" ? "transparent" : config.fill, borderColor: config.stroke }}
            />
            <span className="text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
