import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, ExternalLink, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Streamdown } from "streamdown";
import { useState } from "react";

export default function SurveillanceDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/surveillance/:id");
  const surveillanceId = params?.id ? parseInt(params.id) : null;
  const [isDemoMode] = useState(true);

  // Fetch surveillance detail
  const detailQuery = trpc.surveillance.getDetail.useQuery(
    { id: surveillanceId! },
    { enabled: isDemoMode && surveillanceId !== null }
  );

  if (!surveillanceId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
        <div className="container max-w-4xl">
          <p className="text-muted-foreground">Veille non trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </div>

        {detailQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : detailQuery.error ? (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p>{detailQuery.error.message}</p>
              </div>
            </CardContent>
          </Card>
        ) : detailQuery.data ? (
          <>
            {/* Title and Status */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">Résumé de veille</h1>
                  <p className="text-muted-foreground">
                    {format(new Date(detailQuery.data.executedAt), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {detailQuery.data.status === "success" ? (
                    <Badge className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Succès
                    </Badge>
                  ) : detailQuery.data.status === "failed" ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Échoué
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Partiel
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Résumé de la veille</CardTitle>
                    <CardDescription>Analyse IA des articles trouvés</CardDescription>
                  </div>
                  <Badge variant="outline">{detailQuery.data.articlesCount} articles</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <Streamdown>{detailQuery.data.summary}</Streamdown>
                </div>
              </CardContent>
            </Card>

            {/* Articles List */}
            {detailQuery.data.articles && detailQuery.data.articles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Articles trouvés</CardTitle>
                  <CardDescription>
                    {detailQuery.data.articles.length} article{detailQuery.data.articles.length > 1 ? "s" : ""} découvert{detailQuery.data.articles.length > 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {detailQuery.data.articles.map((article, index) => (
                      <div
                        key={article.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                {index + 1}
                              </span>
                              <h3 className="font-semibold text-foreground line-clamp-2">
                                {article.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {article.source}
                              </Badge>
                              {article.publishedAt && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: fr })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <Button variant="ghost" size="sm" className="gap-2">
                              <ExternalLink className="w-4 h-4" />
                              Lire
                            </Button>
                          </a>
                        </div>
                        {article.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {article.excerpt}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Articles */}
            {(!detailQuery.data.articles || detailQuery.data.articles.length === 0) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aucun article trouvé lors de cette veille</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {detailQuery.data.status === "failed" && detailQuery.data.errorMessage && (
              <Card className="mt-8 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Erreur lors de l'exécution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 dark:text-red-300 font-mono bg-red-100 dark:bg-red-900 p-3 rounded">
                    {detailQuery.data.errorMessage}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-sm">Informations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Date d'exécution</p>
                    <p className="font-medium text-foreground">
                      {format(new Date(detailQuery.data.executedAt), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Statut</p>
                    <p className="font-medium text-foreground capitalize">
                      {detailQuery.data.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Articles trouvés</p>
                    <p className="font-medium text-foreground">
                      {detailQuery.data.articlesCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">ID</p>
                    <p className="font-medium text-foreground font-mono text-xs">
                      {detailQuery.data.id}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
