import { useDebounce } from "@uidotdev/usehooks";
import { Search, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/useAuth";
import { api, type Page } from "@/lib/api";
import { resourcesOfType, type FhirBundle, type Patient } from "@/lib/fhir";
import { cn, formatDate } from "@/lib/utils";

const PAGE_SIZE = 50;

type Gender = "" | "male" | "female";

// Initials for the monogram tile: first letter of the first and last word,
// uppercase, max two characters. Falls back gracefully for single-word or
// empty/missing names (e.g. the anonymized intern view).
function initials(name: string | undefined): string {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function PatientList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { user } = useAuth();
  const isIntern = user?.role === "ESTAGIARIO";

  const [searchInput, setSearchInput] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const debouncedSearch = useDebounce(searchInput, 350);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  type PatientsKey = readonly ["patients", boolean, number, number, string, Gender];

  const getKey = (index: number, previousPageData: Page<FhirBundle> | null): PatientsKey | null => {
    if (previousPageData && !previousPageData.hasMore) return null;
    return ["patients", isIntern, index + 1, PAGE_SIZE, debouncedSearch, gender];
  };

  const { data, size, setSize, isLoading, error } = useSWRInfinite<Page<FhirBundle>>(
    getKey,
    ([, intern, page, pageSize, search, g]: PatientsKey) =>
      (intern ? api.supervisedPatients : api.doctorPatients)(page, pageSize, search, g),
    { revalidateFirstPage: false },
  );

  useEffect(() => {
    void setSize(1);
  }, [debouncedSearch, gender, isIntern, setSize]);

  const patients = data?.flatMap((p) => resourcesOfType<Patient>(p.data, "Patient")) ?? [];
  const hasMore = data?.[data.length - 1]?.hasMore ?? false;
  const isLoadingMore = size > 0 && data && typeof data[size - 1] === "undefined";
  const errorMessage = error instanceof Error ? error.message : error ? "Erro inesperado." : null;

  function loadMore() {
    void setSize(size + 1);
  }

  // Sentinela de scroll infinito: dispara loadMore() quando entra na viewport
  // do container rolável, desde que não haja um carregamento em andamento e
  // ainda haja mais páginas.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { root: scrollRef.current },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoadingMore, isLoading, size]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={isIntern ? "Buscar paciente" : "Buscar por nome ou CPF"}
          className="sm:flex-1"
        />
        <Select
          value={gender || "all"}
          onValueChange={(value) => setGender(value === "all" ? "" : (value as Gender))}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="male">Masculino</SelectItem>
            <SelectItem value="female">Feminino</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : errorMessage ? (
        <ErrorState message={errorMessage} />
      ) : (
        <div
          ref={scrollRef}
          className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-13rem)]"
        >
          <p className="text-xs text-muted-foreground">
            <span className="font-data">{patients.length}</span> pacientes carregados
            {hasMore && " · há mais"}
          </p>

          {patients.map((patient) => (
            <Card
              key={patient.id}
              role="button"
              tabIndex={0}
              aria-selected={selectedId === patient.id}
              onClick={() => onSelect(patient.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(patient.id);
                }
              }}
              className={cn(
                "cursor-pointer border-l-4 border-l-transparent p-4 transition-shadow hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                selectedId === patient.id && "border-l-primary bg-primary/5",
              )}
            >
              <CardContent className="flex items-center gap-3 p-0">
                <div
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-data text-sm font-medium text-primary"
                >
                  {initials(patient.name?.[0]?.text)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{patient.name?.[0]?.text}</p>
                  <p className="font-data text-xs text-muted-foreground">
                    {formatDate(patient.birthDate)} · {patient.gender === "male" ? "Masculino" : "Feminino"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {patients.length === 0 &&
            (debouncedSearch.trim() || gender ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card/50 px-6 py-10 text-center">
                <Search className="size-6 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">Nenhum paciente encontrado</p>
                <p className="text-xs text-muted-foreground">
                  Tente ajustar sua busca ou filtro.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card/50 px-6 py-10 text-center">
                <UsersRound className="size-6 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">Nenhum paciente vinculado</p>
                <p className="text-xs text-muted-foreground">
                  Pacientes aparecerão aqui quando forem atribuídos a você.
                </p>
              </div>
            ))}

          {isLoadingMore &&
            [0, 1, 2].map((i) => <Skeleton key={`more-${i}`} className="h-16 w-full" />)}

          {!hasMore && patients.length > 50 && (
            <p className="text-xs text-muted-foreground">Todos os pacientes foram carregados.</p>
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

          <div ref={sentinelRef} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
