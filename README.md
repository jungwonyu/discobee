# DiscoBee Game

Phaser 3 기반 꿀벌 그림 찾기 & 퀴즈 게임입니다. 마우스를 따라 움직이는 꿀벌로 숨겨진 그림을 찾아내고, 퀴즈를 풀어 다양한 메달을 획득하세요!

---


## 📁 프로젝트 구조

```
discobee/
├── assets/          # 게임 에셋
│   ├── img/         # 이미지 파일
│   ├── mp3/         # 사운드 파일
│   └── font/        # 폰트 파일
├── css/             # 스타일시트
├── js/              # JavaScript 소스
│   ├── main.js          # 엔트리 포인트
│   ├── config.js        # 환경설정
│   ├── playSetting.js   # 게임 설정
│   ├── quizData.js      # 퀴즈 데이터
│   ├── utils.js         # 유틸 함수
│   ├── MiniMap.js       # 미니맵/퀴즈버튼/ UI
│   ├── Stage.js         # 게임 맵/타일 관리
│   ├── manager/
│   │   └── BgmManager.js    # BGM 관리
│   ├── scenes/          # Phaser 씬들
│   │   ├── Boot.js          # 부트 씬
│   │   ├── Preloader.js     # 리소스 로딩 씬
│   │   ├── Start.js         # 시작 화면 씬
│   │   ├── Help.js          # 도움말 씬
│   │   ├── Play.js          # 게임 플레이 씬
│   │   ├── Quiz.js          # 퀴즈 씬
│   │   ├── GameOver.js      # 게임 오버 씬
│   │   ├── Medal.js         # 메달 화면 씬
│   │   └── Bgm.js           # BGM 관리 씬
├── dist/            # 빌드 결과물
│   └── bundle.js
├── index.html       # 메인 HTML
├── package.json     # 의존성
├── vite.config.js   # Vite 설정
└── README.md        # 프로젝트 문서
```

---

## 🚀 시작하기

### 필요 조건

- Node.js (v18 이상)
- npm

### 설치 및 실행

```bash
npm install
npm run dev
```

- 개발 서버: `http://localhost:5173`
- 프로덕션 빌드:  
	```bash
	npm run build
	```
	빌드 결과물은 [`dist/bundle.js`](dist/bundle.js )에 생성됩니다.

---

## 🎮 게임 방법

1. **마우스 움직이기**: 꿀벌이 마우스를 따라 이동합니다.
2. **그림 찾기**: 꿀벌이 지나간 자리에 숨겨진 그림이 드러납니다.
3. **퀴즈 도전**: 도전 버튼을 눌러 그림의 정체를 맞추세요.
4. **아이템 획득**: 다양한 아이템으로 특수 효과를 얻으세요.
5. **말벌 주의**: 말벌이나 선에 닿으면 게임 오버!

---

## 🛠 기술 스택

- **Phaser 3.90.0** : 게임 엔진
- **Vite 7.1.1** : 빌드 도구
- **Vanilla JavaScript (ES6 모듈)**

---

## 🎨 주요 기능

- 육각형 기반 게임 맵 및 마스킹
- 마우스 추적, 선 그리기, 꼬리 효과
- 동적 이미지 마스킹 및 퀴즈 시스템
- 메달 수집 및 점령률 표시
- 다양한 아이템 효과 (스피드, 무적, 얼리기)
- BGM 및 효과음
- 반응형 스케일링 지원

---

## 👥 제작

IceCandy