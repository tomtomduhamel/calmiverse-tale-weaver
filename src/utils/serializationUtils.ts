// Utilitaires de sérialisation
export function isObjectClonable(obj: any): boolean {
  try {
    structuredClone(obj);
    return true;
  } catch {
    return false;
  }
}

export function handleSpecialTypes(value: any, depth: number, maxDepth: number): any {
  if (depth > maxDepth) {
    return "[Max depth reached]";
  }

  if (value instanceof Error) {
    return {
      _type: "Error",
      name: value.name,
      message: value.message,
      stack: value.stack
    };
  }

  if (value instanceof Set) {
    return {
      _type: "Set",
      values: Array.from(value).map(v => handleSpecialTypes(v, depth + 1, maxDepth))
    };
  }

  if (value instanceof Map) {
    return {
      _type: "Map",
      entries: Array.from(value.entries()).map(([k, v]) => [
        handleSpecialTypes(k, depth + 1, maxDepth),
        handleSpecialTypes(v, depth + 1, maxDepth)
      ])
    };
  }

  return value;
}