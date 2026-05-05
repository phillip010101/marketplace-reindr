import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');
const distRootBase = path.join(webRoot, 'dist');
let distRoot = distRootBase;

let buildReady = false;

function runWebBuild() {
  const astroBin = process.platform === 'win32'
    ? path.join(webRoot, 'node_modules', '.bin', 'astro.cmd')
    : path.join(webRoot, 'node_modules', '.bin', 'astro');
  const result =
    process.platform === 'win32'
      ? spawnSync(`"${astroBin}" build`, {
          cwd: webRoot,
          stdio: 'pipe',
          encoding: 'utf8',
          shell: true
        })
      : spawnSync(astroBin, ['build'], {
          cwd: webRoot,
          stdio: 'pipe',
          encoding: 'utf8'
        });

  if (result.error) {
    throw new Error(`web build failed to start: ${String(result.error)}`);
  }

  if (result.status !== 0) {
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    throw new Error(`web build failed:\n${output}`);
  }
}

function readDist(relativePath) {
  const fullPath = path.join(distRoot, relativePath);
  assert.equal(fs.existsSync(fullPath), true, `Expected route output to exist: ${relativePath}`);
  return fs.readFileSync(fullPath, 'utf8');
}

test.before(() => {
  runWebBuild();
  distRoot = fs.existsSync(path.join(distRootBase, 'client'))
    ? path.join(distRootBase, 'client')
    : distRootBase;
  buildReady = true;
});

test('E2E-public-routes: required MVP public routes are generated', () => {
  assert.equal(buildReady, true);

  const expectedOutputs = [
    'index.html',
    path.join('servicios', 'index.html'),
    path.join('servicios', 'cajas-personalizadas', 'index.html'),
    path.join('bogota', 'cajas-personalizadas', 'index.html')
  ];

  for (const outputPath of expectedOutputs) {
    assert.equal(fs.existsSync(path.join(distRoot, outputPath)), true, `Missing output: ${outputPath}`);
  }
});

test('IT-provider-panel-routes: provider panel routes are generated', () => {
  const expectedOutputs = [
    path.join('panel', 'index.html'),
    path.join('panel', 'login', 'index.html'),
    path.join('panel', 'perfil', 'index.html'),
    path.join('panel', 'leads', 'index.html')
  ];

  for (const outputPath of expectedOutputs) {
    assert.equal(fs.existsSync(path.join(distRoot, outputPath)), true, `Missing provider panel output: ${outputPath}`);
  }
});

test('E2E-public-routes: homepage links to servicios listing', () => {
  const homepage = readDist('index.html');
  assert.match(homepage, /href="\/servicios"/);
});

test('E2E-public-routes: city+service page includes lead form and requested service field', () => {
  const cityServicePage = readDist(path.join('bogota', 'cajas-personalizadas', 'index.html'));
  assert.match(cityServicePage, /Solicitar cotizacion/);
  assert.match(cityServicePage, /name="requested_service_slugs"/);
});

test('E2E-public-provider-page: provider profile route is generated with service links', () => {
  const providerPage = readDist(path.join('proveedores', 'cajas-acme', 'index.html'));
  assert.match(providerPage, /Cajas Acme/);
  assert.match(providerPage, /href="\/bogota\/cajas-personalizadas"/);
});

test('E2E-seo-route-content: public SEO routes include title, description and canonical', () => {
  const servicesIndex = readDist(path.join('servicios', 'index.html'));
  assert.match(servicesIndex, /<title>Servicios \| Reindr Marketplace MVP<\/title>/);
  assert.match(servicesIndex, /name="description"/);
  assert.match(servicesIndex, /rel="canonical" href="http:\/\/localhost:4321\/servicios"/);

  const serviceDetail = readDist(path.join('servicios', 'cajas-personalizadas', 'index.html'));
  assert.match(serviceDetail, /<title>Cajas personalizadas \| Reindr Marketplace MVP<\/title>/);
  assert.match(serviceDetail, /rel="canonical" href="http:\/\/localhost:4321\/servicios\/cajas-personalizadas"/);

  const providerDetail = readDist(path.join('proveedores', 'cajas-acme', 'index.html'));
  assert.match(providerDetail, /<title>Cajas Acme \| Proveedor en Bogota<\/title>/);
  assert.match(providerDetail, /rel="canonical" href="http:\/\/localhost:4321\/proveedores\/cajas-acme"/);
});

