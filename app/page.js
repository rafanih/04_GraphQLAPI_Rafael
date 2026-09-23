const { redirect } = require('next/navigation');

module.exports = function Home() {
  redirect('/api/graphql');
};
