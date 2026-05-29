<<<<<<< HEAD
# its-too-hot
Custom exporters, Prometheus and Grafana configs for broadcast equipment 
## Carel Exporter
> Used to export prometheus metrics from the Carel c.pCO HVAC controller.

Run the docker container and configure a prometheus source for each controller:
```
- job_name: carel-exporter-streetside
  metrics_path: '/metrics/{controller-address}'
  static_configs:
    - targets: [carel-exporter:9000] 
      labels:
        instance: ac_streetside
```
=======
# its-too-hot
Custom exporters, Prometheus and Grafana configs for broadcast equipment 
## Carel Exporter
Used to export prometheus metrics from the Carel c.pCO HVAC controller.

Contains a simple python Flask app that reads metrics from the Carel API and serves a Prometheus-formatted metrics page.

## Cobalt Exporter
Currently only supports Cobalt 9905 UDX cards.

Contains a Deno app that connects to the card via WebSocket (same as Dashboard) and serves Prometheus metrics using a simple Oak webserver.

## SNMP Exporter
Contains an snmp.yml file created against useful MIBs - including Arista, Cisco, and Grass Valley K-Frame.

See https://github.com/prometheus/snmp_exporter for instructions on compiling with additional MIBs.

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
>>>>>>> refs/remotes/origin/main