test('E2E-no-pii-public-pages: generated public pages do not expose seeded private contact values', () => {
  const pagesToScan = [
    readDist('index.html'),
    readDist(path.join('servicios', 'index.html')),
    readDist(path.join('servicios', 'cajas-personalizadas', 'index.html')),
    readDist(path.join('bogota', 'cajas-personalizadas', 'index.html')),
    readDist(path.join('proveedores', 'cajas-acme', 'index.html'))
  ];

  const forbiddenSnippets = [
    'cajas-acme@test.com',
    'troqueles-norte@test.com',
    'printlab@test.com',
    '+5700000001',
    '+5700000002',
    '+5700000003'
  ];

  for (const html of pagesToScan) {
    for (const forbidden of forbiddenSnippets) {
      assert.equal(html.includes(forbidden), false, `Forbidden PII found in public page output: ${forbidden}`);
    }
  }
});

test('E2E-lead-flow-3-steps: city+service page renders 3-step lead flow structure', () => {
  const cityServicePage = readDist(path.join('bogota', 'cajas-personalizadas', 'index.html'));
  assert.match(cityServicePage, /Paso 1: Necesidad base/);
  assert.match(cityServicePage, /Paso 2: Servicios relacionados/);
  assert.match(cityServicePage, /Paso 3: Contacto y contexto/);
  assert.match(cityServicePage, /name=\"urgency\"/);
  assert.match(cityServicePage, /name=\"budget_range\"/);
  assert.match(cityServicePage, /name=\"requested_service_slugs\"/);
});

test('IT-provider-panel-content: profile and quote modules are visible in panel pages', () => {
  const panelHome = readDist(path.join('panel', 'index.html'));
  assert.match(panelHome, /Panel proveedor/);
  assert.match(panelHome, /Metricas rapidas/);

  const loginPage = readDist(path.join('panel', 'login', 'index.html'));
  assert.match(loginPage, /Acceso provider/);
  assert.match(loginPage, /name=\"email\"/);

  const profilePage = readDist(path.join('panel', 'perfil', 'index.html'));
  assert.match(profilePage, /Perfil provider/);
  assert.match(profilePage, /name=\"display_name\"/);
  assert.match(profilePage, /name=\"template_id\"/);
  assert.match(profilePage, /Craft Paper/);
  assert.match(profilePage, /Vista previa de plantilla/);
  assert.match(profilePage, /id=\"template-preview-card\"/);
});

test('IT-provider-panel-lead-detail-routing: leads page no longer uses querystring workaround', () => {
  const leadsPage = readDist(path.join('panel', 'leads', 'index.html'));
  assert.equal(leadsPage.includes('?opportunity_id='), false);
  assert.equal(leadsPage.includes('demo-opportunity'), false);
});

test('IT-provider-template-skins: provider page exposes deterministic template marker', () => {
  const providerPage = readDist(path.join('proveedores', 'cajas-acme', 'index.html'));
  assert.match(providerPage, /data-provider-template=\"craft-paper\"/);
  assert.match(providerPage, /Template: Craft Paper/);
});

test('IT-reviews-pending-not-public: provider page renders only approved reviews', () => {
  const providerPage = readDist(path.join('proveedores', 'cajas-acme', 'index.html'));
  assert.match(providerPage, /Resenas verificadas/);
  assert.match(providerPage, /Excelente cumplimiento/);
  assert.equal(providerPage.includes('Esta resena aun esta pendiente de moderacion.'), false);
});
