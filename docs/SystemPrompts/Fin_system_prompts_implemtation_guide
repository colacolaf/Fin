IMPLEMENTATION GUIDE: FIN SYSTEM PROMPTS
For backend developers integrating agents with Ollama + FastAPI

QUICK START
These four documents define the complete agent system for Fin:

01_investment_agent_system_prompt.md - Portfolio analysis & rebalancing
02_debt_agent_system_prompt.md - Loan optimization & payoff strategy
03_retirement_agent_system_prompt.md - 401(k)/IRA planning
04_user_context_file_schema.md - Data structure passed to agents
05_implementation_guide.md - This document (how to implement)


ARCHITECTURE: HOW AGENTS RECEIVE & USE CONTEXT
Request Flow (FastAPI Backend)
User clicks "Get Recommendations"
          ↓
API Route Handler (e.g., GET /api/recommendations/investment)
          ↓
Load User Context File from database
          ↓
Prepare System Prompt + Context Injection
          ↓
Send to Ollama (localhost:11434)
          ↓
Ollama processes with local LLM
          ↓
Parse JSON response (confidence scores, reasoning)
          ↓
Save recommendation to database
          ↓
Return to frontend
System Prompt Structure
[System Role + Instructions]
[C.O.R.E. Framework]
[Priority Rules]
[Output Format Specification]

---
[User Context File - injected here]

---
[User's actual request: "Analyze my portfolio" or "Help with debt payoff"]

IMPLEMENTATION STEPS
1. STORE SYSTEM PROMPTS IN DATABASE OR FILES
Option A: File-based (simpler)
/app/prompts/
├── investment_agent.md
├── debt_agent.md
└── retirement_agent.md
Load at startup:
python# FastAPI startup
import os

SYSTEM_PROMPTS = {
    "investment": open("prompts/investment_agent.md").read(),
    "debt": open("prompts/debt_agent.md").read(),
    "retirement": open("prompts/retirement_agent.md").read(),
}
Option B: Database-based (better for hot updates)
sqlCREATE TABLE agent_prompts (
    id INTEGER PRIMARY KEY,
    agent_type TEXT UNIQUE (investment|debt|retirement),
    system_prompt TEXT,
    version INTEGER,
    updated_at TIMESTAMP,
    is_active BOOLEAN
);
Load into cache:
python@app.on_event("startup")
async def load_prompts():
    global SYSTEM_PROMPTS
    prompts = db.query(AgentPrompt).filter_by(is_active=True)
    SYSTEM_PROMPTS = {p.agent_type: p.system_prompt for p in prompts}
2. LOAD USER CONTEXT FILE
python# In your database layer
def get_user_context(user_id: str) -> dict:
    context = db.query(UserContext).filter_by(user_id=user_id).first()
    if not context:
        # Initialize default context
        context = initialize_context(user_id)
    return json.loads(context.context_json)

# In your API route handler
@app.get("/api/recommendations/{agent_type}")
async def get_recommendation(agent_type: str, current_user: User):
    context = get_user_context(current_user.id)
    
    # Verify context is fresh
    if context["portfolio"]["last_sync"] < (now - timedelta(hours=24)):
        refresh_portfolio_data(current_user.id)  # Call Alpaca API
        context = get_user_context(current_user.id)  # Reload
    
    recommendation = call_agent(agent_type, context, current_user.input)
    
    # Save recommendation
    save_recommendation(current_user.id, recommendation)
    
    return recommendation
3. CALL AGENT WITH INJECTED CONTEXT
pythonimport requests
import json

def call_agent(agent_type: str, context: dict, user_message: str) -> dict:
    """Call Ollama with system prompt + context + user message"""
    
    # Load system prompt for this agent
    system_prompt = SYSTEM_PROMPTS[agent_type]
    
    # Inject context file as part of system prompt
    context_str = json.dumps(context, indent=2)
    
    full_system = f"""{system_prompt}

---
## USER CONTEXT (Auto-Injected)

{context_str}
"""
    
    # Call Ollama API
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "mistral:7b",  # or llama2:13b
            "system": full_system,
            "prompt": user_message,
            "stream": False,
            "temperature": 0.3,  # Low temp for consistency
            "top_p": 0.9,
        },
        timeout=60
    )
    
    if response.status_code != 200:
        raise Exception(f"Ollama error: {response.text}")
    
    return response.json()["response"]
4. PARSE AGENT RESPONSE
Agent responses include markdown + embedded JSON. Example:
markdown## Recommendation Title

**What to do**: [action]

