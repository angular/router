import {Injector} from 'di';
import {Pipeline} from './pipeline';
import {BuildNavigationPlanStep} from './navigationPlan';
import {ApplyModelBindersStep} from './modelBinding';
import {LoadNewComponentsStep} from './componentLoading';
import {CommitChangesStep} from './navigationContext';
import {
  CanDeactivatePreviousStep,
  CanActivateNextStep,
  DeactivatePreviousStep,
  ActivateNextStep
} from './activation';

export class PipelineProvider {
  constructor(injector:Injector){
    this.injector = injector;
    this.steps = [
      BuildNavigationPlanStep,
      CanDeactivatePreviousStep, //optional
      LoadNewComponentsStep,
      ApplyModelBindersStep, //optional
      CanActivateNextStep, //optional
      //NOTE: app state changes start below - point of no return
      DeactivatePreviousStep, //optional
      ActivateNextStep, //optional
      CommitChangesStep
    ];
  }

  createPipeline(navigationContext) {
    var pipeline = new Pipeline();
    this.steps.forEach(step => pipeline.withStep(this.injector.get(step)));
    return pipeline;
  }
}