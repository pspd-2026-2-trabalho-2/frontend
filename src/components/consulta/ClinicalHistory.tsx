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

export function ClinicalHistory({ patientId }: { patientId: string }) {
  const { data, error, isLoading } = useAsync(
    () => api.patientHistory(patientId),
    [patientId],
  );

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return null;

  const entries: TimelineEntry[] = [
    ...resourcesOfType<Encounter>(data, "Encounter").map((e) => ({
      date: e.period.start,
      label: "Atendimento",
      detail: e.serviceType?.text ?? "",
    })),
    ...resourcesOfType<Condition>(data, "Condition").map((c) => ({
      date: c.onsetDateTime ?? "",
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

  return (
    <Card>
      <CardContent className="flex flex-col divide-y divide-border p-0">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-4 p-4 text-sm">
            <span className="font-data w-24 shrink-0 text-muted-foreground">{entry.date}</span>
            <span className="w-28 shrink-0 font-medium">{entry.label}</span>
            <span>{entry.detail}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Sem histórico registrado.</p>
        )}
      </CardContent>
    </Card>
  );
}
