import { invokeLLM } from "./_core/llm";
import { createHash } from 'crypto';

interface SearchResult {
  title: string;
  url: string;
  urlHash: string;
  source: string;
  excerpt?: string;
  publishedAt?: Date;
}

// Helper function to generate URL hash for duplicate detection
function generateUrlHash(url: string): string {
  return createHash('sha256').update(url).digest('hex').substring(0, 64);
}

interface SurveillanceResult {
  articles: SearchResult[];
  summary: string;
  articlesCount: number;
}

/**
 * Search for articles about ANINF using web search
 * This function uses the LLM to search for relevant articles
 */
export async function searchANINFArticles(): Promise<SearchResult[]> {
  try {
    // Use LLM to search for ANINF articles
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a research assistant specialized in finding news and articles about ANINF (Agence Nationale de l'Informatique et de la Francophonie). 
Your task is to search for recent articles, news, and information about ANINF and return them in JSON format.
Focus on finding articles from reputable news sources, official announcements, and relevant publications.
Return results as a JSON array with the following structure:
[
  {
    "title": "Article title",
    "url": "https://example.com/article",
    "source": "Source name (e.g., 'Le Monde', 'Reuters', 'Official ANINF')",
    "excerpt": "Brief excerpt from the article",
    "publishedAt": "2026-02-27T10:00:00Z"
  }
]`,
        },
        {
          role: "user",
          content: `Search for recent articles and news about ANINF (Agence Nationale de l'Informatique et de la Francophonie). 
Find at least 5-10 relevant articles from the past week. Return only the JSON array, no other text.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "aninf_articles",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Article title" },
                url: { type: "string", description: "Article URL" },
                source: { type: "string", description: "Source name" },
                excerpt: { type: "string", description: "Brief excerpt" },
                publishedAt: { type: "string", description: "Publication date in ISO format" },
              },
              required: ["title", "url", "source"],
              additionalProperties: false,
            },
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      console.warn("[SurveillanceAgent] No content returned from LLM");
      return [];
    }

    const articles = JSON.parse(content) as SearchResult[];
    return articles.map((article) => ({
      ...article,
      urlHash: generateUrlHash(article.url),
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : undefined,
    }));
  } catch (error) {
    console.error("[SurveillanceAgent] Error searching articles:", error);
    throw error;
  }
}

/**
 * Generate weekly summary from articles
 */
export async function generateWeeklySummary(articles: SearchResult[]): Promise<string> {
  if (articles.length === 0) {
    return "Aucun article trouvé cette semaine.";
  }

  try {
    const articlesText = articles
      .map(
        (article, index) => {
          const publishDate = article.publishedAt 
            ? new Date(article.publishedAt).toLocaleDateString('fr-FR')
            : 'Date inconnue';
          return `${index + 1}. **${article.title}** (Source: ${article.source}, Publié: ${publishDate})\n${article.excerpt || "Pas de résumé disponible"}`;
        }
      )
      .join("\n\n");

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional news summarizer specialized in ANINF (Agence Nationale de l'Informatique et de la Francophonie).
Your task is to create a comprehensive weekly summary of the provided articles about ANINF.
Write in French, be concise but informative, and highlight the most important developments of the week.
Structure your summary with clear sections and bullet points where appropriate.
Include key themes, important announcements, and notable trends.`,
        },
        {
          role: "user",
          content: `Please summarize these ${articles.length} articles from this week about ANINF:\n\n${articlesText}`,
        },
      ],
    });

    const summary = response.choices[0]?.message.content;
    if (!summary || typeof summary !== "string") {
      console.warn("[SurveillanceAgent] No summary returned from LLM");
      return "Impossible de générer un résumé.";
    }

    return summary;
  } catch (error) {
    console.error("[SurveillanceAgent] Error generating weekly summary:", error);
    throw error;
  }
}

/**
 * Filter articles by keywords
 * Returns articles that contain at least one of the keywords in title or excerpt
 */
export function filterArticlesByKeywords(
  articles: SearchResult[],
  keywords: string[]
): SearchResult[] {
  if (keywords.length === 0) {
    return articles; // If no keywords, return all articles
  }

  return articles.filter((article) => {
    const searchText = `${article.title} ${article.excerpt || ""}`.toLowerCase();
    return keywords.some((keyword) => searchText.includes(keyword.toLowerCase()));
  });
}

/**
 * Summarize articles about ANINF using LLM
 */
export async function summarizeArticles(articles: SearchResult[]): Promise<string> {
  if (articles.length === 0) {
    return "Aucun article trouvé lors de cette veille.";
  }

  try {
    const articlesText = articles
      .map(
        (article, index) =>
          `${index + 1}. **${article.title}** (Source: ${article.source})\n${article.excerpt || "Pas de résumé disponible"}`
      )
      .join("\n\n");

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional news summarizer specialized in ANINF (Agence Nationale de l'Informatique et de la Francophonie).
Your task is to create a comprehensive summary of the provided articles about ANINF.
Write in French, be concise but informative, and highlight the most important points.
Structure your summary with clear sections and bullet points where appropriate.`,
        },
        {
          role: "user",
          content: `Please summarize the following articles about ANINF:\n\n${articlesText}\n\nCreate a comprehensive summary highlighting the key information and trends.`,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    const summary = typeof content === "string" ? content : "";
    return summary;
  } catch (error) {
    console.error("[SurveillanceAgent] Error summarizing articles:", error);
    throw error;
  }
}

/**
 * Execute a complete surveillance operation
 */
export async function executeSurveillance(): Promise<SurveillanceResult> {
  try {
    console.log("[SurveillanceAgent] Starting surveillance...");

    // Search for articles
    const articles = await searchANINFArticles();
    console.log(`[SurveillanceAgent] Found ${articles.length} articles`);

    // Summarize articles
    const summary = await summarizeArticles(articles);
    console.log("[SurveillanceAgent] Generated summary");

    return {
      articles,
      summary,
      articlesCount: articles.length,
    };
  } catch (error) {
    console.error("[SurveillanceAgent] Surveillance execution failed:", error);
    throw error;
  }
}
