export default class HelpUI {
  constructor() {
    this.init();
  }

  init() {
    // DOM이 준비될 때까지 대기
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.helpBox = document.querySelector('.helpBox');
    this.closeBtn = document.querySelector('.closeBtn');
    this.prevBtn = document.querySelector('.prevBtn');
    this.nextBtn = document.querySelector('.nextBtn');
    this.canvas = document.querySelector('canvas');
    this.videos = document.querySelectorAll('video');
    this.videoBtns = document.querySelectorAll('.videoBtn');
    this.slideBox = document.querySelector('.slideBox');
    this.page = document.querySelector('.page');

    this.addEventListeners();
  }

  addEventListeners() {
    this.closeBtn.addEventListener('click', () => {
      this.helpBox.style.top = `-${this.canvas.style.height}`;
      this.slideBox.scrollLeft = 0;
      this.videoSet();
    });

    /* 슬라이드 */
    this.prevBtn.addEventListener('click', () => {
      this.slideBox.scrollBy({ left: -this.page.clientWidth, behavior: 'smooth' });
      this.videoSet();
    });
    
    this.nextBtn.addEventListener('click', () => {
      this.slideBox.scrollBy({ left: this.page.clientWidth, behavior: 'smooth' });
      this.videoSet();
    });

    this.videos.forEach(video => {
      this.eventHover(video);
      video.addEventListener('mouseover', () => {
        video.nextElementSibling.classList.add('hover');
      });
      video.addEventListener('mouseout', () => {
        video.nextElementSibling.classList.remove('hover');
      });
    });

    this.videoBtns.forEach(btn => {
      this.eventHover(btn);
      btn.addEventListener('mouseover', () => {
        btn.previousElementSibling.classList.add('hover');
      });
      btn.addEventListener('mouseout', () => {
        btn.previousElementSibling.classList.remove('hover');
      });
      btn.addEventListener('click', () => {
        if (btn.previousElementSibling.paused) {
          btn.previousElementSibling.play();
          btn.classList.remove('play', 'pause');
          btn.classList.add('play');
        } else {
          btn.previousElementSibling.pause();
          btn.classList.remove('play', 'pause');
          btn.classList.add('pause');
        }
      });
    });

    this.eventHover(this.closeBtn);
    this.eventHover(this.prevBtn);
    this.eventHover(this.nextBtn);
  }

  videoSet() {
    this.videos.forEach(video => {
      video.pause();
      video.currentTime = 0;
    });
  }

  eventHover(DOM, className = 'hover') {
    DOM.addEventListener('mouseover', () => {
      DOM.classList.add(className);
    });
    DOM.addEventListener('mouseout', () => {
      DOM.classList.remove(className);
    });
  }
}
