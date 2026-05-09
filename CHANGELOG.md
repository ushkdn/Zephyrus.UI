# Changelog

Все значимые изменения в проекте Zephyrus UI фиксируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.3.0] — 2026-05-09

### Added
- Возможность создавать заказ из нескольких заявок на закупку одновременно (страница Orders)

### Fixed
- Удалено поле `unit` со страницы Purchase Requests — единица измерения уже отображается на странице Products, дублирование было избыточным

---

## [0.2.0] — 2026-05-04 / 2026-05-06

### Added
- Страница `ForgotPasswordPage` — форма запроса сброса пароля по email
- Страница `ResetPasswordPage` — ввод кода подтверждения и нового пароля
- Отображение персональной информации пользователя (ФИО, email, роль, дата регистрации) в попапе профиля в Sidebar
- Приветственное сообщение на Dashboard учитывает роль текущего пользователя

---

## [0.1.0] — 2026-04-27

### Added
- Инициализация проекта: React 18 + TypeScript + Vite + Tailwind CSS
- Настройка Axios-клиента с интерсепторами авто-обновления JWT (`/api/auth/refresh-token`)
- Zustand-стор аутентификации с `persist` middleware (ключ `zephyrus-auth` в localStorage)
- Декодирование JWT и извлечение пользователя (`sub`, `email`, `given_name`, `family_name`, `role`)
- Клиентский роутинг (React Router v6) с вложенными защищёнными маршрутами
- `ProtectedRoute` — защита маршрутов по аутентификации и ролям
- Страницы аутентификации: `LoginPage`, `RegisterPage`
- Страницы каталога: `CategoriesPage`, `ProductsPage`
- Страницы поставщиков: `SuppliersPage`, `SupplierDetailPage` (с товарами поставщика)
- Страницы закупок: `PurchaseRequestsPage`, `OrdersPage` (только Admin / Manager)
- Страница `NotificationsPage`
- Страница `DashboardPage`
- Компонент `Layout` (Sidebar + `<Outlet />`)
- `Sidebar` с ролевой фильтрацией пунктов навигации
- Shared UI-компоненты: `Badge`, `Button`, `Input`, `Modal`, `Select`, `Spinner`
- API-модули: `auth.api`, `user.api`, `categories.api`, `products.api`, `suppliers.api`, `procurement.api`, `notifications.api`
- Все TypeScript-типы и интерфейсы в `src/types/index.ts`
- Dockerfile: многоэтапная сборка `node:20-alpine` → `nginx:alpine`
- `nginx.conf`: проксирование `/api/` на `zephyrus.gateway:8080`, SPA-роутинг через `try_files`
- `vite.config.ts`: dev-прокси `/api` → `http://localhost:7001`
