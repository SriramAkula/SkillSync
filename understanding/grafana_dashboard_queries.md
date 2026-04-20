# SkillSync (Adapted from FounderLink) — Grafana Dashboard Queries

## Dashboard 1: Platform Overview

> **Template Variable**: Add a variable `$service` with query `label_values(up, job)` to filter any panel by service.

---

### Panel: All Services Up/Down Status
**Type**: Stat  
**Datasource**: Prometheus
```promql
up
```
> Shows a green/red indicator for each service. Set thresholds: 1 = green, 0 = red.

---

### Panel: Total HTTP Requests (Last 5m) — Per Service
**Type**: Bar chart  
**Datasource**: Prometheus
```promql
sum by (job) (
  rate(http_server_requests_seconds_count[5m])
)
```

---

### Panel: Overall Request Rate (Requests/sec)
**Type**: Time series  
**Datasource**: Prometheus
```promql
sum(rate(http_server_requests_seconds_count[1m]))
```

---

### Panel: Global Error Rate (5xx)
**Type**: Stat (alert if > 1%)  
**Datasource**: Prometheus
```promql
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
/
sum(rate(http_server_requests_seconds_count[5m]))
* 100
```

---

### Panel: Average Response Time Across All Services (ms)
**Type**: Gauge  
**Datasource**: Prometheus
```promql
sum(rate(http_server_requests_seconds_sum[5m]))
/
sum(rate(http_server_requests_seconds_count[5m]))
* 1000
```

---

### Panel: JVM Heap Usage Per Service
**Type**: Time series  
**Datasource**: Prometheus
```promql
jvm_memory_used_bytes{area="heap", job="$service"}
```

---

### Panel: Active Threads Per Service
**Type**: Time series  
**Datasource**: Prometheus
```promql
jvm_threads_live_threads{job="$service"}
```

---

## Dashboard 2: Service Health & Performance

> Create one row per service. Use `$service` variable to switch.

---

### Panel: HTTP Request Rate by Status Code
**Type**: Time series  
**Datasource**: Prometheus
```promql
sum by (status) (
  rate(http_server_requests_seconds_count{job="$service"}[1m])
)
```

---

### Panel: P50 / P90 / P99 Latency
**Type**: Time series  
**Datasource**: Prometheus

P50:
```promql
histogram_quantile(0.50,
  sum by (le) (
    rate(http_server_requests_seconds_bucket{job="$service"}[5m])
  )
) * 1000
```

P90:
```promql
histogram_quantile(0.90,
  sum by (le) (
    rate(http_server_requests_seconds_bucket{job="$service"}[5m])
  )
) * 1000
```

P99:
```promql
histogram_quantile(0.99,
  sum by (le) (
    rate(http_server_requests_seconds_bucket{job="$service"}[5m])
  )
) * 1000
```

---

### Panel: Error Count by URI
**Type**: Table  
**Datasource**: Prometheus
```promql
topk(10,
  sum by (uri, status) (
    rate(http_server_requests_seconds_count{job="$service", status=~"4..|5.."}[5m])
  )
)
```

---

### Panel: JVM Memory — Heap vs Non-Heap
**Type**: Time series  
**Datasource**: Prometheus
```promql
jvm_memory_used_bytes{job="$service"}
```
> Legend: `{{id}} ({{area}})`

---

### Panel: GC Pause Time
**Type**: Time series  
**Datasource**: Prometheus
```promql
rate(jvm_gc_pause_seconds_sum{job="$service"}[1m])
```

---

### Panel: CPU Usage (Process)
**Type**: Gauge  
**Datasource**: Prometheus
```promql
process_cpu_usage{job="$service"} * 100
```

---

### Panel: DB Connection Pool — Active
**Type**: Time series  
**Datasource**: Prometheus
```promql
hikaricp_connections_active{job="$service"}
```

---

### Panel: DB Connection Pool — Pending
**Type**: Stat (alert if > 5)  
**Datasource**: Prometheus
```promql
hikaricp_connections_pending{job="$service"}
```

---

### Panel: Open File Descriptors
**Type**: Time series  
**Datasource**: Prometheus
```promql
process_open_fds{job="$service"}
```

---

## Dashboard 3: Payment Intelligence
*(Adapt "payment-service" to your specific payment module name if different)*

### Panel: Payment Order Creation Rate
**Type**: Time series  
**Datasource**: Prometheus
```promql
rate(http_server_requests_seconds_count{
  job="payment-gateway",
  uri="/payments/create-order",
  status="201"
}[5m])
```

... and so on ...
