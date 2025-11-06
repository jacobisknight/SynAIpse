import OpenAI from "openai";
import pLimit from "p-limit";
import pRetry from "p-retry";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// Referenced from javascript_openai_ai_integrations blueprint
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Helper function to check if error is rate limit or quota violation
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

interface SubTask {
  title: string;
  description: string;
  agentType: "voice" | "workflow" | "data";
  priority: number;
}

interface TaskDecomposition {
  subTasks: SubTask[];
  reasoning: string;
}

/**
 * Decompose a complex task into executable sub-tasks using LLM
 */
export async function decomposeTask(
  taskDescription: string,
  parentAgentType: string,
  parentAgentGoals?: string[]
): Promise<TaskDecomposition> {
  const prompt = `You are an AI task decomposition engine for an enterprise agent orchestration system.

Parent Agent Type: ${parentAgentType}
Parent Agent Goals: ${parentAgentGoals?.join(", ") || "N/A"}

Complex Task: "${taskDescription}"

Break this task into 2-5 executable sub-tasks that can be handled by autonomous AI agents.
Each sub-task should be:
1. Specific and actionable
2. Assigned to the most appropriate agent type (voice/workflow/data)
3. Prioritized (1=highest priority)

Return a JSON object with this structure:
{
  "subTasks": [
    {
      "title": "Brief task title",
      "description": "Detailed description",
      "agentType": "voice|workflow|data",
      "priority": 1-5
    }
  ],
  "reasoning": "Brief explanation of decomposition strategy"
}`;

  try {
    const response = await pRetry(
      async () => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_completion_tokens: 8192,
          });
          
          const content = completion.choices[0]?.message?.content || "{}";
          return JSON.parse(content) as TaskDecomposition;
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error; // Rethrow to trigger p-retry
          }
          throw new pRetry.AbortError(error);
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    );

    return response;
  } catch (error) {
    console.error("Task decomposition error:", error);
    // Fallback to simple decomposition
    return {
      subTasks: [
        {
          title: taskDescription,
          description: "Execute the task as specified",
          agentType: parentAgentType as any,
          priority: 1,
        },
      ],
      reasoning: "Fallback to single task due to decomposition error",
    };
  }
}

/**
 * Generate agent persona based on agent type and goals
 */
export async function generateAgentPersona(
  agentType: string,
  goals: string[]
): Promise<string> {
  const prompt = `Generate a professional, concise persona description for a ${agentType} AI agent with these goals:
${goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}

Persona should be 2-3 sentences describing tone, approach, and expertise. Make it suitable for enterprise use.`;

  try {
    const response = await pRetry(
      async () => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
            messages: [{ role: "user", content: prompt }],
            max_completion_tokens: 200,
          });
          
          return completion.choices[0]?.message?.content || "";
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          throw new pRetry.AbortError(error);
        }
      },
      {
        retries: 5,
        minTimeout: 2000,
        maxTimeout: 64000,
        factor: 2,
      }
    );

    return response;
  } catch (error) {
    console.error("Persona generation error:", error);
    return `Professional ${agentType} agent focused on achieving defined objectives with precision and efficiency.`;
  }
}

/**
 * Execute an agent task with LLM
 */
export async function executeAgentTask(
  taskDescription: string,
  agentPersona: string,
  agentType: string
): Promise<string> {
  const prompt = `You are a ${agentType} AI agent with this persona:
"${agentPersona}"

Execute this task: ${taskDescription}

Provide a detailed response describing what you would do to accomplish this task.`;

  try {
    const response = await pRetry(
      async () => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
            messages: [{ role: "user", content: prompt }],
            max_completion_tokens: 8192,
          });
          
          return completion.choices[0]?.message?.content || "Task execution pending";
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          throw new pRetry.AbortError(error);
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    );

    return response;
  } catch (error) {
    console.error("Task execution error:", error);
    return "Task execution failed due to system error. Please retry.";
  }
}
