# its-too-hot
Custom exporters, Prometheus and Grafana configs for broadcast equipment 
## Carel Exporter
> Used to export prometheus metrics from the Carel c.pCO HVAC controller.

## Cobalt Exporter
> Connects to Cobalt 9905 UDX cards via websocket and exposes environmental metrics formatted for Prometheus

## SNMP Exporter
> Contains an snmp.yml file created against useful MIBs - including Arista, Cisco, and Grass Valley K-Frame
> See https://github.com/prometheus/snmp_exporter for instructions on compiling with additional MIBs

## Quickstart
Run the docker compose stack and configure a prometheus source for each target:
```
- job_name: carel-exporter-streetside
  metrics_path: '/metrics/{controller-address}'
  static_configs:
    - targets: [carel-exporter:9000] 
      labels:
        instance: ac_streetside
```
