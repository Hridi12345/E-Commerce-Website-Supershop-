import asyncio
import time
import statistics
import json
import httpx
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

async def authenticate_user(client: httpx.AsyncClient, email: str, password: str) -> str:
    try:
        resp = await client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": password},
            timeout=10.0
        )
        if resp.status_code == 200:
            return resp.json().get("access_token", "")
    except Exception as e:
        pass
    return ""

async def scenario_browse_catalog(client: httpx.AsyncClient) -> tuple[bool, float]:
    start = time.perf_counter()
    try:
        resp = await client.get(f"{BASE_URL}/api/products?limit=12", timeout=10.0)
        elapsed = (time.perf_counter() - start) * 1000
        return (resp.status_code == 200, elapsed)
    except Exception:
        elapsed = (time.perf_counter() - start) * 1000
        return (False, elapsed)

async def scenario_customer_login(client: httpx.AsyncClient) -> tuple[bool, float]:
    start = time.perf_counter()
    try:
        resp = await client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "customer@supershop.com", "password": "customer123"},
            timeout=10.0
        )
        elapsed = (time.perf_counter() - start) * 1000
        return (resp.status_code == 200, elapsed)
    except Exception:
        elapsed = (time.perf_counter() - start) * 1000
        return (False, elapsed)

async def scenario_product_details(client: httpx.AsyncClient) -> tuple[bool, float]:
    start = time.perf_counter()
    try:
        resp = await client.get(f"{BASE_URL}/api/products/organic-honeycrisp-red-apples", timeout=10.0)
        elapsed = (time.perf_counter() - start) * 1000
        return (resp.status_code in [200, 404], elapsed)
    except Exception:
        elapsed = (time.perf_counter() - start) * 1000
        return (False, elapsed)

async def scenario_customer_orders(client: httpx.AsyncClient, token: str) -> tuple[bool, float]:
    start = time.perf_counter()
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        resp = await client.get(f"{BASE_URL}/api/customers/portal/orders", headers=headers, timeout=10.0)
        elapsed = (time.perf_counter() - start) * 1000
        return (resp.status_code == 200, elapsed)
    except Exception:
        elapsed = (time.perf_counter() - start) * 1000
        return (False, elapsed)

async def scenario_admin_dashboard(client: httpx.AsyncClient, admin_token: str) -> tuple[bool, float]:
    start = time.perf_counter()
    try:
        headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        resp = await client.get(f"{BASE_URL}/api/analytics/dashboard?period=7d", headers=headers, timeout=10.0)
        elapsed = (time.perf_counter() - start) * 1000
        return (resp.status_code == 200, elapsed)
    except Exception:
        elapsed = (time.perf_counter() - start) * 1000
        return (False, elapsed)

async def scenario_checkout_order(client: httpx.AsyncClient, token: str) -> tuple[bool, float]:
    start = time.perf_counter()
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        payload = {
            "customer_name": "Load Test Buyer",
            "customer_phone": "+8801700999999",
            "customer_email": "loadtest@buyer.com",
            "shipping_address": {
                "full_name": "Load Test Buyer",
                "phone": "+8801700999999",
                "street": "Road 1, Block A",
                "city": "Dhaka"
            },
            "billing_address": {
                "full_name": "Load Test Buyer",
                "phone": "+8801700999999",
                "street": "Road 1, Block A",
                "city": "Dhaka"
            },
            "payment_method": "cod",
            "items": [
                {
                    "product_id": 1,
                    "unit_price": 280.0,
                    "quantity": 1,
                    "product_name": "Organic Honeycrisp Red Apples (Farm Fresh)",
                    "sku": "APL-HONEYCRISP-1KG"
                }
            ]
        }
        resp = await client.post(f"{BASE_URL}/api/orders/checkout", json=payload, headers=headers, timeout=10.0)
        elapsed = (time.perf_counter() - start) * 1000
        # If stock is depleted during high load, 400 is also a valid business rule response
        return (resp.status_code in [200, 400], elapsed)
    except Exception:
        elapsed = (time.perf_counter() - start) * 1000
        return (False, elapsed)

async def simulate_user(
    user_id: int,
    iterations_per_user: int,
    customer_token: str,
    admin_token: str,
    results: list
):
    async with httpx.AsyncClient(timeout=10.0) as client:
        for it in range(iterations_per_user):
            # Mix of user scenarios representing real-world e-commerce usage
            # 1. Browse catalog
            success, lat = await scenario_browse_catalog(client)
            results.append({"scenario": "browse_catalog", "success": success, "latency_ms": lat})

            # 2. Product details
            success, lat = await scenario_product_details(client)
            results.append({"scenario": "product_details", "success": success, "latency_ms": lat})

            # 3. Order history check (every 2nd iteration)
            if it % 2 == 0 and customer_token:
                success, lat = await scenario_customer_orders(client, customer_token)
                results.append({"scenario": "customer_orders", "success": success, "latency_ms": lat})

            # 4. Admin dashboard monitoring (every 5th user)
            if user_id % 5 == 0 and admin_token:
                success, lat = await scenario_admin_dashboard(client, admin_token)
                results.append({"scenario": "admin_dashboard", "success": success, "latency_ms": lat})

            # 5. Checkout simulation (every 4th iteration)
            if it % 4 == 0:
                success, lat = await scenario_checkout_order(client, customer_token)
                results.append({"scenario": "checkout_order", "success": success, "latency_ms": lat})