**Confidence Score**:
```json
{
  "overall": 82,
  "reasoning_quality": 90,
  ...
}
```

[Rest of recommendation]
Parsing logic:
pythonimport re
import json

def parse_recommendation(response: str) -> dict:
    """Extract confidence JSON from markdown response"""
    
    # Find JSON block
    json_match = re.search(r'```json\n({.*?})\n```', response, re.DOTALL)
    if not json_match:
        raise ValueError("No confidence score found in response")
    
    confidence_json = json.loads(json_match.group(1))
    
    return {
        "raw_response": response,
        "confidence": confidence_json,
        "recommendation_text": response.split("## Recommendation")[1] if "## Recommendation" in response else response
    }
5. UPDATE USER CONTEXT AFTER VOTE
When user votes on recommendation:
python@app.post("/api/recommendations/{rec_id}/vote")
async def vote_on_recommendation(rec_id: str, vote: str, feedback: str = "", current_user: User):
    # vote: "accept" | "reject" | "deferred"
    
    # Save vote to database
    rec = db.query(Recommendation).get(rec_id)
    rec.user_vote = vote
    rec.user_feedback = feedback
    rec.voted_at = now()
    db.commit()
    
    # Update user context
    context = get_user_context(current_user.id)
    
    # 1. Add to past_decisions
    context["past_decisions"].append({
        "date": now().isoformat(),
        "agent": rec.agent_type,
        "recommendation_title": rec.title,
        "recommendation_summary": rec.summary,
        "user_vote": vote,
        "user_reasoning": feedback,
        "execution_status": "pending",
        "execution_date": None,
        "agent_notes": ""
    })
    
    # 2. Recalculate behavioral patterns
    past = context["past_decisions"]
    accepted = sum(1 for d in past if d["user_vote"] == "accepted")
    context["behavioral_patterns"]["recommendation_acceptance_rate"] = accepted / len(past)
    
    # 3. Same for agent-specific breakdown
    inv_recs = [d for d in past if d["agent"] == "investment"]
    inv_accepted = sum(1 for d in inv_recs if d["user_vote"] == "accepted")
    context["behavioral_patterns"]["breakdown_by_agent"]["investment"]["acceptance_rate"] = (
        inv_accepted / len(inv_recs) if inv_recs else 0
    )
    
    # 4. Save updated context
    save_context(current_user.id, context)
    
    return {"status": "success", "message": "Vote recorded"}
6. REFRESH PORTFOLIO DATA (Scheduled Task)
pythonfrom apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('interval', hours=1)
def refresh_all_user_data():
    """Call Alpaca/Plaid APIs for all active users"""
    
    users = db.query(User).filter_by(is_active=True).all()
    
    for user in users:
        try:
            # Refresh Alpaca data
            if user.alpaca_credential:
                refresh_alpaca_holdings(user.id)
            
            # Refresh Plaid data
            if user.plaid_credential:
                refresh_plaid_debts(user.id)
            
            # Recalculate retirement readiness
            recalculate_retirement_readiness(user.id)
            
            # Update context file
            context = get_user_context(user.id)
            context["last_updated"] = now().isoformat()
            save_context(user.id, context)
            
        except Exception as e:
            log_error(f"Failed to refresh {user.id}: {e}")

scheduler.start()
7. WEB SEARCH INTEGRATION
Agents will request web search in their responses. Example:
[Agent response text]

## Web Search Used:
- Query 1: "tech sector valuation 2026" (results: [snippets])
- Query 2: "balance transfer cards 2026" (results: [snippets])

[Agent uses search results in recommendation]
In your backend, agents have access to web_search:
python# Agents should be able to call this (via tool use or function calling)
def web_search(query: str, max_results: int = 5) -> list:
    """Search web and return results"""
    # Use Anthropic web search, or Bing/Google
    # Parse results into snippets
    return search_results
For Ollama + local LLM, you'll need to provide search capability via function calling or a separate API wrapper.

DEPLOYMENT: DOCKER COMPOSE INTEGRATION
yaml# docker-compose.yml

version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./data/fin.db
      - OLLAMA_URL=http://ollama:11434
      - ALPACA_API_KEY=${ALPACA_API_KEY}
      - PLAID_CLIENT_ID=${PLAID_CLIENT_ID}
      - PLAID_SECRET=${PLAID_SECRET}
      - FINNHUB_API_KEY=${FINNHUB_API_KEY}
    volumes:
      - ./data:/app/data
      - ./prompts:/app/prompts
    depends_on:
      - ollama
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ./models:/root/.ollama
    environment:
      - OLLAMA_MODELS=/root/.ollama
    command: serve
