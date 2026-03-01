import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Settings() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDemoMode] = useState(false); // OAuth enabled

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isDemoMode && !isAuthenticated) {
      const loginUrl = getLoginUrl();
      window.location.href = loginUrl;
    }
  }, [isAuthenticated, isDemoMode]);

  // Fetch current configuration
  const isAuthorized = isDemoMode || isAuthenticated;
  const configQuery = trpc.surveillance.getConfig.useQuery(undefined, {
    enabled: isAuthorized,
  });

  // Update configuration mutation
  const updateMutation = trpc.surveillance.updateConfig.useMutation({
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      configQuery.refetch();
      toast.success("Configuration mise à jour avec succès");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  // Load current config into form
  useEffect(() => {
    if (configQuery.data) {
      setHour(String(configQuery.data.executionHour).padStart(2, "0"));
      setMinute(String(configQuery.data.executionMinute).padStart(2, "0"));
    }
  }, [configQuery.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(hour);
    const m = parseInt(minute);

    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      toast.error("Heure invalide");
      return;
    }

    updateMutation.mutate({
      executionHour: h,
      executionMinute: m,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="container max-w-2xl">
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuration de la veille</h1>
          <p className="text-muted-foreground">Définissez l'heure à laquelle la veille s'exécutera chaque jour</p>
        </div>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Heure d'exécution quotidienne</CardTitle>
            <CardDescription>
              La veille ANINF s'exécutera automatiquement à l'heure configurée chaque jour
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Time Input */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hour">Heure (0-23)</Label>
                      <Input
                        id="hour"
                        type="number"
                        min="0"
                        max="23"
                        value={hour}
                        onChange={(e) => setHour(e.target.value.padStart(2, "0"))}
                        className="text-center text-lg font-semibold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minute">Minute (0-59)</Label>
                      <Input
                        id="minute"
                        type="number"
                        min="0"
                        max="59"
                        value={minute}
                        onChange={(e) => setMinute(e.target.value.padStart(2, "0"))}
                        className="text-center text-lg font-semibold"
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="p-4 rounded-lg bg-accent/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Heure d'exécution</p>
                    <p className="text-4xl font-bold text-foreground">
                      {hour}:{minute}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Chaque jour à cette heure, la veille s'exécutera automatiquement
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Note :</strong> La veille recherchera les articles récents sur l'ANINF, les résumera avec l'IA, et vous enverra une notification.
                  </p>
                </div>

                {/* Success Message */}
                {showSuccess && (
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-900 dark:text-green-100">
                      Configuration mise à jour avec succès !
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Mise à jour en cours...
                    </>
                  ) : (
                    "Enregistrer la configuration"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/alert-settings")}>
            <h3 className="font-bold text-slate-900 mb-2">🔔 Alertes Personnalisées</h3>
            <p className="text-sm text-slate-600">Configurez les mots-clés pour filtrer les articles pertinents</p>
          </Card>
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/email-settings")}>
            <h3 className="font-bold text-slate-900 mb-2">📧 Abonnements Email</h3>
            <p className="text-sm text-slate-600">Recevez les synthèses hebdomadaires par email</p>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Comment ça fonctionne ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Configuration</p>
                  <p className="text-sm text-muted-foreground">
                    Définissez l'heure à laquelle vous souhaitez que la veille s'exécute
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Exécution automatique</p>
                  <p className="text-sm text-muted-foreground">
                    Chaque jour à l'heure configurée, l'agent recherche les articles récents sur l'ANINF
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Analyse et résumé</p>
                  <p className="text-sm text-muted-foreground">
                    L'IA analyse les articles trouvés et génère un résumé complet avec les sources
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                  4
                </div>
                <div>
                  <p className="font-medium text-foreground">Notification et historique</p>
                  <p className="text-sm text-muted-foreground">
                    Vous recevez une notification et les résultats sont sauvegardés dans l'historique
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
