require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ALLOWED_ORIGIN, PORT = 3000 } = process.env;

if (!STRIPE_SECRET_KEY) {
  console.error('Defina STRIPE_SECRET_KEY nas variáveis de ambiente.');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);
const app = express();

// Aceita só o seu site do GitHub Pages (ex.: https://SEU_USUARIO.github.io)
app.use(cors({ origin: ALLOWED_ORIGIN || false, methods: ['GET', 'POST'] }));

// ---------- WEBHOOK ----------
// A Stripe envia eventos via POST (não GET). Precisa do corpo "cru" (raw)
// para verificar a assinatura, por isso vem ANTES do express.json().
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!STRIPE_WEBHOOK_SECRET) return res.status(500).send('STRIPE_WEBHOOK_SECRET ausente');
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Assinatura inválida:', err.message);
    return res.status(400).send('Webhook Error: assinatura inválida');
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('✅ Pagamento aprovado:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.log('❌ Pagamento falhou:', event.data.object.id);
      break;
    default:
      console.log('Evento ignorado:', event.type);
  }
  res.json({ received: true });
});

// Atende GET /webhook só para avisar (útil se você abrir a URL no navegador)
app.get('/webhook', (_req, res) =>
  res.status(405).send('Use POST: a Stripe envia os eventos via POST.')
);

app.use(express.json());

// ---------- PAYMENT INTENT ----------
app.post('/create-payment-intent', async (_req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100,            // R$ 1,00 (em centavos)
      currency: 'brl',
      payment_method_types: ['card'],
      description: 'Pagamento de teste R$ 1,00'
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar pagamento.' });
  }
});

app.get('/', (_req, res) => res.send('API Stripe no ar.'));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
