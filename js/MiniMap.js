
import { getMedalNumber, addHoverEffectFrame } from './utils.js';

/**
 * MiniMap 클래스
 * - 게임 내 미니맵, 퀴즈 버튼, 메달 아이콘 등 UI를 관리
 * - 스냅샷(QuizScene 전환) 기능도 담당
 */
export default class MiniMap {
	/**
	 * 원본 비율을 유지하며 최대 크기 내에 맞추는 사이즈 계산
	 * @param {number} sourceWidth - 원본 너비
	 * @param {number} sourceHeight - 원본 높이
	 * @param {number} maxWidth - 최대 허용 너비
	 * @param {number} maxHeight - 최대 허용 높이
	 */
	static getFittedSize(sourceWidth, sourceHeight, maxWidth, maxHeight) {
		const aspectRatio = sourceWidth / sourceHeight;
		let fittedWidth = maxWidth;
		let fittedHeight = fittedWidth / aspectRatio;

		if (fittedHeight > maxHeight) {
			fittedHeight = maxHeight;
			fittedWidth = fittedHeight * aspectRatio;
		}
		return { w: fittedWidth, h: fittedHeight };
	}

	/**
	 * MiniMap 생성자
	 * @param {Phaser.Scene} scene - 미니맵을 표시할 상위 씬(PlayScene)
	 */
	constructor(scene) {
		this.scene = scene;
		this.minimapCam = null;   // Phaser 카메라(미니맵)
		this.quizButton = null;   // 퀴즈 버튼
		this.medalIcon = null;    // 메달 아이콘
		this.createMinimap();
	}

	/**
	 * 미니맵, 퀴즈 버튼, 메달 아이콘 등 UI 요소를 생성하고 배치
	 * - 미니맵 카메라, 퀴즈 버튼, 메달 아이콘을 생성 및 배치
	 * - 퀴즈 버튼 클릭 시 snapshot() 호출 이벤트 연결
	 */
	createMinimap() {
		const scene = this.scene;
		const pad = 10;
		const maxW = 250;
    const maxH = 250;
		const sourceW = scene.world.w;
		const sourceH = scene.world.h;

		// 미니맵 크기 계산 (비율 유지, 최대 크기 제한)
		const { w: miniW, h: miniH } = MiniMap.getFittedSize(sourceW, sourceH, maxW, maxH);
		const vx = scene.scale.width - miniW - pad;
		const vy = pad;
		const zoom = miniW / sourceW;

		// 미니맵 카메라 생성
		this.minimapCam = scene.cameras.add(vx, vy, miniW, miniH).setBounds(0, 0, sourceW, sourceH).setZoom(zoom).setName('minimap');

		// UI 생성 (버튼/메달)
		this.createQuizButtonAndMedal({ vx, vy, miniW, miniH });

		// 미니맵 카메라에서 hexa(기본 육각형) 타일만 무시(딤은 포함)
		if (scene.hexagonList && Array.isArray(scene.hexagonList)) {
			const hexas = scene.hexagonList.filter(hex => hex.texture && hex.texture.key === 'hexagon');
			this.minimapCam.ignore([...hexas, this.quizButton, this.medalIcon]);
		}

		// PlayScene에서 메달 아이콘 참조 가능하도록 연결
		scene.medalIcon = this.medalIcon;
	}

	/**
	 * 퀴즈 버튼, 메달 아이콘 생성 및 배치
	 */
	createQuizButtonAndMedal({ vx, vy, miniW, miniH }) {
		const BUTTON_SCALE = 0.6667;
		const BUTTON_OFFSET_Y = 50;
		const MEDAL_OFFSET_X = -220;
		const MEDAL_SCALE = 0.7;
		const scene = this.scene;

		// 퀴즈 버튼
		const buttonX = vx + miniW / 2;
		const buttonY = vy + miniH + BUTTON_OFFSET_Y;
		this.quizButton = scene.add.image(buttonX, buttonY, 'quiz_start').setScale(BUTTON_SCALE).setScrollFactor(0).setDepth(9999).setInteractive({ useHandCursor: true });
    addHoverEffectFrame(this.quizButton);
		this.quizButton.on('pointerdown', this.snapshot, this);

		// 메달 아이콘
		const medalNumber = getMedalNumber(this.hexagonPercent());
		const medalKey = `medal_${medalNumber}`;
		const medalX = buttonX + this.quizButton.displayWidth / 2 + MEDAL_OFFSET_X;
		const medalY = buttonY;
		this.medalIcon = scene.add.image(medalX, medalY, medalKey).setScale(MEDAL_SCALE).setScrollFactor(0).setDepth(9999);
	}

