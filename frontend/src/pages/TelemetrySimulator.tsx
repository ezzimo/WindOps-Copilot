import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, RotateCcw, Activity } from "lucide-react";
import { useTurbines, useSendTelemetry } from "../hooks/useWindOps";
import type { TelemetryPayload, TelemetryResponse } from "../types";
import { Badge } from "../components/ui/Badge";
import { HealthGauge } from "../components/ui/HealthGauge";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

interface FieldConfig {
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

const FIELDS: Record<keyof Omit<TelemetryPayload, "turbine_id" | "timestamp">, FieldConfig> = {
  wind_speed: {
    label: "Vitesse du vent (m/s)",
    min: 0,
    max: 30,
    step: 0.1,
    default: 12.5,
  },
  rotor_rpm: {
    label: "RPM rotor",
    min: 0,
    max: 25,
    step: 0.1,
    default: 15.0,
  },
  power_output: {
    label: "Puissance (kW)",
    min: 0,
    max: 2000,
    step: 1,
    default: 750,
  },
  temperature_gearbox: {
    label: "Temp. boîte de vitesses (°C)",
    min: 0,
    max: 120,
    step: 0.5,
    default: 65.0,
  },
  temperature_generator: {
    label: "Temp. générateur (°C)",
    min: 0,
    max: 130,
    step: 0.5,
    default: 72.0,
  },
  vibration_level: {
    label: "Niveau vibrations (mm/s)",
    min: 0,
    max: 50,
    step: 0.1,
    default: 5.0,
  },
  blade_pitch_angle: {
    label: "Angle de pale (°)",
    min: -5,
    max: 90,
    step: 0.5,
    default: 15.0,
  },
};

type FormValues = Omit<TelemetryPayload, "turbine_id" | "timestamp">;

const DEFAULT_VALUES: FormValues = {
  wind_speed: FIELDS.wind_speed.default,
  rotor_rpm: FIELDS.rotor_rpm.default,
  power_output: FIELDS.power_output.default,
  temperature_gearbox: FIELDS.temperature_gearbox.default,
  temperature_generator: FIELDS.temperature_generator.default,
  vibration_level: FIELDS.vibration_level.default,
  blade_pitch_angle: FIELDS.blade_pitch_angle.default,
};

const PRESETS: Record<string, Partial<FormValues>> = {
  normal: {},
  vibration: {
    vibration_level: 22,
    temperature_gearbox: 78,
  },
  overheat: {
    temperature_gearbox: 92,
    temperature_generator: 98,
  },
  complex: {
    vibration_level: 19,
    temperature_gearbox: 88,
    power_output: 200,
  },
};

function formatNumber(value: number, step: number): string {
  const decimals = step.toString().split(".")[1]?.length ?? 0;
  return value.toFixed(decimals);
}

export function TelemetrySimulator() {
  const { data: turbines, isLoading: turbinesLoading } = useTurbines();
  const { mutate, isPending, data: result, error, reset } = useSendTelemetry();

  const [turbineId, setTurbineId] = useState<string>("");
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES);

  const applyPreset = (preset: Partial<FormValues>) => {
    setValues((prev) => ({ ...prev, ...preset }));
  };

  const handleChange = (key: keyof FormValues, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!turbineId) return;

    const payload: TelemetryPayload = {
      turbine_id: turbineId,
      timestamp: new Date().toISOString(),
      ...values,
    };

    mutate(payload);
  };

  const handleRetry = () => {
    reset();
    if (!turbineId) return;

    const payload: TelemetryPayload = {
      turbine_id: turbineId,
      timestamp: new Date().toISOString(),
      ...values,
    };

    mutate(payload);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Simulateur de télémétrie</h1>
          <p className="text-slate-400">
            Envoyez manuellement des données de capteurs pour déclencher le
            pipeline multi-agents et observer le résultat en temps réel.
          </p>
        </div>

        {/* Turbine selector */}
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <label
            htmlFor="turbine-select"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Éolienne cible
          </label>
          <select
            id="turbine-select"
            value={turbineId}
            onChange={(e) => setTurbineId(e.target.value)}
            disabled={turbinesLoading}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Sélectionner une éolienne...</option>
            {turbines?.map((turbine) => (
              <option key={turbine.turbine_id} value={turbine.turbine_id}>
                {turbine.name} ({turbine.turbine_id})
              </option>
            ))}
          </select>
        </div>

        {/* Scenarios */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset(PRESETS.normal)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-emerald-700 hover:text-emerald-400"
          >
            Fonctionnement normal
          </button>
          <button
            type="button"
            onClick={() => applyPreset(PRESETS.vibration)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-amber-700 hover:text-amber-400"
          >
            Vibrations élevées
          </button>
          <button
            type="button"
            onClick={() => applyPreset(PRESETS.overheat)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-red-700 hover:text-red-400"
          >
            Surchauffe critique
          </button>
          <button
            type="button"
            onClick={() => applyPreset(PRESETS.complex)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-orange-700 hover:text-orange-400"
          >
            Anomalie complexe
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-lg border border-slate-800 bg-slate-900 p-6"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {(Object.keys(FIELDS) as Array<keyof FormValues>).map((key) => {
              const field = FIELDS[key];
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={key}
                      className="text-sm font-medium text-slate-300"
                    >
                      {field.label}
                    </label>
                    <span className="font-mono text-sm text-sky-400">
                      {formatNumber(values[key], field.step)}
                    </span>
                  </div>
                  <input
                    id={key}
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={formatNumber(values[key], field.step)}
                    onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={values[key]}
                    onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-sky-500"
                  />
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-200">
              <p className="font-semibold">Erreur lors de l’analyse</p>
              <p>{error.message}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-300 hover:text-red-200"
              >
                <RotateCcw className="h-4 w-4" />
                Réessayer
              </button>
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={isPending || !turbineId}
              className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Déclencher l’analyse
                </>
              )}
            </button>
          </div>
        </form>

        {/* Result */}
        {result && <ResultCard result={result} />}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: TelemetryResponse }) {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-100">
          Résultat de l’analyse — {result.turbine_id}
        </h2>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">
            {result.duration_ms.toFixed(0)} ms
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-lg bg-slate-900/50 p-4">
          <HealthGauge score={result.health_score} size="md" />
          <p className="mt-2 text-sm text-slate-400">Score de santé</p>
        </div>

        <div className="space-y-4 rounded-lg bg-slate-900/50 p-4">
          <div>
            <p className="text-xs text-slate-400">Statut</p>
            {result.anomaly_detected ? (
              <span className="text-base font-semibold text-red-400">
                Anomalie détectée
              </span>
            ) : (
              <span className="text-base font-semibold text-emerald-400">
                Aucune anomalie
              </span>
            )}
          </div>

          {result.severity && (
            <div>
              <p className="text-xs text-slate-400">Sévérité</p>
              <Badge severity={result.severity}>{result.severity}</Badge>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-400">Agents déclenchés</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {result.agents_triggered.map((agent) => (
                <span
                  key={agent}
                  className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-200"
                >
                  {agent}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg bg-slate-900/50 p-4">
          {result.incident_id && (
            <button
              type="button"
              onClick={() => navigate(`/incidents/${result.incident_id}`)}
              className="w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500"
            >
              Voir l’incident →
            </button>
          )}

          {result.alert_id && (
            <button
              type="button"
              onClick={() => navigate("/alerts")}
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-700"
            >
              Voir l’alerte →
            </button>
          )}

          <div>
            <p className="text-xs text-slate-500">Correlation ID</p>
            <code className="break-all font-mono text-xs text-slate-400">
              {result.correlation_id}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TelemetrySimulator;
