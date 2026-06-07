#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST="$ROOT/test"
SRC_PADS="$ROOT/physionet.org/files/parkinsons-disease-smartwatch/1.0.0"
DST_PADS="$TEST/physionet.org/files/parkinsons-disease-smartwatch/1.0.0"
PATIENTS=(004 006 019)

echo "Building test bundle at $TEST ..."

rm -rf "$TEST"
mkdir -p "$TEST"

rsync -a --exclude '.venv' --exclude '__pycache__' --exclude '*.pyc' \
  "$ROOT/backend/" "$TEST/backend/"

rsync -a --exclude 'node_modules' --exclude 'tsconfig.tsbuildinfo' --exclude 'dist' \
  "$ROOT/frontend-main/" "$TEST/frontend-main/"

cp "$ROOT/run.sh" "$TEST/run.sh"
chmod +x "$TEST/run.sh"

mkdir -p "$DST_PADS/patients" "$DST_PADS/questionnaire" "$DST_PADS/movement/timeseries"

for id in "${PATIENTS[@]}"; do
  cp "$SRC_PADS/patients/patient_${id}.json" "$DST_PADS/patients/"
  cp "$SRC_PADS/questionnaire/questionnaire_response_${id}.json" "$DST_PADS/questionnaire/"
  cp "$SRC_PADS/movement/timeseries/${id}_"*.txt "$DST_PADS/movement/timeseries/"
done

printf '%s\n' '{"prescriptions": {}}' > "$TEST/backend/data/prescriptions.json"

PADS_DATA="$TEST/backend/pads_data.py"
sed -i.bak 's/DEMO_PATIENT_IDS = \["004", "006", "019", "022", "038"\]/DEMO_PATIENT_IDS = ["004", "006", "019"]/' "$PADS_DATA"
rm -f "$PADS_DATA.bak"

python3 - "$PADS_DATA" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()
for pid in ("022", "038"):
    text = re.sub(rf'    "{pid}": \{{[^}}]+\}},\n', '', text)
open(path, 'w').write(text)
PY

python3 - "$TEST/backend/auth.py" <<'PY'
import sys
path = sys.argv[1]
text = open(path).read()
text = text.replace(
    'for suffix in ("004", "006", "019", "022", "038"):',
    'for suffix in ("004", "006", "019"):',
)
open(path, 'w').write(text)
PY

python3 - "$TEST/frontend-main/src/data/patientNames.ts" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()
text = re.sub(
    r'export const PATIENT_DISPLAY_NAMES: Record<string, \{ en: string; zh: string \}> = \{[^}]+\};',
    '''export const PATIENT_DISPLAY_NAMES: Record<string, { en: string; zh: string }> = {
  "004": { en: "Mr. Hans Keller", zh: "漢斯·凱勒先生" },
  "006": { en: "Mrs. Petra Richter", zh: "佩特拉·里希特女士" },
  "019": { en: "Mr. Miguel Torres", zh: "米格爾·托雷斯先生" },
};''',
    text,
    count=1,
)
open(path, 'w').write(text)
PY

python3 - "$TEST/frontend-main/src/data/mock-pads-wearables.ts" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()
keep = ["004", "006", "019"]
entries = []
for pid in keep:
    m = re.search(rf'  "{pid}": \{{[\s\S]*?\n  \}},', text)
    if m:
        entries.append(m.group(0))
body = "export const PADS_WEARABLE_SUMMARIES: Record<string, PadsWearableSummary> = {\n" + ",\n".join(entries) + "\n};"
text = re.sub(
    r'export const PADS_WEARABLE_SUMMARIES: Record<string, PadsWearableSummary> = \{[\s\S]*?\n\};',
    body,
    text,
    count=1,
)
open(path, 'w').write(text)
PY

cat > "$TEST/README.md" <<'EOF'
# PADS Parkinson Care — Test Bundle (3 patients)

Self-contained copy of the full platform with **three demo patients** only:

| ID | Name | Doctor |
|----|------|--------|
| 004 | Mr. Hans Keller | Dr. Sarah Müller |
| 006 | Mrs. Petra Richter | Dr. Sarah Müller |
| 019 | Mr. Miguel Torres | Dr. James Chen |

## Run

```bash
cd test
./run.sh
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

## Login

- Doctor Müller: `doctor.mueller` / any password → patients 004, 006
- Doctor Chen: `doctor.chen` / any password → patient 019
- Patient: `patient.004` / any password

Data layout matches the main project (`physionet.org/files/parkinsons-disease-smartwatch/1.0.0/`).

Rebuild from main project: `../scripts/build-test-folder.sh`
EOF

echo "Done. Test folder: $TEST"
echo "Patients: ${PATIENTS[*]}"