	/**
	 * 퀴즈 버튼 클릭 시 호출
	 */
	snapshot() {
		const scene = this.scene;
		const mainCam = scene.cameras.main;

		// 1. 게임 일시 정지
		scene.scene.pause();
		document.querySelector('canvas').style.opacity = '0';

		// 2. 요소 숨기기
		const itemGroup = scene.itemManager?.items || scene.items;
		const effects = scene.activeEffects || [];
		const toHide = [scene.player, scene.enemies, this.minimapCam, this.quizButton, itemGroup, scene.trailGraphics, ...effects];
		const toHideHex = scene.stage.hexagonList.filter(tile => tile.visible !== false && tile.texture && tile.texture.key !== 'limit');
		const toHideBgDim = [scene.stage.bgDim];
		[...toHide, ...toHideHex, ...toHideBgDim].forEach(obj => obj && obj.setVisible(false));

		// 3. quizBg의 mask 잠시 해제
		let quizBg = scene.stage && scene.stage.quizBg;
		let originalMask = null;
		if (quizBg && quizBg.mask) {
			originalMask = quizBg.mask;
			quizBg.setMask(null);
		}

		// 4. 카메라 줌/스크롤 설정
		const originalZoom = mainCam.zoom;
		const zoomX = scene.canvasSize.w / scene.world.w;
		const zoomY = scene.canvasSize.h / scene.world.h;
		const newZoom = Math.min(zoomX, zoomY);
		mainCam.stopFollow().setZoom(newZoom).setScroll(0, 0);

		// 5. 첫 번째 스냅샷 찍기
		scene.game.renderer.snapshot(snapshotNoHexagon => {
			if (quizBg && originalMask) quizBg.setMask(originalMask);
			// 다음 프레임에 두 번째 스냅샷 찍기
			setTimeout(() => {
				scene.game.renderer.snapshot(snapshotImage => {
					[...toHide, ...toHideHex, ...toHideBgDim].forEach(obj => obj && obj.setVisible(true));
					mainCam.setZoom(originalZoom).startFollow(scene.player);

					if (scene.textures.exists('worldSnapshot')) scene.textures.remove('worldSnapshot');
					if (scene.textures.exists('worldSnapshotNoHexagon')) scene.textures.remove('worldSnapshotNoHexagon');
					scene.textures.addImage('worldSnapshot', snapshotImage);
					scene.textures.addImage('worldSnapshotNoHexagon', snapshotNoHexagon);

					// QuizScene으로 전환
					scene.scene.launch('QuizScene', { quiz: scene.quiz, allQuizzes: scene.allQuizzes, canvasSize: scene.canvasSize, medalNumber: getMedalNumber(this.hexagonPercent()) });
				});
			}, 0);
		});
	}

	hexagonPercent() {
		const hexagonList = this.scene.hexagonList;
		const totalPlayableTiles = hexagonList.filter(hex => hex.texture.key !== 'limit').length;
		const myHexagonTiles = hexagonList.filter(hex => hex.texture.key === 'my_hexagon').length;
		if (totalPlayableTiles === 0) return 0;
		return Math.floor((myHexagonTiles / totalPlayableTiles) * 100);
	}

	/**
	 * 메달 아이콘의 텍스처를 현재 점령률에 맞게 갱신
	 */
	updateMedal() {
		if (this.medalIcon) {
			const medalNumber = getMedalNumber(this.hexagonPercent());
			const medalKey = `medal_${medalNumber}`;
			this.medalIcon.setTexture(medalKey);
		}
	}
}