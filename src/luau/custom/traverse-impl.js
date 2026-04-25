function isNode(value) {
  return value && typeof value === "object" && typeof value.type === "string";
}

function getVisitorHandlers(visitor, nodeType) {
  if (typeof visitor === "function") {
    return { enter: visitor, leave: null };
  }
  const baseEnter = visitor && typeof visitor.enter === "function" ? visitor.enter : null;
  const baseLeave = visitor && typeof visitor.leave === "function" ? visitor.leave : null;
  if (!visitor || !nodeType || !Object.prototype.hasOwnProperty.call(visitor, nodeType)) {
    return { enter: baseEnter, leave: baseLeave };
  }
  const handler = visitor[nodeType];
  if (typeof handler === "function") {
    return { enter: handler, leave: baseLeave };
  }
  if (handler && (typeof handler.enter === "function" || typeof handler.leave === "function")) {
    return {
      enter: typeof handler.enter === "function" ? handler.enter : baseEnter,
      leave: typeof handler.leave === "function" ? handler.leave : baseLeave,
    };
  }
  return { enter: baseEnter, leave: baseLeave };
}

function traverse(root, visitor) {
  const visit = (node, parent, key, index) => {
    if (!isNode(node)) {
      return node;
    }

    const context = {
      _skip: false,
      _remove: false,
      _replace: null,
      skip() {
        this._skip = true;
      },
      remove() {
        this._remove = true;
      },
      replace(next) {
        this._replace = next;
      },
    };

    const handlers = getVisitorHandlers(visitor, node.type);
    if (handlers.enter) {
      handlers.enter(node, parent, key, index, context);
    }

    if (context._remove) {
      return null;
    }

    let current = context._replace ? context._replace : node;
    if (!context._skip) {
      for (const childKey of Object.keys(current)) {
        const child = current[childKey];
        if (Array.isArray(child)) {
          for (let i = 0; i < child.length; i += 1) {
            const next = visit(child[i], current, childKey, i);
            if (next === null) {
              child.splice(i, 1);
              i -= 1;
              continue;
            }
            if (next !== child[i]) {
              child[i] = next;
            }
          }
          continue;
        }
        if (isNode(child)) {
          const next = visit(child, current, childKey, null);
          if (next === null) {
            current[childKey] = null;
          } else if (next !== child) {
            current[childKey] = next;
          }
        }
      }
    }

    if (handlers.leave) {
      const leaveContext = {
        _remove: false,
        _replace: null,
        remove() {
          this._remove = true;
        },
        replace(next) {
          this._replace = next;
        },
      };
      handlers.leave(current, parent, key, index, leaveContext);
      if (leaveContext._remove) {
        return null;
      }
      if (leaveContext._replace) {
        current = leaveContext._replace;
      }
    }

    return current;
  };

  return visit(root, null, null, null);
}

module.exports = {
  traverse,
};
