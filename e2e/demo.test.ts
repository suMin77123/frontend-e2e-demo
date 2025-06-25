import { test, expect } from '@playwright/test';
import { mockAuthResponse, mockTodos, mockCategories } from './mock-data';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});

test.describe('Visual regression tests', () => {
	test.beforeEach(async ({ context }) => {
		// 모든 API 요청을 가로채서 목 데이터로 응답
		await context.route('**/api/**', async (route) => {
			const url = route.request().url();
			const method = route.request().method();

			if (url.includes('/api/auth/login')) {
				await route.fulfill({ json: mockAuthResponse });
			} else if (url.includes('/api/todos')) {
				if (method === 'GET') {
					await route.fulfill({ json: mockTodos });
				} else if (method === 'POST') {
					const requestBody = JSON.parse(await route.request().postData() || '{}');
					const newTodo = {
						...requestBody,
						id: `todo-${Date.now()}`,
						createdAt: new Date().toISOString(),
						userId: 'user-1'
					};
					await route.fulfill({ json: newTodo });
				}
			} else if (url.includes('/api/todos/categories')) {
				await route.fulfill({ json: mockCategories });
			} else {
				await route.continue();
			}
		});
	});

	test('login page screenshot', async ({ page }) => {
		await page.goto('/login');
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveScreenshot('login.png');
	});

	test('register page screenshot', async ({ page }) => {
		await page.goto('/register');
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveScreenshot('register.png');
	});

	test('todo list page screenshot', async ({ page }) => {
		// 로그인 페이지로 이동
		await page.goto('/login');
		
		// 로그인 폼 작성
		await page.fill('input[type="email"]', 'test@example.com');
		await page.fill('input[type="password"]', 'password123');
		
		// 폼 제출
		await page.click('button[type="submit"]');
		
		// 리다이렉션 대기
		await page.waitForURL('/');
		await page.waitForLoadState('networkidle');
		
		// 스크린샷 생성
		await expect(page).toHaveScreenshot('todo-list.png');
	});
});

test('basic screenshot test', async ({ page }) => {
	// 1. 페이지 이동
	await page.goto('/');
	
	// 2. 페이지가 완전히 로드될 때까지 대기
	await page.waitForLoadState('domcontentloaded');
	await page.waitForLoadState('networkidle');
	
	// 3. 스크린샷 생성
	await expect(page).toHaveScreenshot('home.png');
});
