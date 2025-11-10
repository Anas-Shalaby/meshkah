const express = require("express");
const router = express.Router();
const axios = require("axios");
const { authMiddleware } = require("../middleware/authMiddleware");
const redisClient = require("../utils/redisClient");

// Define available models and their configurations
const AI_MODELS = [
  {
    name: "gemini",
    provider: "google",
    model: "gemini-2.0-flash",
    baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    dailyLimit: 10,
  },

  {
    name: "groq",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    baseUrl: `https://api.groq.com/openai/v1/chat/completions`,
    apiKey: process.env.GROQ_API_KEY,
    dailyLimit: 10,
  },

  {
    name: "openrouter",
    provider: "openrouter",
    model: "deepseek/deepseek-chat:free",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: process.env.OPENROUTER_API_KEY,
    dailyLimit: 10,
  },
];
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff delays in ms
const ERROR_TYPES = {
  RATE_LIMIT: "RATE_LIMIT",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  TEMPORARY_ERROR: "TEMPORARY_ERROR",
  PERMANENT_ERROR: "PERMANENT_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
};

// Track usage for each model
const modelUsage = new Map();
AI_MODELS.forEach((model) => {
  modelUsage.set(model.name, {
    count: 0,
    lastReset: Date.now(),
    errors: 0,
    lastError: null,
  });
});

// Reset usage counters daily
setInterval(() => {
  const now = Date.now();
  modelUsage.forEach((usage, modelName) => {
    if (now - usage.lastReset >= 24 * 60 * 60 * 1000) {
      usage.count = 0;
      usage.lastReset = now;
      usage.errors = 0;
      usage.lastError = null;
    }
  });
}, 60 * 60 * 1000);

const getAvailableModel = () => {
  const now = Date.now();

  // Try models in specific order: Gemini -> Hugging Face -> OpenRouter
  for (const model of AI_MODELS) {
    const usage = modelUsage.get(model.name);
    const isAvailable =
      usage &&
      (now - usage.lastReset >= 24 * 60 * 60 * 1000 ||
        usage.count < model.dailyLimit) &&
      usage.errors < 3;

    if (isAvailable) {
      return model;
    }
  }

  return null;
};

// Add this new function for error classification
const classifyError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    const errorMessage =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
        ? data.message
        : JSON.stringify(data?.error || data?.message || "");

    if (status === 429 || errorMessage.toLowerCase().includes("rate limit")) {
      return ERROR_TYPES.RATE_LIMIT;
    }
    if (status === 403 || errorMessage.toLowerCase().includes("quota")) {
      return ERROR_TYPES.QUOTA_EXCEEDED;
    }
    if (status >= 500) {
      return ERROR_TYPES.TEMPORARY_ERROR;
    }
    if (status >= 400) {
      return ERROR_TYPES.PERMANENT_ERROR;
    }
  }
  if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
    return ERROR_TYPES.NETWORK_ERROR;
  }
  return ERROR_TYPES.TEMPORARY_ERROR;
};

