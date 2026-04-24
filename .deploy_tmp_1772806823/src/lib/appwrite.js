const { Client, Account, Databases } = require("appwrite");
require("dotenv").config({ quiet: true });

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || "";
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || "";
const APPWRITE_OBF_FUNCTION_ID = process.env.APPWRITE_OBF_FUNCTION_ID || "";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";

const client = new Client();
if (APPWRITE_ENDPOINT) {
  client.setEndpoint(APPWRITE_ENDPOINT);
}
if (APPWRITE_PROJECT_ID) {
  client.setProject(APPWRITE_PROJECT_ID);
}

const account = new Account(client);
const databases = new Databases(client);

function ensureBaseConfig() {
  const missing = [];
  if (!APPWRITE_ENDPOINT) {
    missing.push("APPWRITE_ENDPOINT");
  }
  if (!APPWRITE_PROJECT_ID) {
    missing.push("APPWRITE_PROJECT_ID");
  }
  if (missing.length > 0) {
    throw new Error(`Missing Appwrite env: ${missing.join(", ")}`);
  }
}

function pingAppwrite() {
  ensureBaseConfig();
  return client.ping();
}

function isRemoteObfuscationEnabled() {
  return Boolean(APPWRITE_OBF_FUNCTION_ID);
}

async function obfuscateViaAppwrite(payload) {
  ensureBaseConfig();

  if (!APPWRITE_OBF_FUNCTION_ID) {
    throw new Error("Missing Appwrite env: APPWRITE_OBF_FUNCTION_ID");
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Appwrite-Project": APPWRITE_PROJECT_ID,
  };

  if (APPWRITE_API_KEY) {
    headers["X-Appwrite-Key"] = APPWRITE_API_KEY;
  }

  const response = await fetch(
    `${APPWRITE_ENDPOINT}/functions/${encodeURIComponent(APPWRITE_OBF_FUNCTION_ID)}/executions`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        body: JSON.stringify(payload),
        async: false,
        path: "/obfuscate",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    }
  );

  let execution = null;
  try {
    execution = await response.json();
  } catch {
    execution = null;
  }

  if (!response.ok) {
    const message =
      (execution && (execution.message || execution.error)) || `Appwrite request failed with ${response.status}`;
    throw new Error(message);
  }

  const responseBody = execution && typeof execution.responseBody === "string" ? execution.responseBody : "";

  if (!responseBody) {
    const executionErrors = execution && execution.errors ? execution.errors : "Empty response body from Appwrite function.";
    throw new Error(executionErrors);
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(responseBody);
  } catch {
    throw new Error("Invalid JSON response from Appwrite obfuscation function.");
  }

  if (parsedBody && parsedBody.error) {
    throw new Error(parsedBody.error);
  }

  if (!parsedBody || typeof parsedBody.code !== "string") {
    throw new Error(
      "Function executed but did not return obfuscation output. Deploy appwrite/functions/obfuscate/main.js as your Appwrite Function entrypoint."
    );
  }

  return parsedBody;
}

module.exports = {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  client,
  account,
  databases,
  pingAppwrite,
  isRemoteObfuscationEnabled,
  obfuscateViaAppwrite,
};
