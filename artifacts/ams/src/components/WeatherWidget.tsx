import { useEffect, useState } from "react";
import {
  Sun, Cloud, CloudSun, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, CloudLightning, Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface WeatherData {
  temp: number;
  code: number;
  city: string;
}

function iconForCode(code: number) {
  if (code === 0) return Sun;
  if (code >= 1 && code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return CloudRain;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return CloudSun;
}

export default function WeatherWidget() {
  const { t } = useI18n();
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const geo = await fetch("https://ipapi.co/json/").then((r) => r.json());
        const lat = geo.latitude;
        const lon = geo.longitude;
        const city = geo.city ?? "";
        if (lat == null || lon == null) throw new Error("no geo");
        const w = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        ).then((r) => r.json());
        const cw = w.current_weather;
        if (!cancelled && cw) {
          setData({ temp: Math.round(cw.temperature), code: cw.weathercode, city });
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground" data-testid="weather-unavailable">
        <CloudFog className="w-3.5 h-3.5" />
        <span className="text-xs">{t.weatherUnavailable}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs">{t.weatherLoading}</span>
      </div>
    );
  }

  const Icon = iconForCode(data.code);

  return (
    <div
      className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15"
      title={data.city}
      data-testid="weather-widget"
    >
      <Icon className="w-4 h-4 text-primary" />
      <div className="flex flex-col leading-none">
        <span className="text-xs font-bold text-foreground">{data.temp}°C</span>
        {data.city && (
          <span className="text-[10px] text-muted-foreground -mt-0.5 max-w-[80px] truncate">
            {data.city}
          </span>
        )}
      </div>
    </div>
  );
}
