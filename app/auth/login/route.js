async function GET(req) {
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&redirect_uri=${process.env.CALLBACK_URL}` +
    `&scope=read:user`;

  return Response.redirect(githubAuthUrl, 302);
}

module.exports = { GET };
