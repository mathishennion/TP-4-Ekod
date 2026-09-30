const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'tasks',
  user: process.env.DB_USER || 'ekod',
  password: process.env.DB_PASSWORD || 'ekod'
});

// Middleware pour parser le JSON envoyé dans le corps des requêtes
app.use(express.json());

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const toTask = (row) => ({
  id: row.num_tasks,
  titre: row.titre_tasks,
  completed: row.status_tasks === 'Completed'
});

/**
 * POST /tasks
 * Ajoute une nouvelle tâche
 * Body attendu : { "titre": "Faire les courses" }
 */
app.post('/tasks', asyncRoute(async (req, res) => {
  const { titre } = req.body;

  if (!titre || typeof titre !== 'string' || titre.trim() === '') {
    return res.status(400).json({ error: 'Le champ "titre" est requis et doit être une chaîne non vide.' });
  }

  const result = await pool.query(
    'INSERT INTO tasks (titre_tasks, status_tasks) VALUES ($1, $2) RETURNING *',
    [titre.trim(), 'Pending']
  );
  res.status(201).json(toTask(result.rows[0]));
}));

/**
 * GET /tasks
 * Récupère la liste complète des tâches
 */
app.get('/tasks', asyncRoute(async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks ORDER BY num_tasks');
  let tasks = result.rows.map(toTask);

  if (req.query.completed === 'True') {
    tasks = tasks.filter((task) => task.completed);
  } else if (req.query.completed === 'False') {
    tasks = tasks.filter((task) => !task.completed);
  }

  res.status(200).json(tasks);
}));

/**
 * PUT /tasks/:id
 * Modifie une tâche spécifique (titre et/ou statut)
 * Body attendu : { "titre": "...", "complete": true }
 */
app.put('/tasks/:id', asyncRoute(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identifiant de tâche invalide.' });
  }

  const { titre, complete } = req.body;

  if (titre !== undefined) {
    if (typeof titre !== 'string' || titre.trim() === '') {
      return res.status(400).json({ error: 'Le champ "titre" doit être une chaîne non vide.' });
    }
  }

  if (complete !== undefined) {
    if (typeof complete !== 'boolean') {
      return res.status(400).json({ error: 'Le champ "complete" doit être un booléen.' });
    }
  }

  const current = await pool.query('SELECT * FROM tasks WHERE num_tasks = $1', [id]);
  if (current.rowCount === 0) {
    return res.status(404).json({ error: `Aucune tâche trouvée avec l'id ${id}.` });
  }

  const newTitle = titre === undefined ? current.rows[0].titre_tasks : titre.trim();
  const newStatus = complete === undefined
    ? current.rows[0].status_tasks
    : (complete ? 'Completed' : 'Pending');
  const result = await pool.query(
    'UPDATE tasks SET titre_tasks = $1, status_tasks = $2 WHERE num_tasks = $3 RETURNING *',
    [newTitle, newStatus, id]
  );
  res.status(200).json(toTask(result.rows[0]));
}));

/**
 * DELETE /tasks/:id
 * Supprime une tâche spécifique
 */
app.delete('/tasks/:id', asyncRoute(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identifiant de tâche invalide.' });
  }

  const result = await pool.query('DELETE FROM tasks WHERE num_tasks = $1 RETURNING *', [id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: `Aucune tâche trouvée avec l'id ${id}.` });
  }

  res.status(200).json({ message: 'Tâche supprimée.', task: toTask(result.rows[0]) });
}));

/**Nouvelle fonctionnalité 1 (pour l'étudiant A)
§ Ajouter une fonctionnalité permettant de marquer une tâche comme
complétée/non complétée.
§ Route suggérée : PATCH /tasks/:id/completed
*/
app.patch('/tasks/:id/completed', asyncRoute(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identifiant de tâche invalide.' });
  }

  const { complete } = req.body;
  if (typeof complete !== 'boolean') {
    return res.status(400).json({ error: 'Le champ "complete" doit être un booléen.' });
  }

  const result = await pool.query(
    'UPDATE tasks SET status_tasks = $1 WHERE num_tasks = $2 RETURNING *',
    [complete ? 'Completed' : 'Pending', id]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: `Aucune tâche trouvée avec l'id ${id}.` });
  }

  res.status(200).json(toTask(result.rows[0]));
}));

// Route de vérification que le serveur tourne
app.get('/', (req, res) => {
  res.send('Tasks API en ligne. Voir /tasks');
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
