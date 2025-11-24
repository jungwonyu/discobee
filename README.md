# DiscoBee Game

Phaser 3 기반의 꿀벌 게임입니다. 마우스를 따라다니는 꿀벌로 숨겨진 그림을 찾아내고 퀴즈를 풀어 메달을 획득하세요!

## 📁 프로젝트 구조

```
discobee/
├── assets/          # 게임 에셋
│   ├── img/        # 이미지 파일
│   ├── mp3/        # 사운드 파일
│   └── font/       # 폰트 파일
├── css/            # 스타일시트
├── js/             # JavaScript 소스 파일
│   ├── scenes/          # Phaser 씬들
│   │   ├── Boot.js           # 부트 씬
│   │   ├── Preloader.js      # 리소스 로딩 씬
│   │   ├── Start.js          # 시작 화면 씬
│   │   ├── Play.js           # 게임 플레이 씬
│   │   ├── Quiz.js           # 퀴즈 씬
│   │   ├── GameOver.js       # 게임 오버 씬
│   │   ├── Medal.js          # 메달 화면 씬
│   │   └── Bgm.js            # BGM 관리 씬
│   ├── HelpUI.js        # 도움말 UI 클래스
│   ├── playSetting.js   # 게임 설정
│   ├── quizData.js      # 퀴즈 데이터
│   └── main.js          # 메인 엔트리 포인트
├── dist/           # 빌드 결과물
│   └── bundle.js   # 번들링된 JS 파일 (41KB)
├── index.html      # 메인 HTML 파일
├── package.json    # 프로젝트 의존성
├── vite.config.js  # Vite 설정
└── README.md       # 프로젝트 문서
```

## 🚀 시작하기

### 필요 조건

- Node.js (v18 이상 권장)
- npm

### 설치

```bash
npm install
```

### 개발 모드 실행

```bash
npm run dev
```

Vite 개발 서버가 실행되며 `http://localhost:5173`에서 확인할 수 있습니다.

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/bundle.js`에 생성됩니다.

## 🎮 게임 방법

1. **마우스 움직이기**: 마우스를 움직이면 꿀벌이 따라옵니다
2. **그림 찾기**: 꿀벌이 지나간 자리에 숨겨진 그림이 드러납니다
3. **퀴즈 도전**: 도전하기 버튼을 눌러 그림의 정체를 맞추세요
4. **아이템 획득**: 다양한 아이템으로 특수 효과를 얻을 수 있습니다
5. **말벌 주의**: 말벌과 부딪히거나 선에 닿으면 게임 오버!

## 🛠 기술 스택

- **Phaser 3.90.0** - 게임 엔진
- **Vite 7.1.1** - 빌드 도구
- **Vanilla JavaScript** - ES6 모듈

## 📝 개발/프로덕션 모드 전환

`index.html`에서 스크립트 주석을 변경하여 모드를 전환할 수 있습니다:

**개발 모드:**
```html
<script type="module" src="./js/main.js"></script>
<!-- <script src="./dist/bundle.js"></script> -->
```

**프로덕션 모드:**
```html
<!-- <script type="module" src="./js/main.js"></script> -->
<script src="./dist/bundle.js"></script>
```

## 🎨 주요 기능

- 육각형 기반 게임 맵
- 마우스 추적 및 선 그리기
- 동적 이미지 마스킹
- 퀴즈 시스템
- 메달 수집 시스템
- 아이템 효과 (스피드, 무적, 얼리기)
- BGM 및 효과음
- 반응형 스케일링

## 👥 제작

IceCandy 