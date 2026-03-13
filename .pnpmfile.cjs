// Hook to enforce flatted >=3.4.0 to fix DoS vulnerability
// This is applied to all packages with flatted dependency

module.exports = {
  hooks: {
    afterResolve(pkg) {
      if (pkg.dependencies && pkg.dependencies.flatted) {
        pkg.dependencies.flatted = '>=3.4.0';
      }
      return pkg;
    },
  },
};

