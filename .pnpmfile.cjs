// Hook to enforce flatted >=3.4.0 only in packages that actually use it
// This is more efficient than global overrides which force full resolution

function afterResolve(pkg, context) {
  // Only override flatted version in packages that depend on it directly
  if (pkg.dependencies && pkg.dependencies.flatted) {
    pkg.dependencies.flatted = '>=3.4.0';
  }
  return pkg;
}

module.exports = {
  hooks: {
    afterResolve,
  },
};
