import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1]] = match[2];
    }
});

const workflow = {
  "name": "HubView - Notifications Read",
  "nodes": [
    {
      "id": "webhook-1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [100, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "hubview-notifications-read",
        "responseMode": "lastNode",
        "options": {}
      }
    },
    {
      "id": "sql-1",
      "name": "Execute SQL",
      "type": "n8n-nodes-base.microsoftSql",
      "typeVersion": 1.1,
      "position": [300, 300],
      "credentials": {
        "microsoftSql": {
          "id": "wFz8efsBFJdVOJOq",
          "name": "SQL - hubview"
        }
      },
      "parameters": {
        "operation": "executeQuery",
        "query": "UPDATE Notifications SET IsRead=1 WHERE ID='{{ $json.body.notificationId }}'; SELECT 1 as success FOR JSON PATH;"
      }
    },
    {
      "id": "respond-1",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [500, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\"success\":true}",
        "options": {}
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          { "node": "Execute SQL", "type": "main", "index": 0 }
        ]
      ]
    },
    "Execute SQL": {
      "main": [
        [
          { "node": "Respond", "type": "main", "index": 0 }
        ]
      ]
    }
  },
  "settings": {}
};

async function main() {
    const N8N_BASE = env['N8N_API_URL'];
    const API_KEY = env['N8N_API_KEY'];
    if (!N8N_BASE) {
        console.error("No N8N_API_URL");
        return;
    }

    const host = new URL(N8N_BASE).origin;
    console.log("Using n8n host: " + host);

    const res = await fetch(`${host}/api/v1/workflows`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': API_KEY || ''
        },
        body: JSON.stringify(workflow)
    });

    if (!res.ok) {
        console.error("Failed to create workflow", await res.text());
        return;
    }

    const data = await res.json();
    console.log("Created workflow with ID:", data.id);

    // Activate the workflow
    const activateRes = await fetch(`${host}/api/v1/workflows/${data.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': API_KEY || ''
        },
        body: JSON.stringify({ active: true })
    });

    if (activateRes.ok) {
        console.log("Workflow activated successfully!");
    } else {
        console.error("Failed to activate workflow:", await activateRes.text());
    }
}

main().catch(console.error);
