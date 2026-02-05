function normalizeExpected(expected) {
  if (!expected) {
    return null;
  }
  if (Array.isArray(expected)) {
    return expected;
  }
  return [expected];
}

function makeDiagnostic(message, token, expected) {
  const normExpected = normalizeExpected(expected);
  return {
    message,
    expected: normExpected,
    token: token
      ? {
          type: token.type,
          value: token.value,
        }
      : null,
    loc: token && token.loc ? token.loc : null,
    range: token && token.range ? token.range : null,
  };
}

function makeDiagnosticError(message, token, expected) {
  const err = new Error(message);
  err.diagnostic = makeDiagnostic(message, token, expected);
  return err;
}

function makeDiagnosticFromNode(message, node, expected) {
  if (!node || !node.loc || !node.range) {
    return makeDiagnostic(message, null, expected);
  }
  return makeDiagnostic(
    message,
    {
      type: node.type,
      value: null,
      loc: node.loc,
      range: node.range,
    },
    expected,
  );
}

function makeDiagnosticErrorFromNode(message, node, expected) {
  if (!node || !node.loc || !node.range) {
    return makeDiagnosticError(message, null, expected);
  }
  return makeDiagnosticError(
    message,
    {
      type: node.type,
      value: null,
      loc: node.loc,
      range: node.range,
    },
    expected,
  );
}

module.exports = {
  makeDiagnostic,
  makeDiagnosticError,
  makeDiagnosticFromNode,
  makeDiagnosticErrorFromNode,
};
