# Agent de Veille ANINF

Une application web complète et élégante pour la veille automatisée sur l'ANINF (Agence Nationale de l'Informatique et de la Francophonie) avec agent IA, synthèses hebdomadaires, et envoi d'emails automatiques.

## 🎯 Fonctionnalités Principales

### 1. **Veille Automatisée**
- Recherche automatique d'articles sur l'ANINF à une heure configurée chaque jour
- Agent IA utilisant LLM pour analyser et résumer les articles trouvés
- Détection automatique des doublons via hash d'URL
- Stockage en base de données de tous les résultats

### 2. **Synthèses Hebdomadaires**
- Génération automatique chaque dimanche à 8h d'une synthèse consolidée
- Compilation de tous les articles trouvés durant la semaine
- Résumé intelligent généré par IA
- Navigation fluide entre les semaines avec filtrage et recherche

### 3. **Alertes Personnalisées**
- Configuration de mots-clés spécifiques pour filtrer les articles pertinents
- Gestion complète des mots-clés via interface dédiée
- Notifications uniquement sur les articles contenant les mots-clés configurés

### 4. **Abonnements Email**
- Configuration d'adresses email pour recevoir les synthèses hebdomadaires
- Envoi automatique chaque dimanche avec templates HTML élégants
- Gestion des abonnements via interface dédiée
- Suivi de l'historique d'envoi

### 5. **Dashboard Intuitif**
- Vue d'ensemble de la configuration et du statut
- Indicateurs de dernière exécution et prochaine exécution
- Historique complet des veilles avec résumés et sources
- Pages de détail pour consulter les articles complets

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 22.13.0+
- pnpm 10.4.1+
- Base de données MySQL/TiDB

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd aninf_surveillance_agent

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Initialiser la base de données
pnpm db:push

# Démarrer le serveur de développement
pnpm dev
```

### Configuration Requise

Avant de démarrer l'application, configurez les variables d'environnement suivantes :

#### Base de Données
- `DATABASE_URL` : Chaîne de connexion MySQL/TiDB

#### Authentification
- `JWT_SECRET` : Secret pour signer les cookies de session
- `VITE_APP_ID` : ID de l'application OAuth
- `OAUTH_SERVER_URL` : URL du serveur OAuth
- `VITE_OAUTH_PORTAL_URL` : URL du portail OAuth

#### API
- `BUILT_IN_FORGE_API_URL` : URL de l'API
- `BUILT_IN_FORGE_API_KEY` : Clé API (serveur)
- `VITE_FRONTEND_FORGE_API_KEY` : Clé API (frontend)
- `VITE_FRONTEND_FORGE_API_URL` : URL API (frontend)

#### Email (SMTP)
- `SMTP_HOST` : Serveur SMTP (ex: smtp.gmail.com)
- `SMTP_PORT` : Port SMTP (ex: 587)
- `SMTP_USER` : Nom d'utilisateur SMTP
- `SMTP_PASS` : Mot de passe SMTP
- `SMTP_FROM` : Adresse email d'envoi
- `SMTP_SECURE` : "true" pour TLS/SSL, "false" sinon

#### Application
- `APP_URL` : URL publique de l'application (pour les liens dans les emails)

## 📁 Structure du Projet

```
aninf_surveillance_agent/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Pages de l'application
│   │   ├── components/       # Composants réutilisables
│   │   ├── lib/              # Utilitaires et clients
│   │   └── App.tsx           # Routeur principal
│   └── public/               # Fichiers statiques
├── server/                    # Backend Express + tRPC
│   ├── db.ts                 # Helpers de base de données
│   ├── routers.ts            # Procédures tRPC
│   ├── scheduler.ts          # Scheduler pour veille quotidienne
│   ├── weekly-scheduler.ts   # Scheduler pour synthèses hebdomadaires
│   ├── surveillance-agent.ts # Agent IA de veille
│   ├── email.ts              # Service d'envoi d'emails
│   └── _core/                # Infrastructure (OAuth, contexte, etc.)
├── drizzle/                   # Migrations et schéma de base de données
│   └── schema.ts             # Définition des tables
└── shared/                    # Code partagé client/serveur
```

## 🗄️ Schéma de Base de Données

### Tables Principales

**users**
- Stocke les utilisateurs avec authentification OAuth
- Champs: id, openId, name, email, role, createdAt, updatedAt

**surveillance_config**
- Configuration de l'heure d'exécution quotidienne
- Champs: id, userId, executionHour, executionMinute, isActive, lastExecutedAt, nextExecutedAt

**surveillances**
- Résultats de chaque exécution de veille
- Champs: id, userId, executedAt, status, summary, articlesCount, errorMessage

**articles**
- Articles trouvés lors des veilles
- Champs: id, surveillanceId, userId, title, url, urlHash, source, excerpt, publishedAt, discoveredAt

**weekly_summaries**
- Synthèses hebdomadaires consolidées
- Champs: id, userId, weekStartDate, weekEndDate, summary, articlesCount, articlesIds

**alert_keywords**
- Mots-clés configurés par l'utilisateur pour filtrer les articles
- Champs: id, userId, keyword, isActive, createdAt

**email_subscriptions**
- Adresses email pour recevoir les synthèses hebdomadaires
- Champs: id, userId, email, isActive, lastEmailSentAt, createdAt, updatedAt

## 🔄 Flux de Travail

### Veille Quotidienne
1. À l'heure configurée, le scheduler déclenche la veille
2. L'agent IA recherche les articles récents sur l'ANINF
3. Les articles sont filtrés pour éviter les doublons (via urlHash)
4. Un résumé est généré par IA
5. Les résultats sont stockés en base de données
6. Une notification est envoyée au propriétaire

### Synthèse Hebdomadaire
1. Chaque dimanche à 8h, le scheduler génère une synthèse
2. Tous les articles de la semaine sont compilés
3. Un résumé consolidé est généré par IA
4. La synthèse est stockée en base de données
5. Les emails sont envoyés à tous les abonnés
6. La date d'envoi est mise à jour pour chaque abonné

## 🧪 Tests

Le projet inclut une suite de tests vitest couvrant les fonctionnalités critiques :

```bash
# Exécuter tous les tests
pnpm test

