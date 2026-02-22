# Настройка уведомлений о новых пользователях

## Что нужно сделать (3 шага)

---

## ШАГ 1 — Resend (сервис отправки email)

1. Зайди на https://resend.com и зарегистрируйся (бесплатно, 3000 писем/мес)
2. После входа: **API Keys** → **Create API Key** → скопируй ключ (начинается с `re_...`)
3. **Domains** → Add Domain → добавь `talk-scope.com`
   - Resend покажет DNS-записи которые нужно добавить на твой домен
   - Обычно это TXT и MX записи — добавь их там где покупал домен

> Если не хочешь возиться с доменом — на первое время можно использовать
> `from: "onboarding@resend.dev"` (это тестовый адрес Resend, работает сразу без верификации домена)
> Для этого в route.ts замени строку `from` на: `"TalkScope <onboarding@resend.dev>"`

---

## ШАГ 2 — Clerk Webhook

1. Зайди на https://dashboard.clerk.com → твой проект
2. **Webhooks** → **Add Endpoint**
3. URL: `https://talk-scope.com/api/webhooks/clerk`
4. Events: выбери `user.created`
5. Сохрани — Clerk покажет **Signing Secret** (начинается с `whsec_...`) → скопируй

---

## ШАГ 3 — Переменные окружения на Vercel

1. Зайди на https://vercel.com → твой проект → **Settings** → **Environment Variables**
2. Добавь три переменные:

| Переменная | Значение |
|---|---|
| `RESEND_API_KEY` | `re_...` (из Resend) |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` (из Clerk) |
| `NOTIFY_EMAIL` | твой email куда слать уведомления |

3. После добавления — **Redeploy** (Settings → Deployments → три точки → Redeploy)

---

## Проверка

После деплоя зайди на https://dashboard.clerk.com → **Webhooks** → твой endpoint → **Test** → выбери `user.created` → отправь тестовый запрос.

Если всё настроено правильно — придёт письмо на твой email в течение 10 секунд.

---

## Итог

Каждый раз когда кто-то регистрируется на talk-scope.com — ты получишь письмо с:
- Именем пользователя
- Email адресом
- Временем регистрации
- Ссылкой на Clerk dashboard