// Enhanced system prompt for comprehensive Hadith analysis
const enhancedSystemPrompt = `أنت مشكاة، مساعد ذكي متخصص في شرح الأحاديث النبوية.

مهمتك: اشرح الحديث في ٣-٤ أسطر فقط:
- شرح مختصر للحديث
- فائدة عملية واحدة
- تطبيق واقعي واحد

يجب أن تكون إجاباتك:
- مختصرة جداً (٣-٤ أسطر فقط)
- باللغة العربية الفصحى فقط
- دقيقة ومفيدة
- لا تذكر التقنية المستخدمة
- لا تستخدم كلمات أجنبية

لا تزيد عن ٤ أسطر تحت أي ظرف.`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithBackoff = async (
  fn,
  retries = MAX_RETRIES,
  model = "gemini-2.0-flash"
) => {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorType = classifyError(error);

      // Log the error with context
      console.error(`Attempt ${i + 1} failed:`, {
        errorType,
        status: error.response?.status,
        message: error.message,
        timestamp: new Date().toISOString(),
      });

      // Handle different error types
      switch (errorType) {
        case ERROR_TYPES.RATE_LIMIT:
          // For rate limits, wait longer
          await sleep(RETRY_DELAYS[i] * 2);
          break;
        case ERROR_TYPES.QUOTA_EXCEEDED:
          // For quota exceeded, try next model immediately
          const currentIndex = AI_MODELS.findIndex(
            (m) => m.name === model.name
          );
          if (currentIndex < AI_MODELS.length - 1) {
            const nextModel = AI_MODELS[currentIndex + 1];
            console.log(
              `Switching to next model due to quota exceeded: ${nextModel.name}`
            );
            return makeApiRequest(nextModel, [
              {
                role: "system",
                content: `أنت مشكاة، مساعد ذكي متخصص في شرح وتفسير الأحاديث النبوية. مهمتك:
        1. شرح معنى الحديث بشكل واضح ومبسط
        2. توضيح المفردات الصعبة
        3. استخراج الدروس والعبر
        4. ربط الحديث بالواقع المعاصر
        5. الإجابة على أسئلة المستخدم بشكل دقيق ومفيد
        
        يجب أن تكون إجاباتك:
        - دقيقة ومتوافقة مع فهم العلماء
        - منظمة ومرتبة
        - سهلة الفهم
        - مفيدة وعملية
        - باللغة العربية الفصحى المعاصرة فقط
        - تتضمن المراجع الإسلامية المعتبرة (مثل: صحيح البخاري، صحيح مسلم، سنن أبي داود، سنن الترمذي، سنن النسائي، سنن ابن ماجه، موطأ مالك، مسند أحمد، وغيرها من الكتب المعتبرة)
        - لا تذكر أبداً اسم النموذج أو التقنية المستخدمة في الإجابة
        - إذا سُئلت عن التقنية المستخدمة، قل أنك مساعد ذكي متخصص في الأحاديث النبوية
        - لا تستخدم أي لغة غير العربية في ردودك
        - تجنب استخدام الكلمات الأجنبية أو المختلطة
        - استخدم المصطلحات الإسلامية العربية المناسبة
        `,
              },
              "ازيك",
            ]);
          }
          throw error;
        case ERROR_TYPES.PERMANENT_ERROR:
          // For permanent errors, don't retry
          throw error;
        default:
          // For temporary errors, use normal backoff
          await sleep(RETRY_DELAYS[i]);
      }
    }
  }

  throw lastError;
};

