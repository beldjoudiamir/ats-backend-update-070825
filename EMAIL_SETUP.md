# Configuration Email - ATS Transport

## 📧 Configuration Gmail

Pour que les fonctionnalités d'envoi d'email fonctionnent (mot de passe oublié, messages de contact et notifications de devis), vous devez configurer un compte Gmail.

### 1. Créer un fichier .env

Créez un fichier `.env` dans le dossier `backEnd/` avec le contenu suivant :

```env
# Configuration Email
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app

# Clé secrète JWT
JWT_SECRET=votre-cle-secrete-jwt

# Configuration MongoDB
MONGODB_URI=mongodb://localhost:27017/ats_database
```

### 2. Configurer Gmail

#### Option A : Utiliser un mot de passe d'application (Recommandé)

1. **Activez l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générez un mot de passe d'application** :
   - Allez dans les paramètres de votre compte Google
   - Sécurité → Authentification à 2 facteurs
   - Mots de passe d'application
   - Générez un nouveau mot de passe pour "Mail"
3. **Utilisez ce mot de passe** dans `EMAIL_PASS`

#### Option B : Autoriser les applications moins sécurisées (Non recommandé)

⚠️ **Attention** : Cette option est moins sécurisée et peut ne plus fonctionner.

### 3. Fonctionnalités Email

#### ✅ Mot de passe oublié
- **Vérification d'email** : Le système vérifie si l'email existe dans la base de données
- **Génération de mot de passe** : Un nouveau mot de passe sécurisé est généré automatiquement
- **Envoi d'email** : Un email avec le nouveau mot de passe est envoyé
- **Mise à jour en base** : Le nouveau mot de passe est sauvegardé dans la base de données

#### ✅ Messages de contact
- **Formulaire de contact** : Les visiteurs peuvent envoyer des messages depuis la page contact
- **Sauvegarde en base** : Tous les messages sont sauvegardés dans la collection `receivedMessage`
- **Notification email** : L'administrateur reçoit un email de notification pour chaque nouveau message
- **Dashboard messagerie** : Tous les messages sont visibles dans le dashboard avec tri et indicateurs

#### ✅ Notifications de devis
- **Création de devis** : Email de notification détaillé lors de la création d'un nouveau devis
- **Mise à jour de statut** : Email de notification quand le statut d'un devis change
- **Informations complètes** : L'email contient tous les détails du devis (client, articles, montants, etc.)
- **Liens cliquables** : Email et téléphone du client directement cliquables

### 4. Test des fonctionnalités

#### Test du mot de passe oublié :
1. **Démarrer le backend** : `yarn dev`
2. **Aller sur la page de connexion** : `/connexion`
3. **Cliquer sur "Mot de passe oublié ?"**
4. **Entrer un email existant** dans votre base de données

#### Test des messages de contact :
1. **Démarrer le backend** : `yarn dev`
2. **Aller sur la page de contact** : `/contact`
3. **Remplir et envoyer le formulaire**
4. **Vérifier dans le dashboard** : `/dashboard/messagerie`
5. **Vérifier l'email de notification** reçu par l'administrateur

#### Test des notifications de devis :
1. **Démarrer le backend** : `yarn dev`
2. **Se connecter au dashboard** : `/dashboard`
3. **Aller dans "Nos Devis"** et créer un nouveau devis
4. **Vérifier l'email de notification** reçu par l'administrateur
5. **Modifier le statut d'un devis** et vérifier l'email de mise à jour

### 5. Contenu des emails de devis

#### Email de création de devis :
- Numéro de devis et statut
- Informations du client/transporteur/commissionnaire
- Itinéraire (départ/arrivée)
- Liste détaillée des articles avec prix
- Totaux HT, TVA et TTC
- Message associé (si présent)

#### Email de mise à jour de statut :
- Numéro de devis
- Ancien et nouveau statut
- Informations du partenaire
- Montants du devis
- Date de mise à jour

### 6. Sécurité

- Le mot de passe généré contient : lettres minuscules, majuscules, chiffres et caractères spéciaux
- Le mot de passe est hashé avant d'être sauvegardé en base
- L'email contient des instructions pour changer le mot de passe après connexion
- Les messages de contact sont validés côté serveur
- Protection contre les injections et attaques XSS
- Validation des données de devis avant envoi d'email

### 7. Dashboard Messagerie

Le dashboard de messagerie inclut :
- **Tri par date** : Plus récents ou plus anciens
- **Indicateurs visuels** : Messages récents (moins de 24h) mis en évidence
- **Liens cliquables** : Email et téléphone directement cliquables
- **Compteurs** : Nombre de messages par catégorie
- **Actions** : Suppression des messages avec confirmation
- **Actualisation** : Bouton pour rafraîchir les données

### 8. Dépannage

#### Erreur "Invalid login" :
- Vérifiez que `EMAIL_USER` et `EMAIL_PASS` sont corrects
- Assurez-vous que l'authentification à 2 facteurs est activée
- Utilisez un mot de passe d'application, pas votre mot de passe principal

#### Email non reçu :
- Vérifiez vos spams
- Vérifiez que l'email de destination est correct
- Vérifiez les logs du serveur pour les erreurs

#### Erreur "Email non inscrit" :
- L'email n'existe pas dans votre base de données utilisateurs
- Ajoutez d'abord l'utilisateur via l'interface d'administration

#### Messages de contact non reçus :
- Vérifiez que le backend est démarré
- Vérifiez les logs du serveur pour les erreurs
- Vérifiez la configuration email dans le fichier `.env`

#### Notifications de devis non reçues :
- Vérifiez que le backend est démarré
- Vérifiez les logs du serveur pour les erreurs
- Vérifiez que les devis contiennent les champs requis (totalHT)
- Vérifiez la configuration email dans le fichier `.env`

### 9. Structure des données

#### Collection `receivedMessage` :
```json
{
  "name": "Nom du client",
  "email": "email@client.com",
  "phone": "+33123456789",
  "message": "Contenu du message",
  "date": "2024-01-01T12:00:00.000Z"
}
```

#### Collection `estimate` (devis) :
```json
{
  "devisID": "DEV-2024-001",
  "client": { "name": "Nom client", "email": "email@client.com" },
  "items": [
    { "description": "Service transport", "quantity": 1, "price": 100 }
  ],
  "totalHT": 100,
  "tvaRate": 20,
  "tva": 20,
  "totalTTC": 120,
  "status": "Brouillon",
  "date": "2024-01-01T12:00:00.000Z"
}
```

#### Collection `users` :
```json
{
  "name": "Nom utilisateur",
  "mail": "email@user.com",
  "password": "mot_de_passe_hashé",
  "role": "admin|user"
}
``` 