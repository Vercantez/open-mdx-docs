interface AiSearchMessage {
	role: 'system' | 'developer' | 'user' | 'assistant' | 'tool';
	content: string;
}

interface AiSearchChunk {
	id: string;
	type: string;
	score: number;
	text: string;
	item: {
		key: string;
		timestamp?: number;
		metadata?: Record<string, unknown>;
	};
}

interface AiSearchResponse {
	search_query: string;
	chunks: AiSearchChunk[];
}

interface AiSearchInstance {
	search(options: {
		query?: string;
		messages?: AiSearchMessage[];
		ai_search_options?: {
			retrieval?: {
				retrieval_type?: 'vector' | 'keyword' | 'hybrid';
				match_threshold?: number;
				max_num_results?: number;
			};
			query_rewrite?: { enabled?: boolean };
			reranking?: { enabled?: boolean; match_threshold?: number };
		};
	}): Promise<AiSearchResponse>;
}

interface AiSearchNamespace {
	get(instance: string): AiSearchInstance;
}

interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
}

interface Env {
	AI_SEARCH?: AiSearchNamespace;
	AI_SEARCH_INSTANCE?: string;
	ASSETS?: { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
}
