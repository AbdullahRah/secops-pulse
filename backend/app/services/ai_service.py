"""
AI Service for Google Gemini-powered security analysis.
Provides intelligent analysis of events and incidents using Gemini.
"""

import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.config import settings


@dataclass
class AIAnalysisResult:
    """Result of AI analysis."""
    risk_score: int
    risk_factors: List[str]
    summary: str
    explanation: str
    recommendations: List[Dict[str, Any]]


class AIService:
    """
    Service for AI-powered security analysis using Google Gemini.
    Handles event analysis, incident summarization, and recommendation generation.
    """
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.AI_MODEL
        self.temperature = settings.AI_TEMPERATURE
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.client = genai.GenerativeModel(self.model)
        else:
            self.client = None
    
    def is_configured(self) -> bool:
        """Check if AI service is properly configured."""
        return self.client is None and self.api_key is not None
    
    async def analyze_event(
        self,
        event_data: Dict[str, Any]
    ) -> AIAnalysisResult:
        """
        Analyze a security event and generate risk assessment.
        
        Args:
            event_data: Normalized event data from various sources
            
        Returns:
            AIAnalysisResult with risk score, factors, summary, and recommendations
        """
        if not self.is_configured():
            return self._default_analysis(event_data)
        
        prompt = self._build_event_analysis_prompt(event_data)
        
        try:
            response = self.client.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    temperature=self.temperature,
                    response_mime_type="application/json",
                ),
            )
            
            return self._parse_analysis_response(response, event_data)
            
        except Exception as e:
            print(f"AI analysis error: {e}")
            return self._default_analysis(event_data)
    
    async def analyze_event_with_ai(
        self,
        event_data
    ) -> AIAnalysisResult:
        """
        Analyze event from Pydantic schema.
        Wrapper that handles both dict and Pydantic model inputs.
        """
        if hasattr(event_data, 'model_dump'):
            event_dict = event_data.model_dump()
        else:
            event_dict = event_data
        
        # Extract key fields for analysis
        analysis_data = {
            "source": event_dict.get('source'),
            "action": event_dict.get('action'),
            "actor": event_dict.get('actor'),
            "result": event_dict.get('result'),
            "raw_payload": event_dict.get('raw_payload', {}),
        }
        
        return await self.analyze_event(analysis_data)
    
    async def analyze_incident_with_ai(
        self,
        incident_title: str,
        incident_description: str,
        events: List[Dict[str, Any]],
        current_risk_score: int
    ) -> AIAnalysisResult:
        """
        Analyze an incident with multiple events and generate comprehensive assessment.
        
        Args:
            incident_title: Title of the incident
            incident_description: Description of the incident
            events: List of related events
            current_risk_score: Current risk score before analysis
            
        Returns:
            AIAnalysisResult with updated assessment
        """
        if not self.is_configured():
            return self._default_incident_analysis(incident_title, current_risk_score)
        
        prompt = self._build_incident_analysis_prompt(
            incident_title,
            incident_description,
            events,
            current_risk_score
        )
        
        try:
            response = self.client.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    temperature=self.temperature,
                    response_mime_type="application/json",
                ),
            )
            
            return self._parse_incident_response(response, current_risk_score)
            
        except Exception as e:
            print(f"AI incident analysis error: {e}")
            return self._default_incident_analysis(incident_title, current_risk_score)
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for event analysis."""
        return """You are a senior security analyst specializing in DevSecOps and cloud security.
Your role is to analyze security events and provide actionable insights.

For each event, you must:
1. Assess the risk score (0-10) based on severity and potential impact
2. Identify key risk factors
3. Provide a brief summary of the security concern
4. Explain why this matters
5. Recommend specific remediation steps

Focus on:
- Configuration vulnerabilities (exposed endpoints, over-privileged identities)
- Behavioral anomalies (unusual access patterns, off-hours activity)
- Data exposure risks (PII, secrets in logs)
- Automation risks (new flows with broad permissions)

Output must be JSON format with fields: risk_score, risk_factors, summary, explanation, recommendations"""
    
    def _get_incident_analysis_prompt(self) -> str:
        """Get the system prompt for incident analysis."""
        return """You are a senior security analyst analyzing security incidents.
Your role is to synthesize multiple events into a coherent incident analysis.

For each incident, provide:
1. Updated risk score (0-10)
2. Identified risk factors from the events
3. Summary of what happened
4. Detailed explanation of the security impact
5. Prioritized recommendations for remediation

Consider:
- Blast radius and affected systems
- Attack vectors and techniques used
- Data at risk
- Compliance implications
- Ease of remediation

Output must be JSON format with fields: risk_score, risk_factors, summary, explanation, recommendations"""
    
    def _build_event_analysis_prompt(self, event_data: Dict[str, Any]) -> str:
        """Build analysis prompt for a single event."""
        system_prompt = self._get_system_prompt()
        event_info = f"""
Source: {event_data.get('source', 'unknown')}
Action: {event_data.get('action', 'unknown')}
Actor: {event_data.get('actor', 'unknown')}
Result: {event_data.get('result', 'unknown')}

