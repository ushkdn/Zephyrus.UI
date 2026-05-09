# Zephyrus UI

Фронтенд-приложение системы управления закупками **Zephyrus**. Построено на React 18 + TypeScript + Vite, взаимодействует с бэкендом через API-шлюз (`Zephyrus.Gateway`).

---

## Содержание

- [Технологический стек](#технологический-стек)
- [Структура проекта](#структура-проекта)
- [Маршрутизация и страницы](#маршрутизация-и-страницы)
- [Роли пользователей](#роли-пользователей)
- [Архитектура приложения](#архитектура-приложения)
- [npm-пакеты](#npm-пакеты)
- [Конфигурация и переменные окружения](#конфигурация-и-переменные-окружения)
- [Запуск проекта](#запуск-проекта)

---

## Технологический стек

| Технология | Версия | Назначение |
|---|---|---|
| **React** | 18.x | UI-библиотека |
| **TypeScript** | 5.x | Статическая типизация |
| **Vite** | 5.x | Сборщик и dev-сервер |
| **React Router v6** | 6.x | Клиентская маршрутизация, вложенные маршруты |
| **TanStack React Query** | 5.x | Серверное состояние, кэширование, запросы к API |
| **Zustand** | 4.x | Глобальный стор (аутентификация, токены) |
| **Axios** | 1.x | HTTP-клиент с интерсепторами (авто-обновление токенов) |
| **React Hook Form** | 7.x | Управление формами |
| **Zod** | 3.x | Схемы валидации форм |
| **@hookform/resolvers** | 3.x | Мост между React Hook Form и Zod |
| **Tailwind CSS** | 3.x | Utility-first стилизация |
| **clsx** | 2.x | Условные CSS-классы |
| **jwt-decode** | 4.x | Декодирование JWT-токена на клиенте |

---

## Структура проекта

```
Zephyrus.UI/
├── Dockerfile                   # Многоэтапная сборка: node:20-alpine → nginx:alpine
├── nginx.conf                   # Nginx: проксирование /api/ на gateway, SPA-роутинг
├── vite.config.ts               # Vite: dev-сервер порт 3000, прокси /api → localhost:7001
├── tailwind.config.cjs
├── postcss.config.cjs
├── tsconfig.json
├── package.json
├── index.html
└── src/
    ├── main.tsx                 # Точка входа
    ├── App.tsx                  # Роутер приложения
    ├── index.css                # Глобальные стили Tailwind
    │
    ├── api/                     # HTTP-клиент и API-функции по доменам
    │   ├── client.ts            # Axios-инстанс, интерсепторы JWT и авто-рефреша
    │   ├── auth.api.ts          # sign-in, sign-up, forgot-password, reset-password, refresh-token
    │   ├── user.api.ts          # Получение профиля пользователя
    │   ├── categories.api.ts    # CRUD категорий
    │   ├── products.api.ts      # CRUD продуктов
    │   ├── suppliers.api.ts     # CRUD поставщиков и товаров поставщика
    │   ├── procurement.api.ts   # Заявки и заказы
    │   └── notifications.api.ts # Уведомления
    │
    ├── store/
    │   └── auth.store.ts        # Zustand: токены, пользователь, isAuthenticated, hasRole
    │
    ├── types/
    │   └── index.ts             # Все TypeScript-интерфейсы и типы
    │
    ├── components/
    │   ├── auth/
    │   │   └── ProtectedRoute.tsx   # HOC: редирект на /login или / при нехватке прав
    │   ├── layout/
    │   │   ├── Layout.tsx           # Обёртка: Sidebar + <Outlet />
    │   │   └── Sidebar.tsx          # Навигация с ролевой фильтрацией пунктов, попап профиля
    │   └── ui/
    │       ├── Badge.tsx            # Бейдж статусов (цвет по статусу)
    │       ├── Button.tsx           # Кнопка с вариантами и состоянием загрузки
    │       ├── Input.tsx            # Поле ввода с поддержкой ошибок
    │       ├── Modal.tsx            # Модальное окно
    │       ├── Select.tsx           # Выпадающий список
    │       └── Spinner.tsx          # Индикатор загрузки
    │
    └── pages/
        ├── DashboardPage.tsx                            # Главная страница с приветствием
        ├── auth/
        │   ├── LoginPage.tsx                            # Вход
        │   ├── RegisterPage.tsx                         # Регистрация
        │   ├── ForgotPasswordPage.tsx                   # Запрос сброса пароля
        │   └── ResetPasswordPage.tsx                    # Ввод кода и нового пароля
        ├── categories/
        │   └── CategoriesPage.tsx                       # Список, создание, редактирование, удаление
        ├── products/
        │   └── ProductsPage.tsx                         # Список, создание, редактирование, удаление
        ├── suppliers/
        │   ├── SuppliersPage.tsx                        # Список поставщиков
        │   └── SupplierDetailPage.tsx                   # Карточка поставщика + его товары
        ├── procurement/
        │   ├── PurchaseRequestsPage.tsx                 # Заявки на закупку
        │   └── OrdersPage.tsx                           # Заказы (Admin / Manager)
        └── notifications/
            └── NotificationsPage.tsx                    # Список уведомлений, пометка как прочитанных
```

---

## Маршрутизация и страницы

| Маршрут | Страница | Защита | Роли |
|---|---|---|---|
| `/login` | LoginPage | Публичный | — |
| `/register` | RegisterPage | Публичный | — |
| `/forgot-password` | ForgotPasswordPage | Публичный | — |
| `/reset-password/:userId` | ResetPasswordPage | Публичный | — |
| `/` | DashboardPage | Авторизация | Все |
| `/categories` | CategoriesPage | Авторизация | Все |
| `/products` | ProductsPage | Авторизация | Все |
| `/suppliers` | SuppliersPage | Авторизация | Все |
| `/suppliers/:id` | SupplierDetailPage | Авторизация | Все |
| `/purchase-requests` | PurchaseRequestsPage | Авторизация | Все |
| `/orders` | OrdersPage | Авторизация | Admin, Manager |
| `/notifications` | NotificationsPage | Авторизация | Все |

Незащищённый маршрут при попытке доступа без авторизации редиректит на `/login`. Несанкционированный доступ к `/orders` без нужной роли редиректит на `/`.

---

## Роли пользователей

| Роль | Метка | Доступ к заказам |
|---|---|---|
| `Admin` | Администратор | Да |
| `Manager` | Менеджер | Да |
| `Buyer` | Закупщик | Нет |

Роль декодируется из JWT-токена (claim `role`) и хранится в Zustand-сторе. Навигационные пункты в Sidebar автоматически фильтруются по роли текущего пользователя.

---

## Архитектура приложения

### HTTP-клиент и авто-рефреш токенов

`src/api/client.ts` создаёт единственный инстанс Axios с `baseURL: '/api'`. Два интерсептора:

- **Request**: добавляет заголовок `Authorization: Bearer <accessToken>` из Zustand-стора.
- **Response**: при получении `401` автоматически вызывает `POST /api/auth/refresh-token`, обновляет токены в сторе и повторяет исходный запрос. При неудаче — вызывает `logout()` и редиректит на `/login`.

### Глобальный стор (`auth.store.ts`)

Zustand с `persist` middleware — состояние сохраняется в `localStorage` под ключом `zephyrus-auth`. Методы:

| Метод | Описание |
|---|---|
| `setTokens(tokens)` | Декодирует JWT, извлекает пользователя, сохраняет токены |
| `logout()` | Очищает всё состояние |
| `isAuthenticated()` | Проверяет наличие и срок действия `accessToken` |
| `hasRole(...roles)` | Проверяет роль текущего пользователя |

### Серверное состояние (React Query)

Все API-запросы выполняются через `useQuery` / `useMutation` из TanStack React Query. Конфигурация `QueryClient`:
- `retry: 1` — одна попытка повтора при ошибке
- `staleTime: 30_000` — данные считаются свежими 30 секунд

### Прокси в production (Nginx)

В Docker-сборке Nginx перенаправляет запросы `/api/` на `http://zephyrus.gateway:8080/api/`. SPA-маршрутизация обеспечена директивой `try_files $uri $uri/ /index.html`.

### Прокси в разработке (Vite)

Dev-сервер на порту `3000` проксирует `/api` на `http://localhost:7001` (Gateway).

---

## npm-пакеты

### Dependencies (runtime)

| Пакет | Версия | Назначение |
|---|---|---|
| `react` | ^18.2.0 | UI-библиотека |
| `react-dom` | ^18.2.0 | Рендеринг React в DOM |
| `react-router-dom` | ^6.21.3 | Клиентский роутинг |
| `@tanstack/react-query` | ^5.17.19 | Серверное состояние и кэш |
| `axios` | ^1.6.7 | HTTP-клиент |
| `zustand` | ^4.5.0 | Лёгкий глобальный стор |
| `react-hook-form` | ^7.49.3 | Управление формами |
| `@hookform/resolvers` | ^3.3.4 | Адаптер Zod для React Hook Form |
| `zod` | ^3.22.4 | Схемная валидация |
| `jwt-decode` | ^4.0.0 | Декодирование JWT без верификации |
| `clsx` | ^2.1.0 | Утилита для условных CSS-классов |

### DevDependencies (сборка)

| Пакет | Версия | Назначение |
|---|---|---|
| `vite` | ^5.1.0 | Сборщик и dev-сервер |
| `@vitejs/plugin-react` | ^4.2.1 | Плагин Vite для React (Babel/SWC) |
| `typescript` | ^5.3.3 | Компилятор TypeScript |
| `@types/react` | ^18.2.55 | Типы для React |
| `@types/react-dom` | ^18.2.19 | Типы для React DOM |
| `tailwindcss` | ^3.4.1 | Utility-first CSS-фреймворк |
| `autoprefixer` | ^10.4.17 | PostCSS-плагин вендорных префиксов |
| `postcss` | ^8.4.35 | CSS-постпроцессор |

---

## Конфигурация и переменные окружения

Приложение не использует собственные `.env`-файлы — адрес API задаётся через настройки прокси:

- **Development**: `vite.config.ts` → `server.proxy['/api'] = 'http://localhost:7001'`
- **Production**: `nginx.conf` → `proxy_pass http://zephyrus.gateway:8080/api/`

Для смены адреса шлюза в режиме разработки измените значение `target` в `vite.config.ts`.

---

## Запуск проекта

### Требования

- [Node.js](https://nodejs.org/) 20+
- npm 10+

### Разработка

```bash
# Установить зависимости
npm install

# Запустить dev-сервер (порт 3000)
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`.  
Убедитесь, что Gateway (`Zephyrus.Gateway`) запущен на порту `7001`.

### Production-сборка

```bash
# Собрать статику в /dist
npm run build

# Предварительный просмотр production-сборки
npm run preview
```

### Docker

```bash
# Сборка образа
docker build -t zephyrus-ui .

# Запуск контейнера
docker run -p 3000:80 zephyrus-ui
```

Или через `docker compose` из репозитория `Zephyrus`:

```bash
cd Zephyrus/src
docker compose up zephyrus.ui --build
```

---

## Лицензия

Лицензия: [LICENSE](./LICENSE)