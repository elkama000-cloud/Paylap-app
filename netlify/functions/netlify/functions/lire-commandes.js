exports.handler = async (event) => {
  const expectedCode = process.env.FOURNISSEUR_ACCESS_CODE;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!expectedCode || !supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, message: 'Configuration serveur manquante' })
    };
  }

  const providedCode =
    event.headers['x-access-code'] ||
    event.headers['X-Access-Code'] ||
    (event.queryStringParameters && event.queryStringParameters.code) ||
    '';

  if (!providedCode || String(providedCode) !== expectedCode) {
    return {
      statusCode: 401,
      body: JSON.stringify({ ok: false, message: 'Accès non autorisé' })
    };
  }

  const baseHeaders = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`
  };

  try {
    if (event.httpMethod === 'GET') {
      const url = `${supabaseUrl}/rest/v1/commandes_toplapin?select=*&order=created_at.desc`;
      const res = await fetch(url, { headers: baseHeaders });

      if (!res.ok) {
        const errText = await res.text();
        return {
          statusCode: 502,
          body: JSON.stringify({ ok: false, message: 'Erreur lecture commandes', detail: errText })
        };
      }

      const rows = await res.json();
      const orders = rows.map((r) => ({
        id: r.id,
        createdAt: r.created_at,
        clientName: r.client_name,
        phone: r.phone,
        phone2: r.phone2,
        zone: r.zone,
        commune: r.commune,
        itemsSummary: r.items_summary,
        total: Number(r.total || 0),
        paymentMethod: r.payment_method,
        status: r.status || 'En attente'
      }));

      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, orders })
      };
    }

    if (event.httpMethod === 'PATCH') {
      const { id, status } = JSON.parse(event.body || '{}');
      const allowedStatuses = ['En attente', 'En livraison', 'Livrée', 'Annulée'];

      if (!id || !allowedStatuses.includes(status)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ ok: false, message: 'Identifiant ou statut invalide' })
        };
      }

      const patchUrl = `${supabaseUrl}/rest/v1/commandes_toplapin?id=eq.${encodeURIComponent(id)}`;
      const res = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { ...baseHeaders, Prefer: 'return=representation' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          statusCode: 502,
          body: JSON.stringify({ ok: false, message: 'Erreur mise à jour statut', detail: errText })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, id, status })
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, message: 'Méthode non autorisée' })
    };
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, message: 'Requête invalide' })
    };
  }
};
