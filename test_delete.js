const http = require('http');

function req(opts, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  const loginBody = JSON.stringify({ email: 'admin@taller.com', password: 'Admin1234' });
  const login = await req({
    hostname: 'localhost', port: 3001,
    path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);

  console.log('LOGIN status:', login.status);
  const { token, usuario } = JSON.parse(login.body);
  console.log('rol:', usuario?.rol);

  const headers = { 'Authorization': 'Bearer ' + token };

  // List clients
  const cls = await req({ hostname: 'localhost', port: 3001, path: '/api/clientes', method: 'GET', headers });
  const cl = JSON.parse(cls.body);
  console.log('Clientes:', cl.map(c => c.id + ':' + c.nombre));

  // Delete first client
  if (cl.length > 0) {
    const del = await req({ hostname: 'localhost', port: 3001, path: '/api/clientes/' + cl[0].id, method: 'DELETE', headers });
    console.log('DELETE clientes/'+cl[0].id+' status:', del.status, 'body:', del.body);
  }

  // List ordenes and get one item
  const ords = await req({ hostname: 'localhost', port: 3001, path: '/api/ordenes', method: 'GET', headers });
  const ordList = JSON.parse(ords.body);
  if (ordList.length > 0) {
    const ord = await req({ hostname: 'localhost', port: 3001, path: '/api/ordenes/' + ordList[0].id, method: 'GET', headers });
    const ordDetail = JSON.parse(ord.body);
    if (ordDetail.items && ordDetail.items.length > 0) {
      const itemId = ordDetail.items[0].id;
      const delItem = await req({ hostname: 'localhost', port: 3001, path: '/api/items/' + itemId, method: 'DELETE', headers });
      console.log('DELETE items/'+itemId+' status:', delItem.status, 'body:', delItem.body);
    } else {
      console.log('No items in order', ordList[0].id);
    }
  }
}

main().catch(console.error);
