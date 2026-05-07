import psutil
import time
import threading
from django.utils import timezone

class GlobalMonitor:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(GlobalMonitor, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.history_size = 60
        self.cpu_history = [0] * self.history_size
        self.memory_history = [0] * self.history_size
        self.timestamps = ["--:--"] * self.history_size
        
        self.last_net_io = psutil.net_io_counters()
        self.last_time = time.time()
        
        self.net_speed_in = 0
        self.net_speed_out = 0
        self.alerts = []
        
        self._initialized = True
        self._start_monitoring()

    def _start_monitoring(self):
        thread = threading.Thread(target=self._monitor_loop, daemon=True)
        thread.start()

    def _monitor_loop(self):
        while True:
            self.update_metrics()
            time.sleep(1)

    def update_metrics(self):
        # 1. System Usage
        cpu = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # 2. History
        self.cpu_history.pop(0)
        self.cpu_history.append(cpu)
        
        self.memory_history.pop(0)
        self.memory_history.append(memory.percent)
        
        self.timestamps.pop(0)
        self.timestamps.append(timezone.now().strftime("%H:%M:%S"))

        # 3. Network Throughput
        current_net_io = psutil.net_io_counters()
        current_time = time.time()
        time_delta = current_time - self.last_time
        
        if time_delta > 0:
            self.net_speed_in = (current_net_io.bytes_recv - self.last_net_io.bytes_recv) / time_delta / (1024 * 1024) # MB/s
            self.net_speed_out = (current_net_io.bytes_sent - self.last_net_io.bytes_sent) / time_delta / (1024 * 1024) # MB/s
        
        self.last_net_io = current_net_io
        self.last_time = current_time

        # 4. Alert Generation
        new_alerts = []
        if cpu > 90:
            new_alerts.append({"level": "critical", "message": f"CPU Usage critically high ({cpu}%)"})
        elif cpu > 75:
            new_alerts.append({"level": "warning", "message": f"CPU Usage high ({cpu}%)"})
            
        if memory.percent > 90:
            new_alerts.append({"level": "critical", "message": f"Memory Usage critically high ({memory.percent}%)"})
        elif memory.percent > 80:
            new_alerts.append({"level": "warning", "message": f"Memory Usage high ({memory.percent}%)"})
            
        if disk.percent > 90:
            new_alerts.append({"level": "critical", "message": f"Disk space critically low ({disk.percent}%)"})
        
        self.alerts = new_alerts

    def get_data(self):
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_usage_percent": self.cpu_history[-1],
            "memory_usage_percent": self.memory_history[-1],
            "memory_available_gb": round(memory.available / (1024 ** 3), 2),
            "disk_usage_percent": disk.percent,
            "network_in_mb": round(self.last_net_io.bytes_recv / (1024 ** 2), 2),
            "network_out_mb": round(self.last_net_io.bytes_sent / (1024 ** 2), 2),
            "network_speed_in": round(self.net_speed_in, 2),
            "network_speed_out": round(self.net_speed_out, 2),
            "cpu_history": self.cpu_history,
            "memory_history": self.memory_history,
            "timestamps": self.timestamps,
            "alerts": self.alerts
        }

monitor = GlobalMonitor()
