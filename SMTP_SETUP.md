# Configuration SMTP pour l'Envoi d'Emails

Ce document explique comment configurer le service SMTP pour l'envoi automatique des synthèses hebdomadaires.

## Variables d'Environnement Requises

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@example.com
SMTP_SECURE=false
APP_URL=https://your-domain.com
```

## Configuration par Fournisseur

### Gmail

1. **Activer l'authentification 2FA** sur votre compte Google
2. **Créer un mot de passe d'application** :
   - Aller à https://myaccount.google.com/apppasswords
   - Sélectionner "Mail" et "Windows Computer"
   - Copier le mot de passe généré

3. **Configuration** :
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=your-email@gmail.com
   SMTP_SECURE=false
   ```

### Outlook/Office 365

```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com
SMTP_SECURE=false
```

### SendGrid

1. **Créer une clé API** sur https://app.sendgrid.com/settings/api_keys
2. **Configuration** :
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   SMTP_FROM=noreply@your-domain.com
   SMTP_SECURE=false
   ```

### AWS SES (Simple Email Service)

1. **Vérifier le domaine** dans AWS SES
2. **Créer les credentials SMTP** dans AWS SES
3. **Configuration** :
   ```
   SMTP_HOST=email-smtp.region.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-ses-username
   SMTP_PASS=your-ses-password
   SMTP_FROM=noreply@your-verified-domain.com
   SMTP_SECURE=false
   ```

## Test de Configuration

Pour tester votre configuration SMTP, utilisez la procédure tRPC :

```typescript
// Frontend
const { mutate: sendTest } = trpc.email.sendTest.useMutation();

// Envoyer un email de test
sendTest({ email: "test@example.com" });
```

Vous devriez recevoir un email de test dans quelques secondes.

## Dépannage

### Email non reçu
- Vérifier que SMTP_HOST et SMTP_PORT sont corrects
- Vérifier que SMTP_USER et SMTP_PASS sont valides
- Vérifier que le domaine d'envoi (SMTP_FROM) est autorisé
- Consulter les logs du serveur pour les erreurs SMTP

### Erreur d'authentification
- Vérifier le mot de passe SMTP (certains services utilisent des mots de passe d'application)
- Vérifier que l'authentification 2FA est activée si nécessaire
- Vérifier que le compte a les permissions d'envoi d'email

### Emails en spam
- Configurer les enregistrements SPF, DKIM et DMARC pour votre domaine
- Utiliser une adresse SMTP_FROM qui correspond à votre domaine
- Inclure un lien de désinscription dans les emails

## Logs

Les logs d'envoi d'email se trouvent dans `.debug-logs/devserver.log` :

```
[Email] Email sent successfully to user@example.com
[Email] Failed to send email to user@example.com: Connection timeout
```

## Sécurité

- **Ne jamais** commiter les mots de passe SMTP dans le code
- Utiliser des variables d'environnement pour tous les secrets
- Utiliser SMTP_SECURE=true pour les connexions TLS/SSL (port 465)
- Utiliser SMTP_SECURE=false pour les connexions STARTTLS (port 587)
- Régulièrement changer les mots de passe d'application

## Limites et Quotas

Vérifier les limites de votre fournisseur SMTP :

| Fournisseur | Limite Quotidienne | Limite Horaire |
|------------|------------------|-----------------|
| Gmail | 500 emails | N/A |
| Outlook | 10,000 emails | N/A |
| SendGrid | Selon plan | Selon plan |
| AWS SES | 50,000 emails | 14 emails/sec |

## Support

Pour plus d'informations :
- Gmail : https://support.google.com/mail/answer/185833
- Outlook : https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b678-5385dda36160
- SendGrid : https://sendgrid.com/docs/for-developers/sending-email/integrations/
- AWS SES : https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html
