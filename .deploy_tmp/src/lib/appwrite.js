const { Client, Account, Databases } = require("appwrite");

const APPWRITE_ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "69a2b863000e35528896";
const APPWRITE_OBF_FUNCTION_ID = "69a2bdd5001106182572";
const APPWRITE_API_KEY =
  "standard_04e6345ccb8b1d8d0162f13354d66eb872cd4fc1e7a05dbfd4e50913d538e8dfe523d7bc144e033857cabca06fdd804f427ee0a10b6df18c31f4ae3586d5755c00ecc146214ce7205c91bfa7bad4fc75a20fb34eb85f8f386219a577519eadf5a6bbecfe4902b0a357c9b52a8b0f1eb2a6fa49867e9d1d8185db910d7b03d9c3";

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

function pingAppwrite() {
  return client.ping();
}

function isRemoteObfuscationEnabled() {
  return Boolean(APPWRITE_OBF_FUNCTION_ID);
}

async function obfuscateViaAppwrite(payload) {
  if (!isRemoteObfuscationEnabled()) {
    throw new Error("APPWRITE_OBF_FUNCTION_ID is not configured.");
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
