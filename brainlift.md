# Ysera – Brain Lift

## 1. Purpose
Ysera is a transformative platform designed to streamline scientific research by converting natural language descriptions into actionable API-driven workflows, addressing inefficiencies in the decaying grant system. Key features and objectives include:

- **Natural Language to API Conversion**  
  Translates high-level research descriptions into structured API calls for automation.

- **Generalizable Framework**  
  Builds a scalable system adaptable to various research domains, retrofitting grant processes later.

- **Robust Tool Composition**  
  Leverages multi-step tool calls and structured outputs for reliable execution.

- **Contextual Skip Connections**  
  Enhances decision-making by feeding modulated prior context into later stages.

- **Lightweight Backend Deployment**  
  Utilizes Vercel for efficient, scalable backend operations.

- **Rapid Frontend Development**  
  Employs Vercel V0 for quick, integrated frontend generation with authentication and storage.

- **Operational Detail Extraction**  
  Captures scientists' informal research insights into formalized outputs.

### Scope
- **In Scope**:  
  - Natural language processing for API instrumentation  
  - Multi-step tool call composition  
  - Context modulation with skip connections  
  - Vercel-based backend deployment  
  - Vercel V0 frontend with basic auth/storage  
  - Operational detail formalization from research descriptions  

- **Out of Scope**:  
  - Real-time multi-user collaboration  
  - Extensive cross-domain integrations beyond initial MVP  
  - Heavy reliance on third-party frameworks outside Vercel ecosystem  
  - Subscription-based funding models (to be considered post-MVP)  

---

## 2. Experts

### Natural Language Processing Engineers
- **Focus**: Developing converters from natural language to structured API calls  
- **Why Follow**: Ensures accurate translation of research intent into actionable code  
- **Where**:  
  - [OpenAI API Documentation](https://platform.openai.com/docs)  
  - [OpenAI Assistants API](https://platform.openai.com/docs/assistants/overview)  

### API Design Specialists
- **Focus**: Crafting robust, composable tool call structures  
- **Why Follow**: Guarantees reliable multi-step workflows  
- **Where**:  
  - [Zod Schema Validation](https://zod.dev)  
  - [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)  

### Deployment Engineers
- **Focus**: Implementing lightweight backends with Vercel  
- **Why Follow**: Optimizes scalability and deployment efficiency  
- **Where**:  
  - [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)  
  - [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)  

### Frontend Developers
- **Focus**: Using Vercel V0 for rapid UI generation with auth/storage  
- **Why Follow**: Speeds up frontend development with integrated features  
- **Where**:  
  - [Vercel V0 Documentation](https://v0.dev/docs)  
  - [Shadcn UI Components](https://ui.shadcn.com)  

### Research Methodology Experts
- **Focus**: Formalizing operational details from scientists' descriptions  
- **Why Follow**: Bridges the gap between informal research talk and structured outputs  
- **Where**:  
  - [Protocol.io Scientific Workflows](https://www.protocols.io)  
  - [Open Science Framework](https://osf.io)  

---

## 3. SpikyPOVs

### Truths
- **Grant system decay** necessitates generalizable tools to replace outdated funding models.  
- **Natural language conversion** is the fundamental starting point for research automation.  
- **Tool calls and structured outputs** enhance robustness through multi-step composition.  
- **Skip connections** improve context retention for better decision-making across workflow stages.  
- **Lightweight deployment** via Vercel is ideal for backend-heavy research applications.  
- **Vercel V0 superiority** accelerates frontend development with built-in auth/storage capabilities.  
- **Scientists' preference** for discussion over formalization drives the need for extraction tools.  

### Myths
- **"The grant system is sustainable."**  
  It's declining due to funding inefficiencies and institutional bottlenecks, requiring innovative alternatives.  

- **"Start with grants, not tech."**  
  Building from natural language conversion provides a more adaptable foundation than grant-first approaches.  

- **"Simple tool calls suffice."**  
  Complex research workflows require multi-step composition for reliability and thoroughness.  

- **"Context is just input/output."**  
  Modulated skip connections create richer contextual understanding across workflow stages.  

- **"Heavy frameworks are better."**  
  Lightweight Vercel deployment offers superior flexibility and performance for research automation.  

- **"Generic tools beat Vercel V0."**  
  V0's integrated approach delivers more cohesive solutions for research-oriented frontends.  

- **"Scientists formalize easily."**  
  Most researchers prefer natural conversation, requiring specialized tools to extract formal protocols.  

---

## 4. Knowledge Tree

### Project Architecture

#### Summary
- **NLP Conversion Layer**  
  - Uses OpenAI's GPT-4o-mini to parse research descriptions into API calls.  
  - Implements structured outputs via Zod schemas for consistency and validation.  

- **Generalizable Core**  
  - Designs a flexible framework adaptable to various research domains and tasks.  
  - Retrofits grant-specific logic post-MVP while maintaining domain independence.  

- **Tool Composition Engine**  
  - Executes multi-step workflows with robust, error-handling tool calls.  
  - Integrates Pinecone for context-aware embeddings and semantic retrieval.  

- **Skip Connection Mechanism**  
  - Feeds modulated prior context into later workflow stages.  
  - Enhances decision quality without overburdening the direct input/output chain.  

- **Backend Deployment**  
  - Deploys on Vercel for lightweight, scalable API endpoints.  
  - Handles transcription and method generation efficiently through edge functions.  

- **Frontend Implementation**  
  - Built with Vercel V0, featuring auth via localStorage and audio storage.  
  - Provides intuitive UI for research input capture and structured output display.  

- **Operational Formalization**  
  - Extracts detailed methods from scientists' informal inputs through context-aware parsing.  
  - Outputs grant-ready documentation via structured API workflows.  

#### Sources
- **NLP Conversion**  
  - [OpenAI API Reference](https://platform.openai.com/docs/api-reference)  
  - [Zod Schema Documentation](https://zod.dev/?id=introduction)  

- **Generalizable Core**  
  - [Next.js App Router](https://nextjs.org/docs/app)  
  - [NIH Grant Formats](https://grants.nih.gov/grants/how-to-apply-application-guide.html)  

- **Tool Composition**  
  - [Pinecone Vector Database](https://docs.pinecone.io)  
  - [Function Calling Patterns](https://github.com/openai/openai-cookbook/blob/main/examples/function_calling.ipynb)  

- **Skip Connections**  
  - [Transformer Architectures](https://huggingface.co/docs/transformers/model_doc/gpt2)  
  - [Attention Mechanisms](https://paperswithcode.com/method/attention)  

- **Backend Deployment**  
  - [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions)  
  - [Serverless API Routes](https://vercel.com/docs/concepts/functions/serverless-functions)  

- **Frontend Development**  
  - [Vercel V0 Integrations](https://v0.dev/docs)  
  - [Next.js Authentication](https://nextjs.org/docs/authentication)  

- **Operational Formalization**  
  - [Publication Methods Sections](https://www.nature.com/nature-portfolio/for-authors/preparing-your-submission)  
  - [Protocol.io Templates](https://www.protocols.io/workspaces)  