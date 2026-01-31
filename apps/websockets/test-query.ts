import WebSocket from "ws";

const sampleFolders = [
  {
    id: "folder-1",
    name: "Projects",
    color: "#3b82f6",
    iconKey: "folder",
    createdAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "folder-2",
    name: "Ideas",
    color: "#10b981",
    iconKey: "lightbulb",
    createdAt: "2024-01-16T10:00:00.000Z"
  },
  {
    id: "folder-3",
    name: "Journal",
    color: "#f59e0b",
    iconKey: "book",
    createdAt: "2024-01-17T10:00:00.000Z"
  },
  {
    id: "folder-4",
    name: "Research",
    color: "#8b5cf6",
    iconKey: "search",
    createdAt: "2024-01-18T10:00:00.000Z"
  },
  {
    id: "folder-5",
    name: "Meeting Notes",
    color: "#ec4899",
    iconKey: "users",
    createdAt: "2024-01-19T10:00:00.000Z"
  },
  {
    id: "folder-6",
    name: "Technical Docs",
    color: "#06b6d4",
    iconKey: "code",
    createdAt: "2024-01-20T10:00:00.000Z"
  }
];

const sampleNotes = [
  {
    id: "note-1",
    title: "Database Scaling Strategies - Comprehensive Guide",
    content: `For database scaling, we should consider multiple approaches. Horizontal sharding is essential when dealing with large datasets that exceed single server capacity. We need to partition data across multiple database instances based on a shard key. Read replicas are crucial for distributing read load and improving query performance. The main bottleneck is typically write operations, so we need to implement connection pooling to manage database connections efficiently. Redis caching layer should be used for frequently accessed data to reduce database load. PostgreSQL is our primary data storage solution, but we're also considering MongoDB for document-based queries. We need to implement database connection pooling with a maximum of 100 connections per instance. Monitoring query performance is critical - we should track slow queries and optimize them. Index optimization is another key area - we need to ensure proper indexing on frequently queried columns.`,
    folderId: "folder-1",
    createdAt: "2024-01-20T10:00:00.000Z",
    updatedAt: "2024-01-20T10:00:00.000Z",
    tags: ["database", "scaling", "architecture", "performance"]
  },
  {
    id: "note-2",
    title: "System Architecture Notes - Microservices Design",
    content: `Database scaling requires careful planning. Use connection pooling and implement a robust caching layer. Our microservices architecture uses an API gateway pattern for routing requests. Load balancing is implemented across multiple instances using round-robin algorithm. We're using Kubernetes for container orchestration which allows automatic scaling based on CPU and memory metrics. Service mesh implementation with Istio provides better observability and traffic management. Each microservice has its own database to ensure data isolation. Event-driven architecture using message queues (RabbitMQ) for asynchronous communication between services. Circuit breaker pattern implemented to handle service failures gracefully. We use Docker containers for consistent deployment across environments. CI/CD pipeline is set up with GitHub Actions for automated testing and deployment.`,
    folderId: "folder-2",
    createdAt: "2024-01-21T10:00:00.000Z",
    updatedAt: "2024-01-21T10:00:00.000Z",
    tags: ["architecture", "microservices", "kubernetes", "devops"]
  },
  {
    id: "note-3",
    title: "New Product Concept - Habit Tracking App",
    content: `A mobile app that helps users track their daily habits and build sustainable routines. Key features include: habit streaks visualization to motivate users, smart reminders based on user's schedule, comprehensive analytics dashboard showing progress over time, social sharing capabilities to share achievements with friends, gamification elements like badges and rewards, integration with health apps (Apple Health, Google Fit), dark mode support for better user experience, offline mode for tracking habits without internet, customizable habit templates, and progress reports via email. Target audience: professionals aged 25-40 who want to build better habits. Monetization strategy: freemium model with premium features like advanced analytics and unlimited habits. Marketing approach: focus on App Store optimization and social media marketing. Development timeline: 6 months with a team of 5 developers.`,
    folderId: "folder-2",
    createdAt: "2024-01-22T10:00:00.000Z",
    updatedAt: "2024-01-22T10:00:00.000Z",
    tags: ["product", "mobile", "habits", "startup"]
  },
  {
    id: "note-4",
    title: "Marketing Strategy Q1 2024 - Comprehensive Plan",
    content: `Focus on social media marketing across multiple platforms. Instagram and LinkedIn for B2B audience engagement. TikTok for younger demographic (18-30 years). Content calendar planned for next 3 months with daily posts. Budget allocation: 40% paid ads (Facebook, Instagram, Google), 30% content creation (videos, graphics, blog posts), 30% influencer partnerships (micro and macro influencers). Key metrics to track: engagement rate, click-through rate, conversion rate, cost per acquisition. Email marketing campaigns scheduled weekly with personalized content. SEO strategy includes keyword research and content optimization. We're launching a referral program with incentives for both referrer and referee. Partnership with complementary brands for cross-promotion. PR strategy includes press releases and media outreach.`,
    folderId: "folder-2",
    createdAt: "2024-01-23T10:00:00.000Z",
    updatedAt: "2024-01-23T10:00:00.000Z",
    tags: ["marketing", "strategy", "social-media", "growth"]
  },
  {
    id: "note-5",
    title: "Project X Planning - Complete Roadmap",
    content: `Project X is a new initiative to improve user engagement and retention. Key milestones: Phase 1 - Research and Discovery (2 weeks) including user interviews, competitive analysis, and market research. Phase 2 - Design and Prototyping (3 weeks) with wireframes, high-fidelity designs, and user testing. Phase 3 - Development (6 weeks) split into 3 sprints of 2 weeks each. Phase 4 - Testing and QA (2 weeks) including unit tests, integration tests, and user acceptance testing. Phase 5 - Launch and Monitoring (1 week) with gradual rollout and performance monitoring. Team size: 5 developers (2 frontend, 2 backend, 1 full-stack), 2 designers (1 UI/UX, 1 visual), 1 product manager, 1 QA engineer. Budget: $150,000 allocated across salaries, tools, and marketing. Success metrics: 30% increase in daily active users, 20% improvement in retention rate, 15% increase in revenue.`,
    folderId: "folder-1",
    createdAt: "2024-01-24T10:00:00.000Z",
    updatedAt: "2024-01-24T10:00:00.000Z",
    tags: ["project-x", "planning", "milestones", "roadmap"]
  },
  {
    id: "note-6",
    title: "Project X Implementation - Development Progress",
    content: `Started Phase 3 development on schedule. Using React with TypeScript for frontend development. Backend built with Node.js and Express framework. Database schema designed with PostgreSQL including users, sessions, analytics, and content tables. API endpoints defined following RESTful conventions with proper error handling. Authentication implemented using JWT tokens with refresh token mechanism. Deployment pipeline set up on AWS using EC2 instances, RDS for database, S3 for file storage, and CloudFront for CDN. CI/CD configured with GitHub Actions for automated testing and deployment. Code review process established with mandatory approvals. Documentation updated in Confluence. Daily standups scheduled at 10 AM. Sprint planning every 2 weeks. Retrospectives after each sprint to identify improvements.`,
    folderId: "folder-1",
    createdAt: "2024-01-25T10:00:00.000Z",
    updatedAt: "2024-01-25T10:00:00.000Z",
    tags: ["project-x", "implementation", "development", "aws"]
  },
  {
    id: "note-7",
    title: "Daily Reflection - January 25, 2024",
    content: `Today I worked on improving the search functionality in our application. Learned about vector embeddings for semantic search which could significantly improve search accuracy. Need to research more about RAG (Retrieval Augmented Generation) for better AI responses. Attended a tech meetup about distributed systems and learned about eventual consistency patterns. Had a productive code review session with the team. Feeling motivated about the progress we're making. Need to focus on better time management tomorrow. Planning to read more about system design patterns this weekend.`,
    folderId: "folder-3",
    createdAt: "2024-01-25T18:00:00.000Z",
    updatedAt: "2024-01-25T18:00:00.000Z",
    tags: ["reflection", "learning", "personal"]
  },
  {
    id: "note-8",
    title: "AI Research Notes - RAG and Vector Embeddings",
    content: `RAG (Retrieval Augmented Generation) combines retrieval and generation for more accurate AI responses. Use embeddings to find relevant documents, then pass context to LLM. Benefits include: more accurate information, up-to-date data, reduced hallucinations, better source attribution. Implementation requires: vector database (Pinecone, Weaviate, or Chroma), embedding model (OpenAI, Cohere, or open-source), and LLM API (OpenAI, Anthropic, or self-hosted). Embeddings can be generated using models like text-embedding-ada-002 or sentence-transformers. Similarity search uses cosine similarity or dot product. Chunking strategy is important - typically 500-1000 tokens per chunk with overlap. Metadata filtering helps narrow down search results.`,
    folderId: "folder-4",
    createdAt: "2024-01-26T10:00:00.000Z",
    updatedAt: "2024-01-26T10:00:00.000Z",
    tags: ["ai", "rag", "research", "embeddings"]
  },
  {
    id: "note-9",
    title: "Performance Optimization - Complete Analysis",
    content: `Identified bottlenecks in API response times through comprehensive profiling. Average response time was 500ms, which is unacceptable for our use case. Implemented Redis caching for frequently accessed data, reducing response time to 150ms. Next optimizations: optimize database queries by adding proper indexes and using query optimization techniques, add CDN for static assets to reduce load times, implement database query result caching, use connection pooling more effectively, implement lazy loading for non-critical data, compress API responses using gzip, implement pagination for large datasets, use background jobs for heavy processing, optimize image sizes and formats, implement rate limiting to prevent abuse. Monitoring set up with Datadog for real-time performance tracking.`,
    folderId: "folder-1",
    createdAt: "2024-01-27T10:00:00.000Z",
    updatedAt: "2024-01-27T10:00:00.000Z",
    tags: ["performance", "optimization", "caching", "monitoring"]
  },
  {
    id: "note-10",
    title: "Team Meeting Notes - Q2 Roadmap Discussion",
    content: `Discussed Q2 roadmap with entire team. Priority features identified: user analytics dashboard with real-time metrics, advanced search with filters and sorting, mobile app improvements including offline mode, new onboarding flow for better user experience, integration with third-party services, improved notification system, dark mode implementation, accessibility improvements. Resource allocation: 3 developers on dashboard (2 frontend, 1 backend), 2 developers on search functionality, 2 developers on mobile app, 1 designer working on UI improvements, 1 QA engineer for testing. Timeline: 8 weeks for all features. Budget approved: $200,000 for Q2. Risk assessment completed with mitigation strategies.`,
    folderId: "folder-5",
    createdAt: "2024-01-28T10:00:00.000Z",
    updatedAt: "2024-01-28T10:00:00.000Z",
    tags: ["meeting", "roadmap", "team", "planning"]
  },
  {
    id: "note-11",
    title: "API Design Best Practices - Technical Documentation",
    content: `RESTful API design principles: use proper HTTP methods (GET, POST, PUT, DELETE, PATCH), implement proper status codes (200, 201, 400, 401, 404, 500), use versioning in URL (v1, v2) or headers, implement pagination for list endpoints, use filtering and sorting query parameters, implement rate limiting to prevent abuse, use consistent naming conventions (snake_case or camelCase), provide comprehensive error messages, implement authentication and authorization, use HTTPS for all endpoints, implement request/response logging, provide API documentation (OpenAPI/Swagger), implement idempotency for POST requests, use proper content types, implement caching headers, handle CORS properly, validate input data, implement request timeouts, use async processing for long-running tasks.`,
    folderId: "folder-6",
    createdAt: "2024-01-29T10:00:00.000Z",
    updatedAt: "2024-01-29T10:00:00.000Z",
    tags: ["api", "documentation", "best-practices", "technical"]
  },
  {
    id: "note-12",
    title: "Security Best Practices - Implementation Guide",
    content: `Security measures to implement: use HTTPS for all communications, implement proper authentication (OAuth 2.0, JWT), use password hashing (bcrypt, Argon2), implement rate limiting to prevent brute force attacks, use input validation and sanitization, implement CSRF protection, use secure headers (CSP, X-Frame-Options), implement SQL injection prevention (parameterized queries), use environment variables for secrets, implement proper error handling (don't expose sensitive info), use dependency scanning tools, implement regular security audits, use WAF (Web Application Firewall), implement 2FA for sensitive operations, use encryption for sensitive data at rest, implement proper session management, use MFA where possible, conduct regular penetration testing, implement security monitoring and alerting.`,
    folderId: "folder-6",
    createdAt: "2024-01-30T10:00:00.000Z",
    updatedAt: "2024-01-30T10:00:00.000Z",
    tags: ["security", "best-practices", "implementation"]
  },
  {
    id: "note-13",
    title: "User Research Findings - Q1 2024",
    content: `Conducted 50 user interviews over 3 months. Key findings: users want faster search functionality (current search is too slow), mobile app needs offline capabilities (major pain point), users want better organization features (tags, folders, filters), analytics dashboard is highly requested, users want integration with calendar apps, notification system needs improvement (too many notifications), users want dark mode (requested by 80% of users), onboarding process is confusing for new users, users want better collaboration features, pricing is a concern for some users. Prioritized features based on user feedback and business impact. Next steps: create user personas, design user journeys, create prototypes for top features.`,
    folderId: "folder-2",
    createdAt: "2024-02-01T10:00:00.000Z",
    updatedAt: "2024-02-01T10:00:00.000Z",
    tags: ["research", "user-feedback", "product"]
  },
  {
    id: "note-14",
    title: "Database Migration Strategy - PostgreSQL to Distributed",
    content: `Planning migration from single PostgreSQL instance to distributed database system. Reasons: current database is hitting capacity limits, need better scalability, want to improve availability, need geographic distribution. Options considered: PostgreSQL with read replicas, CockroachDB for distributed SQL, MongoDB for document storage, Cassandra for time-series data. Decision: use PostgreSQL with read replicas initially, then migrate to CockroachDB for true distribution. Migration plan: Phase 1 - set up read replicas (2 weeks), Phase 2 - implement application-level sharding (4 weeks), Phase 3 - migrate to CockroachDB (8 weeks), Phase 4 - optimize and monitor (2 weeks). Risks: data loss, downtime, performance degradation. Mitigation: comprehensive backup strategy, gradual rollout, extensive testing, rollback plan.`,
    folderId: "folder-1",
    createdAt: "2024-02-02T10:00:00.000Z",
    updatedAt: "2024-02-02T10:00:00.000Z",
    tags: ["database", "migration", "postgresql", "architecture"]
  },
  {
    id: "note-15",
    title: "Frontend Architecture - React Best Practices",
    content: `React architecture decisions: use functional components with hooks, implement component composition over inheritance, use TypeScript for type safety, implement proper state management (Redux or Zustand), use React Query for server state, implement code splitting for better performance, use lazy loading for routes, implement proper error boundaries, use custom hooks for reusable logic, implement proper prop types or TypeScript interfaces, use context API for global state, implement proper memoization (useMemo, useCallback), use React.memo for expensive components, implement proper loading states, use Suspense for async components, implement proper form validation, use React Router for navigation, implement proper testing (Jest, React Testing Library), use Storybook for component documentation.`,
    folderId: "folder-6",
    createdAt: "2024-02-03T10:00:00.000Z",
    updatedAt: "2024-02-03T10:00:00.000Z",
    tags: ["frontend", "react", "architecture", "best-practices"]
  },
  {
    id: "note-16",
    title: "Backend Architecture - Node.js Microservices",
    content: `Backend architecture using Node.js: microservices pattern with Express framework, each service has its own database, use message queues (RabbitMQ) for inter-service communication, implement API gateway for routing, use Docker for containerization, Kubernetes for orchestration, implement proper logging (Winston, Pino), use structured logging with correlation IDs, implement distributed tracing (Jaeger, Zipkin), use monitoring tools (Prometheus, Grafana), implement health check endpoints, use circuit breaker pattern, implement retry logic with exponential backoff, use rate limiting middleware, implement authentication middleware, use validation libraries (Joi, Zod), implement proper error handling, use environment-based configuration, implement database migrations, use ORM (Sequelize, TypeORM) or query builders (Knex), implement caching strategies, use background job processing (Bull, Agenda).`,
    folderId: "folder-6",
    createdAt: "2024-02-04T10:00:00.000Z",
    updatedAt: "2024-02-04T10:00:00.000Z",
    tags: ["backend", "nodejs", "microservices", "architecture"]
  },
  {
    id: "note-17",
    title: "DevOps Pipeline - CI/CD Implementation",
    content: `CI/CD pipeline implementation: use GitHub Actions for CI/CD, implement automated testing (unit, integration, e2e), use code quality tools (ESLint, Prettier, SonarQube), implement automated security scanning, use Docker for containerization, implement multi-stage builds, use container registry (Docker Hub, AWS ECR), implement automated deployment to staging, use blue-green deployment for production, implement automated rollback on failure, use infrastructure as code (Terraform, CloudFormation), implement monitoring and alerting, use log aggregation (ELK stack, CloudWatch), implement performance testing in pipeline, use feature flags for gradual rollout, implement database migration in pipeline, use secrets management (AWS Secrets Manager, HashiCorp Vault), implement backup automation, use disaster recovery testing.`,
    folderId: "folder-6",
    createdAt: "2024-02-05T10:00:00.000Z",
    updatedAt: "2024-02-05T10:00:00.000Z",
    tags: ["devops", "cicd", "pipeline", "automation"]
  },
  {
    id: "note-18",
    title: "Product Launch Strategy - Go-to-Market Plan",
    content: `Product launch strategy for new feature: soft launch to 10% of users, monitor metrics for 1 week, fix critical issues, expand to 50% of users, continue monitoring, full launch to 100% of users. Marketing activities: blog post announcement, social media campaign, email newsletter, press release, influencer outreach, community engagement, paid advertising campaign. Success metrics: user adoption rate, engagement metrics, retention rate, revenue impact, customer satisfaction scores. Support preparation: update documentation, train support team, prepare FAQ, set up monitoring, create rollback plan. Timeline: 4 weeks from soft launch to full launch. Budget: $50,000 for marketing activities.`,
    folderId: "folder-2",
    createdAt: "2024-02-06T10:00:00.000Z",
    updatedAt: "2024-02-06T10:00:00.000Z",
    tags: ["product", "launch", "strategy", "marketing"]
  },
  {
    id: "note-19",
    title: "Customer Support Process - Best Practices",
    content: `Customer support process: use ticketing system (Zendesk, Intercom), implement SLA for response times (1 hour for critical, 4 hours for normal, 24 hours for low priority), create knowledge base with articles, implement chatbot for common questions, use customer feedback surveys, implement escalation process, track customer satisfaction (CSAT, NPS), use analytics to identify common issues, implement proactive support (reaching out before issues), use customer success team for onboarding, implement self-service options, use social media monitoring, implement feedback loop to product team, track resolution time, implement customer health scoring, use support metrics dashboard, implement training for support team, use CRM for customer history.`,
    folderId: "folder-5",
    createdAt: "2024-02-07T10:00:00.000Z",
    updatedAt: "2024-02-07T10:00:00.000Z",
    tags: ["support", "customer-service", "process"]
  },
  {
    id: "note-20",
    title: "Data Analytics Strategy - Business Intelligence",
    content: `Data analytics strategy: implement data warehouse (Snowflake, BigQuery), use ETL pipelines for data extraction, implement data modeling (star schema, snowflake schema), use BI tools (Tableau, Looker, Power BI), implement real-time analytics, use event tracking (Mixpanel, Amplitude), implement user segmentation, use cohort analysis, implement funnel analysis, track key metrics (DAU, MAU, retention, revenue), use predictive analytics, implement A/B testing framework, use data visualization, implement data governance, use data quality tools, implement data privacy compliance (GDPR, CCPA), use machine learning for insights, implement anomaly detection, use data storytelling for reports.`,
    folderId: "folder-4",
    createdAt: "2024-02-08T10:00:00.000Z",
    updatedAt: "2024-02-08T10:00:00.000Z",
    tags: ["analytics", "data", "bi", "strategy"]
  }
];

