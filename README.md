# art_director package

This package contains a professional Art Director assistant module for analysis and step-by-step fixes of visual assets (webtoons, illustrations, renders).

## Installation

1. Clone the repository:

   git clone https://github.com/alinnamlina-cell/my-aiCSP-assistant-.git
   cd my-aiCSP-assistant-

2. Create a virtual environment and install dependencies:

   python -m venv .venv
   source .venv/bin/activate  # macOS / Linux
   .venv\Scripts\activate     # Windows
   pip install -r requirements.txt

3. Create a `.env` file in repository root with keys used by your services (example):

   # If you use Mistral via serverless backend
   MISTRAL_API_KEY=your_mistral_key_here

   # If you use OpenAI via langchain wrapper
   OPENAI_API_KEY=your_openai_key_here

## Usage (example)

This package exposes `WebtoonArtDirector` and `Settings`.

Example (async):

```python
import asyncio
from art_director import WebtoonArtDirector, Settings

async def main():
    s = Settings(openai_api_key="YOUR_OPENAI_KEY")
    d = WebtoonArtDirector(settings=s)
    answer = await d.send_message("Анализируй по протоколу: diagnose+fix")
    print(answer)

if __name__ == '__main__':
    asyncio.run(main())
```

## Notes
- Frontend already sends a strict professional system prompt; backend also contains a conservative prompt (low temperature) to prioritize precise, tool-like instructions.
- Ensure environment variables are set when running locally or deploying (Vercel/other).
- This package is intended as a library. You can run it as a separate microservice and connect it to your frontend if needed.
