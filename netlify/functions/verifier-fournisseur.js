exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, message: 'Méthode non autorisée' })
    };
  }

  const expectedCode = process.env.FOURNISSEUR_ACCESS_CODE;
  if (!expectedCode) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, message: 'Code fournisseur non configuré sur le serveur' })
    };
  }

  try {
    const { code } = JSON.parse(event.body || '{}');
    if (String(code || '').trim() === expectedCode) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true })
      };
    }

    return {
      statusCode: 401,
      body: JSON.stringify({ ok: false, message: 'Code fournisseur incorrect' })
    };
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, message: 'Requête invalide' })
    };
  }
};