const testQueries = [
  {
    name: "Find Query",
    message: "Where did I write about database scaling? Find all mentions and provide specific locations."
  },
  {
    name: "Summarize Query",
    message: "Summarize all my notes about Project X. Include key milestones, team structure, timeline, and current status."
  },
  {
    name: "Cross-Reference Query",
    message: "What are the common themes across my notes in the Ideas folder? List the main topics and how they relate to each other."
  },
  {
    name: "Technical Deep Dive",
    message: "Based on my technical documentation, what are the best practices I've documented for API design, security, and performance optimization? Provide a comprehensive list."
  },
  {
    name: "Project Analysis",
    message: "Analyze my Project X notes. What are the phases, timeline, team composition, budget, and success metrics? Are there any risks or concerns mentioned?"
  },
  {
    name: "Research Summary",
    message: "Summarize my research notes about AI, RAG, and vector embeddings. What are the key concepts, implementation details, and benefits?"
  }
];

async function testQuery(queryIndex: number = 0) {
  if (queryIndex >= testQueries.length) {
    console.log("\n✅ All tests completed!");
    process.exit(0);
  }

  const test = testQueries[queryIndex];
  if (!test) {
    console.log("\n❌ Test not found");
    process.exit(1);
  }

  const ws = new WebSocket("ws://localhost:8000");

  ws.on("open", () => {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`✅ Test ${queryIndex + 1}/${testQueries.length}: ${test.name}`);
    console.log(`${"=".repeat(80)}`);
    console.log("✅ Connected to WebSocket server");
    
    const message = {
      message: test.message,
      apiKey: "",
      model: "gemini-1.5-flash",
      config: {
        temperature: 0.3,
        maxTokens: 4000
      },
      operationType: "query",
      notes: JSON.stringify(sampleNotes),
      folders: JSON.stringify(sampleFolders)
    };

    console.log("\n📤 Sending query message...");
    console.log(`Query: ${test.message}`);
    console.log(`Notes: ${sampleNotes.length}`);
    console.log(`Folders: ${sampleFolders.length}`);
    console.log(`Total content size: ~${JSON.stringify(sampleNotes).length} characters`);
    
    ws.send(JSON.stringify(message));
  });

  ws.on("message", (data) => {
    try {
      const response = JSON.parse(data.toString());
      console.log("\n📥 Response received:");
      console.log("Success:", response.success);
      console.log("Type:", response.type);
      
      if (response.success && response.type === "query") {
        console.log("\n🤖 AI Response:");
        console.log("─".repeat(80));
        console.log(response.response);
        console.log("─".repeat(80));
      } else if (response.error) {
        console.log("\n❌ Error:", response.error);
      } else {
        console.log("\n📋 Full Response:", JSON.stringify(response, null, 2));
      }
    } catch (e) {
      console.log("\n📥 Raw Response:", data.toString());
    }
    
    ws.close();
  });

  ws.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
    process.exit(1);
  });

  ws.on("close", () => {
    console.log("\n🔌 Connection closed");
    setTimeout(() => {
      testQuery(queryIndex + 1);
    }, 2000);
  });
}

console.log("🚀 Starting comprehensive AI Agent tests...");
console.log(`Total notes: ${sampleNotes.length}`);
console.log(`Total folders: ${sampleFolders.length}`);
console.log(`Total test queries: ${testQueries.length}`);
testQuery(0).catch(console.error);
