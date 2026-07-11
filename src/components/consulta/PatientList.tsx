import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/useAuth";
import { api } from "@/lib/api";
import { resourcesOfType, type Patient } from "@/lib/fhir";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

export function PatientList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { user } = useAuth();
  const isIntern = user?.role === "ESTAGIARIO";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = isIntern ? api.supervisedPatients : api.doctorPatients;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchPage(1, PAGE_SIZE)
      .then(({ data, hasMore }) => {
        if (cancelled) return;
        setPatients(resourcesOfType<Patient>(data, "Patient"));
        setPage(1);
        setHasMore(hasMore);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erro inesperado.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntern]);

  async function loadMore() {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { data, hasMore: more } = await fetchPage(nextPage, PAGE_SIZE);
      setPatients((prev) => [...prev, ...resourcesOfType<Patient>(data, "Patient")]);
      setPage(nextPage);
      setHasMore(more);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {patients.map((patient) => (
        <Card
          key={patient.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(patient.id)}
          className={cn(
            "cursor-pointer p-4 transition-shadow hover:shadow-hover",
            selectedId === patient.id && "ring-2 ring-primary/40",
          )}
        >
          <CardContent className="flex items-center justify-between p-0">
            <div>
              <p className="font-medium">{patient.name?.[0]?.text}</p>
              <p className="font-data text-xs text-muted-foreground">
                {patient.birthDate} · {patient.gender === "male" ? "Masculino" : "Feminino"}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
      {patients.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum paciente vinculado.</p>
      )}
      {hasMore && (
        <Button
          variant="secondary"
          className="mt-2"
          disabled={isLoadingMore}
          onClick={loadMore}
        >
          {isLoadingMore ? "Carregando..." : "Carregar mais"}
        </Button>
      )}
    </div>
  );
}
