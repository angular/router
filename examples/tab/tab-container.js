import {ComponentDirective} from 'templating';

@ComponentDirective({
  selector: 'tab-container',
  observe: {
    'tabs': 'tabsChanged'
  },
  shadowDOM: true,
  query: {
    'tabpane[]': 'tabs'
  }
})
export class TabContainer {
  constructor() {
    // TODO: This is needed as ngRepeat creates a child object as execution context.
    // when an expression in that child object is evaluated we
    // get that child object as current "this", and not our original "this"
    this.select = this.select.bind(this);
  }
  selectFirstTab() {
    if (!this.tabs) {
      return;
    }
    var oneSelected = false;
    this.tabs.forEach((tab) => {
      oneSelected = oneSelected || tab.selected;
    })
    if (!oneSelected && this.tabs.length) {
      this.select(this.tabs[0]);
    }
  }
  tabsChanged(tabs) {
    this.selectFirstTab();
  }
  select(tab) {
    if (this.selectedTab) {
      this.selectedTab.selected = false;
    }
    this.selectedTab = tab;
    tab.selected = true;
  }
}
