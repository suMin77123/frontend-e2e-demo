<script lang="ts">
    import { auth } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    
    let email = '';
    let password = '';
    let error = '';
    
    async function handleSubmit() {
        try {
            error = '';
            await auth.login({ email, password });
            goto('/');
        } catch (e) {
            error = e instanceof Error ? e.message : '로그인에 실패했습니다.';
        }
    }
</script>

<div class="container">
    <div class="auth-form">
        <h1>로그인</h1>
        
        {#if error}
            <div class="error">{error}</div>
        {/if}
        
        <form on:submit|preventDefault={handleSubmit}>
            <div class="form-group">
                <label for="email">이메일</label>
                <input
                    type="email"
                    id="email"
                    bind:value={email}
                    required
                    placeholder="이메일을 입력하세요"
                />
            </div>
            
            <div class="form-group">
                <label for="password">비밀번호</label>
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    required
                    placeholder="비밀번호를 입력하세요"
                />
            </div>
            
            <button type="submit">로그인</button>
        </form>
        
        <div class="auth-links">
            <a href="/register">회원가입</a>
        </div>
    </div>
</div>

<style>
    .container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 1rem;
    }
    
    .auth-form {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
    }
    
    h1 {
        text-align: center;
        margin-bottom: 2rem;
        color: #333;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    label {
        display: block;
        margin-bottom: 0.5rem;
        color: #666;
    }
    
    input {
        width: 100%;
        padding: 0.5rem;
        font-size: 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    button {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        color: white;
        background-color: #4CAF50;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 1rem;
    }
    
    button:hover {
        background-color: #45a049;
    }
    
    .error {
        color: #dc3545;
        background-color: #f8d7da;
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }
    
    .auth-links {
        text-align: center;
        margin-top: 1rem;
    }
    
    .auth-links a {
        color: #4CAF50;
        text-decoration: none;
    }
    
    .auth-links a:hover {
        text-decoration: underline;
    }
</style> 