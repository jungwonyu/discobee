
/**
 * 전체 화면을 덮는 반투명 오버레이를 생성
 * 
 * @param {Phaser.Scene} scene - 오버레이를 추가할 씬
 * @param {number} color - 오버레이 색상 (기본값: 0x000000 검은색)
 * @param {number} alpha - 투명도 (0~1, 기본값: 0.5)
 * @returns {Phaser.GameObjects.Rectangle} Rectangle 오버레이 객체
 */
export const createOverlay = (scene, color = 0x000000, alpha = 0.5) => {
  const { width, height } = scene.sys.game.config;
  return scene.add.rectangle(0, 0, width, height, color, alpha).setOrigin(0, 0).setDepth(0);
};

/**
 * 버튼에 호버 효과를 추가
 * 
 * @param {Phaser.GameObjects.Image} button - 효과를 적용할 버튼 이미지
 * @param {string} normalKey - 기본 상태의 텍스처 키
 * @param {string} [hoverKey] - 호버 상태의 텍스처 키 (생략 시 normalKey_h 사용)
 */
export const addHoverEffect = (button, normalKey, hoverKey) => {
  const hover = hoverKey || `${normalKey}_h`;
  const scene = button.scene;

  // 텍스처 존재 확인
  if (!scene.textures.exists(normalKey) || !scene.textures.exists(hover)) return;

  button.on('pointerover', () => button.setTexture(hover));
  button.on('pointerout', () => button.setTexture(normalKey));
};

/**
 * 버튼에 프레임 기반 호버 효과를 추가
 */
export const addHoverEffectFrame = (button) => {
  button.on('pointerover', () => button.setFrame(1));
  button.on('pointerout', () => button.setFrame(0));
};

/**
 * 점수 퍼센트에 따라 메달 등급을 반환
 * @param {number} percent - 점수 퍼센트 (0~100)
 * @returns {number} 메달 등급 (1: 다이아몬드, 2: 금, 3: 은, 4: 동)
 */
export const getMedalNumber = (percent) => {
  if (percent <= 5) return 1;
  if (percent <= 15) return 2;
  if (percent <= 30) return 3;
  return 4;
};