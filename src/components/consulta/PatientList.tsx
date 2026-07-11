import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/useAuth";
import { api } from "@/lib/api";
import { resourcesOfType, type Patient } from "@/lib/fhir";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

type Gender = "" | "male" | "female";

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

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<Gender>("");

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const generationRef = useRef(0);

  const fetchPage = isIntern ? api.supervisedPatients : api.doctorPatients;

  // Debounce: só propaga o valor digitado para `search` (e portanto para a API)
  // 350ms após o usuário parar de digitar, mantendo a taxa de requisições bem
  // abaixo do rate limit do gateway (10 rps / burst 20).
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    generationRef.current += 1;
    setIsLoading(true);
    setError(null);

    fetchPage(1, PAGE_SIZE, search, gender)
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
  }, [isIntern, search, gender]);

  async function loadMore() {
    const generation = generationRef.current;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { data, hasMore: more } = await fetchPage(nextPage, PAGE_SIZE, search, gender);
      if (generation !== generationRef.current) return;
      setPatients((prev) => [...prev, ...resourcesOfType<Patient>(data, "Patient")]);
      setPage(nextPage);
      setHasMore(more);
    } catch (err) {
      if (generation !== generationRef.current) return;
      toast.error(err instanceof Error ? err.message : "Falha ao carregar mais pacientes.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Sentinela de scroll infinito: dispara loadMore() quando entra na viewport,
  // desde que não haja um carregamento em andamento e ainda haja mais páginas.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isLoading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
        void loadMore();
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoadingMore, isLoading, page, search, gender]);

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
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            <span className="font-data">{patients.length}</span> pacientes carregados
            {hasMore && " · há mais"}
          </p>

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
        </>
      )}
    </div>
  );
}
