Guide Technique WindOps Copilot
================================

Ce document décrit l'architecture, le pipeline d'agents, les schémas de données, la configuration et le déploiement de l'application WindOps Copilot.

Contexte et Objectifs
---------------------

WindOps Copilot est un assistant opérationnel destiné au suivi et au diagnostic d'éoliennes industrielles. Il automatise les tâches suivantes :

- Réception de données capteurs via une API REST
- Détection d'anomalies par un agent basé sur un modèle de langage
- Diagnostic de la cause racine
- Recommandation d'actions opérationnelles
- Notification par email avec rapport PDF joint
- Stockage des incidents et alertes dans MongoDB
- Exposition de métriques et de traces d'agents pour le tableau de bord

Architecture Technique
----------------------

L'application se compose de trois couches principales :

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Frontend | React, TypeScript, Vite, Tailwind CSS | Tableau de bord opérateur |
| Backend | FastAPI, Python 3.11 | API REST et orchestration des agents |
| Base de données | MongoDB 7 | Persistance des turbines, incidents, alertes et traces |

Le backend exécute un graphe LangGraph compilé à la volée sous forme de singleton. Le graphe est défini dans `backend/graph/graph.py` et utilise le schéma d'état partagé `WindOpsState`.

Pipeline LangGraph
------------------

Le flux de traitement est le suivant :

1. Le point d'entrée `supervisor` valide les champs capteurs obligatoires.
2. L'agent `monitoring` analyse les valeurs et détecte les anomalies.
3. La fonction de routage `should_diagnose` dirige vers `diagnosis` si une anomalie est détectée, sinon vers la fin du graphe.
4. L'agent `diagnosis` établit la cause racine et identifie les composants affectés.
5. L'agent `decision` recommande une action et détermine si une notification est nécessaire.
6. La fonction de routage `should_notify` dirige vers `notification` si la sévérité est `high` ou `critical`, sinon vers la fin du graphe.
7. L'agent `notification` crée l'incident, génère le rapport PDF, envoie l'email et enregistre l'alerte.

Référence des Agents
--------------------

| Agent | Fichier | Entrée principale | Sortie principale | Description |
|-------|---------|-------------------|-------------------|-------------|
| supervisor | `backend/agents/supervisor/agent.py` | `WindOpsState` | `agents_triggered`, `agent_trace`, `error_messages` | Valide la présence des champs capteurs obligatoires |
| monitoring | `backend/agents/monitoring/agent.py` | `sensor_data` | `anomaly_detected`, `anomaly_type`, `severity`, `health_score`, `threshold_violations`, `observation` | Détecte les anomalies selon des seuils prédéfinis |
| diagnosis | `backend/agents/diagnosis/agent.py` | `WindOpsState` | `root_cause`, `confidence`, `affected_components` | Diagnostique la cause racine |
| decision | `backend/agents/decision/agent.py` | `WindOpsState` | `recommended_action`, `requires_human_validation`, `requires_notification` | Recommande une action et décide de notifier |
| notification | `backend/agents/notification/agent.py` | `WindOpsState` | `incident_id`, `alert_id`, `report_id`, `notification_sent`, `duration_ms` | Persiste l'incident, génère le PDF, envoie l'email, journalise l'alerte |

Schémas de Données
------------------

### État Partagé

Le schéma `WindOpsState` est défini dans `backend/graph/state.py`.

