# API de gestion des tâches

Ce guide explique comment démarrer l’API et PostgreSQL, tester les routes avec Bruno et consulter les données avec DBeaver.

## Démarrer les services

Ouvrez un terminal à la racine du projet, dans le dossier qui contient `docker-compose.yml`, puis lancez :

```powershell
docker compose up --build -d
```

Cette commande construit et démarre l’API et la base PostgreSQL. Vérifiez que les deux conteneurs sont actifs :

```powershell
docker compose ps
```

L’API est disponible sur `http://localhost:3000`. PostgreSQL est exposé sur le port `5433` de votre ordinateur. Dans Docker, l’API se connecte à la base via `db:5432`.

## Tester avec Bruno

1. Installez l’extension Bruno dans VS Code ou l’application Bruno.
2. Ouvrez la collection en sélectionnant le dossier `Tasks-API-main/Tasks-API-main/bruno`.
3. Sélectionnez l’environnement `local`, dont l’URL de base est `http://localhost:3000`.
4. Ouvrez une requête et cliquez sur **Send** ou **Run**.

Les requêtes disponibles sont :

| Méthode | Route | Fonction |
| --- | --- | --- |
| `POST` | `/tasks` | Ajouter une tâche |
| `GET` | `/tasks` | Lister les tâches |
| `PUT` | `/tasks/:id` | Modifier le titre et/ou l’état d’une tâche |
| `PATCH` | `/tasks/:id/completed` | Modifier l’état terminé/non terminé |
| `DELETE` | `/tasks/:id` | Supprimer une tâche |

Pour créer une tâche, le corps JSON de la requête `POST` est par exemple :

```json
{
	"titre": "Faire les courses"
}
```

Pour modifier une tâche, remplacez `:id` par son identifiant. Vous pouvez envoyer un titre, un état, ou les deux :

```json
{
	"titre": "Faire les courses ce soir",
	"complete": true
}
```

Pour `PATCH`, le corps doit contenir le booléen `complete` :

```json
{
	"complete": true
}
```

Une réponse de l’API utilise les champs `id`, `titre` et `completed`. Pour supprimer une tâche, utilisez son identifiant dans l’URL, par exemple `DELETE /tasks/2`.

## Vérifier les données avec DBeaver

Créez une connexion PostgreSQL dans DBeaver avec les paramètres suivants :

| Paramètre | Valeur |
| --- | --- |
| Hôte | `localhost` |
| Port | `5433` |
| Base de données | `tasks` |
| Utilisateur | `ekod` |
| Mot de passe | `ekod` |

Après connexion, ouvrez un éditeur SQL et exécutez :

```sql
SELECT *
FROM tasks
ORDER BY num_tasks;
```

Les tâches créées, modifiées ou supprimées par l’API doivent se retrouver dans cette table. L’API et DBeaver consultent la même base `tasks`.

Les deux tâches initiales sont créées par `db-init/init.sql` lors de la première initialisation de la base. Le script utilise les statuts texte `False` et `True`, tandis que l’API écrit `Pending` et `Completed` et ne considère que `Completed` comme terminé. Les données initiales peuvent donc ne pas être interprétées comme prévu par le filtre `completed` de l’API.

## Arrêter les services


Pour arrêter les conteneurs sans supprimer les données :

```powershell
docker compose down
```

Les données PostgreSQL sont conservées dans le volume Docker `postgres_data`. La commande `docker compose down -v` supprime aussi ce volume et toutes les données qu’il contient; le script d’initialisation est alors exécuté à nouveau au prochain démarrage.


