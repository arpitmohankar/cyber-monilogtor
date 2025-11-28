import logging
logging.getLogger("scapy.runtime").setLevel(logging.ERROR)

import sys
import json
import pandas as pd
from scapy.all import rdpcap, IP, TCP, UDP, ICMP
from collections import Counter
import os

def analyze_pcap(file_path):
    try:
        if not os.path.exists(file_path):
            return json.dumps({"error": "File not found"})

        packets = rdpcap(file_path)
        
        packet_data = []
        protocol_counts = Counter()
        ip_src_counts = Counter()
        ip_dst_counts = Counter()
        
        start_time = None
        end_time = None

        for pkt in packets:
            if IP in pkt:
                src_ip = pkt[IP].src
                dst_ip = pkt[IP].dst
                proto = pkt[IP].proto
                length = len(pkt)
                time = float(pkt.time)
                
                if start_time is None or time < start_time:
                    start_time = time
                if end_time is None or time > end_time:
                    end_time = time

                protocol_name = "Other"
                if proto == 6:
                    protocol_name = "TCP"
                elif proto == 17:
                    protocol_name = "UDP"
                elif proto == 1:
                    protocol_name = "ICMP"
                
                protocol_counts[protocol_name] += 1
                ip_src_counts[src_ip] += 1
                ip_dst_counts[dst_ip] += 1
                
                packet_data.append({
                    "time": time,
                    "source": src_ip,
                    "destination": dst_ip,
                    "protocol": protocol_name,
                    "length": length,
                    "info": pkt.summary()
                })

        # Convert to pandas DataFrame for easier manipulation if needed, 
        # but for now we just prepare the JSON response
        
        # Top talkers
        top_sources = dict(ip_src_counts.most_common(5))
        top_destinations = dict(ip_dst_counts.most_common(5))
        
        # Timeline data (simplified for chart)
        # Group by second
        df = pd.DataFrame(packet_data)
        if not df.empty:
            df['time'] = pd.to_datetime(df['time'], unit='s')
            timeline = df.groupby(df['time'].dt.floor('S')).size().to_dict()
            # Convert keys to string for JSON serialization
            timeline_str = {k.strftime('%Y-%m-%d %H:%M:%S'): v for k, v in timeline.items()}
        else:
            timeline_str = {}

        result = {
            "success": True,
            "summary": {
                "total_packets": len(packets),
                "duration": (end_time - start_time) if start_time and end_time else 0,
                "protocols": dict(protocol_counts),
                "top_sources": top_sources,
                "top_destinations": top_destinations
            },
            "packets": packet_data[:100], # Limit to first 100 for display to avoid huge payload
            "timeline": timeline_str
        }
        
        return json.dumps(result)

    except Exception as e:
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        print(analyze_pcap(file_path))
    else:
        print(json.dumps({
            "error": "No file path provided", 
            "usage": "python packet_analyzer.py <path_to_pcap_file>"
        }))
