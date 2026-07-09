import type { Node } from "unist";

const BLOCKED_GLOBALS = [
  // Code execution
  "eval",
  "Function",
  "AsyncFunction",
  "GeneratorFunction",
  // Module system
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  // Runtime
  "process",
  "global",
  "globalThis",
  "Reflect",
  // File system / network
  "child_process",
  "fs",
  "net",
  "http",
  "https",
  "vm",
  "worker_threads",
  // Browser-like (available in Node/Deno)
  "fetch",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "queueMicrotask",
  "XMLHttpRequest",
];

const BLOCKED_PROPERTIES = [
  "constructor",
  "prototype",
  "__proto__",
  "eval",
  "Reflect",
  "Function",
  "AsyncFunction",
  "GeneratorFunction",
  "require",
];

function walk(
  node: any,
  blockedGlobals: string[],
  blockedProperties: string[],
) {
  if (!node || typeof node !== "object") return;

  if (node.type === "Identifier" && blockedGlobals.includes(node.name)) {
    const parent = node.parent;
    const isProperty =
      parent?.type === "MemberExpression" &&
      parent.property === node &&
      !parent.computed;
    const isParam =
      parent?.type === "FunctionDeclaration" ||
      parent?.type === "FunctionExpression";
    if (!isProperty && !isParam) {
      throw new Error(`Security: Access to '${node.name}' is not allowed`);
    }
  }

  // Block direct calls to blocked globals: eval(), Function(), fetch(), etc.
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "Identifier" &&
    blockedGlobals.includes(node.callee.name)
  ) {
    throw new Error(`Security: ${node.callee.name}() calls are not allowed`);
  }

  // Block dynamic import(): import("node:fs")
  if (node.type === "ImportExpression") {
    throw new Error("Security: Dynamic import() is not allowed");
  }

  // Block tagged template literals on blocked globals: eval`...`
  if (
    node.type === "TaggedTemplateExpression" &&
    node.tag?.type === "Identifier" &&
    blockedGlobals.includes(node.tag.name)
  ) {
    throw new Error(
      `Security: ${node.tag.name}\`...\` tagged template is not allowed`,
    );
  }

  // Block computed MemberExpression calls on any object identifier
  // Catches: Object["constructor"](...), Object["con"+"structor"](...), etc.
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    node.callee.computed
  ) {
    throw new Error(
      "Security: Function calls via computed property access are not allowed",
    );
  }

  // Block non-computed property access to dangerous properties:
  // obj.constructor, obj.prototype, obj.__proto__
  if (node.type === "MemberExpression" && !node.computed) {
    const prop = node.property;
    if (
      prop?.type === "Identifier" &&
      blockedProperties.includes(prop.name)
    ) {
      throw new Error(
        `Security: .${prop.name} access is not allowed`,
      );
    }
  }

  // Block new expressions: new Function(...)
  if (
    node.type === "NewExpression" &&
    node.callee?.type === "Identifier" &&
    blockedGlobals.includes(node.callee.name)
  ) {
    throw new Error(`Security: new ${node.callee.name}() is not allowed`);
  }

  for (const key in node) {
    if (key === "parent" || key === "position") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((child: any) => {
        if (child && typeof child === "object")
          walk(child, blockedGlobals, blockedProperties);
      });
    } else if (value && typeof value === "object") {
      walk(value, blockedGlobals, blockedProperties);
    }
  }
}

export const CreateRemoveDangerousCallsPlugin = (
  blockedGlobals?: string[],
  blockedProperties?: string[],
) => {
  return () => (tree: Node) => {
    walk(
      tree,
      blockedGlobals ?? BLOCKED_GLOBALS,
      blockedProperties ?? BLOCKED_PROPERTIES,
    );
    return tree;
  };
};
