const fs = require('fs');
const path = require('path');
const https = require('https');

class PRCommentPoster {
    constructor() {
        this.githubToken = process.env.GITHUB_TOKEN;
        this.repoOwner = process.env.GITHUB_REPOSITORY?.split('/')[0];
        this.repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
        this.prNumber = process.env.GITHUB_PR_NUMBER;

        if (!this.githubToken || !this.repoOwner || !this.repoName || !this.prNumber) {
            console.error('필수 환경변수가 설정되지 않았습니다:');
            console.error('- GITHUB_TOKEN:', !!this.githubToken);
            console.error('- GITHUB_REPOSITORY:', !!process.env.GITHUB_REPOSITORY);
            console.error('- GITHUB_PR_NUMBER:', !!this.prNumber);
            process.exit(1);
        }
    }

    async makeGitHubRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                path: path,
                method: method,
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'User-Agent': 'Visual-Regression-Bot',
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(responseData);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(response);
                        } else {
                            reject(new Error(`GitHub API 오류 (${res.statusCode}): ${response.message}`));
                        }
                    } catch (error) {
                        reject(new Error(`응답 파싱 오류: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`요청 오류: ${error.message}`));
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    async findExistingComment() {
        try {
            const comments = await this.makeGitHubRequest(
                `/repos/${this.repoOwner}/${this.repoName}/issues/${this.prNumber}/comments`
            );

            return comments.find(comment => 
                comment.body.includes('🎭 Visual Regression Report') &&
                comment.user.login === 'github-actions[bot]'
            );
        } catch (error) {
            console.error('기존 댓글 찾기 실패:', error.message);
            return null;
        }
    }

    generateCommentBody(summary) {
        const commitSha = process.env.GITHUB_SHA?.substring(0, 7) || 'N/A';
        const runId = process.env.GITHUB_RUN_ID;
        const artifactUrl = runId ? 
            `https://github.com/${this.repoOwner}/${this.repoName}/actions/runs/${runId}` : 
            '#';

        if (!summary.hasChanges) {
            return `## 🎭 Visual Regression Report

✅ **모든 시각적 테스트가 통과했습니다!**

📋 **세부 정보:**
- 커밋: \`${commitSha}\`
- 검사 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
- [전체 테스트 결과 보기](${artifactUrl})

---
*이 댓글은 GitHub Actions에 의해 자동으로 생성되었습니다.*`;
        }

        let commentBody = `## 🎭 Visual Regression Report

⚠️ **${summary.changeCount}개의 시각적 변경사항이 발견되었습니다.**

📋 **세부 정보:**
- 커밋: \`${commitSha}\`
- 검사 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

## 📸 변경된 스크린샷

`;

        // 각 변경사항에 대한 링크 생성
        summary.reports.forEach((report, index) => {
            const artifactPath = report.htmlPath.replace(/\\/g, '/');
            commentBody += `### ${index + 1}. ${report.testName}

🔗 **[2-up | Swipe | Onion Skin 비교 보기](${artifactUrl})**

`;
        });

        commentBody += `
## 🔍 비교 방법

생성된 HTML 리포트에서 다음 3가지 방식으로 이미지를 비교할 수 있습니다:

- **2-Up**: 기존 이미지와 새 이미지를 나란히 비교
- **Swipe**: 슬라이더로 드래그하며 변경사항 확인  
- **Onion Skin**: 두 이미지를 겹쳐서 투명도 조절로 차이점 확인

## 📁 다운로드

[📦 전체 Visual Report 다운로드](${artifactUrl})

---
*이 댓글은 GitHub Actions에 의해 자동으로 생성되었습니다.*`;

        return commentBody;
    }

    async postOrUpdateComment() {
        try {
            // 요약 정보 읽기
            const summaryPath = path.join('visual-reports', 'summary.json');
            if (!fs.existsSync(summaryPath)) {
                console.log('요약 정보 파일이 없습니다. 댓글을 생성하지 않습니다.');
                return;
            }

            const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
            const commentBody = this.generateCommentBody(summary);

            // 기존 댓글 찾기
            const existingComment = await this.findExistingComment();

            if (existingComment) {
                // 기존 댓글 업데이트
                console.log('기존 댓글을 업데이트합니다...');
                await this.makeGitHubRequest(
                    `/repos/${this.repoOwner}/${this.repoName}/issues/comments/${existingComment.id}`,
                    'PATCH',
                    { body: commentBody }
                );
                console.log('✅ 댓글이 성공적으로 업데이트되었습니다!');
                console.log(`🔗 댓글 링크: ${existingComment.html_url}`);
            } else {
                // 새 댓글 생성
                console.log('새 댓글을 생성합니다...');
                const newComment = await this.makeGitHubRequest(
                    `/repos/${this.repoOwner}/${this.repoName}/issues/${this.prNumber}/comments`,
                    'POST',
                    { body: commentBody }
                );
                console.log('✅ 댓글이 성공적으로 생성되었습니다!');
                console.log(`🔗 댓글 링크: ${newComment.html_url}`);
            }

        } catch (error) {
            console.error('❌ 댓글 생성/업데이트 실패:', error.message);
            process.exit(1);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const poster = new PRCommentPoster();
    poster.postOrUpdateComment();
}

module.exports = PRCommentPoster; 