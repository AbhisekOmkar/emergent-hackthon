"""
Prompt Lab Routes
AI-powered prompt generation with web scraping, PDF parsing, and structured XML output
"""

import os
import logging
import httpx
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from bs4 import BeautifulSoup
import PyPDF2
import io

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/prompt-lab", tags=["Prompt Lab"])

# MongoDB connection
def get_db():
    mongo_url = os.environ.get("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get("DB_NAME", "intelliax")
    return client, client[db_name]


# ========== PYDANTIC MODELS ==========

class WebsiteExtractionRequest(BaseModel):
    """Request to extract content from website"""
    url: str = Field(..., description="Website URL to extract from")
    extract_type: str = Field(default="auto", description="Type: auto, faq, documentation, about")


class PromptGenerationRequest(BaseModel):
    """Request to generate structured prompt"""
    company_name: Optional[str] = Field(None, description="Company/product name")
    industry: Optional[str] = Field(None, description="Industry/domain")
    agent_purpose: str = Field(..., description="What the agent should do")
    tone: str = Field(default="professional", description="Tone: professional, friendly, technical, casual")
    source_content: Optional[str] = Field(None, description="Extracted content from website/PDF")
    additional_instructions: Optional[str] = Field(None, description="Any additional requirements")


class TestQAGenerationRequest(BaseModel):
    """Request to generate test Q&A from prompt"""
    system_prompt: str = Field(..., description="Generated system prompt")
    num_questions: int = Field(default=10, description="Number of test questions")


class PromptTestRequest(BaseModel):
    """Request to test prompt with QA agent"""
    system_prompt: str = Field(..., description="Prompt to test")
    test_questions: List[str] = Field(..., description="Questions to ask")


# ========== HELPER FUNCTIONS ==========

async def extract_website_content(url: str) -> Dict[str, Any]:
    """Extract content from website URL"""
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": "IntelliAX Prompt Generator Bot (Contact: support@intelliax.ai)"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {response.status_code}")
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'lxml')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # Extract different sections
            title = soup.find('title').get_text() if soup.find('title') else ""
            
            # Try to find FAQ sections
            faq_sections = []
            for faq_container in soup.find_all(['div', 'section'], class_=lambda x: x and ('faq' in x.lower() if isinstance(x, str) else False)):
                questions = faq_container.find_all(['h2', 'h3', 'h4', 'dt', 'summary'])
                for q in questions:
                    answer_elem = q.find_next_sibling(['p', 'div', 'dd', 'details'])
                    if answer_elem:
                        faq_sections.append({
                            'question': q.get_text(strip=True),
                            'answer': answer_elem.get_text(strip=True)
                        })
            
            # Extract main content
            main_content = ""
            main = soup.find('main') or soup.find('article') or soup.find('body')
            if main:
                main_content = main.get_text(separator='\n', strip=True)
            
            # Limit content length
            main_content = main_content[:10000] if len(main_content) > 10000 else main_content
            
            return {
                "url": url,
                "title": title,
                "faq_items": faq_sections,
                "main_content": main_content,
                "content_length": len(main_content),
                "faq_count": len(faq_sections)
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"HTTP error: {str(e)}")
    except Exception as e:
        logger.error(f"Error extracting website: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Extraction error: {str(e)}")


