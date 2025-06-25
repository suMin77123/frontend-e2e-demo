const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

class VisualReportGenerator {
    constructor() {
        this.imgurClientId = process.env.IMGUR_CLIENT_ID;
        if (!this.imgurClientId) {
            console.error('IMGUR_CLIENT_ID 환경변수가 설정되지 않았습니다.');
            process.exit(1);
        }
    }

    async uploadToImgur(imagePath) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(imagePath)) {
                console.log(`이미지 파일이 존재하지 않습니다: ${imagePath}`);
                return resolve(null);
            }

            const form = new FormData();
            form.append('image', fs.createReadStream(imagePath));

            const options = {
                hostname: 'api.imgur.com',
                path: '/3/image',
                method: 'POST',
                headers: {
                    'Authorization': `Client-ID ${this.imgurClientId}`,
                    ...form.getHeaders()
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.success) {
                            console.log(`✅ 이미지 업로드 성공: ${path.basename(imagePath)} -> ${response.data.link}`);
                            resolve(response.data.link);
                        } else {
                            console.error(`❌ 이미지 업로드 실패: ${response.data.error}`);
                            reject(new Error(response.data.error));
                        }
                    } catch (error) {
                        console.error(`❌ 응답 파싱 오류: ${error.message}`);
                        reject(error);
                    }
                });
            });

            req.on('error', (error) => {
                console.error(`❌ 요청 오류: ${error.message}`);
                reject(error);
            });

            form.pipe(req);
        });
    }

    async findTestResults() {
        const testResultsDir = 'test-results';
        const results = [];

        if (!fs.existsSync(testResultsDir)) {
            console.log('test-results 디렉토리가 존재하지 않습니다.');
            return results;
        }

        const testDirs = fs.readdirSync(testResultsDir)
            .filter(dir => fs.statSync(path.join(testResultsDir, dir)).isDirectory());

        for (const testDir of testDirs) {
            const testPath = path.join(testResultsDir, testDir);
            const files = fs.readdirSync(testPath);
            
            // 스크린샷 파일들을 찾기
            const screenshots = files.filter(file => 
                file.endsWith('.png') && !file.includes('-previous') && !file.includes('-diff')
            );

            for (const screenshot of screenshots) {
                const baseName = screenshot.replace('.png', '');
                const expectedPath = path.join('e2e', `${testDir}.test.ts-snapshots`, screenshot);
                const actualPath = path.join(testPath, screenshot);
                const diffPath = path.join(testPath, `${baseName}-diff.png`);

                // 이미지가 실제로 다른지 확인 (diff 파일이 있는지)
                const hasDiff = fs.existsSync(diffPath);

                if (hasDiff || !fs.existsSync(expectedPath)) {
                    results.push({
                        testName: `${testDir} - ${baseName}`,
                        expectedPath: fs.existsSync(expectedPath) ? expectedPath : null,
                        actualPath: actualPath,
                        diffPath: hasDiff ? diffPath : null,
                        hasChanges: true
                    });
                }
            }
        }

        return results;
    }

    async generateReport() {
        console.log('🔍 테스트 결과 찾는 중...');
        const testResults = await this.findTestResults();

        if (testResults.length === 0) {
            console.log('✅ 시각적 변경사항이 없습니다!');
            return this.generateNoChangesReport();
        }

        console.log(`📸 ${testResults.length}개의 시각적 변경사항을 발견했습니다.`);

        // HTML 템플릿 읽기
        const templatePath = path.join(__dirname, 'image-comparison.html');
        let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

        const reports = [];

        for (const result of testResults) {
            console.log(`\n처리 중: ${result.testName}`);

            try {
                // 이미지들을 Imgur에 업로드
                const [expectedUrl, actualUrl, diffUrl] = await Promise.all([
                    result.expectedPath ? this.uploadToImgur(result.expectedPath) : null,
                    this.uploadToImgur(result.actualPath),
                    result.diffPath ? this.uploadToImgur(result.diffPath) : null
                ]);

                // HTML 생성
                let html = htmlTemplate
                    .replace(/\{\{PR_NUMBER\}\}/g, process.env.GITHUB_PR_NUMBER || 'N/A')
                    .replace(/\{\{COMMIT_SHA\}\}/g, process.env.GITHUB_SHA?.substring(0, 7) || 'N/A')
                    .replace(/\{\{testName\}\}/g, result.testName)
                    .replace(/\{\{expectedImage\}\}/g, expectedUrl || actualUrl)
                    .replace(/\{\{actualImage\}\}/g, actualUrl)
                    .replace(/\{\{diffImage\}\}/g, diffUrl || '');

                // Handlebars 스타일 조건문 처리
                html = html.replace(/\{\{#if hasChanges\}\}/g, '');
                html = html.replace(/\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, '');
                html = html.replace(/\{\{\/if\}\}/g, '');

                if (diffUrl) {
                    html = html.replace(/\{\{#if diffImage\}\}/g, '');
                    html = html.replace(/\{\{\/if\}\}/g, '');
                } else {
                    html = html.replace(/\{\{#if diffImage\}\}[\s\S]*?\{\{\/if\}\}/g, '');
                }

                // 파일 저장
                const outputPath = path.join('visual-reports', `${result.testName.replace(/[^a-zA-Z0-9-]/g, '-')}.html`);
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                fs.writeFileSync(outputPath, html);

                reports.push({
                    testName: result.testName,
                    htmlPath: outputPath,
                    expectedUrl,
                    actualUrl,
                    diffUrl
                });

                console.log(`✅ 리포트 생성 완료: ${outputPath}`);

            } catch (error) {
                console.error(`❌ ${result.testName} 처리 중 오류:`, error.message);
            }
        }

        // 요약 정보 생성
        this.generateSummary(reports);
        return reports;
    }

    generateNoChangesReport() {
        const templatePath = path.join(__dirname, 'image-comparison.html');
        let html = fs.readFileSync(templatePath, 'utf8');

        html = html
            .replace(/\{\{PR_NUMBER\}\}/g, process.env.GITHUB_PR_NUMBER || 'N/A')
            .replace(/\{\{COMMIT_SHA\}\}/g, process.env.GITHUB_SHA?.substring(0, 7) || 'N/A')
            .replace(/\{\{#if hasChanges\}\}[\s\S]*?\{\{else\}\}/g, '')
            .replace(/\{\{\/if\}\}/g, '');

        const outputPath = path.join('visual-reports', 'no-changes.html');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, html);

        console.log(`✅ 변경사항 없음 리포트 생성: ${outputPath}`);
        return [];
    }

    generateSummary(reports) {
        const summary = {
            hasChanges: reports.length > 0,
            changeCount: reports.length,
            reports: reports.map(r => ({
                testName: r.testName,
                htmlPath: r.htmlPath
            })),
            timestamp: new Date().toISOString()
        };

        const summaryPath = path.join('visual-reports', 'summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`📊 요약 정보 생성: ${summaryPath}`);
    }
}

// 스크립트 실행
if (require.main === module) {
    const generator = new VisualReportGenerator();
    generator.generateReport().catch(error => {
        console.error('❌ 리포트 생성 실패:', error.message);
        process.exit(1);
    });
}

module.exports = VisualReportGenerator; 