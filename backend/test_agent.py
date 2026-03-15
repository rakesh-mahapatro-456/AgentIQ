import httpx
import asyncio
import json

async def run_test():
    print("🎬 SCRIPT STARTING...")
    url = "http://127.0.0.1:8000/api/agent/stream"
    params = {"lead_email": "s.global@globalcorp.io"}
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            print(f"📡 Connecting to {url}...")
            async with client.stream("GET", url, params=params) as response:
                if response.status_code != 200:
                    print(f"❌ SERVER ERROR {response.status_code}: {await response.aread()}")
                    return

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = json.loads(line.replace("data: ", ""))
                        
                        # Print logs from the agent nodes
                        if "discovery" in data:
                            print(f"✅ DISCOVERY: {data['discovery'].get('logs')}")
                        if "researcher" in data:
                            print(f"🔍 RESEARCH: {data['researcher'].get('logs')}")
                        if "writer" in data:
                            print(f"✍️ PROPOSAL GENERATED!")
                            print("-" * 30)
                            print(data['writer'].get('final_proposal'))
                            print("-" * 30)
                            
    except Exception as e:
        print(f"❌ CONNECTION ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(run_test())