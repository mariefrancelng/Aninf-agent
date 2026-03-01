import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Home, Plus, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";

export default function EmailSettings() {
  const [, setLocation] = useLocation();
  const [newEmail, setNewEmail] = useState("");

  // Fetch email subscriptions
  const { data: subscriptions, refetch } = trpc.email.getSubscriptions.useQuery();

  // Mutations
  const subscribeMutation = trpc.email.subscribe.useMutation({
    onSuccess: () => {
      setNewEmail("");
      refetch();
      toast.success("Email ajouté avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const unsubscribeMutation = trpc.email.unsubscribe.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Email supprimé");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const handleAddEmail = () => {
    if (!newEmail.trim()) {
      toast.error("Veuillez entrer une adresse email");
      return;
    }
    subscribeMutation.mutate({ email: newEmail });
  };

  const handleRemoveEmail = (subscriptionId: number) => {
    unsubscribeMutation.mutate({ subscriptionId });
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Abonnements Email</h1>
          <p className="text-slate-600">
            Recevez les synthèses hebdomadaires par email
          </p>
        </div>

        {/* Add Email Form */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Ajouter une adresse email</h2>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="exemple@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddEmail();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleAddEmail}
              disabled={subscribeMutation.isPending}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </div>
        </Card>

        {/* Email List */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Adresses abonnées ({subscriptions?.length || 0})
          </h2>

          {subscriptions && subscriptions.length > 0 ? (
            <div className="space-y-3">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">{subscription.email}</p>
                      <p className="text-xs text-slate-500">
                        {subscription.lastEmailSentAt
                          ? `Dernier email: ${new Date(subscription.lastEmailSentAt).toLocaleDateString(
                              "fr-FR"
                            )}`
                          : "Aucun email envoyé"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveEmail(subscription.id)}
                    disabled={unsubscribeMutation.isPending}
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
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucune adresse email configurée</p>
              <p className="text-sm text-slate-500 mt-2">
                Ajoutez une adresse email pour recevoir les synthèses hebdomadaires
              </p>
            </div>
          )}
        </Card>

        {/* Info Section */}
        <Card className="p-6 mt-8 bg-green-50 border-green-200">
          <h3 className="font-bold text-slate-900 mb-2">📧 Synthèses par email</h3>
          <p className="text-sm text-slate-700 mb-3">
            Chaque dimanche, une synthèse consolidée de tous les articles trouvés durant la
            semaine sera envoyée à vos adresses email.
          </p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>Résumé complet des activités ANINF</li>
            <li>Liste de tous les articles trouvés</li>
            <li>Liens directs vers les sources</li>
            <li>Format HTML facile à lire</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
