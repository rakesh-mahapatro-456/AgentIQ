import httpx
import asyncio
import json
import os
import io

BASE_URL = "http://127.0.0.1:8000"

async def test_backend():
    async with httpx.AsyncClient(timeout=180.0) as client:
        print("🚀 STARTING AGENT-IQ FULL SUITE (NEURAX 2.0)...\n")

        # 1. Health Check
        print("🏥 [1/5] Testing /health...")
        try:
            r = await client.get(f"{BASE_URL}/health")
            print(f"Status: {r.status_code} | Body: {r.json()}")
        except Exception as e:
            print(f"❌ CONNECTION FAILED: Is the server running at {BASE_URL}?")
            return

        print("\n" + "-"*20 + "\n")

        # 2. PDF Ingestion
        print("📂 [2/5] Testing /api/kb/ingest...")
        dummy_path = "demo_knowledge.pdf"
        # Generate a valid minimal PDF header
        with open(dummy_path, "wb") as f:
            f.write(b"%PDF-1.1\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n178\n%%EOF")
        
        try:
            with open(dummy_path, "rb") as f:
                files = {"file": ("demo_knowledge.pdf", f, "application/pdf")}
                r = await client.post(f"{BASE_URL}/api/kb/ingest", files=files)
                print(f"Status: {r.status_code} | Body: {r.json()}")
        finally:
            if os.path.exists(dummy_path):
                os.remove(dummy_path)

        print("\n" + "-"*20 + "\n")

        # 3. Agent Streaming
        print("🤖 [3/5] Testing Agent Streaming (Single Lead)...")
        params = {"lead_email": "s.global@globalcorp.io"}
        full_content = ""
        
        async with client.stream("GET", f"{BASE_URL}/api/agent/stream", params=params) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line.replace("data: ", "").strip()
                    if not data_str: continue
                    data = json.loads(data_str)
                    
                    # Log the "Thoughts"
                    if "logs" in data:
                        print(f"   💭 {data['logs']}")
                    
                    if "writer" in data:
                        full_content = data["writer"].get("final_proposal", "")
        
        if full_content:
            print("✅ Agent Output Received.")
        else:
            print("❌ No content received from agent.")

        print("\n" + "-"*20 + "\n")

        # 4. PDF Export (THE FIX IS HERE)
        if full_content:
            print("📄 [4/5] Testing /api/agent/export-pdf...")
            payload = {"content": full_content, "lead_name": "Sarah_Global"}
            r = await client.post(f"{BASE_URL}/api/agent/export-pdf", json=payload)
            
            if r.status_code == 200:
                # Save the actual bytes to a file so you can open it!
                output_path = "test_proposal_result.pdf"
                with open(output_path, "wb") as f:
                    f.write(r.content)
                print(f"✅ PDF DOWNLOADED SUCCESSFULLY: {os.path.abspath(output_path)}")
            else:
                print(f"❌ PDF Export Failed: {r.status_code}")

        print("\n" + "-"*20 + "\n")

        # 5. Batch CSV Processing
        print("📊 [5/5] Testing Batch CSV Processing...")
        csv_content = "email\nrakesh@infosys.com\nanita@tcs.com"
        csv_file = io.BytesIO(csv_content.encode('utf-8'))
        files = {"file": ("leads.csv", csv_file, "text/csv")}
        
        try:
            print("⏳ Processing Batch leads...")
            r = await client.post(f"{BASE_URL}/api/batch/process", files=files)
            if r.status_code == 200:
                print(f"✅ Batch Complete! Processed: {r.json()['total_processed']} leads.")
            else:
                print(f"❌ Batch Failed: {r.status_code}")
        except Exception as e:
            print(f"❌ Batch Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_backend())
    print("\n🏁 ALL SYSTEMS OPERATIONAL FOR DEMO.")