import { streamText } from 'ai'
import pLimit from 'p-limit'
import { z } from 'zod'
import { parseStreamingJson, type DeepPartial } from '~/utils/json'

import { trimPrompt } from './ai/providers'
import { languagePrompt, systemPrompt } from './prompt'
import zodToJsonSchema from 'zod-to-json-schema'
import { useAiModel } from '~/composables/useAiProvider'
import type { Locale } from '~/components/LangSwitcher.vue'
import { useMem0Client } from '~/lib/mem0'

export type ResearchResult = {
  learnings: string[]
  visitedUrls: string[]
}

export interface WriteFinalReportParams {
  prompt: string
  learnings: string[]
  language: string
}
// useRuntimeConfig()
// Used for streaming response
export type SearchQuery = z.infer<typeof searchQueriesTypeSchema>['queries'][0]
export type PartialSearchQuery = DeepPartial<SearchQuery>
export type ProcessedSearchResult = z.infer<typeof searchResultTypeSchema>
export type PartialProcessedSearchResult = DeepPartial<ProcessedSearchResult>

export type ResearchStep =
  | {
      type: 'generating_query'
      result: PartialSearchQuery
      nodeId: string
      parentNodeId?: string
    }
  | { type: 'generating_query_reasoning'; delta: string; nodeId: string }
  | {
      type: 'generated_query'
      query: string
      result: PartialSearchQuery
      nodeId: string
    }
  | { type: 'searching'; query: string; nodeId: string }
  | { type: 'search_complete'; results: WebSearchResult[]; nodeId: string }
  | {
      type: 'processing_serach_result'
      query: string
      result: PartialProcessedSearchResult
      nodeId: string
    }
  | {
      type: 'processing_serach_result_reasoning'
      delta: string
      nodeId: string
    }
  | {
      type: 'node_complete'
      result?: ProcessedSearchResult
      nodeId: string
    }
  | { type: 'error'; message: string; nodeId: string }
  | { type: 'complete'; learnings: string[]; visitedUrls: string[] }

/**
 * Schema for {@link generateSearchQueries} without dynamic descriptions
 */
export const searchQueriesTypeSchema = z.object({
  queries: z.array(
    z.object({
      query: z.string(),
      researchGoal: z.string(),
    }),
  ),
})

// take en user query, return a list of SERP queries
export function generateSearchQueries({
  query,
  numQueries = 3,
  learnings,
  language,
  searchLanguage,
  memories,
}: {
  query: string
  language: string
  numQueries?: number
  // optional, if provided, the research will continue from the last learning
  learnings?: string[]
  /** Force the LLM to generate serp queries in a certain language */
  searchLanguage?: string
  memories?: string[]
}) {
  const schema = z.object({
    queries: z
      .array(
        z
          .object({
            query: z.string().describe('The SERP query.'),
            researchGoal: z
              .string()
              .describe(
                'First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions.',
              ),
          })
          .required({ query: true, researchGoal: true }),
      )
      .describe(`List of SERP queries, max of ${numQueries}`),
  })
  const jsonSchema = JSON.stringify(zodToJsonSchema(schema))
  let lp = languagePrompt(language)

  if (searchLanguage && searchLanguage !== language) {
    lp += ` Use ${searchLanguage} for the SERP queries.`
  }
  const prompt = [
    `Given the following prompt from the user, generate a list of SERP queries to research the topic. Return a maximum of ${numQueries} queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other: <prompt>${query}</prompt>\n\n`,
    learnings
      ? `Here are some learnings from previous research, use them to generate more specific queries: ${learnings.join(
          '\n',
        )}`
      : '',
    memories
      ? `Here are some user preferences from previous research, strictly follow them to generate more specific queries: ${memories.join(
          '\n',
        )}`
      : '',
    `You MUST respond in JSON matching this JSON schema: ${jsonSchema}`,
    lp,
  ].join('\n\n')
  return streamText({
    model: useAiModel(),
    system: systemPrompt(),
    prompt,
    onError({ error }) {
      throw error
    },
  })
}

export const searchResultTypeSchema = z.object({
  learnings: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
})
function processSearchResult({
  query,
  results,
  numLearnings = 3,
  numFollowUpQuestions = 3,
  language,
  memories,
}: {
  query: string
  results: WebSearchResult[]
  language: string
  numLearnings?: number
  numFollowUpQuestions?: number
  memories?: string[]
}) {
  const schema = z.object({
    learnings: z
      .array(z.string())
      .describe(`List of learnings, max of ${numLearnings}`),
    followUpQuestions: z
      .array(z.string())
      .describe(
        `List of follow-up questions to research the topic further, max of ${numFollowUpQuestions}`,
      ),
  })
  const jsonSchema = JSON.stringify(zodToJsonSchema(schema))
  const contents = results.map((item) => trimPrompt(item.content, 25_000))
  const prompt = [
    `Given the following contents from a SERP search for the query <query>${query}</query>, generate a list of learnings from the contents. Return a maximum of ${numLearnings} learnings, but feel free to return less if the contents are clear. Strictly follow the user preferences: ${memories?.join(
      '\n',
    )} to generate the learnings. Make sure each learning is unique and not similar to each other. The learnings should be concise and to the point, as detailed and information dense as possible. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any exact metrics, numbers, or dates. The learnings will be used to research the topic further.`,
    `<contents>${contents
      .map((content) => `<content>\n${content}\n</content>`)
      .join('\n')}</contents>`,
    `You MUST respond in JSON matching this JSON schema: ${jsonSchema}`,
    languagePrompt(language),
  ].join('\n\n')

  return streamText({
    model: useAiModel(),
    system: systemPrompt(),
    prompt,
    onError({ error }) {
      throw error
    },
  })
}

