import { useEffect } from "react";
import useSWRInfinite from "swr/infinite";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/useApi";
import { api, type Page } from "@/lib/api";
import {
  AGE_RANGE_EXTENSION_URL,
  type CohortPercentage,
  type FhirBundle,
  type FhirResource,
  type Observation,
  type Patient,
} from "@/lib/fhir";

const PAGE_SIZE = 50;

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-data text-2xl font-bold text-primary">{value}</p>
    </Card>
  );
}

function DistributionList({ title, data }: { title: string; data: CohortPercentage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        {data.map((item) => (
          <div key={item.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span>{item.key}</span>
              <span className="font-data">{item.percentage}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
              <div
                className="h-full rounded-full bg-primary/15"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-muted-foreground">Sem dados suficientes.</p>
        )}
      </CardContent>
    </Card>
  );
}

function groupByPatient(resources: FhirResource[]) {
  const groups: { patient: Patient; observations: Observation[] }[] = [];
  for (const resource of resources) {
    if (resource.resourceType === "Patient") {
      groups.push({ patient: resource, observations: [] });
    } else if (resource.resourceType === "Observation" && groups.length > 0) {
      groups[groups.length - 1].observations.push(resource);
    }
  }
  return groups;
}

export function CohortStats({ code }: { code: string }) {
  const stats = useApi(["cohortStatistics", code], () => api.cohortStatistics(code));

  type ExamsKey = readonly ["cohortExams", string, number];
  const getExamsKey = (index: number, previousPageData: Page<FhirBundle> | null): ExamsKey | null => {
    if (previousPageData && !previousPageData.hasMore) return null;
    return ["cohortExams", code, index + 1];
  };

  const {
    data: examsPages,
    size,
    setSize,
    isLoading: examsLoading,
    error: examsErrorRaw,
  } = useSWRInfinite<Page<FhirBundle>>(
    getExamsKey,
    ([, cond, page]: ExamsKey) => api.cohortExams(cond, page, PAGE_SIZE),
    { revalidateFirstPage: false },
  );

  useEffect(() => {
    void setSize(1);
  }, [code, setSize]);

  const examsError = examsErrorRaw instanceof Error ? examsErrorRaw.message : examsErrorRaw ? "Erro inesperado." : null;
  const hasMoreExams = examsPages?.[examsPages.length - 1]?.hasMore ?? false;
  const isLoadingMoreExams = size > 0 && examsPages && typeof examsPages[size - 1] === "undefined";

  if (stats.isLoading || examsLoading) return <Skeleton className="h-64 w-full" />;
  if (stats.error) return <ErrorState message={stats.error} />;
  if (examsError) return <ErrorState message={examsError} />;
  if (!stats.data || !examsPages) return null;

  const total = Number(stats.data.totalPatients ?? "0");
  const female = stats.data.bySex?.find((s) => s.key === "female")?.percentage ?? 0;
  const male = stats.data.bySex?.find((s) => s.key === "male")?.percentage ?? 0;
  const examEntries = examsPages.flatMap((p) => p.data.entry ?? []);
  const groups = groupByPatient(examEntries.map((e) => e.resource));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total de casos" value={total.toLocaleString("pt-BR")} />
        <StatTile label="% Mulheres" value={`${female}%`} />
        <StatTile label="% Homens" value={`${male}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DistributionList title="Faixa etária" data={stats.data.byAgeRange ?? []} />
        <DistributionList title="Departamentos mais usados" data={stats.data.byDepartment ?? []} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exames por paciente (anonimizado)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Faixa etária</TableHead>
                <TableHead>Exames</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map(({ patient, observations }) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-data">{patient.id}</TableCell>
                  <TableCell>{patient.gender === "male" ? "M" : "F"}</TableCell>
                  <TableCell className="font-data">
                    {patient.extension?.find((e) => e.url === AGE_RANGE_EXTENSION_URL)?.valueString}
                  </TableCell>
                  <TableCell className="font-data">
                    {observations
                      .map((o) => `${o.code.text}=${o.valueQuantity?.value}`)
                      .join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        {hasMoreExams && (
          <CardContent className="pt-0">
            <Button
              variant="secondary"
              disabled={isLoadingMoreExams}
              onClick={() => void setSize(size + 1)}
            >
              {isLoadingMoreExams ? "Carregando..." : "Carregar mais"}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
