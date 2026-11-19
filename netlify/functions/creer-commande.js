exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, message: 'Méthode non autorisée' })
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, message: 'Configuration serveur manquante' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    const clientName = String(payload.clientName || '').trim();
    const phone = String(payload.phone || '').trim();
    const phone2 = String(payload.phone2 || '').trim();
    const zone = String(payload.zone || '').trim();
    const commune = String(payload.commune || '').trim();
    const itemsSummary = String(payload.itemsSummary || '').trim();
    const paymentMethod = String(payload.paymentMethod || 'Paiement à la livraison').trim();
    const total = Number(payload.total || 0);

    if (!clientName || !phone || !commune || !itemsSummary || total <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          message: 'Informations de commande incomplètes (nom, téléphone, commune ou panier).'
        })
      };
    }

    const orderRecord = {
      id: `TL-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
      client_name: clientName,
      phone,
      phone2,
      zone,
      commune,
      items_summary: itemsSummary,
      total,
      payment_method: paymentMethod,
      status: 'En attente'
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/commandes_toplapin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify(orderRecord)
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: 502,
        body: JSON.stringify({ ok: false, message: 'Erreur enregistrement base', detail: errText })
      };
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ ok: true, orderId: orderRecord.id })
    };
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, message: 'Données JSON invalides' })
    };
  }
};
