import {Provide, Inject} from 'di';
import {ComponentLoader} from 'templating';
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
  @Inject(ComponentLoader)
  constructor(componentLoader){
    this.componentLoader = componentLoader;
  }

  build(componentLoader, viewFactory) {
    return new Pipeline()
      .withStep(new BuildNavigationPlanStep())
      .withStep(new CanDeactivatePreviousStep()) //optional
      .withStep(new LoadNewComponentsStep(this.componentLoader))
      .withStep(new ApplyModelBindersStep()) //optional
      .withStep(new CanActivateNextStep()) //optional
      //NOTE: app state changes start below - point of no return
      .withStep(new DeactivatePreviousStep()) //optional
      .withStep(new ActivateNextStep()) //optional
      .withStep(new CommitChangesStep());
  }
}