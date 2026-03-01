import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Home, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AlertSettings() {
  const [, setLocation] = useLocation();
  const [newKeyword, setNewKeyword] = useState("");

  // Fetch alert keywords
  const { data: keywords, refetch } = trpc.alerts.getKeywords.useQuery();

  // Mutations
  const addKeywordMutation = trpc.alerts.addKeyword.useMutation({
    onSuccess: () => {
      setNewKeyword("");
      refetch();
      toast.success("Mot-clé ajouté avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const deleteKeywordMutation = trpc.alerts.deleteKeyword.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Mot-clé supprimé");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) {
      toast.error("Veuillez entrer un mot-clé");
      return;
    }
    addKeywordMutation.mutate({ keyword: newKeyword });
  };

  const handleDeleteKeyword = (keywordId: number) => {
    deleteKeywordMutation.mutate({ keywordId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Alertes Personnalisées</h1>
          <p className="text-slate-600">
            Configurez les mots-clés pour filtrer les articles pertinents
          </p>
        </div>

        {/* Add Keyword Form */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Ajouter un mot-clé</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: cybersécurité, transformation digitale..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddKeyword();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleAddKeyword}
              disabled={addKeywordMutation.isPending}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </div>
        </Card>

        {/* Keywords List */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Mots-clés actifs ({keywords?.length || 0})
          </h2>

          {keywords && keywords.length > 0 ? (
            <div className="space-y-3">
              {keywords.map((keyword) => (
                <div
                  key={keyword.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{keyword.keyword}</p>
                    <p className="text-xs text-slate-500">
                      Ajouté le{" "}
                      {new Date(keyword.createdAt).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteKeyword(keyword.id)}
                    disabled={deleteKeywordMutation.isPending}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600">Aucun mot-clé configuré</p>
              <p className="text-sm text-slate-500 mt-2">
                Ajoutez des mots-clés pour filtrer les articles pertinents
              </p>
            </div>
          )}
        </Card>

        {/* Info Section */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-slate-900 mb-2">💡 Comment ça marche ?</h3>
          <p className="text-sm text-slate-700">
            Les mots-clés que vous configurez ici seront utilisés pour filtrer les articles
            trouvés lors de la veille. Seuls les articles contenant au moins un de vos mots-clés
            recevront une notification. Vous pouvez ajouter plusieurs mots-clés pour affiner votre
            recherche.
          </p>
        </Card>
      </div>
    </div>
  );
}
