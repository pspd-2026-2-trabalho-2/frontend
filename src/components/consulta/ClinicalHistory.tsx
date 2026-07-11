import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import {
  resourcesOfType,
  type Condition,
  type Encounter,
  type MedicationRequest,
  type Observation,
} from "@/lib/fhir";

interface TimelineEntry {
  date: string;
  label: string;
  detail: string;
}

const TYPE_FILTERS = ["Todos", "Atendimento", "Diagnóstico", "Exame", "Medicação"] as const;

export function ClinicalHistory({ patientId }: { patientId: string }) {
  const { data, error, isLoading } = useAsync(
    () => api.patientHistory(patientId),
    [patientId],
  );

  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>("Todos");

  const entries: TimelineEntry[] = useMemo(() => {
    if (!data) return [];
    return [
      ...resourcesOfType<Encounter>(data, "Encounter").map((e) => ({
        date: e.period.start,
        label: "Atendimento",
        detail: e.serviceType?.text ?? "",
      })),
      ...resourcesOfType<Condition>(data, "Condition").map((c) => ({
        date: c.recordedDate ?? "",
        label: "Diagnóstico",
        detail: c.code.text,
      })),
      ...resourcesOfType<Observation>(data, "Observation").map((o) => ({
        date: o.effectiveDateTime ?? "",
        label: "Exame",
        detail: `${o.code.text}: ${o.valueQuantity?.value} ${o.valueQuantity?.unit ?? ""}`,
      })),
      ...resourcesOfType<MedicationRequest>(data, "MedicationRequest").map((m) => ({
        date: m.authoredOn ?? "",
        label: "Medicação",
        detail: m.medicationCodeableConcept.text,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));
  }, [data]);

  const filteredEntries = useMemo(() => {
    if (typeFilter === "Todos") return entries;
    return entries.filter((entry) => entry.label === typeFilter);
  }, [entries, typeFilter]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row flex-wrap gap-2">
        {TYPE_FILTERS.map((type) => (
          <Button
            key={type}
            type="button"
            size="sm"
            variant={typeFilter === type ? "default" : "outline"}
            onClick={() => setTypeFilter(type)}
          >
            {type}
          </Button>
        ))}
      </div>
      <Card>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {filteredEntries.map((entry, i) => (
            <div key={i} className="flex items-center gap-4 p-4 text-sm">
              <span className="font-data w-24 shrink-0 text-muted-foreground">{entry.date}</span>
              <span className="w-28 shrink-0 font-medium">{entry.label}</span>
              <span>{entry.detail}</span>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Sem histórico registrado.</p>
          )}
          {entries.length > 0 && filteredEntries.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              Nenhum evento encontrado para o filtro.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
