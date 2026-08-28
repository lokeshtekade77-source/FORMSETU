import requests

base = "http://127.0.0.1:8000/api"

print("--- 1. Creating Test Application ---")
res = requests.post(f"{base}/test-applications")
print("Create output:", res.json())
test_id = res.json()["id"]

print("\n--- 2. Uploading HCL Form PDF ---")
with open("scratch/sample_hcl_form.pdf", "rb") as f:
    res = requests.post(
        f"{base}/test-applications/{test_id}/upload-form",
        files={"file": ("sample_hcl_form.pdf", f, "application/pdf")}
    )
print("Upload output:", res.json())

print("\n--- 3. Getting Analysis ---")
res = requests.get(f"{base}/test-applications/{test_id}/analysis")
analysis = res.json()
print("Extracted Title:", analysis.get("title"))
for sec in analysis.get("sections", []):
    print(f"Section [{sec.get('title')}]:")
    for fld in sec.get("fields", []):
        print(f"  - {fld.get('label')} ({fld.get('key')}): '{fld.get('value')}'")

print("\n--- 4. Starting Workflow ---")
res = requests.post(f"{base}/test-applications/{test_id}/start")
wf = res.json()
print("Workflow created:", wf)
app_id = wf["application_id"]

print("\n--- 5. Getting Form Fields in Application ---")
res = requests.get(f"{base}/applications/{app_id}/fields")
fields = res.json()
for f in fields:
    print(f"  - {f['label']} ({f['key']}): value='{f['value']}', source={f['source']}, status={f['status']}")

print("\n--- 6. Testing Field Verification (Mobile Number) ---")
mobile_field = next((f for f in fields if "mobile" in f["key"] or "phone" in f["key"]), fields[0])
res = requests.post(f"{base}/applications/{app_id}/fields/{mobile_field['id']}/verify")
print("Verify Field output:", res.json())

print("\n--- 7. Testing Field Update (Mobile Number) ---")
res = requests.post(f"{base}/applications/{app_id}/fields/{mobile_field['id']}/update", json={"value": "9876543210"})
print("Update Field output:", res.json())