// Replace the existing makeApiRequest function with this enhanced version
const makeApiRequest = async (model, messages) => {
  const makeRequest = async () => {
    try {
      let response;
      if (model.provider === "google") {
        response = await axios.post(`${model.baseUrl}`, {
          contents: messages.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          })),
        });
        return response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else if (model.provider === "hf-inference") {
        response = await axios.post(
          model.baseUrl,
          {
            messages: messages?.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            model: model.model,
            parameters: {
              temperature: 0.3,
              max_new_tokens: 2000,
              top_p: 0.9,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${model.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        return (
          response?.data?.generated_text ||
          response?.data?.choices?.[0]?.message?.content ||
          ""
        );
      } else {
        response = await axios.post(
          model.baseUrl,
          {
            messages: messages?.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            model: model.model,
          },
          {
            headers: {
              Authorization: `Bearer ${model.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        return response?.data?.choices?.[0]?.message?.content || "";
      }
    } catch (error) {
      const errorType = classifyError(error);

      // Update model usage statistics
      const usage = modelUsage.get(model.name);
      usage.errors++;
      usage.lastError = {
        type: errorType,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        timestamp: new Date().toISOString(),
      };

      console.log(
        `Error type: ${errorType}, Status: ${
          error.response?.status
        }, Data: ${JSON.stringify(error.response?.data)}, Message: ${
          error.message
        }`
      );

      // For quota exceeded or permanent errors, try next model
      if (
        errorType === ERROR_TYPES.QUOTA_EXCEEDED ||
        errorType === ERROR_TYPES.PERMANENT_ERROR
      ) {
        const currentIndex = AI_MODELS.findIndex((m) => m.name === model.name);
        if (currentIndex < AI_MODELS.length - 1) {
          const nextModel = AI_MODELS[currentIndex + 1];
          console.log(`Switching to next model: ${nextModel.name}`);
          return makeApiRequest(nextModel, messages);
        }
      }

      throw error;
    }
  };

  return retryWithBackoff(makeRequest);
};
const rateLimit = async (req, res, next) => {
  try {
    const key = req.user ? req.user.id : req.ip;

    const windowMs = 24 * 60 * 60 * 1000; // 24 hours
    const max = 10; // 10 questions per day
    if (req.user && req.user.id === 5) {
      await redisClient.incrementWithExpiry(
        `rate-limit:${key}`,
        Math.floor(windowMs / 1000)
      );
      return next();
    }

    // Get current count and TTL
    const { value: count, ttl } = await redisClient.getWithTTL(
      `rate-limit:${key}`
    );
    const currentCount = parseInt(count) || 0;

    if (currentCount >= max) {
      const resetTime = new Date(Date.now() + ttl * 1000);
      return res.status(429).json({
        error: `عذراً، لقد استنفذت الحد المسموح به من الأسئلة اليوم (${max} أسئلة). يرجى المحاولة مرة أخرى بعد ${resetTime.toLocaleTimeString()}`,
        resetTime,
      });
    }

    // Increment counter with expiry
    await redisClient.incrementWithExpiry(
      `rate-limit:${key}`,
      Math.floor(windowMs / 1000)
    );
    next();
  } catch (error) {
    console.error("Rate limit error:", error);
    next(error);
  }
};

// Helper function to check for greetings
const isGreeting = (message) => {
  const greetings = [
    "اهلا",
    "السلام عليكم",
    "مرحبا",
    "اهلا وسهلا",
    "السلام عليكم ورحمة الله",
    "السلام عليكم ورحمة الله وبركاته",
  ];
  return greetings.some((greeting) =>
    message.toLowerCase().includes(greeting.toLowerCase())
  );
};

// Helper function to get greeting response
const getGreetingResponse = () => {
  const responses = [
    "وعليكم السلام ورحمة الله وبركاته، كيف يمكنني مساعدتك في فهم وتفسير الأحاديث النبوية الشريفة؟",
    "السلام عليكم ورحمة الله وبركاته، أنا مشكاة مساعدك في فهم الأحاديث النبوية. كيف يمكنني خدمتك اليوم؟",
    "وعليكم السلام ورحمة الله وبركاته، أنا هنا لمساعدتك في فهم وتفسير الأحاديث النبوية. ما هو سؤالك؟",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

// Helper function to analyze conversation context
const analyzeConversationContext = (messages) => {
  if (messages.length <= 1) return "";

  // Get the last few messages for context
  const recentMessages = messages.slice(-6); // Last 6 messages for better context
  let contextSummary = "";

  // Analyze the conversation flow
  for (let i = 0; i < recentMessages.length - 1; i += 2) {
    const userMessage = recentMessages[i];
    const aiResponse = recentMessages[i + 1];

    if (userMessage && aiResponse) {
      contextSummary += `المستخدم: ${userMessage.content}\nالمساعد: ${aiResponse.content}\n\n`;
    }
  }

  return contextSummary ? `السياق السابق للمحادثة:\n${contextSummary}` : "";
};

// Helper function to extract the main topic from previous conversation
const extractMainTopic = (messages) => {
  if (messages.length <= 1) return "";

  const lastUserMessage = messages[messages.length - 1];
  const previousUserMessage = messages[messages.length - 3];

  // If current message is a short follow-up, extract topic from previous question
  if (lastUserMessage.content.trim().length <= 10 && previousUserMessage) {
    return `الموضوع الأساسي من السؤال السابق: ${previousUserMessage.content}`;
  }

  return "";
};

// Helper function to extract key topics from conversation
const extractConversationTopics = (messages) => {
  if (messages.length <= 1) return "";

  const topics = [];
  const recentMessages = messages.slice(-4);

  // Look for key Islamic terms and concepts
  const islamicTerms = [
    "الصلاة",
    "الزكاة",
    "الصوم",
    "الحج",
    "الوضوء",
    "الطهارة",
    "النية",
    "الخشوع",
    "الصحابة",
    "التابعين",
    "التابعين",
    "الخلفاء",
    "الرسول",
    "النبي",
    "الوحي",
    "القرآن",
    "السنة",
    "الحديث",
    "الرواية",
    "الإسناد",
    "المتن",
    "الدرجة",
    "العبادة",
    "الطاعة",
    "البر",
    "التقوى",
    "الإيمان",
    "الإسلام",
    "الإحسان",
    "الحديث",
    "الرواية",
    "الصحابي",
    "الراوي",
    "الإسناد",
    "المتن",
    "الدرجة",
    "صحيح",
    "حسن",
    "ضعيف",
    "موضوع",
    "مرفوع",
    "موقوف",
    "مقطوع",
  ];

  recentMessages.forEach((msg) => {
    if (msg.role === "user") {
      islamicTerms.forEach((term) => {
        if (msg.content.includes(term) && !topics.includes(term)) {
          topics.push(term);
        }
      });
    }
  });

  return topics.length > 0 ? `المواضيع المطروحة: ${topics.join(", ")}` : "";
};

// Helper function to detect conversation flow and relationships
const analyzeConversationFlow = (messages) => {
  if (messages.length <= 1) return "";

  const lastUserMessage = messages[messages.length - 1];
  const previousMessages = messages.slice(-6, -1);

  // Look for question patterns
  const questionPatterns = [
    "ما هو",
    "ما هي",
    "من هو",
    "من هي",
    "متى",
    "أين",
    "كيف",
    "لماذا",
    "ماذا",
    "هل",
    "أليس",
    "أم",
    "أو",
    "ثم",
    "بعد",
    "قبل",
    "خلال",
    "في",
    "عند",
  ];

  const hasQuestionPattern = questionPatterns.some((pattern) =>
    lastUserMessage.content.includes(pattern)
  );

  if (hasQuestionPattern) {
    return "هذا سؤال يحتاج إلى فهم السياق السابق للإجابة بدقة.";
  }

  return "";
};

// Helper function to detect if current question is a follow-up
const isFollowUpQuestion = (messages) => {
  if (messages.length < 3) return false;

  const lastUserMessage = messages[messages.length - 1];
  const previousUserMessage = messages[messages.length - 3];
  const previousAIMessage = messages[messages.length - 2];

  // Check for follow-up indicators
  const followUpIndicators = [
    "ماذا عن",
    "وكيف",
    "وما",
    "وأين",
    "ومتى",
    "ولماذا",
    "وكذلك",
    "أيضاً",
    "بالإضافة",
    "علاوة على",
    "كذلك",
    "مثلاً",
    "مثل",
    "هذا",
    "ذلك",
    "هذه",
    "تلك",
    "هؤلاء",
    "أولئك",
    "و",
    "أو",
    "ثم",
  ];

  // Check for pronouns that refer to previous context
  const contextPronouns = ["هو", "هي", "هم", "هن", "هذا", "ذلك", "هذه", "تلك"];

  // Check for short follow-up questions
  const shortFollowUpQuestions = [
    "كيف",
    "لماذا",
    "متى",
    "أين",
    "ماذا",
    "من",
    "ما",
    "هل",
    "أليس",
  ];

  const hasFollowUpIndicator = followUpIndicators.some((indicator) =>
    lastUserMessage.content.includes(indicator)
  );

  const hasContextPronoun = contextPronouns.some((pronoun) =>
    lastUserMessage.content.includes(pronoun)
  );

  // Check if it's a short follow-up question (like "كيف" alone)
  const isShortFollowUp = shortFollowUpQuestions.some(
    (question) =>
      lastUserMessage.content.trim().toLowerCase() === question.toLowerCase()
  );

  // Check if the previous AI response was positive (like "نعم")
  const previousResponseWasPositive =
    previousAIMessage &&
    (previousAIMessage.content.includes("نعم") ||
      previousAIMessage.content.includes("بلى") ||
      previousAIMessage.content.includes("أجل") ||
      previousAIMessage.content.includes("صحيح") ||
      previousAIMessage.content.includes("نعم،") ||
      previousAIMessage.content.includes("بلى،"));

  return (
    hasFollowUpIndicator ||
    hasContextPronoun ||
    (isShortFollowUp && previousResponseWasPositive)
  );
};

// AI proxy endpoint with rate limiting
router.post("/chat", authMiddleware, rateLimit, async (req, res) => {
  try {
    const { messages, hadith } = req.body;

    // Check if the last message is a greeting
    const lastMessage = messages[messages.length - 1];
    if (isGreeting(lastMessage.content)) {
      return res.json({ response: getGreetingResponse() });
    }

    // Get available model
    const model = getAvailableModel();
    if (!model) {
      return res.status(429).json({
        error: "عذراً، لقد استنفذت الحد اليومي. يرجى المحاولة مرة أخرى غداً.",
      });
    }

    // Analyze conversation context
    const contextSummary = analyzeConversationContext(messages);
    const conversationTopics = extractConversationTopics(messages);
    const conversationFlow = analyzeConversationFlow(messages);
    const mainTopic = extractMainTopic(messages);
    const isFollowUp = isFollowUpQuestion(messages);

    // Enhanced system message with context awareness
    const systemMessage = {
      role: "system",
      content: `أنت مشكاة، مساعد ذكي متخصص في شرح وتفسير الأحاديث النبوية.

${contextSummary}

${conversationTopics}

${conversationFlow}

${mainTopic}

${
  isFollowUp
    ? `
تنبيه مهم: هذا سؤال متابعة مرتبط بالسياق السابق. يجب أن تفهم تماماً ما تم مناقشته سابقاً وتجيب بناءً على السياق الكامل للمحادثة. لا تعامل هذا السؤال كسؤال منفصل.

`
    : ""
}

مهمتك:
1. شرح معنى الحديث بشكل واضح ومبسط
2. توضيح المفردات الصعبة
3. استخراج الدروس والعبر
4. ربط الحديث بالواقع المعاصر
5. فهم السياق الكامل للمحادثة والإجابة بناءً عليه

يجب أن تكون إجاباتك:
- دقيقة ومتوافقة مع فهم العلماء
- منظمة ومرتبة
- سهلة الفهم
- مفيدة وعملية
- باللغة العربية الفصحى المعاصرة فقط
- تتضمن المراجع الإسلامية المعتبرة (مثل: صحيح البخاري، صحيح مسلم، سنن أبي داود، سنن الترمذي، سنن النسائي، سنن ابن ماجه، موطأ مالك، مسند أحمد، وغيرها من الكتب المعتبرة)
- لا تذكر أبداً اسم النموذج أو التقنية المستخدمة في الإجابة
- إذا سُئلت عن التقنية المستخدمة، قل أنك مساعد ذكي متخصص في الأحاديث النبوية
- لا تستخدم أي لغة غير العربية في ردودك
- تجنب استخدام الكلمات الأجنبية أو المختلطة
- إجابات مختصرة وواضحة
- استخدم المصطلحات الإسلامية العربية المناسبة
- ${isFollowUp ? "تأكد من فهم السياق السابق والإجابة بناءً عليه" : ""}

معلومات الحديث:
${hadith?.hadeeth ? `الحديث: ${hadith.hadeeth}` : ""}
${hadith?.attribution ? `الراوي: ${hadith.attribution}` : ""}
${hadith?.source ? `المصدر: ${hadith.source}` : ""}
${hadith?.grade_ar ? `الدرجة: ${hadith.grade_ar}` : ""}
${hadith?.takhrij_ar ? `التخريج: ${hadith.takhrij_ar}` : ""}`,
    };

    const fullMessages = [systemMessage, ...messages];

    // Make API request
    const response = await makeApiRequest(model, fullMessages);

    // Update usage counter
    const usage = modelUsage.get(model.name);
    usage.count++;

    // Clean response to remove any model-specific information and ensure Arabic only
    const cleanedResponse = response
      .replace(/\[.*?\]|\(.*?\)/g, "")
      .replace(
        /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s.,،:؛؟!()]/g,
        ""
      )
      .trim();

    res.json({ response: cleanedResponse });
  } catch (error) {
    console.error("AI proxy error:", error);
    res.status(error.response?.status || 500).json({
      error: error.message || "حدث خطأ أثناء معالجة طلبك",
    });
  }
});

router.post("/ai-chat", async (req, res) => {
  try {
    const { messages, hadith } = req.body;

    // Check if the last message is a greeting
    const lastMessage = messages[messages.length - 1];
    if (isGreeting(lastMessage.content)) {
      return res.json({ response: getGreetingResponse() });
    }

    // Get available model
    const model = getAvailableModel();
    if (!model) {
      return res.status(429).json({
        error: "عذراً، لقد استنفذت الحد اليومي. يرجى المحاولة مرة أخرى غداً.",
      });
    }

    // Analyze conversation context
    const contextSummary = analyzeConversationContext(messages);
    const conversationTopics = extractConversationTopics(messages);
    const conversationFlow = analyzeConversationFlow(messages);
    const mainTopic = extractMainTopic(messages);
    const isFollowUp = isFollowUpQuestion(messages);

    // Enhanced system message with context awareness
    const systemMessage = {
      role: "system",
      content: `أنت مشكاة، مساعد ذكي متخصص في شرح وتفسير الأحاديث النبوية.

${contextSummary}

${conversationTopics}

${conversationFlow}

${mainTopic}

${
  isFollowUp
    ? `
تنبيه مهم: هذا سؤال متابعة مرتبط بالسياق السابق. يجب أن تفهم تماماً ما تم مناقشته سابقاً وتجيب بناءً على السياق الكامل للمحادثة. لا تعامل هذا السؤال كسؤال منفصل.

`
    : ""
}

مهمتك:
1. شرح معنى الحديث بشكل واضح ومبسط
2. توضيح المفردات الصعبة
3. استخراج الدروس والعبر
4. ربط الحديث بالواقع المعاصر
5. فهم السياق الكامل للمحادثة والإجابة بناءً عليه

يجب أن تكون إجاباتك:
- دقيقة ومتوافقة مع فهم العلماء
- منظمة ومرتبة
- سهلة الفهم
- مفيدة وعملية
- باللغة العربية الفصحى المعاصرة فقط
- تتضمن المراجع الإسلامية المعتبرة (مثل: صحيح البخاري، صحيح مسلم، سنن أبي داود، سنن الترمذي، سنن النسائي، سنن ابن ماجه، موطأ مالك، مسند أحمد، وغيرها من الكتب المعتبرة)
- لا تذكر أبداً اسم النموذج أو التقنية المستخدمة في الإجابة
- إذا سُئلت عن التقنية المستخدمة، قل أنك مساعد ذكي متخصص في الأحاديث النبوية
- لا تستخدم أي لغة غير العربية في ردودك
- تجنب استخدام الكلمات الأجنبية أو المختلطة
- إجابات مختصرة وواضحة
- استخدم المصطلحات الإسلامية العربية المناسبة
- ${isFollowUp ? "تأكد من فهم السياق السابق والإجابة بناءً عليه" : ""}

معلومات الحديث:
${hadith?.hadeeth ? `الحديث: ${hadith.hadeeth}` : ""}
${hadith?.attribution ? `الراوي: ${hadith.attribution}` : ""}
${hadith?.source ? `المصدر: ${hadith.source}` : ""}
${hadith?.grade_ar ? `الدرجة: ${hadith.grade_ar}` : ""}
${hadith?.takhrij_ar ? `التخريج: ${hadith.takhrij_ar}` : ""}`,
    };

    const fullMessages = [systemMessage, ...messages];

    // Make API request
    const response = await makeApiRequest(model, fullMessages);

    // Update usage counter
    const usage = modelUsage.get(model.name);
    usage.count++;

    // Clean response to remove any model-specific information and ensure Arabic only
    const cleanedResponse = response
      .replace(/\[.*?\]|\(.*?\)/g, "")
      .replace(
        /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s.,،:؛؟!()]/g,
        ""
      )
      .trim();

    res.json({ response: cleanedResponse });
  } catch (error) {
    console.error("AI proxy error:", error);
    res.status(error.response?.status || 500).json({
      error: error.message || "حدث خطأ أثناء معالجة طلبك",
    });
  }
});

// Get remaining questions endpoint
router.get("/remaining-questions", authMiddleware, async (req, res) => {
  try {
    const key = req.user.id;

    // استثناء للمستخدم رقم 5 - عدد غير محدود من الأسئلة
    if (req.user.id === 5) {
      return res.json({
        remaining: -1, // -1 يعني عدد غير محدود
        resetTime: null,
        max: -1,
        currentCount: 0,
        unlimited: true,
      });
    }

    const max = 10; // 15 questions per day

    // Get the current count and TTL from Redis
    const { value: count, ttl } = await redisClient.getWithTTL(
      `rate-limit:${key}`
    );
    const currentCount = parseInt(count) || 0;
    const remaining = Math.max(0, max - currentCount);
    const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : null;

    res.json({
      remaining,
      resetTime,
      max,
      currentCount,
    });
  } catch (error) {
    console.error("Error getting remaining questions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/analyze-hadith", authMiddleware, async (req, res) => {
  try {
    const { hadith, analysisType } = req.body;
    if (!hadith) {
      return res.status(400).json({
        error: "يرجى تقديم الحديث المراد تحليله",
      });
    }

    // Get available model
    const model = getAvailableModel();
    if (!model) {
      return res.status(429).json({
        error: "عذراً، لقد استنفذت الحد اليومي. يرجى المحاولة مرة أخرى غداً.",
      });
    }

    // Prepare messages based on analysis type
    const messages = [
      {
        role: "system",
        content: enhancedSystemPrompt,
      },
      {
        role: "user",
        content: `الحديث المراد تحليله:
${hadith.hadeeth ? `الحديث: ${hadith.hadeeth}` : ""}
${hadith.attribution ? `الراوي: ${hadith.attribution}` : ""}
${hadith.grade ? `الدرجة: ${hadith.grade}` : ""}
${hadith.reference ? `التخريج: ${hadith.reference}` : ""}

نوع التحليل المطلوب: ${analysisType || "تحليل شامل"}`,
      },
    ];

    // Make API request
    const response = await makeApiRequest(
      {
        name: "gemini",
        provider: "google",
        model: "gemini-2.0-flash",
        baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        dailyLimit: 10,
      },
      messages
    );

    // Update usage counter
    const usage = modelUsage.get(model.name);
    usage.count++;

    // Clean response
    const cleanedResponse = response
      .replace(/\[.*?\]|\(.*?\)/g, "")
      .replace(
        /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s.,،:؛؟!()]/g,
        ""
      )
      .trim();

    // Structure the response
    const analysisResult = {
      hadith: hadith.hadeeth,
      attribution: hadith.attribution,
      source: hadith.source,
      grade: hadith.grade_ar,
      analysis: cleanedResponse,
      timestamp: new Date().toISOString(),
    };

    res.json(analysisResult);
  } catch (error) {
    console.error("Hadith analysis error:", error);
    res.status(error.response?.status || 500).json({
      error: error.message || "حدث خطأ أثناء تحليل الحديث",
    });
  }
});

module.exports = router;
