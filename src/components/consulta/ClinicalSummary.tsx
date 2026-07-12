import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import {
  resourcesOfType,
  type Condition,
  type Encounter,
  type MedicationRequest,
  type Observation,
  type Patient,
} from "@/lib/fhir";
import { formatDate } from "@/lib/utils";

export function ClinicalSummary({ patientId }: { patientId: string }) {
  const { data, error, isLoading } = useAsync(
    () => api.patientSummary(patientId),
    [patientId],
  );

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const patient = resourcesOfType<Patient>(data, "Patient")[0];
  const encounter = resourcesOfType<Encounter>(data, "Encounter")[0];
  const conditions = resourcesOfType<Condition>(data, "Condition");
  const observations = resourcesOfType<Observation>(data, "Observation");
  const medications = resourcesOfType<MedicationRequest>(data, "MedicationRequest");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dados do paciente</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>
            <span className="text-muted-foreground">Nome: </span>
            {patient?.name?.[0]?.text}
          </p>
          <p>
            <span className="text-muted-foreground">Nascimento: </span>
            <span className="font-data">{formatDate(patient?.birthDate)}</span>
          </p>
          {patient?.address?.[0] && (
            <p>
              <span className="text-muted-foreground">Local: </span>
              {[patient.address[0].city, patient.address[0].state].filter(Boolean).join(" / ")}
            </p>
          )}
          {patient?.identifier?.map((id) => (
            <p key={id.system}>
              <span className="text-muted-foreground">{id.system.toUpperCase()}: </span>
              <span className="font-data">{id.value}</span>
            </p>
          ))}
        </CardContent>
      </Card>

      {encounter && (
        <Card>
          <CardHeader>
            <CardTitle>Último atendimento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Setor: </span>
              {encounter.serviceType?.text}
            </p>
            <p>
              <span className="text-muted-foreground">Data: </span>
              <span className="font-data">{formatDate(encounter.period.start)}</span>
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Diagnósticos principais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {conditions.map((c) => (
            <Badge key={c.id} variant="secondary">
              {c.code.text}
            </Badge>
          ))}
          {conditions.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum diagnóstico registrado.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos exames</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {observations.map((o) => (
            <p key={o.id}>
              {o.code.text}:{" "}
              <span className="font-data">
                {o.valueQuantity?.value} {o.valueQuantity?.unit}
              </span>
            </p>
          ))}
          {observations.length === 0 && (
            <p className="text-muted-foreground">Nenhum exame registrado.</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Medicamentos em uso</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {medications.map((m) => (
            <Badge key={m.id} variant="accent">
              {m.medicationCodeableConcept.text}
            </Badge>
          ))}
          {medications.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum medicamento em uso.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