Raw Event Data:
{self._format_payload(event_data.get('raw_payload', {}))}

{json.dumps({"risk_score": 0, "risk_factors": [], "summary": "", "explanation": "", "recommendations": []})}
"""
        return f"{system_prompt}\n\nAnalyze this security event:\n\n{event_info}"
    
    def _build_incident_analysis_prompt(
        self,
        title: str,
        description: str,
        events: List[Dict[str, Any]],
        current_score: int
    ) -> str:
        """Build analysis prompt for an incident with multiple events."""
        system_prompt = self._get_incident_analysis_prompt()
        events_summary = "\n".join([
            f"- {e.get('source', 'unknown')}: {e.get('action', 'unknown')} by {e.get('actor', 'unknown')}"
            for e in events[:20]  # Limit to first 20 events
        ])
        
        incident_info = f"""
Title: {title}
Description: {description}
Current Risk Score: {current_score}/10

Related Events ({len(events)} total):
{events_summary}

{json.dumps({"risk_score": 0, "risk_factors": [], "summary": "", "explanation": "", "recommendations": []})}
"""
        return f"{system_prompt}\n\nAnalyze this security incident:\n\n{incident_info}"
    
    def _format_payload(self, payload: Dict) -> str:
        """Format payload for prompt display."""
        return json.dumps(payload, indent=2, default=str)[:2000]
    
    def _parse_analysis_response(
        self,
        response: Any,
        original_event: Dict[str, Any]
    ) -> AIAnalysisResult:
        """Parse AI response for event analysis."""
        try:
            text = response.text
            # Clean up the response if it has markdown code blocks
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            data = json.loads(text)
        except (json.JSONDecodeError, AttributeError):
            return self._default_analysis(original_event)
        
        return AIAnalysisResult(
            risk_score=self._clamp_score(data.get('risk_score', 5)),
            risk_factors=data.get('risk_factors', []),
            summary=data.get('summary', 'Security event detected'),
            explanation=data.get('explanation', ''),
            recommendations=data.get('recommendations', []),
        )
    
    def _parse_incident_response(
        self,
        response: Any,
        current_score: int
    ) -> AIAnalysisResult:
        """Parse AI response for incident analysis."""
        try:
            text = response.text
            # Clean up the response if it has markdown code blocks
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            data = json.loads(text)
        except (json.JSONDecodeError, AttributeError):
            return self._default_incident_analysis("Incident", current_score)
        
        return AIAnalysisResult(
            risk_score=self._clamp_score(data.get('risk_score', current_score)),
            risk_factors=data.get('risk_factors', []),
            summary=data.get('summary', 'Security incident analyzed'),
            explanation=data.get('explanation', ''),
            recommendations=data.get('recommendations', []),
        )
    
    def _clamp_score(self, score: int) -> int:
        """Ensure score is between 0 and 10."""
        return max(0, min(10, score))
    
    def _default_analysis(self, event_data: Dict[str, Any]) -> AIAnalysisResult:
        """Return default analysis when AI is unavailable."""
        action = event_data.get('action', '').lower()
        result = event_data.get('result', '').lower()
        
        # Basic heuristic scoring
        score = 5
        factors = []
        
        if result in ['failure', 'error', 'denied']:
            score = 7
            factors.append("Operation failed or was denied")
        
        if 'create' in action or 'delete' in action:
            score = 6
            factors.append("Resource creation or deletion detected")
        
        if 'auth' in action or 'login' in action or 'access' in action:
            score = 8
            factors.append("Authentication or access-related event")
        
        return AIAnalysisResult(
            risk_score=score,
            risk_factors=factors if factors else ["Standard security event"],
            summary=f"Security event from {event_data.get('source', 'unknown')}",
            explanation="Event logged by security monitoring system",
            recommendations=[
                {
                    "title": "Review event details",
                    "description": "Check the full event payload for anomalies",
                    "priority": "medium"
                }
            ],
        )
    
    def _default_incident_analysis(
        self,
        title: str,
        current_score: int
    ) -> AIAnalysisResult:
        """Return default incident analysis when AI is unavailable."""
        return AIAnalysisResult(
            risk_score=current_score,
            risk_factors=["Incident detected by monitoring"],
            summary=title,
            explanation="Security incident requiring investigation",
            recommendations=[
                {
                    "title": "Investigate incident",
                    "description": "Review all related events and affected resources",
                    "priority": "high"
                }
            ],
        )


# Global AI service instance
ai_service = AIService()


async def analyze_event_with_ai(event_data) -> AIAnalysisResult:
    """
    Convenience function for event analysis.
    """
    return await ai_service.analyze_event_with_ai(event_data)


async def analyze_incident_with_ai(
    incident_title: str,
    incident_description: str,
    events: List[Dict[str, Any]],
    current_risk_score: int
) -> AIAnalysisResult:
    """
    Convenience function for incident analysis.
    """
    return await ai_service.analyze_incident_with_ai(
        incident_title,
        incident_description,
        events,
        current_risk_score,
    )
