# frontend-e2e-demo

## 🎭 Visual Regression Testing with PR Comments

이 프로젝트는 Playwright를 사용한 시각적 회귀 테스트를 제공하며, PR 댓글에서 2-up, Swipe, Onion Skin 방식으로 이미지 변경사항을 확인할 수 있습니다.

## 🚀 기능

- **자동 시각적 회귀 테스트**: PR 생성/업데이트 시 자동으로 실행
- **인터랙티브 이미지 비교**: 3가지 방식으로 변경사항 확인
  - **2-Up**: 기존 이미지와 새 이미지를 나란히 비교
  - **Swipe**: 슬라이더로 드래그하며 변경사항 확인
  - **Onion Skin**: 두 이미지를 겹쳐서 투명도 조절로 차이점 확인
- **PR 댓글 자동 생성**: 시각적 변경사항을 PR 댓글로 자동 알림
- **GitHub Pages 없이 동작**: Imgur를 통한 이미지 호스팅

## ⚙️ 설정 방법

### 1. Imgur API 설정

1. [Imgur](https://imgur.com/)에 로그인합니다.
2. [API 설정 페이지](https://api.imgur.com/)에서 새 애플리케이션을 등록합니다.
3. Client ID를 복사합니다.

### 2. GitHub Secrets 설정

GitHub 저장소 Settings > Secrets and variables > Actions에서 다음 Secret을 추가:

- `IMGUR_CLIENT_ID`: Imgur에서 발급받은 Client ID

### 3. 의존성 설치

```bash
npm install
```

### 4. 테스트 실행

```bash
# 로컬에서 E2E 테스트 실행
npm run test:e2e

# 시각적 리포트 생성 (테스트 실패 후)
npm run visual-report

# PR 댓글 생성 (GitHub Actions에서만 동작)
npm run post-pr-comment
```

## 📁 프로젝트 구조

```
├── .github/workflows/
│   └── visual-regression.yml    # GitHub Actions 워크플로우
├── e2e/
│   ├── demo.test.ts            # Playwright 테스트
│   └── demo.test.ts-snapshots/ # 기준 스크린샷
├── scripts/
│   ├── image-comparison.html   # 이미지 비교 HTML 템플릿
│   ├── generate-visual-report.js # 시각적 리포트 생성 스크립트
│   └── post-pr-comment.js      # PR 댓글 생성 스크립트
└── src/                        # Svelte 애플리케이션
```

## 🔄 워크플로우 동작 방식

1. **PR 생성/업데이트** → GitHub Actions 트리거
2. **Playwright 테스트 실행** → 스크린샷 생성 및 비교
3. **이미지 업로드** → Imgur에 이미지 업로드
4. **HTML 리포트 생성** → 인터랙티브 비교 페이지 생성
5. **PR 댓글 생성** → 결과를 PR에 자동 댓글로 알림
6. **Artifact 업로드** → 모든 결과물을 GitHub Artifacts에 저장

## 🛠️ 사용법

### 시각적 테스트 추가

```javascript
test('새 페이지 스크린샷', async ({ page }) => {
  await page.goto('/new-page');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('new-page.png');
});
```

### 기준 스크린샷 업데이트

```bash
npx playwright test --update-snapshots
```

## 🎯 예시

PR을 생성하면 다음과 같은 댓글이 자동으로 생성됩니다:

![Visual Regression Report 예시](docs/pr-comment-example.png)

## 🔧 커스터마이징

### 이미지 호스팅 서비스 변경

현재는 Imgur를 사용하지만, `scripts/generate-visual-report.js`를 수정하여 다른 서비스로 변경할 수 있습니다:

- Cloudinary
- AWS S3
- Google Cloud Storage
- 기타 이미지 호스팅 서비스

### HTML 템플릿 수정

`scripts/image-comparison.html`을 수정하여 비교 UI를 커스터마이징할 수 있습니다.

## 📝 라이선스

MIT License