async def extract_pdf_content(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        # Limit length
        text = text[:15000] if len(text) > 15000 else text
        return text
        
    except Exception as e:
        logger.error(f"Error extracting PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF extraction error: {str(e)}")


async def generate_xml_prompt(request: PromptGenerationRequest) -> str:
    """Generate structured XML prompt using GPT-4"""
    try:
        openai_api_key = os.environ.get('OPENAI_API_KEY')
        if not openai_api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        # Build generation prompt
        generation_instructions = f"""You are an expert AI prompt engineer. Generate a highly effective, XML-structured system prompt for an AI voice/chat agent.

**Agent Details:**
- Company/Product: {request.company_name or 'Not specified'}
- Industry: {request.industry or 'Not specified'}
- Purpose: {request.agent_purpose}
- Tone: {request.tone}

**Source Content:**
{request.source_content[:8000] if request.source_content else 'No source content provided'}

**Additional Instructions:**
{request.additional_instructions or 'None'}

**Generate a complete XML-structured system prompt with these sections:**

1. <persona> - Define the agent's identity, expertise, tone, and personality
2. <guardrails> - What the agent MUST do and MUST NOT do
3. <context> - Company info, products/services, policies, key information
4. <instructions> - Primary objectives and interaction flow
5. <examples> - 2-3 example interactions showing ideal responses

**Important Guidelines:**
- Be specific and actionable
- Include real information from the source content
- Make guardrails clear and enforceable
- Use professional XML formatting
- Ensure the prompt is production-ready
- Include edge case handling
- Add conversation flow guidance

Return ONLY the XML-formatted prompt, starting with <system_prompt> and ending with </system_prompt>."""

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert AI prompt engineer specializing in creating structured, XML-formatted prompts for conversational AI agents."
                        },
                        {
                            "role": "user",
                            "content": generation_instructions
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 4000
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to generate prompt")
            
            data = response.json()
            generated_prompt = data["choices"][0]["message"]["content"]
            
            # Clean up markdown code blocks if present
            generated_prompt = generated_prompt.strip()
            if generated_prompt.startswith("```xml"):
                generated_prompt = generated_prompt[6:]
            if generated_prompt.startswith("```"):
                generated_prompt = generated_prompt[3:]
            if generated_prompt.endswith("```"):
                generated_prompt = generated_prompt[:-3]
            
            return generated_prompt.strip()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating prompt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def generate_test_questions(system_prompt: str, num_questions: int) -> List[Dict[str, str]]:
    """Generate test questions based on the system prompt"""
    try:
        openai_api_key = os.environ.get('OPENAI_API_KEY')
        if not openai_api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        generation_prompt = f"""Based on this system prompt for an AI agent, generate {num_questions} diverse test questions that would evaluate the agent's performance.

System Prompt:
{system_prompt[:5000]}

Generate questions that test:
1. Core functionality (30%)
2. Edge cases and error handling (25%)
3. Guardrail compliance (20%)
4. Context understanding (15%)
5. Personality and tone (10%)

Return as JSON array:
[
  {{
    "question": "The test question",
    "category": "core_functionality|edge_case|guardrails|context|personality",
    "expected_behavior": "What the agent should do"
  }}
]"""

        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": "You are a QA engineer. Return only valid JSON."},
                        {"role": "user", "content": generation_prompt}
                    ],
                    "temperature": 0.8,
                    "max_tokens": 3000
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to generate questions")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()
            
            # Clean JSON from markdown
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            import json
            questions = json.loads(content.strip())
            return questions
            
    except Exception as e:
        logger.error(f"Error generating test questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== API ENDPOINTS ==========

@router.post("/extract-from-url")
async def extract_from_url(request: WebsiteExtractionRequest):
    """Extract content from a website URL"""
    return await extract_website_content(request.url)


@router.post("/extract-from-pdf")
async def extract_from_pdf(file: UploadFile = File(...)):
    """Extract content from uploaded PDF"""
    try:
        content = await file.read()
        text = await extract_pdf_content(content)
        
        return {
            "filename": file.filename,
            "content": text,
            "content_length": len(text)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-prompt")
async def generate_prompt(request: PromptGenerationRequest):
    """Generate structured XML prompt"""
    try:
        generated_prompt = await generate_xml_prompt(request)
        
        # Save to database
        client, db = get_db()
        prompt_record = {
            "id": str(uuid.uuid4()),
            "company_name": request.company_name,
            "industry": request.industry,
            "agent_purpose": request.agent_purpose,
            "tone": request.tone,
            "generated_prompt": generated_prompt,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.generated_prompts.insert_one(prompt_record)
        client.close()
        
        return {
            "success": True,
            "prompt": generated_prompt,
            "prompt_id": prompt_record["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate-prompt endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-test-qa")
async def generate_test_qa(request: TestQAGenerationRequest):
    """Generate test questions and answers for prompt testing"""
    try:
        questions = await generate_test_questions(
            request.system_prompt,
            request.num_questions
        )
        
        return {
            "success": True,
            "questions": questions,
            "count": len(questions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-prompt")
async def test_prompt(request: PromptTestRequest):
    """Test a prompt by having QA agent ask questions to the main agent"""
    try:
        openai_api_key = os.environ.get('OPENAI_API_KEY')
        if not openai_api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        results = []
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            for question in request.test_questions[:10]:  # Limit to 10 questions
                # Test the agent with this question
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": request.system_prompt},
                            {"role": "user", "content": question}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 500
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    answer = data["choices"][0]["message"]["content"]
                    results.append({
                        "question": question,
                        "answer": answer,
                        "status": "success"
                    })
                else:
                    results.append({
                        "question": question,
                        "answer": None,
                        "status": "error",
                        "error": response.text
                    })
        
        return {
            "success": True,
            "test_results": results,
            "total_questions": len(request.test_questions),
            "tested_questions": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error testing prompt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/saved-prompts")
async def get_saved_prompts():
    """Get all saved generated prompts"""
    try:
        client, db = get_db()
        prompts = await db.generated_prompts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        client.close()
        
        return {
            "success": True,
            "prompts": prompts,
            "count": len(prompts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/saved-prompts/{prompt_id}")
async def get_saved_prompt(prompt_id: str):
    """Get a specific saved prompt"""
    try:
        client, db = get_db()
        prompt = await db.generated_prompts.find_one({"id": prompt_id}, {"_id": 0})
        client.close()
        
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        return prompt
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/saved-prompts/{prompt_id}")
async def delete_saved_prompt(prompt_id: str):
    """Delete a saved prompt"""
    try:
        client, db = get_db()
        result = await db.generated_prompts.delete_one({"id": prompt_id})
        client.close()
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        return {"success": True, "message": "Prompt deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
