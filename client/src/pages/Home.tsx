import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Settings, ExternalLink, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Streamdown } from "streamdown";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // L'authentification est gérée par DashboardLayout — user est toujours défini ici
  const isAuthorized = Boolean(user);

  // Fetch surveillance configuration
  const configQuery = trpc.surveillance.getConfig.useQuery(undefined, {
    enabled: isAuthorized,
  });

  // Fetch surveillance history
  const historyQuery = trpc.surveillance.getHistory.useQuery(
    { limit: 10, offset: 0 },
    { enabled: isAuthorized }
  );

  // Fetch latest surveillance
  const latestQuery = trpc.surveillance.getLatest.useQuery(undefined, {
    enabled: isAuthorized,
  });

  // Trigger surveillance mutation
  const triggerMutation = trpc.surveillance.triggerNow.useMutation({
    onSuccess: () => {
      historyQuery.refetch();
      latestQuery.refetch();
    },
  });

  const config = configQuery.data;
  const latest = latestQuery.data;
  const history = historyQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-foreground">Agent de Veille ANINF</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/weekly-summaries")}
                className="gap-2"
              >
                📊 Synthèses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/settings")}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Configuration
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">Surveillance automatisée des articles et actualités sur l'ANINF</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Configuration Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {configQuery.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Chargement...</span>
                </div>
              ) : config ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium">Planifiée</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {String(config.executionHour).padStart(2, "0")}:{String(config.executionMinute).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-muted-foreground">Heure d'exécution quotidienne</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium">Non configurée</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Cliquez sur Configuration pour définir l'heure</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Last Execution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Dernière exécution</CardTitle>
            </CardHeader>
            <CardContent>
              {latestQuery.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Chargement...</span>
                </div>
              ) : latest ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {latest.status === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : latest.status === "failed" ? (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                    <span className="text-sm font-medium capitalize">{latest.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(latest.executedAt), { addSuffix: true, locale: fr })}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{latest.articlesCount} articles</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Aucune exécution</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Aucune veille n'a encore été exécutée</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Execution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Prochaine exécution</CardTitle>
            </CardHeader>
            <CardContent>
              {config ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium">Planifiée</span>
                  </div>
                  {config.nextExecutedAt ? (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(config.nextExecutedAt), { addSuffix: true, locale: fr })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">À calculer</p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 gap-2"
                    onClick={() => triggerMutation.mutate()}
                    disabled={triggerMutation.isPending}
                  >
                    {triggerMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exécution...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Exécuter maintenant
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium">Non planifiée</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Configurez d'abord l'heure d'exécution</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Latest Surveillance Detail */}
        {latest && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Dernier résumé de veille</CardTitle>
                  <CardDescription>
                    Exécutée {formatDistanceToNow(new Date(latest.executedAt), { addSuffix: true, locale: fr })}
                  </CardDescription>
                </div>
                <Badge variant={latest.status === "success" ? "default" : "secondary"}>
                  {latest.articlesCount} articles
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <Streamdown>{latest.summary}</Streamdown>
              </div>
              <Button
                variant="outline"
                onClick={() => setLocation(`/surveillance/${latest.id}`)}
                className="gap-2"
              >
                Voir les détails
                <ExternalLink className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des veilles</CardTitle>
            <CardDescription>Dernières exécutions de la veille ANINF</CardDescription>
          </CardHeader>
          <CardContent>
            {historyQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucune veille enregistrée pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((surveillance) => (
                  <div
                    key={surveillance.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/surveillance/${surveillance.id}`)}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {surveillance.status === "success" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : surveillance.status === "failed" ? (
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {formatDistanceToNow(new Date(surveillance.executedAt), { addSuffix: true, locale: fr })}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {surveillance.summary.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="outline">{surveillance.articlesCount} articles</Badge>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
