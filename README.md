# sso-client

Клиентская библиотека для единого входа (SSO) через Active Directory.

## Сервер

https://github.com/shinichiroisumi/sso-server.git

## Установка

```bash
npm install @shinichiroisumi/sso-client
```

## Инициализация

```javascript
import { SSOClient } from '@shinichiroisumi/sso-client';

const sso = new SSOClient({
  ssoServerUrl: 'https://sso.company.com',
  appId: 'my-app-id',
  debug: false
});
```

## Подключение в HTML

```html
<script src="node_modules/@shinichiroisumi/sso-client/index.js"></script>
<script>
  const sso = new SSOClient({
    ssoServerUrl: 'https://sso.company.com',
    appId: 'my-app-id'
  });
</script>
```

## Методы

| Метод | Что делает |
|-------|-------------|
| `handleCallback()` | Вызовите при загрузке страницы. Извлекает токен из URL после редиректа с SSO. |
| `checkAuth()` | Проверяет, авторизован ли пользователь. Возвращает `{ authenticated, user }`. |
| `login()` | Перенаправляет на страницу входа SSO. |
| `logout()` | Завершает сессию, удаляет токен. |
| `getUser()` | Запрашивает данные пользователя (имя, email, отдел, должность). |
| `getPhoto()` | Запрашивает фото пользователя (base64). |
| `requireAuth()` | Если не авторизован – вызывает `login()`. Иначе возвращает пользователя. |
| `isAuthenticated()` | Синхронно проверяет наличие токена (без запроса к серверу). |
| `getAuthHeader()` | Возвращает объект `{ Authorization: 'Bearer ...' }` для ваших API запросов. |

## Типичный сценарий

```javascript
async function init() {
  await sso.handleCallback();
  const auth = await sso.checkAuth();
  
  if (auth.authenticated) {
    const user = auth.user;
    const photo = await sso.getPhoto();
    // отобразить данные и фото
  } else {
    document.getElementById('login-btn').onclick = () => sso.login();
  }
}
init();
```

## Пример в чистом HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>Моё приложение</title>
</head>
<body>
    <div id="app">Загрузка...</div>

    <script src="node_modules/@shinichiroisumi/sso-client/index.js"></script>
    <script>
        const sso = new SSOClient({
            ssoServerUrl: 'https://sso.company.com',
            appId: 'my-app'
        });

        async function init() {
            await sso.handleCallback();
            const auth = await sso.checkAuth();
            
            if (auth.authenticated) {
                const user = auth.user;
                const photo = await sso.getPhoto();
                
                document.getElementById('app').innerHTML = `
                    <div>
                        ${photo ? `<img src="${photo}" style="width: 80px; height: 80px; border-radius: 50%;">` : `<div style="width: 80px; height: 80px; border-radius: 50%; background: #0078d7; display: flex; align-items: center; justify-content: center; color: white;">${user.displayName.charAt(0)}</div>`}
                        <p><strong>${user.displayName}</strong></p>
                        <p>${user.email}</p>
                        <button id="logoutBtn">Выйти</button>
                    </div>
                `;
                document.getElementById('logoutBtn').onclick = () => sso.logout();
            } else {
                document.getElementById('app').innerHTML = '<button id="loginBtn">Войти через SSO</button>';
                document.getElementById('loginBtn').onclick = () => sso.login();
            }
        }
        
        init();
    </script>
</body>
</html>
```

## Примечания

- Токен хранится в `localStorage` (по умолчанию) или `sessionStorage`.
- Фото запрашивается отдельно методом `getPhoto()`.
- Все методы, обращающиеся к серверу, асинхронные.