On first startup, pull LLM model:
bashdocker exec fin-ollama ollama pull mistral:7b
# or
docker exec fin-ollama ollama pull llama2:13b

TESTING AGENTS LOCALLY
Manual Test (without full stack)
python# test_agents.py
import json
import requests

# Load system prompt
system_prompt = open("prompts/investment_agent.md").read()

# Load sample context
context = json.load(open("test_data/user_context_sample.json"))

# Load sample user question
user_message = "Should I sell NVDA? It's up 40% this year."

# Call Ollama
response = requests.post(
    "http://localhost:11434/api/generate",
    json={
        "model": "mistral:7b",
        "system": f"{system_prompt}\n\n---\n## USER CONTEXT\n\n{json.dumps(context)}\n",
        "prompt": user_message,
        "stream": False,
    }
)

print(response.json()["response"])
Run with:
bash# Start Ollama (separate terminal)
docker run -it -p 11434:11434 ollama/ollama:latest serve

# Pull model (separate terminal)
docker exec <container> ollama pull mistral:7b

# Run test
python test_agents.py

MONITORING & DEBUGGING
Log Agent Calls
pythonimport logging

logger = logging.getLogger("agents")

def call_agent(agent_type: str, context: dict, user_message: str):
    logger.info(f"Calling {agent_type} agent for user {context['user_id']}")
    logger.debug(f"Context version: {context['context_version']}")
    logger.debug(f"Portfolio value: ${context['portfolio']['total_value']:,}")
    
    # Call Ollama...
    
    logger.info(f"Agent returned confidence: {recommendation['confidence']['overall']}")
    return recommendation
Monitor Recommendation Quality
pythondef analyze_recommendation_accuracy():
    """After 30 days, check if predicted outcomes matched reality"""
    
    recs_30d_old = db.query(Recommendation).filter(
        Recommendation.created_at < (now - timedelta(days=30))
    ).all()
    
    accuracy = 0
    for rec in recs_30d_old:
        if rec.user_execution_status == "executed":
            # Check if prediction matched reality
            actual_impact = calculate_actual_impact(rec)
            predicted_impact = rec.predicted_impact
            
            if abs(actual_impact - predicted_impact) < 0.1:  # 10% tolerance
                accuracy += 1
    
    return accuracy / len(recs_30d_old)

PERFORMANCE TUNING
Ollama Optimization
bash# For CPU-only (slower, ~10 tokens/sec):
ollama run mistral:7b

# For GPU (faster, ~50-100 tokens/sec):
# Ensure CUDA support in container
docker run --gpus all -p 11434:11434 ollama/ollama:latest serve
Context Window Management

Mistral 7B: 32K token context window (plenty)
System prompt: ~1.5KB (~300 tokens)
User context file: ~1-2KB (~100 tokens)
User message: ~100 tokens
Total: ~500 tokens in, leaving 31,500 for response

If context is too large, optimize:
pythondef trim_context(context: dict) -> dict:
    """Keep only last 10 recommendations, last 5 holdings"""
    
    context["past_decisions"] = context["past_decisions"][-10:]
    context["portfolio"]["holdings"] = context["portfolio"]["holdings"][:5]
    
    return context

TROUBLESHOOTING
Agent Returning Gibberish

Cause: Temperature too high or Ollama overloaded
Fix: Lower temperature (0.1-0.3), or increase Ollama resources

Context Not Being Used

Cause: Context not injected in system prompt
Fix: Verify context is in the system message, not the user message

Recommendations Not Parsing

Cause: Agent returned markdown without JSON block
Fix: Add retry logic or adjust prompt to ensure JSON block

Web Search Not Working

Cause: Agent doesn't have access to search API
Fix: Implement web search endpoint and grant agent access


SUMMARY CHECKLIST
✅ Store system prompts (files or database)
✅ Load context file before each agent call
✅ Inject context into system message
✅ Call Ollama with full prompt + context
✅ Parse JSON confidence from response
✅ Save recommendation to database
✅ Update context after user votes
✅ Refresh portfolio data on schedule
✅ Monitor agent performance
✅ Log all agent calls for debugging
✅ Test with sample users before production
✅ Deploy with Docker Compose

NEXT STEPS

Integrate these prompts into your FastAPI backend
Test with sample user contexts (use 04_user_context_file_schema.md for examples)
Deploy Ollama container with one LLM model
Wire up Alpaca/Plaid/Finnhub APIs
Build frontend to display recommendations
Launch with beta users and gather feedback

Questions? Refer back to the four spec documents for detailed guidance.
