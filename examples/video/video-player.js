import {ComponentDirective} from 'templating';

@ComponentDirective({
  selector: 'video-player',
  bind: {
    'src': 'src'
  },
  query: {
    ':shadow video': 'video'
  },
  shadowDOM: true
})
export class VideoPlayer {
  start() {
    this.video.src = this.src;
    this.video.play();
  }
  stop() {
    this.video.pause();
  }
}
