const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const PORT = process.env.PORT || 4000;
const API = `http://localhost:${PORT}/api/v1`;

let passed = 0;
let failed = 0;
let total = 0;
const results = [];

function log(status, testId, title, detail = '') {
  total++;
  const icon = status === 'PASS' ? '✅' : '❌';
  if (status === 'PASS') passed++;
  else failed++;
  const msg = `${icon} ${testId}: ${title}${detail ? ' — ' + detail : ''}`;
  console.log(msg);
  results.push({ testId, title, status, detail });
}

async function run() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  PulsePoll Comprehensive API Test Suite');
  console.log(`  Target: ${API}`);
  console.log('═══════════════════════════════════════════════════\n');

  // ─── TC009: Health Check ────────────────────────────────────
  console.log('── Health Check ──');
  try {
    const t0 = Date.now();
    const res = await fetch(`${API}/health`);
    const ms = Date.now() - t0;
    const body = await res.json();
    if (res.status === 200 && body.status === 'ok') {
      log('PASS', 'TC009', 'Health check returns 200', `${ms}ms`);
    } else {
      log('FAIL', 'TC009', 'Health check', `Status: ${res.status}, Body: ${JSON.stringify(body)}`);
    }
  } catch (e) {
    log('FAIL', 'TC009', 'Health check', e.message);
  }

  // ─── TC001: Create Poll (Valid) ─────────────────────────────
  console.log('\n── Poll Creation ──');
  let shareCode, pollId;
  try {
    const t0 = Date.now();
    const res = await fetch(`${API}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'API Test Poll Question',
        options: ['Alpha', 'Beta', 'Gamma'],
        fingerprint: 'test-fp-001'
      })
    });
    const ms = Date.now() - t0;
    const body = await res.json();
    if (res.status === 201 && body.shareCode && body.pollId) {
      shareCode = body.shareCode;
      pollId = body.pollId;
      log('PASS', 'TC001', 'Create poll with valid data', `${ms}ms, shareCode=${shareCode}`);
    } else {
      log('FAIL', 'TC001', 'Create poll', `Status: ${res.status}, Body: ${JSON.stringify(body)}`);
    }
  } catch (e) {
    log('FAIL', 'TC001', 'Create poll', e.message);
  }

  // ─── TC002: Create Poll (Invalid – missing question) ──────
  try {
    const res = await fetch(`${API}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '', options: ['A', 'B'], fingerprint: 'fp2' })
    });
    if (res.status === 400) {
      log('PASS', 'TC002a', 'Reject empty question', `Status: ${res.status}`);
    } else {
      log('FAIL', 'TC002a', 'Empty question should return 400', `Got: ${res.status}`);
    }
  } catch (e) {
    log('FAIL', 'TC002a', 'Empty question validation', e.message);
  }

  // ─── TC002b: Create Poll (Invalid – < 2 options) ──────────
  try {
    const res = await fetch(`${API}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Test', options: ['Only one'], fingerprint: 'fp3' })
    });
    if (res.status === 400) {
      log('PASS', 'TC002b', 'Reject fewer than 2 options', `Status: ${res.status}`);
    } else {
      log('FAIL', 'TC002b', 'Fewer than 2 options should return 400', `Got: ${res.status}`);
    }
  } catch (e) {
    log('FAIL', 'TC002b', 'Options count validation', e.message);
  }

  // ─── TC002c: Create Poll (Invalid – > 10 options) ─────────
  try {
    const opts = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`);
    const res = await fetch(`${API}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Test', options: opts, fingerprint: 'fp4' })
    });
    if (res.status === 400) {
      log('PASS', 'TC002c', 'Reject more than 10 options', `Status: ${res.status}`);
    } else {
      log('FAIL', 'TC002c', 'More than 10 options should return 400', `Got: ${res.status}`);
    }
  } catch (e) {
    log('FAIL', 'TC002c', 'Max options validation', e.message);
  }

  // ─── TC003: Get Poll (Valid) ────────────────────────────────
  console.log('\n── Poll Retrieval ──');
  let optionId;
  if (shareCode) {
    try {
      const t0 = Date.now();
      const res = await fetch(`${API}/polls/${shareCode}`);
      const ms = Date.now() - t0;
      const body = await res.json();
      if (res.status === 200 && body.poll && body.options && body.options.length === 3) {
        optionId = body.options[0].id;
        log('PASS', 'TC003', 'Retrieve poll by shareCode', `${ms}ms, ${body.options.length} options`);
      } else {
        log('FAIL', 'TC003', 'Retrieve poll', `Status: ${res.status}, Body keys: ${Object.keys(body)}`);
      }
    } catch (e) {
      log('FAIL', 'TC003', 'Retrieve poll', e.message);
    }
  }

  // ─── TC004: Get Poll (Not Found) ───────────────────────────
  try {
    const res = await fetch(`${API}/polls/nonexistent123`);
    if (res.status === 404) {
      log('PASS', 'TC004', 'Non-existent poll returns 404', '');
    } else {
      log('FAIL', 'TC004', 'Non-existent poll', `Expected 404, got ${res.status}`);
    }
  } catch (e) {
    log('FAIL', 'TC004', 'Non-existent poll', e.message);
  }

  // ─── TC005: Vote (Valid) ────────────────────────────────────
  console.log('\n── Vote Submission ──');
  if (shareCode && optionId) {
    try {
      const t0 = Date.now();
      const res = await fetch(`${API}/polls/${shareCode}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, fingerprint: 'voter-unique-001' })
      });
      const ms = Date.now() - t0;
      if (res.status === 200) {
        const body = await res.json();
        log('PASS', 'TC005', 'Valid vote accepted', `${ms}ms, message: ${body.message}`);
      } else {
        const body = await res.json();
        log('FAIL', 'TC005', 'Valid vote', `Status: ${res.status}, ${body.message}`);
      }
    } catch (e) {
      log('FAIL', 'TC005', 'Valid vote', e.message);
    }
  }

  // ─── TC006: Vote (Invalid option) ──────────────────────────
  if (shareCode) {
    try {
      const res = await fetch(`${API}/polls/${shareCode}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: '00000000-0000-0000-0000-000000000000', fingerprint: 'voter-invalid' })
      });
      if (res.status === 404 || res.status === 409) {
        log('PASS', 'TC006', 'Invalid option rejected', `Status: ${res.status}`);
      } else {
        log('FAIL', 'TC006', 'Invalid option', `Expected 404, got ${res.status}`);
      }
    } catch (e) {
      log('FAIL', 'TC006', 'Invalid option vote', e.message);
    }
  }

  // ─── TC007: Duplicate Vote (same fingerprint) ──────────────
  console.log('\n── Anti-Abuse ──');
  if (shareCode && optionId) {
    try {
      const res = await fetch(`${API}/polls/${shareCode}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, fingerprint: 'voter-unique-001' })
      });
      if (res.status === 409) {
        const body = await res.json();
        log('PASS', 'TC007', 'Duplicate vote blocked (IP or fingerprint)', `Message: ${body.message}`);
      } else {
        log('FAIL', 'TC007', 'Duplicate vote should be 409', `Got: ${res.status}`);
      }
    } catch (e) {
      log('FAIL', 'TC007', 'Duplicate vote check', e.message);
    }
  }

  // ─── TC008: Vote on non-existent poll ──────────────────────
  try {
    const res = await fetch(`${API}/polls/fakepoll123/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId: '00000000-0000-0000-0000-000000000000', fingerprint: 'fp-fake' })
    });
    if (res.status === 404) {
      log('PASS', 'TC008', 'Vote on non-existent poll returns 404', '');
    } else {
      log('FAIL', 'TC008', 'Non-existent poll vote', `Expected 404, got ${res.status}`);
    }
  } catch (e) {
    log('FAIL', 'TC008', 'Non-existent poll vote', e.message);
  }

  // ─── Performance: Response time benchmarks ─────────────────
  console.log('\n── Performance Benchmarks ──');
  
  // Measure health check latency (10 requests)
  const healthTimes = [];
  for (let i = 0; i < 10; i++) {
    const t0 = Date.now();
    await fetch(`${API}/health`);
    healthTimes.push(Date.now() - t0);
  }
  const avgHealth = (healthTimes.reduce((a, b) => a + b, 0) / healthTimes.length).toFixed(1);
  const maxHealth = Math.max(...healthTimes);
  if (Number(avgHealth) < 200) {
    log('PASS', 'PERF01', `Health avg ${avgHealth}ms, max ${maxHealth}ms`, '< 200ms threshold');
  } else {
    log('FAIL', 'PERF01', `Health avg ${avgHealth}ms — exceeds 200ms threshold`, '');
  }

  // Measure poll creation latency (5 requests)
  const createTimes = [];
  for (let i = 0; i < 5; i++) {
    const t0 = Date.now();
    await fetch(`${API}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: `Perf test poll ${i}`,
        options: ['A', 'B'],
        fingerprint: `perf-fp-${i}`
      })
    });
    createTimes.push(Date.now() - t0);
  }
  const avgCreate = (createTimes.reduce((a, b) => a + b, 0) / createTimes.length).toFixed(1);
  const maxCreate = Math.max(...createTimes);
  if (Number(avgCreate) < 1000) {
    log('PASS', 'PERF02', `Poll creation avg ${avgCreate}ms, max ${maxCreate}ms`, '< 1000ms threshold');
  } else {
    log('FAIL', 'PERF02', `Poll creation avg ${avgCreate}ms — exceeds 1000ms threshold`, '');
  }

  // Measure poll retrieval latency (10 requests)
  if (shareCode) {
    const getTimes = [];
    for (let i = 0; i < 10; i++) {
      const t0 = Date.now();
      await fetch(`${API}/polls/${shareCode}`);
      getTimes.push(Date.now() - t0);
    }
    const avgGet = (getTimes.reduce((a, b) => a + b, 0) / getTimes.length).toFixed(1);
    const maxGet = Math.max(...getTimes);
    if (Number(avgGet) < 500) {
      log('PASS', 'PERF03', `Poll retrieval avg ${avgGet}ms, max ${maxGet}ms`, '< 500ms threshold');
    } else {
      log('FAIL', 'PERF03', `Poll retrieval avg ${avgGet}ms — exceeds 500ms threshold`, '');
    }
  }

  // ─── Rapid-fire concurrent requests ────────────────────────
  console.log('\n── Concurrent / Stress Test ──');
  try {
    const concurrentStart = Date.now();
    const promises = Array.from({ length: 20 }, () => fetch(`${API}/health`));
    const responses = await Promise.all(promises);
    const concurrentMs = Date.now() - concurrentStart;
    const allOk = responses.every(r => r.status === 200);
    if (allOk) {
      log('PASS', 'STRESS01', `20 concurrent health checks in ${concurrentMs}ms`, 'All 200 OK');
    } else {
      const statuses = responses.map(r => r.status);
      log('FAIL', 'STRESS01', '20 concurrent health checks', `Statuses: ${[...new Set(statuses)]}`);
    }
  } catch (e) {
    log('FAIL', 'STRESS01', '20 concurrent requests', e.message);
  }

  // ─── Summary ───────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed}/${total} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════');
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   ${r.testId}: ${r.title} — ${r.detail}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();