| Champ | Type | Description |
|-------|------|-------------|
| `correlation_id` | str | Identifiant de corrélation de la requête |
| `turbine_id` | str | Identifiant de l'éolienne |
| `sensor_data` | dict | Valeurs des capteurs sérialisées |
| `health_score` | float optionnel | Score de santé entre 0.0 et 1.0 |
| `anomaly_detected` | bool optionnel | Indique si une anomalie a été détectée |
| `anomaly_type` | str optionnel | Type d'anomalie : `high_vibration`, `temperature_spike`, `power_inconsistency`, `multiple` |
| `severity` | str optionnel | Sévérité : `low`, `medium`, `high`, `critical` |
| `root_cause` | str optionnel | Cause racine diagnostiquée |
| `confidence` | float optionnel | Confiance du diagnostic |
| `affected_components` | liste optionnelle | Composants affectés |
| `recommended_action` | str optionnel | Action recommandée |
| `requires_human_validation` | bool | Indique si une validation humaine est requise |
| `requires_notification` | bool | Indique si une notification doit être envoyée |
| `notification_sent` | bool | Indique si la notification a été envoyée |
| `alert_id` | str optionnel | Identifiant de l'alerte créée |
| `incident_id` | str optionnel | Identifiant de l'incident créé |
| `report_id` | str optionnel | Identifiant du rapport PDF |
| `agents_triggered` | liste | Liste cumulée des agents exécutés |
| `agent_trace` | liste de dict | Traces d'exécution des agents |
| `error_messages` | liste | Messages d'erreur cumulés |
| `pipeline_start_time` | float optionnel | Horodatage de début du pipeline |
| `duration_ms` | float optionnel | Durée d'exécution en millisecondes |

### Payload et Réponse API

Le modèle `TelemetryPayload` définit les champs attendus par le endpoint `POST /api/telemetry`.

| Champ | Type | Description |
|-------|------|-------------|
| `turbine_id` | str | Identifiant de l'éolienne |
| `wind_speed` | float | Vitesse du vent en m/s |
| `rotor_rpm` | float | Vitesse de rotation du rotor |
| `power_output` | float | Puissance produite en kW |
| `temperature_gearbox` | float | Température du multiplicateur en degrés Celsius |
| `temperature_generator` | float | Température du générateur en degrés Celsius |
| `vibration_level` | float | Niveau de vibration en mm/s |
| `blade_pitch_angle` | float | Angle de pas des pales en degrés |
| `timestamp` | str optionnel | Horodatage ISO de la mesure |
| `correlation_id` | str optionnel | Identifiant de corrélation |

Le modèle `TelemetryResponse` retourne les résultats de l'analyse.

| Champ | Type | Description |
|-------|------|-------------|
| `correlation_id` | str | Identifiant de corrélation |
| `turbine_id` | str | Identifiant de l'éolienne |
| `anomaly_detected` | bool | Résultat de la détection |
| `health_score` | float | Score de santé |
| `severity` | str optionnel | Sévérité de l'anomalie |
| `alert_id` | str optionnel | Identifiant de l'alerte |
| `incident_id` | str optionnel | Identifiant de l'incident |
| `agents_triggered` | liste | Agents ayant été exécutés |
| `duration_ms` | float | Durée d'exécution en millisecondes |

### Modèles de Persistance

Les modèles `Incident` et `Alert` sont définis dans `backend/repositories.py`.

Incident :

| Champ | Type | Description |
|-------|------|-------------|
| `turbine_id` | str | Éolienne concernée |
| `correlation_id` | str | Identifiant de corrélation |
| `severity` | str | Sévérité |
| `status` | str | Statut, valeur par défaut `open` |
| `root_cause` | str optionnel | Cause racine |
| `recommended_action` | str optionnel | Action recommandée |
| `agents_involved` | liste | Agents impliqués |
| `incident_id` | str | Identifiant unique généré automatiquement |
| `created_at` | str | Date de création au format ISO |
| `closed_at` | str optionnel | Date de clôture |
| `health_score` | float optionnel | Score de santé |
| `duration_ms` | float optionnel | Durée du pipeline |
| `report_id` | str optionnel | Identifiant du rapport |
| `agent_trace` | liste optionnelle | Traces d'agents |

Alert :

| Champ | Type | Description |
|-------|------|-------------|
| `turbine_id` | str | Éolienne concernée |
| `severity` | str | Sévérité |
| `message` | str | Message descriptif |
| `correlation_id` | str | Identifiant de corrélation |
| `alert_id` | str | Identifiant unique généré automatiquement |
| `created_at` | str | Date de création au format ISO |
| `acknowledged` | bool | Indique si l'alerte a été acquittée |

Configuration LLM
-----------------

La configuration des fournisseurs de modèles est définie dans `backend/config.py`.