# Exécuter les tests en mode watch
pnpm test --watch

# Exécuter les tests avec couverture
pnpm test --coverage
```

### Fichiers de Test
- `server/surveillance.test.ts` - Tests du système de veille
- `server/surveillance-integration.test.ts` - Tests d'intégration
- `server/auth.logout.test.ts` - Tests d'authentification

## 🔧 Commandes Disponibles

```bash
# Développement
pnpm dev              # Démarrer le serveur de développement
pnpm build            # Compiler pour la production
pnpm start            # Démarrer le serveur de production

# Base de données
pnpm db:push          # Appliquer les migrations Drizzle
pnpm db:studio        # Ouvrir Drizzle Studio

# Tests et qualité
pnpm test             # Exécuter les tests
pnpm check            # Vérifier les types TypeScript
pnpm format           # Formater le code avec Prettier

# Build
pnpm build            # Compiler le projet
```

## 📊 API tRPC

### Surveillance
- `surveillance.getConfig()` - Récupérer la configuration
- `surveillance.updateConfig(hour, minute)` - Mettre à jour l'heure
- `surveillance.getHistory(limit, offset)` - Historique des veilles
- `surveillance.getDetail(id)` - Détail d'une veille
- `surveillance.getLatest()` - Dernière veille
- `surveillance.triggerNow()` - Déclencher manuellement
- `surveillance.getWeeklySummaries(limit, offset)` - Synthèses hebdomadaires
- `surveillance.getWeekArticles(weekStart, weekEnd)` - Articles d'une semaine

### Alertes
- `alerts.addKeyword(keyword)` - Ajouter un mot-clé
- `alerts.getKeywords()` - Récupérer les mots-clés
- `alerts.deleteKeyword(keywordId)` - Supprimer un mot-clé

### Email
- `email.subscribe(email)` - S'abonner
- `email.getSubscriptions()` - Récupérer les abonnements
- `email.unsubscribe(subscriptionId)` - Se désabonner
- `email.sendTest(email)` - Envoyer un email de test

### Scheduler
- `scheduler.triggerWeeklySummary()` - Déclencher la synthèse hebdomadaire

## 🎨 Design et UX

L'application utilise :
- **React 19** pour l'interface utilisateur
- **Tailwind CSS 4** pour le styling responsive
- **shadcn/ui** pour les composants d'interface
- **Lucide React** pour les icônes
- **Framer Motion** pour les animations

## 🔐 Sécurité

- Authentification OAuth intégrée
- Gestion des sessions via cookies sécurisés
- Procédures tRPC protégées pour les opérations sensibles
- Validation des entrées avec Zod
- Variables d'environnement pour les secrets

## 📝 Notes de Développement

### Mode Démo
L'application fonctionne actuellement en mode démo (DEMO_MODE = true), ce qui signifie :
- Pas d'authentification requise
- Utilisation d'un ID utilisateur fixe (userId = 1)
- Accès complet à toutes les fonctionnalités

Pour activer l'authentification OAuth en production, modifiez `DEMO_MODE` dans `server/routers.ts`.

### Gestion des Erreurs
- Les erreurs sont loggées avec des préfixes ([Email], [Scheduler], etc.)
- Les erreurs critiques sont propagées à l'utilisateur
- Les erreurs non critiques sont loggées mais ne bloquent pas le flux

### Performance
- Utilisation de requêtes optimisées avec Drizzle ORM
- Caching des configurations utilisateur
- Pagination pour l'historique des veilles
- Lazy loading des pages

## 🚀 Déploiement

### Prérequis de Production
1. Base de données MySQL/TiDB en production
2. Service SMTP configuré (Gmail, SendGrid, etc.)
3. Variables d'environnement configurées
4. Certificat SSL/TLS pour HTTPS

### Étapes de Déploiement
1. Builder l'application avec `pnpm build`
2. Déployer sur votre hébergeur (VPS, cloud, etc.)
3. Configurer le domaine personnalisé si nécessaire
4. Vérifier les logs de déploiement

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs dans `.debug-logs/`
2. Vérifiez la configuration des variables d'environnement
3. Exécutez les tests pour valider l'intégrité du système

## 📄 Licence

MIT

---

**Dernière mise à jour** : 28 février 2026
**Version** : 1.0.0
**Statut** : Production Ready
