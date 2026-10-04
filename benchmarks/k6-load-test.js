import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * k6 Load Test Script - Web SMK Telkom Purwokerto
 *
 * Skenario Pengujian Beban:
 * - Ramp-up: 50 VUs (30 detik)
 * - Beban Sedang: 200 VUs (1 menit)
 * - Beban Puncak: 500 VUs (1 menit)
 * - Ramp-down: 0 VUs (30 detik)
 *
 * Ambang Batas (Thresholds):
 * - http_req_duration: p(95) < 200ms, p(99) < 400ms
 * - http_req_failed: rate < 0.01 (kurang dari 1%)
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const failureRate = new Rate('failed_requests');

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up beban 50 VUs
    { duration: '1m', target: 200 },  // Beban konstan 200 VUs
    { duration: '1m', target: 500 },  // Beban puncak 500 VUs
    { duration: '30s', target: 0 },   // Ramp-down beban
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<400'],
    http_req_failed: ['rate<0.01'],
  },
};

const endpoints = [
  { name: 'Halaman Utama', path: '/' },
  { name: 'Endpoint Kesehatan', path: '/api/health' },
  { name: 'Endpoint PKL', path: '/api/pkl' },
  { name: 'Halaman Jurusan', path: '/jurusan' },
  { name: 'Halaman Berita', path: '/berita' },
  { name: 'Endpoint Metrik Prometheus', path: '/api/metrics' },
];

export default function () {
  for (const ep of endpoints) {
    const url = `${BASE_URL}${ep.path}`;
    const params = {
      tags: {
        endpoint: ep.path,
        name: ep.name,
      },
      headers: {
        'Accept': 'application/json, text/html, */*',
        'User-Agent': 'k6-load-tester/1.0',
      },
    };

    const res = http.get(url, params);

    const isOk = check(res, {
      [`${ep.name} status 200`]: (r) => r.status === 200,
    });

    if (!isOk) {
      failureRate.add(1);
    } else {
      failureRate.add(0);
    }
  }

  // Waktu jeda antar iterasi per Virtual User
  sleep(1);
}
