function collectExportedNames(programPath) {
  const exported = new Set();
  for (const node of programPath.node.body) {
    if (node.type === "ExportNamedDeclaration") {
      if (node.declaration) {
        if (node.declaration.id) {
          exported.add(node.declaration.id.name);
        }
        if (node.declaration.declarations) {
          for (const decl of node.declaration.declarations) {
            if (decl.id && decl.id.name) {
              exported.add(decl.id.name);
            }
          }
        }
      }
      if (node.specifiers) {
        for (const spec of node.specifiers) {
          if (spec.local && spec.local.name) {
            exported.add(spec.local.name);
          }
        }
      }
    }
    if (node.type === "ExportDefaultDeclaration") {
      if (node.declaration && node.declaration.id) {
        exported.add(node.declaration.id.name);
      }
    }
  }
  return exported;
}

function renameScope(scope, ctx, reserved, usedNames) {
  const names = Object.keys(scope.bindings);
  for (const name of names) {
    if (reserved.has(name)) {
      continue;
    }
    const binding = scope.bindings[name];
    if (!binding || !binding.identifier) {
      continue;
    }
    if (binding.path.isImportSpecifier() || binding.path.isImportDefaultSpecifier()) {
      if (reserved.has(binding.identifier.name)) {
        continue;
      }
    }
    let newName = ctx.nameGen.next();
    while (
      scope.hasBinding(newName) ||
      scope.hasGlobal(newName) ||
      reserved.has(newName) ||
      usedNames.has(newName)
    ) {
      newName = ctx.nameGen.next();
    }
    scope.rename(name, newName);
    usedNames.add(newName);
  }
}

function renameIdentifiers(ast, ctx) {
  const { traverse, options } = ctx;

  traverse(ast, {
    Program(path) {
      const exported = collectExportedNames(path);
      const reserved = new Set(options.renameOptions.reserved);
      for (const name of exported) {
        reserved.add(name);
      }
      const usedNames = new Set(reserved);
      path.traverse({
        Scopable(scopePath) {
          if (!scopePath.scope) {
            return;
          }
          for (const name of Object.keys(scopePath.scope.bindings)) {
            usedNames.add(name);
          }
        },
      });

      path.traverse({
        Scopable(scopePath) {
          if (scopePath.isProgram() && !options.renameOptions.renameGlobals) {
            return;
          }
          if (!scopePath.scope) {
            return;
          }
          renameScope(scopePath.scope, ctx, reserved, usedNames);
        },
      });
    },
  });
}

module.exports = renameIdentifiers;
