function addBindingIdentifiers(t, node, exported) {
  if (!node) {
    return;
  }
  if (
    node.type === "VariableDeclaration" ||
    node.type === "FunctionDeclaration" ||
    node.type === "ClassDeclaration"
  ) {
    const identifiers = t.getBindingIdentifiers(node);
    for (const name of Object.keys(identifiers)) {
      exported.add(name);
    }
    return;
  }
  if (node.id && node.id.name) {
    exported.add(node.id.name);
  }
}

function collectExportedNames(programPath, t) {
  const exported = new Set();
  for (const node of programPath.node.body) {
    if (node.type === "ExportNamedDeclaration") {
      addBindingIdentifiers(t, node.declaration, exported);
      if (node.specifiers) {
        for (const spec of node.specifiers) {
          if (spec.local && spec.local.name) {
            exported.add(spec.local.name);
          }
        }
      }
    }
    if (node.type === "ExportDefaultDeclaration") {
      addBindingIdentifiers(t, node.declaration, exported);
    }
  }
  return exported;
}

function renameIdentifierInNode(node, oldName, newName) {
  if (!node) return;
  if (node.type === "Identifier" && node.name === oldName) {
    node.name = newName;
    return;
  }
  if (node.type === "AssignmentPattern") {
    renameIdentifierInNode(node.left, oldName, newName);
    return;
  }
  if (node.type === "ArrayPattern") {
    for (const elem of node.elements) {
      renameIdentifierInNode(elem, oldName, newName);
    }
    return;
  }
  if (node.type === "ObjectPattern") {
    for (const prop of node.properties) {
      if (prop.type === "ObjectProperty") {
        if (prop.shorthand && prop.key.type === "Identifier" && prop.key.name === oldName) {
          prop.shorthand = false;
        }
        renameIdentifierInNode(prop.value, oldName, newName);
      } else if (prop.type === "RestElement") {
        renameIdentifierInNode(prop.argument, oldName, newName);
      }
    }
    return;
  }
  if (node.type === "RestElement") {
    renameIdentifierInNode(node.argument, oldName, newName);
  }
}

function isInsideWith(path) {
  return Boolean(
    path && path.findParent && path.findParent((parent) => parent.isWithStatement())
  );
}

function bindingTouchesWith(binding) {
  if (!binding) {
    return false;
  }
  if (isInsideWith(binding.path)) {
    return true;
  }
  if (
    binding.referencePaths &&
    binding.referencePaths.some((reference) => isInsideWith(reference))
  ) {
    return true;
  }
  if (
    binding.constantViolations &&
    binding.constantViolations.some((violation) => isInsideWith(violation))
  ) {
    return true;
  }
  return false;
}

function renameScope(scope, ctx, reserved, usedNames) {
  const names = Object.keys(scope.bindings);
  for (const name of names) {
    if (reserved.has(name)) {
      continue;
    }
    // The pipeline's generated identifiers are already random and unique.
    // Renaming them can desynchronize declarations from references when the
    // nodes were synthesized directly (for example CFF state codecs).
    if (ctx.nameGen && typeof ctx.nameGen.isGenerated === "function" && ctx.nameGen.isGenerated(name)) {
      continue;
    }
    const binding = scope.bindings[name];
    if (!binding || !binding.identifier) {
      continue;
    }
    if (bindingTouchesWith(binding)) {
      continue;
    }
    if (binding.path.isImportSpecifier() || binding.path.isImportDefaultSpecifier()) {
      if (reserved.has(binding.identifier.name)) {
        continue;
      }
    }
    let newName = ctx.nameGen.next();
    while (
      reserved.has(newName) ||
      usedNames.has(newName)
    ) {
      newName = ctx.nameGen.next();
    }
    usedNames.add(newName);

    if (binding.identifier) {
      binding.identifier.name = newName;
    }
    for (const ref of binding.referencePaths) {
      if (ref.node && (ref.node.type === "Identifier" || ref.node.type === "JSXIdentifier")) {
        if (ref.parentPath && ref.parentPath.isObjectProperty() && ref.parentPath.node.shorthand) {
          if (ref.parentPath.node.value === ref.node) {
            ref.parentPath.node.shorthand = false;
          }
        }
        ref.node.name = newName;
      }
    }
    for (const v of binding.constantViolations) {
      if (v.isAssignmentExpression()) {
        renameIdentifierInNode(v.node.left, name, newName);
      } else if (v.isUpdateExpression()) {
        renameIdentifierInNode(v.node.argument, name, newName);
      } else if (v.isForXStatement && v.isForXStatement()) {
        renameIdentifierInNode(v.node.left, name, newName);
      }
    }

    delete scope.bindings[name];
    scope.bindings[newName] = binding;
  }
}

function renameIdentifiers(ast, ctx) {
  const { traverse, options, t } = ctx;

  traverse(ast, {
    Program(path) {
      // Earlier plugins synthesize and move nodes directly. Rebuild Babel's
      // scope/binding/reference information before renaming so references in
      // generated wrappers are not left dangling.
      if (path.scope && typeof path.scope.crawl === "function") {
        path.scope.crawl();
      }
      const exported = collectExportedNames(path, t);
      const reserved = new Set(options.renameOptions.reserved);
      for (const name of exported) {
        reserved.add(name);
      }
      const usedNames = new Set(reserved);
      if (path.scope) {
        for (const name of Object.keys(path.scope.bindings)) {
          usedNames.add(name);
        }
        if (path.scope.globals) {
          for (const name of Object.keys(path.scope.globals)) {
            usedNames.add(name);
          }
        }
      }

      const scopes = [];
      path.traverse({
        Scopable(scopePath) {
          if (!scopePath.scope || scopePath.isProgram()) {
            return;
          }
          scopes.push(scopePath.scope);
          for (const name of Object.keys(scopePath.scope.bindings)) {
            usedNames.add(name);
          }
        },
      });

      if (options.renameOptions.renameGlobals && path.scope) {
        renameScope(path.scope, ctx, reserved, usedNames);
      }

      for (const scope of scopes) {
        renameScope(scope, ctx, reserved, usedNames);
      }
      path.skip();
    },
  });
}

module.exports = renameIdentifiers;
