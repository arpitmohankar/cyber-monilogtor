import socket
import sys
import json
import threading
from queue import Queue
import time
import platform
import subprocess

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "127.0.0.1"

def scan_port(ip, port, open_ports):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex((ip, port))
        if result == 0:
            try:
                service = socket.getservbyport(port)
            except:
                service = "unknown"
            open_ports.append({"port": port, "service": service})
        sock.close()
    except:
        pass

def scan_target_ports(target_ip, ports_to_scan=None):
    if ports_to_scan is None:
        # Common ports
        ports_to_scan = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 3306, 3389, 5000, 8080, 8443]
    
    open_ports = []
    threads = []
    
    for port in ports_to_scan:
        t = threading.Thread(target=scan_port, args=(target_ip, port, open_ports))
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()
        
    return sorted(open_ports, key=lambda x: x['port'])

def ping_host(ip, active_hosts):
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    command = ['ping', param, '1', ip]
    
    try:
        # Hide output
        if platform.system().lower() == 'windows':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            output = subprocess.call(command, startupinfo=startupinfo, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            output = subprocess.call(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
        if output == 0:
            try:
                hostname = socket.gethostbyaddr(ip)[0]
            except:
                hostname = "Unknown"
            active_hosts.append({"ip": ip, "hostname": hostname, "status": "Active"})
    except:
        pass

def scan_network(subnet):
    active_hosts = []
    threads = []
    
    # Scan first 20 IPs for speed in this demo, or full 254 if needed
    # For demo purposes, we'll scan a smaller range or just the local IP + neighbors
    base_ip = ".".join(subnet.split(".")[:3])
    
    # Limit to 1-20 and current IP for speed
    ranges = list(range(1, 21))
    
    for i in ranges:
        ip = f"{base_ip}.{i}"
        t = threading.Thread(target=ping_host, args=(ip, active_hosts))
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()
        
    return sorted(active_hosts, key=lambda x: int(x['ip'].split('.')[-1]))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Invalid arguments"}))
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "scan_network":
        local_ip = get_local_ip()
        results = scan_network(local_ip)
        print(json.dumps({"success": True, "local_ip": local_ip, "devices": results}))
        
    elif command == "scan_ports":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Target IP required"}))
            sys.exit(1)
        target = sys.argv[2]
        results = scan_target_ports(target)
        print(json.dumps({"success": True, "target": target, "ports": results}))
        
    else:
        print(json.dumps({"error": "Unknown command"}))
