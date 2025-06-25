<script lang="ts">
    import { onMount } from 'svelte';
    import { todos } from '$lib/stores/todo';
    import { auth } from '$lib/stores/auth';
    import type { Todo, TodoFilter } from '$lib/types';
    import { goto } from '$app/navigation';
    
    let newTodoTitle = '';
    let newTodoCategory = '';
    let newTodoDueDate = '';
    let categories: string[] = [];
    let filter: TodoFilter = {};
    let loading = true;
    let error = '';
    
    onMount(async () => {
        if (!$auth) {
            goto('/login');
            return;
        }
        
        try {
            await loadData();
        } catch (e) {
            error = e instanceof Error ? e.message : '데이터를 불러오는데 실패했습니다.';
        } finally {
            loading = false;
        }
    });
    
    async function loadData() {
        await Promise.all([
            todos.load(filter),
            loadCategories()
        ]);
    }
    
    async function loadCategories() {
        try {
            categories = await todos.getCategories();
        } catch (e) {
            console.error('카테고리 목록을 불러오는데 실패했습니다:', e);
        }
    }
    
    async function handleSubmit() {
        if (!newTodoTitle.trim()) return;
        
        try {
            await todos.add({
                title: newTodoTitle.trim(),
                completed: false,
                ...(newTodoCategory && { category: newTodoCategory }),
                ...(newTodoDueDate && { dueDate: new Date(newTodoDueDate).toISOString() })
            });
            
            newTodoTitle = '';
            newTodoCategory = '';
            newTodoDueDate = '';
        } catch (e) {
            error = e instanceof Error ? e.message : '할 일을 추가하는데 실패했습니다.';
        }
    }
    
    async function handleToggle(todo: Todo) {
        try {
            await todos.toggleComplete(todo.id);
        } catch (e) {
            error = e instanceof Error ? e.message : '상태를 변경하는데 실패했습니다.';
        }
    }
    
    async function handleDelete(todo: Todo) {
        try {
            await todos.remove(todo.id);
        } catch (e) {
            error = e instanceof Error ? e.message : '할 일을 삭제하는데 실패했습니다.';
        }
    }
    
    async function handleFilterChange() {
        try {
            loading = true;
            await todos.load(filter);
        } catch (e) {
            error = e instanceof Error ? e.message : '필터를 적용하는데 실패했습니다.';
        } finally {
            loading = false;
        }
    }
    
    async function handleLogout() {
        await auth.logout();
        goto('/login');
    }
    
    function formatDate(date: string) {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
</script>

<div class="container">
    <header class="header">
        <h1>Todo List</h1>
        <button class="logout-button" on:click={handleLogout}>로그아웃</button>
    </header>
    
    {#if error}
        <div class="error">{error}</div>
    {/if}
    
    <div class="filters">
        <select
            bind:value={filter.category}
            on:change={handleFilterChange}
        >
            <option value="">모든 카테고리</option>
            {#each categories as category}
                <option value={category}>{category}</option>
            {/each}
        </select>
        
        <select
            bind:value={filter.completed}
            on:change={handleFilterChange}
        >
            <option value={undefined}>모든 상태</option>
            <option value={false}>미완료</option>
            <option value={true}>완료</option>
        </select>
        
        <select
            bind:value={filter.sortBy}
            on:change={handleFilterChange}
        >
            <option value="createdAt">생성일</option>
            <option value="dueDate">마감일</option>
            <option value="title">제목</option>
        </select>
        
        <select
            bind:value={filter.sortOrder}
            on:change={handleFilterChange}
        >
            <option value="asc">오름차순</option>
            <option value="desc">내림차순</option>
        </select>
        
        <input
            type="text"
            bind:value={filter.search}
            placeholder="검색..."
            on:input={handleFilterChange}
        />
    </div>
    
    <form on:submit|preventDefault={handleSubmit} class="add-form">
        <input
            type="text"
            bind:value={newTodoTitle}
            placeholder="할 일을 입력하세요"
            class="add-input"
        />
        <input
            type="text"
            bind:value={newTodoCategory}
            placeholder="카테고리"
            class="category-input"
            list="categories"
        />
        <datalist id="categories">
            {#each categories as category}
                <option value={category}></option>
            {/each}
        </datalist>
        <input
            type="date"
            bind:value={newTodoDueDate}
            class="date-input"
        />
        <button type="submit" class="add-button">추가</button>
    </form>
    
    {#if loading}
        <div class="loading">로딩 중...</div>
    {:else}
        <ul class="todo-list">
            {#each $todos as todo (todo.id)}
                <li class="todo-item">
                    <label class="todo-label">
                        <input
                            type="checkbox"
                            checked={todo.completed}
                            on:change={() => handleToggle(todo)}
                        />
                        <span class:completed={todo.completed}>
                            {todo.title}
                        </span>
                    </label>
                    <div class="todo-meta">
                        {#if todo.category}
                            <span class="category">{todo.category}</span>
                        {/if}
                        {#if todo.dueDate}
                            <span class="due-date">
                                마감: {formatDate(todo.dueDate)}
                            </span>
                        {/if}
                        <button
                            class="delete-button"
                            on:click={() => handleDelete(todo)}
                        >
                            삭제
                        </button>
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 0 1rem;
    }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }
    
    h1 {
        margin: 0;
        color: #333;
    }
    
    .logout-button {
        padding: 0.5rem 1rem;
        color: white;
        background-color: #dc3545;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .logout-button:hover {
        background-color: #c82333;
    }
    
    .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .filters select,
    .filters input {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.875rem;
    }
    
    .add-form {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .add-input {
        flex: 2;
    }
    
    .category-input,
    .date-input {
        flex: 1;
    }
    
    .add-input,
    .category-input,
    .date-input {
        padding: 0.5rem;
        font-size: 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    .add-button {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        color: white;
        background-color: #4CAF50;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .add-button:hover {
        background-color: #45a049;
    }
    
    .loading {
        text-align: center;
        padding: 2rem;
        color: #666;
    }
    
    .error {
        color: #dc3545;
        background-color: #f8d7da;
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }
    
    .todo-list {
        list-style: none;
        padding: 0;
    }
    
    .todo-item {
        padding: 1rem;
        margin-bottom: 0.5rem;
        background-color: #f9f9f9;
        border-radius: 4px;
    }
    
    .todo-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    
    .completed {
        text-decoration: line-through;
        color: #888;
    }
    
    .todo-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-left: 1.5rem;
        font-size: 0.875rem;
    }
    
    .category {
        background-color: #e9ecef;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        color: #495057;
    }
    
    .due-date {
        color: #666;
    }
    
    .delete-button {
        margin-left: auto;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        color: white;
        background-color: #dc3545;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .delete-button:hover {
        background-color: #c82333;
    }
</style>
