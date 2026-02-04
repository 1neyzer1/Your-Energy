# Your Energy

**Your Energy** — вебзастосунок для пошуку та вибору вправ за категоріями, з можливістю додавати вправи в обране, переглядати деталі та залишати рейтинг.

## Live Demo

https://1neyzer1.github.io/Your-Energy/

## Основні можливості

- Фільтри за категоріями: Muscles, Body parts, Equipment
- Перегляд категорій і вправ з серверною пагінацією
- Пошук вправ за назвою (submit)
- Модальне вікно з деталями вправи (відео/гіф, калорії, рейтинг тощо)
- Додавання/видалення вправ із Favorites (localStorage)
- Цитата дня з кешуванням на добу (localStorage)
- Форма підписки на email

## Технології

- Vite
- Vanilla JavaScript (ES6+)
- SCSS
- modern-normalize

## Запуск локально

```bash
npm install
npm run dev
```

## Білд і превʼю

```bash
npm run build
npm run preview
```

## API

Base URL: `https://your-energy.b.goit.study/api`

- `GET /quote`
- `GET /filters?filter=Muscles&page=1&limit=12`
- `GET /exercises?muscles=abs&page=1&limit=10&keyword=run`
- `GET /exercises/{exerciseId}`
- `PATCH /exercises/{exerciseId}/rating` (body: `{ "rate": 4, "email": "user@example.com", "review": "text" }`)
- `POST /subscription` (body: `{ "email": "user@example.com" }`)

## Деплой

GitHub Pages: https://1neyzer1.github.io/Your-Energy/
