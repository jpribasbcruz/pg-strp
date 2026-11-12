const { STRIPE_PUBLISHABLE_KEY, API_URL } = window.APP_CONFIG;
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

// "Deferred intent": o formulário aparece antes do PaymentIntent existir.
// O PaymentIntent só é criado quando você clica em "Pagar".
const elements = stripe.elements({
  mode: 'payment',
  amount: 100,
  currency: 'brl',
  paymentMethodTypes: ['card'],
  locale: 'pt-BR'
});
elements.create('payment').mount('#payment-element');

const botao = document.getElementById('pagar');
const msg = document.getElementById('mensagem');

function mostrar(texto, tipo) {
  msg.textContent = texto;
  msg.className = tipo;
}

botao.addEventListener('click', async () => {
  botao.disabled = true;
  msg.className = '';
  msg.style.display = 'none';

  try {
    // 1) Valida os campos do cartão
    const { error: submitError } = await elements.submit();
    if (submitError) throw new Error(submitError.message);

    // 2) Pede o client_secret ao backend
    const resp = await fetch(`${API_URL}/create-payment-intent`, { method: 'POST' });
    if (!resp.ok) throw new Error('Falha ao criar o pagamento no servidor.');
    const { clientSecret } = await resp.json();

    // 3) Confirma o pagamento
    // Com o PaymentElement usa-se stripe.confirmPayment
    // (confirmCardPayment só funciona com o CardElement antigo).
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required'
    });

    if (error) throw new Error(error.message);

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      mostrar('✅ Pagamento aprovado! ID: ' + paymentIntent.id, 'ok');
    } else {
      mostrar('Status: ' + (paymentIntent ? paymentIntent.status : 'desconhecido'), 'ok');
    }
  } catch (e) {
    mostrar('❌ ' + e.message, 'erro');
    botao.disabled = false;
  }
});