| Fournisseur | Variable clé | Variable modèle | Modèle par défaut |
|-------------|--------------|-----------------|-------------------|
| OpenAI | `OPENAI_API_KEY` | `OPENAI_MODEL` | `gpt-4o-mini` |
| Groq | `GROQ_API_KEY` | `GROQ_MODEL` | `llama3-70b-8192` |
| Google Gemini | `GOOGLE_API_KEY` | `GOOGLE_MODEL` | `gemini-1.5-flash` |

Le fournisseur actif est sélectionné via la variable `LLM_PROVIDER`. La valeur par défaut est `openai`. La clé correspondante est automatiquement injectée dans `os.environ` pour les utilitaires LangChain.

Seuils de Détection
-------------------

L'agent de monitoring applique les seuils suivants, définis dans `backend/agents/monitoring/prompt.py`.

| Capteur | Seuil d'avertissement | Seuil critique |
|---------|----------------------|----------------|
| `vibration_level` | > 12 mm/s | > 18 mm/s |
| `temperature_gearbox` | > 75 degrés Celsius | > 85 degrés Celsius |
| `temperature_generator` | > 85 degrés Celsius | > 95 degrés Celsius |
| `power_output` | Écart relatif > 30 % par rapport à `rotor_rpm * 45` | Écart relatif > 30 % par rapport à `rotor_rpm * 45` |

Les règles de sévérité sont les suivantes :

| Sévérité | Condition |
|----------|-----------|
| `low` | Un seuil d'avertissement légèrement dépassé |
| `medium` | Un seuil critique atteint |
| `high` | Deux seuils dépassés simultanément |
| `critical` | Trois seuils ou plus dépassés, ou une valeur supérieure de 20 % au seuil critique |

Démarrage et Déploiement
------------------------

### Environnement Local

1. Copier `.env.example` vers `.env` et renseigner les variables.
2. Lancer l'ensemble des services :

```bash
docker compose up --build
```

3. Le backend est accessible sur `http://localhost:8000`.
4. Le frontend est accessible sur `http://localhost:3000`.

### Configuration Docker Compose

Le fichier `docker-compose.yml` définit trois services :

| Service | Image / Build | Port exposé | Dépendances |
|---------|---------------|-------------|-------------|
| `mongodb` | `mongo:7` | `27017:27017` | Aucune |
| `backend` | `./backend/Dockerfile` | `8000:8000` | `mongodb` |
| `frontend` | `./frontend/Dockerfile` | `3000:80` | `backend` |

Les variables d'environnement du backend sont injectées depuis le fichier `.env`. Le volume `/tmp/reports` est monté pour le stockage des rapports PDF.

### Déploiement Continu

Le déploiement est géré par GitHub Actions via deux workflows.

`ci.yml` est déclenché sur les branches `main` et `develop`, ainsi que sur les pull requests vers `main`. Il exécute les étapes suivantes :

- Tests backend avec Python 3.11 contre une instance MongoDB 7
- Build frontend avec Node.js 20
- Construction des images Docker backend et frontend
- Smoke test du conteneur backend sur le endpoint `/health`

`deploy.yml` est déclenché sur les push vers `main`. Il appelle les hooks de déploiement Render pour le backend et le frontend, puis vérifie l'état de santé du backend en production.

Observabilité et Métriques
--------------------------

Le endpoint `GET /api/metrics` retourne les indicateurs suivants :

| Métrique | Source |
|----------|--------|
| `total_turbines` | Nombre de documents dans la collection `turbines` |
| `turbines_in_alert` | Nombre d'alertes non acquittées |
| `avg_health_score` | Moyenne des scores de santé des turbines |
| `incidents_today` | Incidents créés depuis minuit UTC |
| `incidents_resolved_today` | Incidents fermés depuis minuit UTC |
| `pipeline_avg_ms` | Durée moyenne des 20 derniers pipelines |
| `agents` | Métriques par agent calculées sur les 20 derniers incidents |

Chaque agent met à jour les listes `agents_triggered` et `agent_trace` dans l'état partagé. Les erreurs sont accumulées dans `error_messages`. Le repository bascule automatiquement vers un stockage en mémoire si MongoDB n'est pas accessible.
