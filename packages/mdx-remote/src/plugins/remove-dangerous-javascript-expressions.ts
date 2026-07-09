import type { Node } from "unist";

const BLOCKED_GLOBALS = [
  "eval",
  "Function",
  "AsyncFunction",
  "GeneratorFunction",
  "require",
  "process",
  "global",
  "globalThis",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "child_process",
  "fs",
  "net",
  "http",
  "https",
  "vm",
  "worker_threads",
  "Reflect",
];

const BUILTIN_CONSTRUCTORS = [
  "Object", "Array", "String", "Number", "Boolean",
  "Symbol", "Error", "Date", "RegExp", "Promise",
  "Proxy", "Reflect", "WeakMap", "WeakSet", "Map", "Set",
];

const BLOCKED_PROPERTIES = [
  "constructor", "prototype", "__proto__", "eval",
  "Reflect", "Function", "AsyncFunction",
  "GeneratorFunction", "require",
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

  if (
    node.type === "CallExpression" &&
    node.callee?.type === "Identifier" &&
    blockedGlobals.includes(node.callee.name)
  ) {
    throw new Error(`Security: ${node.callee.name}() calls are not allowed`);
  }

  if (
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    node.callee.computed &&
    node.callee.object?.type === "Identifier" &&
    blockedGlobals.includes(node.callee.object.name)
  ) {
    throw new Error(
      `Security: Function calls on computed properties of '${node.callee.object.name}' are not allowed`,
    );
  }

  if (
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    node.callee.computed &&
    node.callee.object?.type === "Identifier" &&
    BUILTIN_CONSTRUCTORS.includes(node.callee.object.name)
  ) {
    throw new Error(
      `Security: Function calls on computed properties of '${node.callee.object.name}' are not allowed`,
    );
  }

  if (node.type === "MemberExpression") {
    const prop = node.property;
    if (
      prop?.type === "Identifier" &&
      !node.computed &&
      blockedProperties.includes(prop.name)
    ) {
      throw new Error(`Security: .${prop.name} access is not allowed`);
    }
    if (
      prop?.type === "Literal" &&
      blockedProperties.includes(String(prop.value))
    ) {
      throw new Error(`Security: ["${prop.value}"] access is not allowed`);
    }
    if (
      node.computed &&
      node.object?.type === "Identifier" &&
      blockedGlobals.includes(node.object.name)
    ) {
      throw new Error(
        `Security: Computed property access on '${node.object.name}' is not allowed`,
      );
    }
    if (
      node.object?.type === "Identifier" &&
      blockedGlobals.includes(node.object.name)
    ) {
      throw new Error(
        `Security: Access to '${node.object.name}' properties is not allowed`,
      );
    }
  }

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
        if (child && typeof child === "object") walk(child, blockedGlobals, blockedProperties);
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
    walk(tree, blockedGlobals ?? BLOCKED_GLOBALS, blockedProperties ?? BLOCKED_PROPERTIES);
    return tree;
  };
};
