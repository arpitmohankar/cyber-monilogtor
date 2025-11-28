from scapy.all import wrpcap, Ether, IP, TCP, UDP, ICMP
import random
import time

def generate_sample_pcap(filename="sample_traffic.pcap", count=100):
    packets = []
    
    print(f"Generating {count} sample packets...")
    
    for _ in range(count):
        # Randomize IPs
        src_ip = f"192.168.1.{random.randint(1, 254)}"
        dst_ip = f"10.0.0.{random.randint(1, 254)}"
        
        # Randomize Protocol
        proto = random.choice(['TCP', 'UDP', 'ICMP'])
        
        if proto == 'TCP':
            pkt = IP(src=src_ip, dst=dst_ip)/TCP(sport=random.randint(1024, 65535), dport=random.choice([80, 443, 22, 8080]))
        elif proto == 'UDP':
            pkt = IP(src=src_ip, dst=dst_ip)/UDP(sport=random.randint(1024, 65535), dport=random.randint(1024, 65535))
        else:
            pkt = IP(src=src_ip, dst=dst_ip)/ICMP()
            
        # Add some payload
        pkt = pkt/("X" * random.randint(10, 100))
        
        # Set a timestamp (simulated)
        pkt.time = time.time() - random.randint(0, 3600)
        
        packets.append(pkt)
        
    wrpcap(filename, packets)
    print(f"Saved to {filename}")

if __name__ == "__main__":
    generate_sample_pcap()
