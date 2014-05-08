export class Route {
  constructor({
    definition,
    params = {}
  }) {
    this.definition = definition;
    this.params = params;
  }
}

export function Routes() {
  return [];
}
