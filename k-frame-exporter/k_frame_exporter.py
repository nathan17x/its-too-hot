from bs4 import BeautifulSoup
import requests
from flask import Flask, Response

app = Flask(__name__)

@app.route("/metrics/<slug>")
def metrics(slug):
  metrics_list = []
  
  try:
    data = requests.get(f'http://{slug}/frstatus.htm')

    if data.status_code == 200:
      soup = BeautifulSoup(data.text, 'html.parser')
      
      # power supply status
      ps_status_data = soup.find(string="Power Supply and Chassis Status").parent.parent.find_next_sibling('pre')
      ps_status_lines = ps_status_data.text.splitlines()
      
      for line in ps_status_lines:
        split = line.split(":")
        metric_name = split[0].strip()
        ps_status = split[1].strip()
        metrics_list.append(f"{metric_name.lower().replace(" ", "_")}{{frame_address=\"{slug}\"}} {ps_status.lower().replace(" ", "_")}")
        
      # fan status
      fan_status_data = soup.find(string="Fan Status").parent.parent.find_next('table')
      fan_status_rows = fan_status_data.find_all('tr')
      for row in fan_status_rows[1:]:
        fan_number = row.find('th').text.strip()
        fan_state_and_speed = row.find_all('td')
        fan_state = fan_state_and_speed[0].text
        fan_speed = fan_state_and_speed[1].text.split(" ")[0]
        metrics_list.append(f"k_frame_fan_{fan_number}_state {fan_state}")
        metrics_list.append(f"k_frame_fan_{fan_number}_speed {fan_speed}")
      
      # video sync status
      sync_status_data = soup.find(string="Video Sync Status").parent.parent.find_next('pre')
      sync_status_lines = sync_status_data.text.splitlines()
      for line in sync_status_lines:
        split = line.split(':')
        metric_name = split[0].lower().strip().replace(" ", "_")
        metric = split[1].lower().strip().replace(" ", "_")
        metrics_list.append(f"k_frame_{metric_name} {metric}")
        
      # disk space status
      disk_status_data = soup.find(string="Disk Space Status").parent.parent.find_next('pre')
      disk_status_lines = disk_status_data.text.splitlines()
      for line in disk_status_lines:
        split = line.split(':')
        metric_name = split[0].lower().strip().replace(" ", "_")
        metric_full = split[1]
        metric = metric_full.split()[0].replace(",","")
        metrics_list.append(f"# HELP k_frame_disk_space_{metric_name} Disk Space in Bytes")
        metrics_list.append(f"k_frame_disk_space_{metric_name} {metric}")
        
      # frame slot status
      slot_status_data = soup.find(string="Frame Slot Status").parent.parent.find_next('table')
      slot_status_rows = slot_status_data.find_all('tr')
      for row in slot_status_rows[1:]:
        columns = row.find_all('td')
        print(columns)
        slot_name = columns[0].text.lower().strip().replace(" ","_")
        present = columns[1].text.lower().strip().replace(" ","_")
        power = columns[2].text.lower().strip().replace(" ","_")
        pcie = columns[3].text.lower().strip().replace(" ","_")
        temp_state = columns[4].text.lower().strip().replace(" ","_")
        metrics_list.append(f"k_frame_{slot_name}_present {present}")
        metrics_list.append(f"k_frame_{slot_name}_power {power}")
        metrics_list.append(f"k_frame_{slot_name}_pcie_link_up {pcie}")
        metrics_list.append(f"k_frame_{slot_name}_temp_state {temp_state}")
        
    return Response('\n'.join(metrics_list) + '\n', mimetype="text/plain")
  except Exception as e:
    return Response(e, mimetype="text/plain")
  
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)
    



