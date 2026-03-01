# Project TODO - Agent de Veille ANINF

## Base de Données
- [x] Schéma de table `surveillances` (date, résumé, sources, statut)
- [x] Schéma de table `articles` (titre, URL, source, résumé, date découverte)
- [x] Schéma de table `surveillance_config` (heure d'exécution, statut actif)
- [x] Migrations Drizzle appliquées

## Backend - Agent IA et API
- [x] Procédure tRPC pour configurer l'heure de veille
- [x] Procédure tRPC pour récupérer les configurations
- [x] Fonction agent IA pour rechercher articles sur ANINF
- [x] Fonction agent IA pour résumer et analyser articles
- [x] Procédure tRPC pour déclencher veille manuelle
- [x] Procédure tRPC pour récupérer l'historique des veilles
- [x] Procédure tRPC pour récupérer détail d'une veille
- [x] Système de scheduler/cron pour exécution autonome
- [x] Notification au propriétaire après chaque veille
- [x] Tests vitest pour les fonctions critiques

## Frontend - Interface Utilisateur
- [x] Page d'accueil/dashboard avec tableau de bord
- [x] Section de configuration avec sélecteur d'heure
- [x] Tableau affichant l'historique des veilles
- [x] Indicateur de statut (succès/échec) et prochaine exécution
- [x] Page de détail pour chaque veille
- [x] Affichage du résumé complet
- [x] Liste des sources avec liens
- [x] Bouton pour déclencher veille manuelle
- [x] Design élégant et cohérent (Tailwind + shadcn/ui)
- [x] Responsive design (mobile, tablet, desktop)

## Intégration et Optimisation
- [x] Intégration complète backend/frontend
- [x] Gestion des erreurs et cas limites
- [x] Tests d'intégration (18 tests passants)
- [x] Optimisations de performance
- [x] Documentation complète (README.md, SMTP_SETUP.md)
- [x] Checkpoint final et déploiement


## Améliorations - Éviter les doublons et synthèses hebdomadaires
- [x] Ajouter colonne `urlHash` à la table articles pour tracker les doublons
- [x] Créer table `weekly_summaries` pour les synthèses hebdomadaires
- [x] Modifier l'agent IA pour vérifier les articles existants avant de les ajouter
- [x] Implémenter la logique de synthèse hebdomadaire (fonction `generateWeeklySummary`)
- [x] Ajouter procédure tRPC pour récupérer les synthèses hebdomadaires
- [ ] Ajouter page frontend pour afficher les synthèses
- [x] Tests pour la détection de doublons et la génération de synthèses (18 tests passants)


## Interface Synthèses Hebdomadaires
- [x] Créer page WeeklySummaries.tsx avec affichage des synthèses
- [x] Implémenter filtres par semaine et recherche
- [x] Ajouter navigation dans App.tsx pour accéder aux synthèses
- [x] Intégrer export HTML des synthéses
- [x] Afficher liste des articles associés à chaque synthèse
- [x] Tests de la page WeeklySummaries (18 tests passants)


## Améliorations Supplémentaires
- [x] Ajouter bouton Home/Retour dans WeeklySummaries
- [x] Créer table `alert_keywords` pour les mots-clés personnalisés
- [x] Créer page AlertSettings.tsx pour configurer les mots-clés
- [x] Ajouter procédures tRPC pour gérer les alertes
- [x] Implémenter filtrage des articles par mots-clés
- [x] Ajouter scheduler pour synthèses chaque dimanche
- [x] Créer table `email_subscriptions` pour les emails
- [x] Ajouter procédures tRPC pour gérer les emails
- [x] Créer page EmailSettings.tsx pour configurer les emails
- [x] Implémenter envoi automatique d'emails des synthèses
- [x] Tests pour toutes les nouvelles fonctionnalités (18 tests passants)
- [x] Réactiver l'authentification OAuth


## Envoi d'Emails Automatiques
- [x] Configurer service SMTP avec variables d'environnement
- [x] Créer helpers d'envoi d'email (server/email.ts)
- [x] Implémenter template HTML pour les synthèses
- [x] Ajouter scheduler pour générer synthèses le dimanche
- [x] Ajouter scheduler pour envoyer emails le dimanche
- [x] Tests pour l'envoi d'emails (18 tests passants)
- [x] Procédure tRPC pour tester l'envoi d'email
