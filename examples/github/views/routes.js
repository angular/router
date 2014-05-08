import {Provide} from 'di';
import {Routes} from '../route';

@Provide(Routes)
export function GhRoutes() {
  return [
    {
      pattern: /detail\/(.*)/,
      params: ['id'],
      element: 'gh-detail'
    },
    {
      pattern: /overview/,
      params: [],
      element: 'gh-overview'
    },
    {
      pattern: /.*/,
      params: [],
      element: 'gh-overview'
    }
  ];
}