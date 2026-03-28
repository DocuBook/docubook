// State machine for CLI flow
export class CLIState {
  constructor(options = {}) {
    this.stage = 'welcome'; // welcome → input → scaffolding → done
    this.projectName = null;
    this.packageManager = null;
    this.template = null;
    this.currentStep = null;
    this.error = null;
    this.history = [];
    this.silent = options.silent || false;
    this.json = options.json || false;
    this.noClear = options.noClear || false;
  }

  setProjectName(name) {
    this.projectName = name;
  }

  setPackageManager(pm) {
    this.packageManager = pm;
  }

  setTemplate(template) {
    this.template = template;
  }

  setStage(stage) {
    this.stage = stage;
  }

  setCurrentStep(step) {
    this.currentStep = step;
    if (step) {
      // Track a compact history of step events (without timestamps)
      const lastStep = this.history[this.history.length - 1];
      if (lastStep !== step) {
        this.history.push(step);
      }
    }
  }

  setError(error) {
    this.error = error;
  }

  reset() {
    this.stage = 'welcome';
    this.projectName = null;
    this.packageManager = null;
    this.template = null;
    this.currentStep = null;
    this.error = null;
  }

  toJSON() {
    return {
      stage: this.stage,
      projectName: this.projectName,
      packageManager: this.packageManager,
      template: this.template,
      error: this.error,
      history: this.history,
    };
  }
}
