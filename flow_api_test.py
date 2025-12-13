#!/usr/bin/env python3
"""
Focused Flow API Testing - Comprehensive validation of all Flow endpoints
"""

import requests
import json
from datetime import datetime

def test_flows_api():
    base_url = "https://nodeflow-ui.preview.emergentagent.com/api"
    
    print("🔄 Testing Flow API Endpoints Comprehensively...")
    print("=" * 60)
    
    # Test data
    created_flows = []
    created_agent_id = None
    
    try:
        # First create an agent for testing flows with agent assignment
        agent_data = {
            "name": f"Flow Test Agent {datetime.now().strftime('%H%M%S')}",
            "description": "Agent for flow testing",
            "type": "chat",
            "system_prompt": "You are a test assistant.",
            "chat_config": {
                "llm_provider": "openai",
                "llm_model": "gpt-4o"
            }
        }
        
        response = requests.post(f"{base_url}/agents", json=agent_data)
        if response.status_code == 200:
            created_agent_id = response.json()['id']
            print(f"✅ Created test agent: {created_agent_id}")
        else:
            print(f"❌ Failed to create agent: {response.text}")
            return False
        
        # Test 1: Create flow without agent
        print("\n1. Testing POST /api/flows (without agent)...")
        flow_data = {
            "name": f"Test Flow {datetime.now().strftime('%H%M%S')}",
            "description": "Test flow without agent assignment",
            "nodes": [
                {
                    "id": "start-1",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {"label": "Start Node"}
                }
            ],
            "edges": []
        }
        
        response = requests.post(f"{base_url}/flows", json=flow_data)
        if response.status_code == 200:
            flow1 = response.json()
            created_flows.append(flow1['id'])
            print(f"✅ Created flow without agent: {flow1['id']}")
            print(f"   - Name: {flow1['name']}")
            print(f"   - Agent ID: {flow1.get('agent_id', 'None')}")
            print(f"   - Nodes count: {flow1['nodes_count']}")
            print(f"   - Status: {flow1['status']}")
        else:
            print(f"❌ Failed to create flow: {response.text}")
            return False
        
        # Test 2: Create flow with agent
        print("\n2. Testing POST /api/flows (with agent)...")
        flow_data_with_agent = {
            "name": f"Agent Flow {datetime.now().strftime('%H%M%S')}",
            "description": "Test flow with agent assignment",
            "agent_id": created_agent_id,
            "nodes": [
                {
                    "id": "start-1",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {"label": "Start Node"}
                },
                {
                    "id": "llm-1",
                    "type": "llm",
                    "position": {"x": 300, "y": 100},
                    "data": {"label": "LLM Node", "prompt": "Process user input"}
                }
            ],
            "edges": [
                {
                    "id": "e1-2",
                    "source": "start-1",
                    "target": "llm-1"
                }
            ]
        }
        
        response = requests.post(f"{base_url}/flows", json=flow_data_with_agent)
        if response.status_code == 200:
            flow2 = response.json()
            created_flows.append(flow2['id'])
            print(f"✅ Created flow with agent: {flow2['id']}")
            print(f"   - Name: {flow2['name']}")
            print(f"   - Agent ID: {flow2['agent_id']}")
            print(f"   - Nodes count: {flow2['nodes_count']}")
            print(f"   - Edges count: {len(flow2['edges'])}")
        else:
            print(f"❌ Failed to create flow with agent: {response.text}")
            return False
        
        # Test 3: List all flows
        print("\n3. Testing GET /api/flows...")
        response = requests.get(f"{base_url}/flows")
        if response.status_code == 200:
            flows = response.json()
            our_flows = [f for f in flows if f['id'] in created_flows]
            print(f"✅ Listed flows: {len(flows)} total, {len(our_flows)} are ours")
            for flow in our_flows:
                print(f"   - {flow['name']} (Agent: {flow.get('agent_id', 'None')})")
        else:
            print(f"❌ Failed to list flows: {response.text}")
            return False
        
        # Test 4: Get specific flow
        print(f"\n4. Testing GET /api/flows/{created_flows[0]}...")
        response = requests.get(f"{base_url}/flows/{created_flows[0]}")
        if response.status_code == 200:
            flow = response.json()
            print(f"✅ Retrieved specific flow: {flow['name']}")
            print(f"   - ID matches: {flow['id'] == created_flows[0]}")
            print(f"   - Has all fields: {all(field in flow for field in ['id', 'name', 'description', 'status', 'nodes', 'edges', 'created_at', 'updated_at'])}")
        else:
            print(f"❌ Failed to get specific flow: {response.text}")
            return False
        
        # Test 5: Update flow
        print(f"\n5. Testing PUT /api/flows/{created_flows[0]}...")
        update_data = {
            "name": f"Updated Flow {datetime.now().strftime('%H%M%S')}",
            "description": "Updated flow description",
            "nodes": [
                {
                    "id": "start-1",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {"label": "Updated Start Node"}
                },
                {
                    "id": "end-1",
                    "type": "end",
                    "position": {"x": 300, "y": 100},
                    "data": {"label": "End Node"}
                }
            ],
            "edges": [
                {
                    "id": "e1-end",
                    "source": "start-1",
                    "target": "end-1"
                }
            ]
        }
        
        response = requests.put(f"{base_url}/flows/{created_flows[0]}", json=update_data)
        if response.status_code == 200:
            updated_flow = response.json()
            print(f"✅ Updated flow: {updated_flow['name']}")
            print(f"   - Name updated: {updated_flow['name'].startswith('Updated Flow')}")
            print(f"   - Nodes count: {updated_flow['nodes_count']}")
            print(f"   - Description: {updated_flow['description']}")
        else:
            print(f"❌ Failed to update flow: {response.text}")
            return False
        
        # Test 6: Delete flow
        print(f"\n6. Testing DELETE /api/flows/{created_flows[1]}...")
        response = requests.delete(f"{base_url}/flows/{created_flows[1]}")
        if response.status_code == 200:
            print(f"✅ Deleted flow: {created_flows[1]}")
            
            # Verify deletion
            verify_response = requests.get(f"{base_url}/flows/{created_flows[1]}")
            if verify_response.status_code == 404:
                print("✅ Deletion verified (404 on GET)")
                created_flows.remove(created_flows[1])  # Remove from cleanup list
            else:
                print(f"❌ Flow still exists after deletion")
                return False
        else:
            print(f"❌ Failed to delete flow: {response.text}")
            return False
        
        # Test 7: Error handling
        print("\n7. Testing error handling...")
        
        # Non-existent flow
        response = requests.get(f"{base_url}/flows/non-existent-id")
        print(f"   - GET non-existent flow: {'✅' if response.status_code == 404 else '❌'} (404)")
        
        # Invalid agent ID
        invalid_flow = {
            "name": "Invalid Agent Flow",
            "agent_id": "non-existent-agent",
            "nodes": [],
            "edges": []
        }
        response = requests.post(f"{base_url}/flows", json=invalid_flow)
        print(f"   - POST with invalid agent: {'✅' if response.status_code == 404 else '❌'} (404)")
        
        # Update non-existent flow
        response = requests.put(f"{base_url}/flows/non-existent-id", json={"name": "Test"})
        print(f"   - PUT non-existent flow: {'✅' if response.status_code == 404 else '❌'} (404)")
        
        # Delete non-existent flow
        response = requests.delete(f"{base_url}/flows/non-existent-id")
        print(f"   - DELETE non-existent flow: {'✅' if response.status_code == 404 else '❌'} (404)")
        
        print("\n✅ All Flow API tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        return False
        
    finally:
        # Cleanup
        print("\n🧹 Cleaning up test data...")
        for flow_id in created_flows:
            try:
                requests.delete(f"{base_url}/flows/{flow_id}")
                print(f"   - Deleted flow: {flow_id[:8]}...")
            except:
                pass
        
        if created_agent_id:
            try:
                requests.delete(f"{base_url}/agents/{created_agent_id}")
                print(f"   - Deleted agent: {created_agent_id[:8]}...")
            except:
                pass

if __name__ == "__main__":
    success = test_flows_api()
    exit(0 if success else 1)