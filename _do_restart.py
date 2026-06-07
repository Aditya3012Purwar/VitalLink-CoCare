import subprocess, pathlib, json, re, time
root = pathlib.Path("/Users/adityapurwar/Documents/Euortech Hackathon")
backend = root / "backend"

def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True)

run("pkill -f 'uvicorn main:app' 2>/dev/null; pkill -f 'ngrok http' 2>/dev/null; lsof -ti:8000 | xargs kill -9 2>/dev/null")
time.sleep(2)
run(f'cd "{backend}" && .venv/bin/pip install python-multipart -q')
run(f'cd "{root}/frontend-main" && VITE_API_URL= npm run build')

log_server = pathlib.Path("/tmp/pads-server.log")
with open(log_server, "w") as f:
    subprocess.Popen(
        [str(backend / ".venv/bin/uvicorn"), "main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=str(backend), stdout=f, stderr=subprocess.STDOUT, start_new_session=True,
    )
health_code = "000"
for _ in range(30):
    health_code = run("curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/health").stdout.strip()
    if health_code == "200":
        break
    time.sleep(1)

env = (backend / ".env").read_text()
tok = re.search(r"^NGROK_AUTHTOKEN=(.*)$", env, re.M).group(1).strip().strip("\r")
run(f"ngrok config add-authtoken {tok!r}")
log_ngrok = pathlib.Path("/tmp/pads-ngrok-manual.log")
with open(log_ngrok, "w") as f:
    subprocess.Popen(["ngrok", "http", "8000", "--log=stdout"], stdout=f, stderr=subprocess.STDOUT, start_new_session=True)
public_url = ""
for _ in range(30):
    r = run("curl -s http://127.0.0.1:4040/api/tunnels")
    try:
        for t in json.loads(r.stdout).get("tunnels", []):
            if t.get("proto") == "https":
                public_url = t["public_url"]
                break
    except Exception:
        pass
    if public_url:
        break
    time.sleep(1)

voice = run("curl -s http://127.0.0.1:8000/api/voice/config").stdout.strip()
uv = run("pgrep -fl uvicorn").stdout.strip()
ng = run("pgrep -fl ngrok").stdout.strip()
summary = {
    "local_url": "http://127.0.0.1:8000",
    "public_url": public_url,
    "health_http_code": health_code,
    "voice_config": voice,
    "uvicorn_procs": uv,
    "ngrok_procs": ng,
}
(root / "restart-summary.json").write_text(json.dumps(summary, indent=2))
