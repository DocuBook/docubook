// State machine for CLI flow
export class CLIState {
  constructor() {
    this.stage = 'welcome'; // welcome → input → scaffolding → done
    this.projectName = null;
    this.packageManager = null;
    this.template = null;
    this.currentStep = null;
    this.error = null;
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
}
