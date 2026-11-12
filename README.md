# Pagamento Stripe (R$ 1,00) – GitHub Pages + backend

O GitHub Pages só hospeda arquivos **estáticos**. Por isso:

- `/public` → frontend (vai para o GitHub Pages)
- `/server` → backend Node/Express (precisa de outro host: Render, Railway, Fly.io, Vercel...)

## 1. Backend

```bash
cd server
npm install
cp ../.env.example .env   # preencha STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ALLOWED_ORIGIN
npm start
```

Para hospedar (ex.: Render): crie um *Web Service* apontando para a pasta `server`,
comando de build `npm install`, start `npm start`, e cadastre as variáveis de ambiente
no painel (nunca no repositório).

## 2. Frontend

1. Edite `public/config.js`: coloque a `pk_live_...` e a URL pública do backend em `API_URL`.
2. Suba o repositório para o GitHub.
3. Em **Settings → Pages**, escolha **Source: GitHub Actions** (o workflow já está em `.github/workflows/pages.yml`).
4. Seu site ficará em `https://SEU_USUARIO.github.io/NOME_DO_REPO/`.
5. No backend, defina `ALLOWED_ORIGIN=https://SEU_USUARIO.github.io` (CORS).

## 3. Webhook

No Dashboard da Stripe → Developers → Webhooks, adicione o endpoint
`https://SEU-BACKEND/webhook` com os eventos `payment_intent.succeeded` e
`payment_intent.payment_failed`, e copie o `whsec_...` para `STRIPE_WEBHOOK_SECRET`.
Teste local: `stripe listen --forward-to localhost:3000/webhook`.

## Observações importantes

- Modo produção cobra **de verdade** (R$ 1,00). Para testar sem cobrar, use `sk_test_`/`pk_test_` e o cartão `4242 4242 4242 4242`.
- Nunca commite o `.env` nem a `sk_live_`.
- O webhook é `POST` (a Stripe não usa GET).
- Com PaymentElement usa-se `stripe.confirmPayment` (não `confirmCardPayment`).
