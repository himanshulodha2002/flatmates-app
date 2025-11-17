"""
Unified AI service supporting multiple providers (Gemini and OpenAI).
"""

from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
import json
from PIL import Image
import io
import base64

from app.core.config import settings


class AIProvider(ABC):
    """Abstract base class for AI providers."""

    @abstractmethod
    def is_available(self) -> bool:
        """Check if the provider is configured and available."""
        pass

    @abstractmethod
    async def categorize_expense(
        self, description: str, amount: float, context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Categorize an expense using AI."""
        pass

    @abstractmethod
    async def extract_receipt_data(
        self, image_data: bytes, mime_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        """Extract data from a receipt image using OCR."""
        pass

    @abstractmethod
    async def suggest_tasks(
        self,
        household_context: Dict[str, Any],
        existing_tasks: List[Dict[str, Any]],
        recent_expenses: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Dict[str, Any]]:
        """Generate smart task suggestions based on household context."""
        pass


class GeminiProvider(AIProvider):
    """Google Gemini AI provider."""

    def __init__(self):
        """Initialize Gemini AI with API key."""
        self.model = None
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
            except Exception as e:
                print(f"Failed to initialize Gemini: {e}")

    def is_available(self) -> bool:
        """Check if Gemini AI is configured and available."""
        return self.model is not None

    async def categorize_expense(
        self, description: str, amount: float, context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Categorize an expense using Gemini AI."""
        if not self.is_available():
            return self._get_default_categorization()

        categories = [
            "Groceries", "Utilities", "Rent", "Transportation", "Entertainment",
            "Dining", "Healthcare", "Shopping", "Home Maintenance", "Other"
        ]

        prompt = f"""You are an expense categorization assistant for a flatmates expense tracking app.

Analyze the following expense and categorize it:
- Description: {description}
- Amount: ${amount:.2f}
{f"- Context: {context}" if context else ""}

Categories available: {', '.join(categories)}

Provide a JSON response with:
1. category: Main category from the list above
2. subcategory: More specific subcategory if applicable (or null)
3. confidence: Confidence score between 0.0 and 1.0
4. reasoning: Brief explanation for the categorization
5. suggested_tags: Array of 1-3 relevant tags for filtering

Respond ONLY with the JSON object, no additional text."""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            result_text = self._clean_json_response(result_text)
            result = json.loads(result_text)

            if result.get("category") not in categories:
                result["category"] = "Other"
            result["confidence"] = max(0.0, min(1.0, result.get("confidence", 0.5)))

            return result
        except Exception as e:
            print(f"Error in Gemini categorization: {str(e)}")
            return self._get_default_categorization(str(e))

    async def extract_receipt_data(
        self, image_data: bytes, mime_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        """Extract data from a receipt image using Gemini Vision."""
        if not self.is_available():
            return {"success": False, "error": "AI service unavailable", "expenses": []}

        prompt = """You are a receipt OCR assistant for a flatmates expense tracking app.

Analyze this receipt image and extract the following information:
1. Store/merchant name
2. Date of purchase (in YYYY-MM-DD format)
3. Total amount
4. Individual line items with descriptions and amounts
5. Payment method if visible
6. Tax amount if shown

Provide a JSON response with this structure:
{
    "success": true,
    "merchant": "Store Name",
    "date": "2025-11-17",
    "total": 45.67,
    "currency": "USD",
    "items": [
        {"description": "Item 1", "amount": 10.00},
        {"description": "Item 2", "amount": 35.67}
    ],
    "tax": 3.45,
    "payment_method": "Credit Card",
    "confidence": 0.95,
    "notes": "Any additional relevant information"
}

If you cannot read the receipt clearly, set success to false and explain in the error field.
Respond ONLY with the JSON object, no additional text."""

        try:
            image = Image.open(io.BytesIO(image_data))
            response = self.model.generate_content([prompt, image])
            result_text = response.text.strip()
            result_text = self._clean_json_response(result_text)
            result = json.loads(result_text)
            return result
        except Exception as e:
            print(f"Error in Gemini OCR: {str(e)}")
            return {"success": False, "error": f"Failed to process receipt: {str(e)}", "expenses": []}

    async def suggest_tasks(
        self,
        household_context: Dict[str, Any],
        existing_tasks: List[Dict[str, Any]],
        recent_expenses: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Dict[str, Any]]:
        """Generate smart task suggestions using Gemini."""
        if not self.is_available():
            return []

        context_parts = [f"Household members: {household_context.get('member_count', 0)}"]

        if existing_tasks:
            context_parts.append(f"\nCurrent tasks ({len(existing_tasks)}):")
            for task in existing_tasks[:5]:
                context_parts.append(f"- {task.get('title')} (Status: {task.get('status')})")

        if recent_expenses:
            context_parts.append(f"\nRecent expenses ({len(recent_expenses)}):")
            for expense in recent_expenses[:5]:
                context_parts.append(f"- ${expense.get('amount', 0):.2f} for {expense.get('description', 'unknown')}")

        prompt = f"""You are a helpful assistant for a flatmates household management app.

Based on the following context, suggest 3-5 practical tasks for the household:

{chr(10).join(context_parts)}

Consider:
1. Recurring household chores
2. Maintenance tasks based on the season
3. Financial tasks (bill payments, expense reviews)
4. Shopping needs
5. General household organization

Provide a JSON array of task suggestions with this structure:
[
    {{
        "title": "Task title (clear and concise)",
        "description": "Detailed description of what needs to be done",
        "priority": "low" | "medium" | "high",
        "category": "chores" | "financial" | "shopping" | "maintenance" | "other",
        "reasoning": "Why this task is suggested"
    }}
]

Make suggestions practical, actionable, and relevant to a shared living situation.
Respond ONLY with the JSON array, no additional text."""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            result_text = self._clean_json_response(result_text)
            suggestions = json.loads(result_text)

            valid_priorities = ["low", "medium", "high"]
            for suggestion in suggestions:
                if suggestion.get("priority") not in valid_priorities:
                    suggestion["priority"] = "medium"

            return suggestions[:5]
        except Exception as e:
            print(f"Error in Gemini task suggestions: {str(e)}")
            return []

    @staticmethod
    def _clean_json_response(text: str) -> str:
        """Remove markdown code blocks from JSON response."""
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    @staticmethod
    def _get_default_categorization(error: str = "AI categorization unavailable") -> Dict[str, Any]:
        """Return default categorization when AI is unavailable."""
        return {
            "category": "Other",
            "subcategory": None,
            "confidence": 0.0,
            "reasoning": error,
            "suggested_tags": []
        }


class OpenAIProvider(AIProvider):
    """OpenAI / GitHub Models provider."""

    def __init__(self):
        """Initialize OpenAI with API key."""
        self.client = None
        if settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    base_url=settings.OPENAI_BASE_URL,
                )
                self.model = settings.OPENAI_MODEL
            except Exception as e:
                print(f"Failed to initialize OpenAI: {e}")

    def is_available(self) -> bool:
        """Check if OpenAI is configured and available."""
        return self.client is not None

    async def categorize_expense(
        self, description: str, amount: float, context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Categorize an expense using OpenAI."""
        if not self.is_available():
            return self._get_default_categorization()

        categories = [
            "Groceries", "Utilities", "Rent", "Transportation", "Entertainment",
            "Dining", "Healthcare", "Shopping", "Home Maintenance", "Other"
        ]

        prompt = f"""You are an expense categorization assistant for a flatmates expense tracking app.

Analyze the following expense and categorize it:
- Description: {description}
- Amount: ${amount:.2f}
{f"- Context: {context}" if context else ""}

Categories available: {', '.join(categories)}

Provide a JSON response with:
1. category: Main category from the list above
2. subcategory: More specific subcategory if applicable (or null)
3. confidence: Confidence score between 0.0 and 1.0
4. reasoning: Brief explanation for the categorization
5. suggested_tags: Array of 1-3 relevant tags for filtering

Respond ONLY with the JSON object, no additional text."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful expense categorization assistant. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )

            result_text = response.choices[0].message.content
            result = json.loads(result_text)

            if result.get("category") not in categories:
                result["category"] = "Other"
            result["confidence"] = max(0.0, min(1.0, result.get("confidence", 0.5)))

            return result
        except Exception as e:
            print(f"Error in OpenAI categorization: {str(e)}")
            return self._get_default_categorization(str(e))

    async def extract_receipt_data(
        self, image_data: bytes, mime_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        """Extract data from a receipt image using OpenAI Vision."""
        if not self.is_available():
            return {"success": False, "error": "AI service unavailable", "expenses": []}

        # Convert image to base64
        base64_image = base64.b64encode(image_data).decode('utf-8')

        prompt = """You are a receipt OCR assistant for a flatmates expense tracking app.

Analyze this receipt image and extract the following information:
1. Store/merchant name
2. Date of purchase (in YYYY-MM-DD format)
3. Total amount
4. Individual line items with descriptions and amounts
5. Payment method if visible
6. Tax amount if shown

Provide a JSON response with this structure:
{
    "success": true,
    "merchant": "Store Name",
    "date": "2025-11-17",
    "total": 45.67,
    "currency": "USD",
    "items": [
        {"description": "Item 1", "amount": 10.00},
        {"description": "Item 2", "amount": 35.67}
    ],
    "tax": 3.45,
    "payment_method": "Credit Card",
    "confidence": 0.95,
    "notes": "Any additional relevant information"
}

If you cannot read the receipt clearly, set success to false and explain in the error field.
Respond ONLY with the JSON object, no additional text."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful receipt OCR assistant. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            return result
        except Exception as e:
            print(f"Error in OpenAI OCR: {str(e)}")
            return {"success": False, "error": f"Failed to process receipt: {str(e)}", "expenses": []}

    async def suggest_tasks(
        self,
        household_context: Dict[str, Any],
        existing_tasks: List[Dict[str, Any]],
        recent_expenses: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Dict[str, Any]]:
        """Generate smart task suggestions using OpenAI."""
        if not self.is_available():
            return []

        context_parts = [f"Household members: {household_context.get('member_count', 0)}"]

        if existing_tasks:
            context_parts.append(f"\nCurrent tasks ({len(existing_tasks)}):")
            for task in existing_tasks[:5]:
                context_parts.append(f"- {task.get('title')} (Status: {task.get('status')})")

        if recent_expenses:
            context_parts.append(f"\nRecent expenses ({len(recent_expenses)}):")
            for expense in recent_expenses[:5]:
                context_parts.append(f"- ${expense.get('amount', 0):.2f} for {expense.get('description', 'unknown')}")

        prompt = f"""You are a helpful assistant for a flatmates household management app.

Based on the following context, suggest 3-5 practical tasks for the household:

{chr(10).join(context_parts)}

Consider:
1. Recurring household chores
2. Maintenance tasks based on the season
3. Financial tasks (bill payments, expense reviews)
4. Shopping needs
5. General household organization

Provide a JSON array of task suggestions with this structure:
[
    {{
        "title": "Task title (clear and concise)",
        "description": "Detailed description of what needs to be done",
        "priority": "low" | "medium" | "high",
        "category": "chores" | "financial" | "shopping" | "maintenance" | "other",
        "reasoning": "Why this task is suggested"
    }}
]

Make suggestions practical, actionable, and relevant to a shared living situation.
Respond ONLY with the JSON array, no additional text."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful household management assistant. Always respond with valid JSON only."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                response_format={"type": "json_object"}
            )

            result_text = response.choices[0].message.content
            # OpenAI might wrap array in an object, handle both cases
            result = json.loads(result_text)
            if isinstance(result, dict) and "suggestions" in result:
                suggestions = result["suggestions"]
            elif isinstance(result, list):
                suggestions = result
            else:
                suggestions = []

            valid_priorities = ["low", "medium", "high"]
            for suggestion in suggestions:
                if suggestion.get("priority") not in valid_priorities:
                    suggestion["priority"] = "medium"

            return suggestions[:5]
        except Exception as e:
            print(f"Error in OpenAI task suggestions: {str(e)}")
            return []

    @staticmethod
    def _get_default_categorization(error: str = "AI categorization unavailable") -> Dict[str, Any]:
        """Return default categorization when AI is unavailable."""
        return {
            "category": "Other",
            "subcategory": None,
            "confidence": 0.0,
            "reasoning": error,
            "suggested_tags": []
        }


class AIService:
    """Unified AI service that routes to the appropriate provider."""

    def __init__(self):
        """Initialize AI service with configured providers."""
        self.gemini = GeminiProvider()
        self.openai = OpenAIProvider()
        self.provider = self._select_provider()

    def _select_provider(self) -> AIProvider:
        """Select the appropriate AI provider based on configuration."""
        provider_name = settings.AI_PROVIDER.lower()

        if provider_name == "openai":
            if self.openai.is_available():
                print("Using OpenAI provider")
                return self.openai
            elif self.gemini.is_available():
                print("OpenAI not available, falling back to Gemini")
                return self.gemini
        elif provider_name == "gemini":
            if self.gemini.is_available():
                print("Using Gemini provider")
                return self.gemini
            elif self.openai.is_available():
                print("Gemini not available, falling back to OpenAI")
                return self.openai
        elif provider_name == "auto":
            # Try OpenAI first, then Gemini
            if self.openai.is_available():
                print("Using OpenAI provider (auto-selected)")
                return self.openai
            elif self.gemini.is_available():
                print("Using Gemini provider (auto-selected)")
                return self.gemini

        # Fallback to Gemini as default
        print("No AI provider available, using default (non-functional)")
        return self.gemini

    def is_available(self) -> bool:
        """Check if any AI provider is available."""
        return self.provider.is_available()

    async def categorize_expense(
        self, description: str, amount: float, context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Categorize an expense using the selected provider."""
        return await self.provider.categorize_expense(description, amount, context)

    async def extract_receipt_data(
        self, image_data: bytes, mime_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        """Extract receipt data using the selected provider."""
        return await self.provider.extract_receipt_data(image_data, mime_type)

    async def suggest_tasks(
        self,
        household_context: Dict[str, Any],
        existing_tasks: List[Dict[str, Any]],
        recent_expenses: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Dict[str, Any]]:
        """Generate task suggestions using the selected provider."""
        return await self.provider.suggest_tasks(household_context, existing_tasks, recent_expenses)


# Create a singleton instance
ai_service = AIService()
