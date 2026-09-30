const jwt = require('jsonwebtoken');

async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return Response.json(
      { error: "Parameter 'code' tidak ditemukan" },
      { status: 400 }
    );
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return Response.json(
        { error: tokenData.error_description || tokenData.error },
        { status: 400 }
      );
    }

    const { access_token } = tokenData;

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'User-Agent': 'lab-graphql-oauth',
      },
    });
    const githubUser = await userRes.json();

    const token = jwt.sign(
      { username: githubUser.login, id: githubUser.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return Response.json({
      message: 'Login berhasil. Salin token di bawah ke header Authorization Apollo Sandbox.',
      token,
      user: { login: githubUser.login, id: githubUser.id },
    });
  } catch (err) {
    console.error('OAuth callback error:', err);
    return Response.json({ error: 'Gagal login lewat GitHub' }, { status: 500 });
  }
}

module.exports = { GET };
