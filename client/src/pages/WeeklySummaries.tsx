import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Streamdown } from "streamdown";
import { ChevronLeft, ChevronRight, Download, Calendar, Home } from "lucide-react";
import { useLocation } from "wouter";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns";
import { fr } from "date-fns/locale";

export default function WeeklySummaries() {
  const [, setLocation] = useLocation();
  // L'authentification est gérée par DashboardLayout
  const isAuthorized = true;
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Monday
  });

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch weekly summaries
  const { data: summaries, isLoading } = trpc.surveillance.getWeeklySummaries.useQuery({
    limit: 50,
    offset: 0,
  });

  // Filter summaries by current week
  const currentWeekSummary = summaries?.find(
    (s) =>
      new Date(s.weekStartDate) <= currentWeekStart &&
      new Date(s.weekEndDate) >= weekEnd
  );

  // Fetch articles for current week
  const { data: weekArticles } = trpc.surveillance.getWeekArticles.useQuery(
    {
      weekStartDate: currentWeekStart.toISOString(),
      weekEndDate: weekEnd.toISOString(),
    },
    { enabled: !!currentWeekStart }
  );

  const filteredArticles = weekArticles?.filter((article) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.source.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const handleExportPDF = () => {
    if (!currentWeekSummary) return;

    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Synthèse ANINF</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    .header { text-align: center; margin-bottom: 40px; }
    .week-info { background: #f0f9ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .summary { background: #f9fafb; padding: 20px; border-left: 4px solid #1e40af; margin-bottom: 30px; line-height: 1.6; }
    .articles { margin-top: 30px; }
    .article { margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px; }
    .article-title { font-weight: bold; color: #1e40af; margin-bottom: 5px; }
    .article-meta { font-size: 12px; color: #666; margin-top: 8px; }
    .article-url { font-size: 12px; color: #0066cc; word-break: break-all; }
    .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Synthèse Hebdomadaire ANINF</h1>
    <div class="week-info">
      <p><strong>Période :</strong> ${format(currentWeekStart, "dd MMMM yyyy", { locale: fr })} - ${format(weekEnd, "dd MMMM yyyy", { locale: fr })}</p>
      <p><strong>Articles trouvés :</strong> ${currentWeekSummary.articlesCount}</p>
    </div>
  </div>

  <div class="summary">
    <h2>Résumé de la semaine</h2>
    <div>${currentWeekSummary.summary.replace(/\n/g, '<br>')}</div>
  </div>

  <div class="articles">
    <h2>Articles détaillés (${filteredArticles.length})</h2>
    ${filteredArticles.map((article) => `
      <div class="article">
        <div class="article-title">${article.title}</div>
        <div class="article-meta">
          <strong>📰 Source :</strong> ${article.source}
          ${article.publishedAt ? `<br><strong>📅 Publié :</strong> ${format(new Date(article.publishedAt), "dd MMMM yyyy", { locale: fr })}` : ''}
        </div>
        ${article.excerpt ? `<div style="margin-top: 8px; font-size: 13px;">${article.excerpt}</div>` : ''}
        <div class="article-url"><strong>URL :</strong> ${article.url}</div>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <p>Généré le ${format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}</p>
    <p>Agent de Veille ANINF</p>
  </div>
</body>
</html>
    `.trim();

    // Create blob and download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synthese-aninf-${format(currentWeekStart, "yyyy-MM-dd")}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Accueil
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Synthèses Hebdomadaires</h1>
          <p className="text-slate-600">Consultez les synthèses consolidées de chaque semaine</p>
        </div>

        {/* Week Navigation */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Semaine précédente
            </Button>

            <div className="flex items-center gap-3 text-center">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Semaine du</p>
                <p className="text-lg font-semibold text-slate-900">
                  {format(currentWeekStart, "dd MMMM", { locale: fr })} -{" "}
                  {format(weekEnd, "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="flex items-center gap-2"
            >
              Semaine suivante
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Summary Section */}
        {isLoading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
            <p className="mt-4 text-slate-600">Chargement des synthèses...</p>
          </Card>
        ) : currentWeekSummary ? (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="p-8 bg-white border-l-4 border-l-blue-600">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Résumé de la semaine</h2>
                <Button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Exporter en HTML
                </Button>
              </div>
              <Streamdown className="prose prose-sm max-w-none">
                {currentWeekSummary.summary}
              </Streamdown>
            </Card>

            {/* Articles Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Articles trouvés ({currentWeekSummary.articlesCount})
                </h2>
                <Input
                  placeholder="Rechercher par titre ou source..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {filteredArticles.length > 0 ? (
                <div className="grid gap-4">
                  {filteredArticles.map((article) => (
                    <Card key={article.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {article.title}
                          </a>
                          <p className="text-sm text-slate-600 mt-2">{article.excerpt}</p>
                          <div className="flex gap-4 mt-4 text-sm text-slate-500">
                            <span className="font-medium text-slate-700">
                              📰 {article.source}
                            </span>
                            {article.publishedAt && (
                              <span>
                                📅{" "}
                                {format(new Date(article.publishedAt), "dd MMMM yyyy", {
                                  locale: fr,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-slate-600">
                  <p>Aucun article trouvé pour cette recherche</p>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-slate-600 text-lg">
              Aucune synthèse disponible pour cette semaine
            </p>
            <p className="text-slate-500 mt-2">
              Les synthèses seront générées chaque dimanche à partir des articles trouvés
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
