const { obfuscate } = require("../../../src");

function parsePayload(req) {
  if (req && req.bodyJson && typeof req.bodyJson === "object") {
    return req.bodyJson;
  }

  const bodyText = req && typeof req.bodyText === "string" ? req.bodyText : "";
  if (!bodyText) {
    return {};
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    return {};
  }
}

module.exports = async ({ req, res, log, error }) => {
  try {
    const payload = parsePayload(req);
    const source = payload.source || payload.code || "";

    if (!source || !source.trim()) {
      return res.json({ error: "No source code provided." }, 400);
    }

    const filename = payload.filename || "input.js";
    const options = payload.options && typeof payload.options === "object" ? payload.options : {};
    const result = await obfuscate(source, { ...options, filename });

    return res.json(result, 200);
  } catch (runtimeError) {
    const message = runtimeError && runtimeError.message ? runtimeError.message : "Obfuscation failed.";
    if (typeof error === "function") {
      error(message);
    } else if (typeof log === "function") {
      log(message);
    }
    return res.json({ error: message }, 500);
  }
};
