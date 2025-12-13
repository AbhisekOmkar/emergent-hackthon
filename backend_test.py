#!/usr/bin/env python3
"""
AI Agent Builder Platform - Backend API Testing
Tests all core API endpoints for functionality and integration
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

class AgentBuilderAPITester:
    def __init__(self, base_url="https://agent-builder-56.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        # Test tracking
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = []
        
        # Test data storage
        self.created_agent_id = None
        self.created_kb_id = None
        
    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            self.failed_tests.append(name)
            print(f"❌ {name} - FAILED: {details}")
            
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })
    
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, expected_status: int = 200) -> tuple[bool, Any]:
        """Make HTTP request and validate response"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url)
            else:
                return False, f"Unsupported method: {method}"
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                return False, f"Status {response.status_code}, Expected {expected_status}. Response: {response.text[:200]}"
                
        except Exception as e:
            return False, f"Request failed: {str(e)}"
    
    def test_health_check(self):
        """Test basic health endpoint"""
        success, data = self.make_request('GET', '/health')
        self.log_test("Health Check", success, "" if success else str(data), data)
        return success
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, data = self.make_request('GET', '/')
        self.log_test("Root Endpoint", success, "" if success else str(data), data)
        return success
    
    def test_create_agent(self):
        """Test agent creation"""
        agent_data = {
            "name": f"Test Agent {datetime.now().strftime('%H%M%S')}",
            "description": "Test agent for API validation",
            "type": "chat",
            "system_prompt": "You are a helpful test assistant.",
            "greeting_message": "Hello! I'm a test agent.",
            "chat_config": {
                "llm_provider": "openai",
                "llm_model": "gpt-4o",
                "temperature": 0.7,
                "max_tokens": 2048
            },
            "tools": [],
            "knowledge_bases": []
        }
        
        success, data = self.make_request('POST', '/agents', agent_data, 200)
        
        if success and isinstance(data, dict) and 'id' in data:
            self.created_agent_id = data['id']
            self.log_test("Create Agent", True, f"Agent ID: {self.created_agent_id}", data)
        else:
            self.log_test("Create Agent", False, str(data))
            
        return success
    
    def test_list_agents(self):
        """Test listing agents"""
        success, data = self.make_request('GET', '/agents')
        
        if success and isinstance(data, list):
            self.log_test("List Agents", True, f"Found {len(data)} agents", data)
        else:
            self.log_test("List Agents", False, str(data))
            
        return success
    
    def test_get_agent(self):
        """Test getting specific agent"""
        if not self.created_agent_id:
            self.log_test("Get Agent", False, "No agent ID available")
            return False
            
        success, data = self.make_request('GET', f'/agents/{self.created_agent_id}')
        
        if success and isinstance(data, dict) and data.get('id') == self.created_agent_id:
            self.log_test("Get Agent", True, f"Retrieved agent: {data.get('name')}", data)
        else:
            self.log_test("Get Agent", False, str(data))
            
        return success
    
    def test_builtin_tools(self):
        """Test built-in tools endpoint"""
        success, data = self.make_request('GET', '/tools/builtin')
        
        if success and isinstance(data, list) and len(data) > 0:
            self.log_test("Built-in Tools", True, f"Found {len(data)} tools", data)
        else:
            self.log_test("Built-in Tools", False, str(data))
            
        return success
    
    def test_integration_categories(self):
        """Test integration categories"""
        success, data = self.make_request('GET', '/integrations/categories')
        
        if success and isinstance(data, list) and len(data) > 0:
            self.log_test("Integration Categories", True, f"Found {len(data)} categories", data)
        else:
            self.log_test("Integration Categories", False, str(data))
            
        return success
    
    def test_analytics_calls(self):
        """Test analytics endpoint"""
        success, data = self.make_request('GET', '/analytics/calls')
        
        if success and isinstance(data, dict):
            expected_keys = ['total_calls', 'successful_calls', 'success_rate', 'average_duration']
            has_keys = all(key in data for key in expected_keys)
            if has_keys:
                self.log_test("Analytics Calls", True, f"Analytics data: {data}", data)
            else:
                self.log_test("Analytics Calls", False, f"Missing keys in response: {data}")
        else:
            self.log_test("Analytics Calls", False, str(data))
            
        return success
    
    def test_create_knowledge_base(self):
        """Test knowledge base creation"""
        kb_data = {
            "name": f"Test KB {datetime.now().strftime('%H%M%S')}",
            "description": "Test knowledge base",
            "type": "documents"
        }
        
        success, data = self.make_request('POST', '/knowledge', kb_data, 200)
        
        if success and isinstance(data, dict) and 'id' in data:
            self.created_kb_id = data['id']
            self.log_test("Create Knowledge Base", True, f"KB ID: {self.created_kb_id}", data)
        else:
            self.log_test("Create Knowledge Base", False, str(data))
            
        return success
    
    def test_list_knowledge_bases(self):
        """Test listing knowledge bases"""
        success, data = self.make_request('GET', '/knowledge')
        
        if success and isinstance(data, list):
            self.log_test("List Knowledge Bases", True, f"Found {len(data)} knowledge bases", data)
        else:
            self.log_test("List Knowledge Bases", False, str(data))
            
        return success
    
    def test_chat_with_agent(self):
        """Test LLM chat integration"""
        if not self.created_agent_id:
            self.log_test("Chat with Agent", False, "No agent ID available")
            return False
        
        chat_data = {
            "agent_id": self.created_agent_id,
            "message": "Hello, can you help me test this system?",
            "history": []
        }
        
        success, data = self.make_request('POST', '/chat', chat_data, 200)
        
        if success and isinstance(data, dict) and 'response' in data and 'session_id' in data:
            self.log_test("Chat with Agent", True, f"Got response: {data['response'][:50]}...", data)
        else:
            self.log_test("Chat with Agent", False, str(data))
            
        return success
    
    def test_deploy_agent(self):
        """Test agent deployment"""
        if not self.created_agent_id:
            self.log_test("Deploy Agent", False, "No agent ID available")
            return False
            
        success, data = self.make_request('POST', f'/agents/{self.created_agent_id}/deploy', {}, 200)
        
        if success and isinstance(data, dict) and data.get('status') == 'active':
            self.log_test("Deploy Agent", True, "Agent deployed successfully", data)
        else:
            self.log_test("Deploy Agent", False, str(data))
            
        return success
    
    def cleanup_test_data(self):
        """Clean up created test data"""
        cleanup_results = []
        
        # Delete created agent
        if self.created_agent_id:
            success, data = self.make_request('DELETE', f'/agents/{self.created_agent_id}', expected_status=200)
            cleanup_results.append(f"Agent cleanup: {'✅' if success else '❌'}")
        
        # Delete created knowledge base
        if self.created_kb_id:
            success, data = self.make_request('DELETE', f'/knowledge/{self.created_kb_id}', expected_status=200)
            cleanup_results.append(f"KB cleanup: {'✅' if success else '❌'}")
        
        if cleanup_results:
            print(f"\n🧹 Cleanup: {', '.join(cleanup_results)}")
    
    def run_all_tests(self):
        """Run complete test suite"""
        print(f"🚀 Starting AI Agent Builder API Tests")
        print(f"📡 Testing endpoint: {self.base_url}")
        print("=" * 60)
        
        # Core API tests
        self.test_health_check()
        self.test_root_endpoint()
        
        # Agent management tests
        self.test_create_agent()
        self.test_list_agents()
        self.test_get_agent()
        self.test_deploy_agent()
        
        # Tools and integrations
        self.test_builtin_tools()
        self.test_integration_categories()
        
        # Knowledge base tests
        self.test_create_knowledge_base()
        self.test_list_knowledge_bases()
        
        # Analytics tests
        self.test_analytics_calls()
        
        # LLM integration test (most critical)
        self.test_chat_with_agent()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Results summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"❌ Failed Tests: {', '.join(self.failed_tests)}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = AgentBuilderAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Test suite failed with error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())