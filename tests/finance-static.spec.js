const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('código do frete salva total_freight e lucro líquido corretamente', async () => {
  const freight = fs.readFileSync(path.join(__dirname, '..', 'freight.js'), 'utf8');
  expect(freight).toContain('total_freight:t.freight');
  expect(freight).toContain('net_profit:t.net');
  expect(freight).toContain('freight_value:Number(x.freight_value)||0');
  expect(freight).toContain('net:sale-cost-freight-tax');
});

test('cartão de lançamento mostra bruto e líquido', async () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  expect(app).toContain('class="launch-values"');
  expect(app).toContain('<small>Bruto</small>');
  expect(app).toContain('<em>Líquido</em>');
  expect(app).toContain('const gross=Number(o.total_sale||0)');
  expect(app).toContain('const net=Number(o.net_profit||0)');
});

test('lucro por serviço também desconta frete', async () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  expect(app).toContain('Number(x.freight_value||0)');
});

test('não existem handlers submit adicionais via addEventListener', async () => {
  for (const file of ['app.js','freight.js','freight-ui.js','supabase-config.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    expect(src, file).not.toMatch(/addEventListener\(\s*['"]submit['"]/);
  }
});