async def run_load_tier(concurrency: int, iterations_per_user: int, customer_token: str, admin_token: str):
    print(f"\n========================================================")
    print(f"  RUNNING LOAD TIER: {concurrency} CONCURRENT VIRTUAL USERS")
    print(f"========================================================")

    results = []
    t_start = time.perf_counter()

    tasks = [
        simulate_user(i, iterations_per_user, customer_token, admin_token, results)
        for i in range(concurrency)
    ]
    await asyncio.gather(*tasks)

    t_elapsed = time.perf_counter() - t_start
    total_requests = len(results)
    successful_requests = sum(1 for r in results if r["success"])
    failed_requests = total_requests - successful_requests
    error_rate = (failed_requests / total_requests) * 100.0 if total_requests > 0 else 0.0
    rps = total_requests / t_elapsed if t_elapsed > 0 else 0.0

    latencies = [r["latency_ms"] for r in results]
    latencies.sort()

    avg_lat = statistics.mean(latencies) if latencies else 0.0
    median_lat = statistics.median(latencies) if latencies else 0.0
    p95_lat = latencies[int(len(latencies) * 0.95)] if latencies else 0.0
    p99_lat = latencies[int(len(latencies) * 0.99)] if latencies else 0.0
    min_lat = min(latencies) if latencies else 0.0
    max_lat = max(latencies) if latencies else 0.0

    tier_summary = {
        "concurrency": concurrency,
        "total_requests": total_requests,
        "successful_requests": successful_requests,
        "failed_requests": failed_requests,
        "error_rate_pct": round(error_rate, 2),
        "duration_sec": round(t_elapsed, 2),
        "requests_per_sec": round(rps, 2),
        "latency_stats_ms": {
            "avg": round(avg_lat, 2),
            "median_p50": round(median_lat, 2),
            "p95": round(p95_lat, 2),
            "p99": round(p99_lat, 2),
            "min": round(min_lat, 2),
            "max": round(max_lat, 2)
        }
    }

    print(f"Total Requests: {total_requests}")
    print(f"Total Time:     {t_elapsed:.2f}s")
    print(f"Throughput:     {rps:.2f} req/s")
    print(f"Error Rate:     {error_rate:.2f}%")
    print(f"Latency Avg:    {avg_lat:.2f} ms")
    print(f"Latency P50:    {median_lat:.2f} ms")
    print(f"Latency P95:    {p95_lat:.2f} ms")
    print(f"Latency P99:    {p99_lat:.2f} ms")

    # Breakdown by scenario
    print("\n-- Breakdown by Scenario --")
    scenarios = set(r["scenario"] for r in results)
    scenario_stats = {}
    for sc in sorted(scenarios):
        sc_lats = [r["latency_ms"] for r in results if r["scenario"] == sc]
        sc_succ = sum(1 for r in results if r["scenario"] == sc and r["success"])
        sc_err = len(sc_lats) - sc_succ
        sc_avg = statistics.mean(sc_lats) if sc_lats else 0
        sc_p95 = sc_lats[int(len(sc_lats) * 0.95)] if sc_lats else 0
        scenario_stats[sc] = {
            "count": len(sc_lats),
            "success": sc_succ,
            "errors": sc_err,
            "avg_ms": round(sc_avg, 2),
            "p95_ms": round(sc_p95, 2)
        }
        print(f"  {sc:<18}: {len(sc_lats):>4} reqs | Avg: {sc_avg:>6.2f}ms | P95: {sc_p95:>6.2f}ms | Errors: {sc_err}")

    tier_summary["scenario_breakdown"] = scenario_stats
    return tier_summary

async def main():
    print("=" * 60)
    print("  SUSHOP E-COMMERCE CONCURRENT LOAD & STRESS TESTING SUITE")
    print("=" * 60)

    async with httpx.AsyncClient() as auth_client:
        print("Authenticating benchmark tokens...")
        cust_token = await authenticate_user(auth_client, "customer@supershop.com", "customer123")
        admin_token = await authenticate_user(auth_client, "admin@supershop.com", "admin123")
        print(f"Tokens acquired: Customer={'YES' if cust_token else 'NO'}, Admin={'YES' if admin_token else 'NO'}")

    all_summaries = []

    # 1. 10 Concurrent Users
    res_10 = await run_load_tier(concurrency=10, iterations_per_user=5, customer_token=cust_token, admin_token=admin_token)
    all_summaries.append(res_10)

    # 2. 50 Concurrent Users
    res_50 = await run_load_tier(concurrency=50, iterations_per_user=5, customer_token=cust_token, admin_token=admin_token)
    all_summaries.append(res_50)

    # 3. 100 Concurrent Users
    res_100 = await run_load_tier(concurrency=100, iterations_per_user=4, customer_token=cust_token, admin_token=admin_token)
    all_summaries.append(res_100)

    with open("load_test_report.json", "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.utcnow().isoformat(),
            "target": BASE_URL,
            "summaries": all_summaries
        }, f, indent=2)

    print("\n[SUCCESS] Load testing finished! Generated load_test_report.json")

if __name__ == "__main__":
    asyncio.run(main())
