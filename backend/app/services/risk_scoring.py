"""
Risk scoring service for rule-based security assessment.
Provides initial risk scoring based on patterns and heuristics.
"""

from typing import Dict, Any, List, Set, Tuple
from dataclasses import dataclass


@dataclass
class RiskFactor:
    """Individual risk factor with score contribution."""
    name: str
    score: int
    description: str


class RiskScoringEngine:
    """
    Rule-based risk scoring engine for security events.
    Evaluates events against known patterns and assigns risk scores.
    """
    
    # High-risk action patterns
    HIGH_RISK_ACTIONS: Set[str] = {
        "delete", "destroy", "terminate", "kill",
        "exfiltrate", "steal", "dump", "export",
        "escalate", "privilege", "admin", "root",
        "inject", "exploit", "bypass", "override",
    }
    
    # Medium-risk action patterns
    MEDIUM_RISK_ACTIONS: Set[str] = {
        "create", "modify", "update", "change",
        "deploy", "push", "commit", "merge",
        "configure", "setup", "install", "enable",
    }
    
    # High-risk result patterns
    HIGH_RISK_RESULTS: Set[str] = {
        "failure", "error", "denied", "rejected",
        "unauthorized", "forbidden", "blocked", "failed",
    }
    
    # High-risk sources
    HIGH_RISK_SOURCES: Set[str] = {
        "kubernetes", "api_gateway", "cloudwatch",
    }
    
    # Sensitive data patterns in payloads
    SENSITIVE_PATTERNS: Set[str] = {
        "password", "secret", "api_key", "token",
        "credential", "private_key", "auth", "credential",
    }
    
    async def calculate_risk_score(
        self,
        event_data
    ) -> int:
        """
        Calculate risk score for an event.
        
        Args:
            event_data: Event data (dict or Pydantic model)
            
        Returns:
            Risk score from 0 to 10
        """
        # Convert to dict if needed
        if hasattr(event_data, 'model_dump'):
            event_dict = event_data.model_dump()
        else:
            event_dict = event_data
        
        # Start with base score
        score = 0
        factors = []
        
        # Evaluate action risk
        action = event_dict.get('action', '').lower()
        action_score, action_factors = await self._evaluate_action(action)
        score += action_score
        factors.extend(action_factors)
        
        # Evaluate result risk
        result = event_dict.get('result', '').lower()
        result_score, result_factors = await self._evaluate_result(result)
        score += result_score
        factors.extend(result_factors)
        
        # Evaluate source risk
        source = str(event_dict.get('source', '')).lower()
        source_score, source_factors = await self._evaluate_source(source)
        score += source_score
        factors.extend(source_factors)
        
        # Evaluate actor risk
        actor = event_dict.get('actor', '')
        actor_score, actor_factors = await self._evaluate_actor(actor)
        score += actor_score
        factors.extend(actor_factors)
        
        # Evaluate payload for sensitive data
        payload = event_dict.get('raw_payload', {})
        if isinstance(payload, dict):
            payload_score, payload_factors = await self._evaluate_payload(payload)
            score += payload_score
            factors.extend(payload_factors)
        
        # Clamp score to 0-10 range
        return max(0, min(10, score))
    
    async def get_risk_factors(
        self,
        event_data
    ) -> List[RiskFactor]:
        """
        Get detailed risk factors for an event.
        
        Returns:
            List of RiskFactor objects with details
        """
        if hasattr(event_data, 'model_dump'):
            event_dict = event_data.model_dump()
        else:
            event_dict = event_data
        
        factors = []
        
        # Action analysis
        action = event_dict.get('action', '').lower()
        if any(pattern in action for pattern in self.HIGH_RISK_ACTIONS):
            factors.append(RiskFactor(
                name="high_risk_action",
                score=3,
                description=f"Action '{action}' is classified as high-risk"
            ))
        elif any(pattern in action for pattern in self.MEDIUM_RISK_ACTIONS):
            factors.append(RiskFactor(
                name="medium_risk_action",
                score=1,
                description=f"Action '{action}' modifies system state"
            ))
        
        # Result analysis
        result = event_dict.get('result', '').lower()
        if result in self.HIGH_RISK_RESULTS:
            factors.append(RiskFactor(
                name="failed_operation",
                score=2,
                description=f"Operation resulted in '{result}'"
            ))
        
        # Source analysis
        source = str(event_dict.get('source', '')).lower()
        if source in self.HIGH_RISK_SOURCES:
            factors.append(RiskFactor(
                name="high_risk_source",
                score=2,
                description=f"Event from {source} requires attention"
            ))
        
        # Sensitive data check
        payload = event_dict.get('raw_payload', {})
        if isinstance(payload, dict):
            payload_str = str(payload).lower()
            if any(pattern in payload_str for pattern in self.SENSITIVE_PATTERNS):
                factors.append(RiskFactor(
                    name="sensitive_data",
                    score=4,
                    description="Potential sensitive data in event payload"
                ))
        
        return factors
    
    async def _evaluate_action(self, action: str) -> Tuple[int, List[str]]:
        """Evaluate action for risk contribution."""
        score = 0
        factors = []
        
        if not action:
            return score, factors
        
        action_lower = action.lower()
        
        # High-risk actions
        if any(pattern in action_lower for pattern in self.HIGH_RISK_ACTIONS):
            score += 3
            factors.append("high_risk_action")
        
        # Medium-risk actions
        elif any(pattern in action_lower for pattern in self.MEDIUM_RISK_ACTIONS):
            score += 1
            factors.append("medium_risk_action")
        
        return score, factors
    
    async def _evaluate_result(self, result: str) -> Tuple[int, List[str]]:
        """Evaluate result for risk contribution."""
        score = 0
        factors = []
        
        if not result:
            return score, factors
        
        result_lower = result.lower()
        
        if result_lower in self.HIGH_RISK_RESULTS:
            score += 2
            factors.append("failed_operation")
        
        return score, factors
    
    async def _evaluate_source(self, source: str) -> Tuple[int, List[str]]:
        """Evaluate source for risk contribution."""
        score = 0
        factors = []
        
        if not source:
            return score, factors
        
        source_lower = source.lower()
        
        if source_lower in self.HIGH_RISK_SOURCES:
            score += 2
            factors.append("high_risk_source")
        
        # Check for Power Platform (often under-monitored)
        if "power" in source_lower:
            score += 1
            factors.append("automation_platform")
        
        return score, factors
    
    async def _evaluate_actor(self, actor: str) -> Tuple[int, List[str]]:
        """Evaluate actor for risk contribution."""
        score = 0
        factors = []
        
        if not actor:
            return score, factors
        
        # Check for service accounts vs user accounts
        if any(pattern in actor.lower() for pattern in ['service', 'system', 'admin', 'root']):
            score += 1
            factors.append("privileged_account")
        
        return score, factors
    
    async def _evaluate_payload(self, payload: Dict) -> Tuple[int, List[str]]:
        """Evaluate payload for sensitive data exposure."""
        score = 0
        factors = []
        
        payload_str = str(payload).lower()
        
        # Check for sensitive patterns
        if any(pattern in payload_str for pattern in self.SENSITIVE_PATTERNS):
            score += 4
            factors.append("sensitive_data_exposure")
        
        # Check for unusual payload size (potential data exfiltration)
        if len(payload_str) > 10000:
            score += 2
            factors.append("large_payload")
        
        return score, factors
    
    def should_trigger_incident(self, score: int) -> bool:
        """Determine if a score warrants incident creation."""
        return score >= 7
    
    def get_risk_level(self, score: int) -> str:
        """Get risk level label from score."""
        if score >= 9:
            return "critical"
        elif score >= 7:
            return "high"
        elif score >= 4:
            return "medium"
        elif score >= 1:
            return "low"
        else:
            return "info"


# Global instance
risk_scoring_engine = RiskScoringEngine()


async def calculate_risk_score(event_data) -> int:
    """
    Convenience function for calculating risk score.
    """
    return await risk_scoring_engine.calculate_risk_score(event_data)


async def get_risk_factors(event_data) -> List[RiskFactor]:
    """
    Convenience function for getting risk factors.
    """
    return await risk_scoring_engine.get_risk_factors(event_data)
