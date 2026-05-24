import fs from 'fs';
import path from 'path';

const CONFIG_PATH = 'C:\\Users\\User\\.config\\configstore\\firebase-tools.json';
const PROJECT_ID = 'gen-lang-client-0717923979';

// Parse Firestore REST field structures
function parseFields(fields) {
  if (!fields) return {};
  const res = {};
  for (const [key, value] of Object.entries(fields)) {
    res[key] = parseValue(value);
  }
  return res;
}

function parseValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(v => parseValue(v));
  }
  if ('mapValue' in val) {
    return parseFields(val.mapValue.fields);
  }
  return val;
}

// Convert normal objects to Firestore REST JSON structures
function toFirestoreValue(val) {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (val === null) return { nullValue: null };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    return { mapValue: { fields: toFirestoreFields(val) } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

// Load and refresh OAuth token
async function getAccessToken() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Firebase CLI config not found at: ${CONFIG_PATH}. Please run "npx -p firebase-tools firebase login" first.`);
  }
  
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const expiresAt = config.tokens.expires_at;
  
  if (expiresAt && expiresAt > Date.now()) {
    return { token: config.tokens.access_token, email: config.user.email };
  }
  
  console.log("Token expired. Refreshing OAuth token...");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.user.aud || "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
      grant_type: "refresh_token",
      refresh_token: config.tokens.refresh_token
    })
  });
  
  if (!res.ok) {
    throw new Error(`Failed to refresh token: ${await res.text()}`);
  }
  
  const data = await res.json();
  config.tokens.access_token = data.access_token;
  config.tokens.expires_at = Date.now() + (data.expires_in * 1000) - 5000;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  return { token: data.access_token, email: config.user.email };
}

async function run() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Executive OS Firebase Firestore Command-Line Interface

Commands:
  node db-cli.js status
      Checks active connection, user identity, and project.

  node db-cli.js list <userId> <collection>
      Lists all documents inside a collection. (e.g., node db-cli.js list guest tasks)

  node db-cli.js get <userId> <collection> <docId>
      Shows details of a specific document.

  node db-cli.js delete <userId> <collection> <docId>
      Deletes a document.

  node db-cli.js clear <userId> <collection>
      Deletes all documents in a collection.
    `);
    process.exit(0);
  }

  try {
    const { token, email } = await getAccessToken();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    if (command === 'status') {
      console.log(`Connection: ACTIVE`);
      console.log(`Authenticated Email: ${email}`);
      console.log(`Firebase Project: ${PROJECT_ID}`);
      process.exit(0);
    }

    if (command === 'list') {
      const userId = args[1];
      const colName = args[2];
      if (!userId || !colName) {
        console.error("Usage: node db-cli.js list <userId> <collection>");
        process.exit(1);
      }

      const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/${colName}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        if (res.status === 404) {
          console.log(`Collection "users/${userId}/${colName}" is empty or does not exist.`);
          process.exit(0);
        }
        throw new Error(`REST Error: ${res.status} - ${await res.text()}`);
      }

      const data = await res.json();
      const docs = data.documents || [];
      console.log(`Found ${docs.length} document(s) in "users/${userId}/${colName}":\n`);
      docs.forEach(d => {
        const id = path.basename(d.name);
        const fields = parseFields(d.fields);
        console.log(`Document ID: ${id}`);
        console.log(JSON.stringify(fields, null, 2));
        console.log("-----------------------------------------");
      });
      process.exit(0);
    }

    if (command === 'get') {
      const userId = args[1];
      const colName = args[2];
      const docId = args[3];
      if (!userId || !colName || !docId) {
        console.error("Usage: node db-cli.js get <userId> <collection> <docId>");
        process.exit(1);
      }

      const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/${colName}/${docId}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        if (res.status === 404) {
          console.log(`Document "users/${userId}/${colName}/${docId}" not found.`);
          process.exit(0);
        }
        throw new Error(`REST Error: ${res.status} - ${await res.text()}`);
      }

      const data = await res.json();
      const fields = parseFields(data.fields);
      console.log(`Document ID: ${docId}`);
      console.log(JSON.stringify(fields, null, 2));
      process.exit(0);
    }

    if (command === 'delete') {
      const userId = args[1];
      const colName = args[2];
      const docId = args[3];
      if (!userId || !colName || !docId) {
        console.error("Usage: node db-cli.js delete <userId> <collection> <docId>");
        process.exit(1);
      }

      const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/${colName}/${docId}`;
      const res = await fetch(url, { method: 'DELETE', headers });
      if (!res.ok) {
        throw new Error(`Failed to delete: ${res.status} - ${await res.text()}`);
      }

      console.log(`Successfully deleted document "${docId}" from "users/${userId}/${colName}".`);
      process.exit(0);
    }

    if (command === 'clear') {
      const userId = args[1];
      const colName = args[2];
      if (!userId || !colName) {
        console.error("Usage: node db-cli.js clear <userId> <collection>");
        process.exit(1);
      }

      const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/${colName}`;
      const listRes = await fetch(listUrl, { headers });
      if (!listRes.ok) {
        if (listRes.status === 404) {
          console.log("Collection already empty.");
          process.exit(0);
        }
        throw new Error(`Failed to list for clear: ${await listRes.text()}`);
      }

      const data = await listRes.json();
      const docs = data.documents || [];
      
      console.log(`Deleting ${docs.length} documents...`);
      for (const d of docs) {
        const id = path.basename(d.name);
        const delUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/${colName}/${id}`;
        const delRes = await fetch(delUrl, { method: 'DELETE', headers });
        if (!delRes.ok) {
          console.error(`Failed to delete document ${id}`);
        }
      }
      console.log("Clear operation completed.");
      process.exit(0);
    }

    console.error(`Unknown command: ${command}`);
    process.exit(1);
  } catch (err) {
    console.error("CLI Execution failed:", err.message);
    process.exit(1);
  }
}

run();