export function writeFinalReport({
  prompt,
  learnings,
  language,
  memories,
}: WriteFinalReportParams & { memories?: string[] }) {
  const learningsString = trimPrompt(
    learnings
      .map((learning) => `<learning>\n${learning}\n</learning>`)
      .join('\n'),
    150_000,
  )
  const _prompt = [
    `Given the following prompt from the user, write a final report on the topic using the learnings from research. Make it as as detailed as possible, aim for 3 or more pages, include ALL the learnings from research:`,
    `<prompt>${prompt}</prompt>`,
    `Here are all the learnings from previous research:`,
    `<learnings>\n${learningsString}\n</learnings>`,
    `Here are all the user preferences:`,
    `<memories>\n${memories?.join('\n')}\n</memories>`,
    `Write the report using Markdown.`,
    languagePrompt(language),
    `## Deep Research Report`,
  ].join('\n\n')

  return streamText({
    model: useAiModel(),
    system: systemPrompt(),
    prompt: _prompt,
    onError({ error }) {
      throw error
    },
  })
}

function childNodeId(parentNodeId: string, currentIndex: number) {
  return `${parentNodeId}-${currentIndex}`
}

export async function deepResearch({
  query,
  breadth,
  maxDepth,
  languageCode,
  learnings = [],
  visitedUrls = [],
  onProgress,
  currentDepth = 1,
  nodeId = '0',
  searchLanguage,
}: {
  query: string
  breadth: number
  maxDepth: number
  languageCode: Locale
  learnings?: string[]
  visitedUrls?: string[]
  onProgress: (step: ResearchStep) => void
  currentDepth?: number
  nodeId?: string
  searchLanguage?: string
  memories?: string[]
}): Promise<ResearchResult> {
  const { t } = useNuxtApp().$i18n
  const language = t('language', {}, { locale: languageCode })
  const globalLimit = usePLimit()
  
  // Fetch memories from Mem0
  const { getAllMemories } = useMem0Client()
  let memories: string[] = []
  try {
    const memoryResults = await getAllMemories()
    memories = memoryResults.map(m => m.memory)
  } catch (error) {
    console.error('Error fetching memories:', error)
  }

  onProgress({
    type: 'generating_query',
    nodeId,
    result: {},
  })

  try {
    const searchQueriesResult = generateSearchQueries({
      query,
      learnings,
      numQueries: breadth,
      language,
      searchLanguage,
      memories,
    })

    let searchQueries: PartialSearchQuery[] = []

    for await (const chunk of parseStreamingJson(
      searchQueriesResult.fullStream,
      searchQueriesTypeSchema,
      (value) => !!value.queries?.length && !!value.queries[0]?.query,
    )) {
      if (chunk.type === 'object' && chunk.value.queries) {
        // Temporary fix: Exclude queries that equals `undefined`
        // Currently only being reported to be seen on GPT-4o, where the model simply returns `undefined` for certain questions
        // https://github.com/AnotiaWang/deep-research-web-ui/issues/7
        searchQueries = chunk.value.queries.filter(
          (q) => q.query !== 'undefined',
        )
        for (let i = 0; i < searchQueries.length; i++) {
          onProgress({
            type: 'generating_query',
            result: searchQueries[i],
            nodeId: childNodeId(nodeId, i),
            parentNodeId: nodeId,
          })
        }
      } else if (chunk.type === 'reasoning') {
        // Reasoning part goes to the parent node
        onProgress({
          type: 'generating_query_reasoning',
          delta: chunk.delta,
          nodeId,
        })
      } else if (chunk.type === 'error') {
        onProgress({
          type: 'error',
          message: chunk.message,
          nodeId,
        })
        break
      } else if (chunk.type === 'bad-end') {
        onProgress({
          type: 'error',
          message: t('invalidStructuredOutput'),
          nodeId,
        })
        break
      }
    }

    onProgress({
      type: 'node_complete',
      nodeId,
    })

    for (let i = 0; i < searchQueries.length; i++) {
      onProgress({
        type: 'generated_query',
        query,
        result: searchQueries[i],
        nodeId: childNodeId(nodeId, i),
      })
    }

    // Run in parallel and limit the concurrency
    const results = await Promise.all(
      searchQueries.map((searchQuery, i) =>
        globalLimit(async () => {
          if (!searchQuery?.query) {
            return {
              learnings: [],
              visitedUrls: [],
            }
          }
          onProgress({
            type: 'searching',
            query: searchQuery.query,
            nodeId: childNodeId(nodeId, i),
          })
          try {
            // search the web
            const results = await useWebSearch()(searchQuery.query, {
              maxResults: 5,
              lang: languageCode,
            })
            console.log(
              `[DeepResearch] Searched "${searchQuery.query}", found ${results.length} contents`,
            )

            // Collect URLs from this search
            const newUrls = results.map((item) => item.url).filter(Boolean)
            onProgress({
              type: 'search_complete',
              results,
              nodeId: childNodeId(nodeId, i),
            })
            // Breadth for the next search is half of the current breadth
            const nextBreadth = Math.ceil(breadth / 2)

            const searchResultGenerator = processSearchResult({
              query: searchQuery.query,
              results,
              numFollowUpQuestions: nextBreadth,
              language,
              memories,
            })
            let searchResult: PartialProcessedSearchResult = {}

            for await (const chunk of parseStreamingJson(
              searchResultGenerator.fullStream,
              searchResultTypeSchema,
              (value) => !!value.learnings?.length,
            )) {
              const id = childNodeId(nodeId, i)
              if (chunk.type === 'object') {
                searchResult = chunk.value
                onProgress({
                  type: 'processing_serach_result',
                  result: chunk.value,
                  query: searchQuery.query,
                  nodeId: id,
                })
              } else if (chunk.type === 'reasoning') {
                onProgress({
                  type: 'processing_serach_result_reasoning',
                  delta: chunk.delta,
                  nodeId: id,
                })
              } else if (chunk.type === 'error') {
                onProgress({
                  type: 'error',
                  message: chunk.message,
                  nodeId: id,
                })
                break
              } else if (chunk.type === 'bad-end') {
                onProgress({
                  type: 'error',
                  message: t('invalidStructuredOutput'),
                  nodeId: id,
                })
                break
              }
            }
            console.log(
              `Processed search result for ${searchQuery.query}`,
              searchResult,
            )
            const allLearnings = [
              ...learnings,
              ...(searchResult.learnings ?? []),
            ]
            const allUrls = [...visitedUrls, ...newUrls]
            const nextDepth = currentDepth + 1

            onProgress({
              type: 'node_complete',
              result: {
                learnings: allLearnings,
                followUpQuestions: searchResult.followUpQuestions ?? [],
              },
              nodeId: childNodeId(nodeId, i),
            })

            if (
              nextDepth <= maxDepth &&
              searchResult.followUpQuestions?.length
            ) {
              console.warn(
                `Researching deeper, breadth: ${nextBreadth}, depth: ${nextDepth}`,
              )

              const nextQuery = `
              Previous research goal: ${searchQuery.researchGoal}
              Follow-up research directions: ${searchResult.followUpQuestions
                .map((q) => `\n${q}`)
                .join('')}
            `.trim()

              // Add concurrency by 1, and do next recursive search
              globalLimit.concurrency++
              try {
                const r = await deepResearch({
                  query: nextQuery,
                  breadth: nextBreadth,
                  maxDepth,
                  learnings: allLearnings,
                  visitedUrls: allUrls,
                  onProgress,
                  currentDepth: nextDepth,
                  nodeId: childNodeId(nodeId, i),
                  languageCode,
                  searchLanguage,
                  memories,
                })
                return r
              } catch (error) {
                throw error
              } finally {
                globalLimit.concurrency--
              }
            } else {
              return {
                learnings: allLearnings,
                visitedUrls: allUrls,
              }
            }
          } catch (e: any) {
            const id = childNodeId(nodeId, i)
            console.error(
              `Error in node ${id} for query ${searchQuery.query}`,
              e,
            )
            onProgress({
              type: 'error',
              message: e.message,
              nodeId: id,
            })
            return {
              learnings: [],
              visitedUrls: [],
            }
          }
        }),
      ),
    )
    // Conclude results
    const _learnings = [...new Set(results.flatMap((r) => r.learnings))]
    const _visitedUrls = [...new Set(results.flatMap((r) => r.visitedUrls))]
    // Complete should only be called once
    if (nodeId === '0') {
      onProgress({
        type: 'complete',
        learnings: _learnings,
        visitedUrls: _visitedUrls,
      })
    }
    return {
      learnings: _learnings,
      visitedUrls: _visitedUrls,
    }
  } catch (error: any) {
    console.error(error)
    onProgress({
      type: 'error',
      message: error?.message ?? 'Something went wrong',
      nodeId,
    })
    return {
      learnings: [],
      visitedUrls: [],
    }
  }
}
