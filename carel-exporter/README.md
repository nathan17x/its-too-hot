# Carel Exporter
> Used to export prometheus metrics from the Carel c.pCO HVAC controller.

Run the docker container and configure a prometheus source for each controller:
```
- job_name: carel-exporter-streetside
  metrics_path: '/metrics/{controller-address}'
  static_configs:
    - targets: [carel-exporter:9000] 
      labels:
        instance: ac_streetside