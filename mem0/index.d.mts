interface MemoryOptions {
    user_id?: string;
    agent_id?: string;
    app_id?: string;
    run_id?: string;
    metadata?: Record<string, any>;
    filters?: Record<string, any>;
    org_name?: string | null;
    project_name?: string | null;
    org_id?: string | number | null;
    project_id?: string | number | null;
    infer?: boolean;
    page?: number;
    page_size?: number;
    includes?: string;
    excludes?: string;
    enable_graph?: boolean;
    start_date?: string;
    end_date?: string;
}
interface ProjectOptions {
    fields?: string[];
}
declare enum API_VERSION {
    V1 = "v1",
    V2 = "v2"
}
interface Messages {
    role: string;
    content: string;
}
interface Message extends Messages {
}
interface MemoryHistory {
    id: string;
    memory_id: string;
    input: Array<Messages>;
    old_memory: string | null;
    new_memory: string | null;
    user_id: string;
    categories: Array<string>;
    event: Event | string;
    created_at: Date;
    updated_at: Date;
}
interface SearchOptions extends MemoryOptions {
    api_version?: API_VERSION | string;
    limit?: number;
    enable_graph?: boolean;
    threshold?: number;
    top_k?: number;
    only_metadata_based_search?: boolean;
    keyword_search?: boolean;
    fields?: string[];
    categories?: string[];
    rerank?: boolean;
}
declare enum Event {
    ADD = "ADD",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    NOOP = "NOOP"
}
interface MemoryData {
    memory: string;
}
interface Memory {
    id: string;
    messages?: Array<Messages>;
    event?: Event | string;
    data?: MemoryData | null;
    memory?: string;
    user_id?: string;
    hash?: string;
    categories?: Array<string>;
    created_at?: Date;
    updated_at?: Date;
    memory_type?: string;
    score?: number;
    metadata?: any | null;
}
interface MemoryUpdateBody {
    memoryId: string;
    text: string;
}
interface User {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
    total_memories: number;
    owner: string;
    type: string;
}
interface AllUsers {
    count: number;
    results: Array<User>;
    next: any;
    previous: any;
}
interface ProjectResponse {
    custom_instructions?: string;
    custom_categories?: string[];
    [key: string]: any;
}
interface custom_categories {
    [key: string]: any;
}
interface PromptUpdatePayload {
    custom_instructions?: string;
    custom_categories?: custom_categories[];
    [key: string]: any;
}
declare enum WebhookEvent {
    MEMORY_ADDED = "memory_add",
    MEMORY_UPDATED = "memory_update",
    MEMORY_DELETED = "memory_delete"
}
interface Webhook {
    webhook_id?: string;
    name: string;
    url: string;
    project?: string;
    owner?: string;
    created_at?: Date;
    updated_at?: Date;
    is_active?: boolean;
    event_types?: WebhookEvent[];
}

interface ClientOptions {
    apiKey: string;
    host?: string;
    organizationName?: string;
    projectName?: string;
    organizationId?: string;
    projectId?: string;
}
declare class MemoryClient {
    apiKey: string;
    host: string;
    organizationName: string | null;
    projectName: string | null;
    organizationId: string | number | null;
    projectId: string | number | null;
    headers: Record<string, string>;
    client: any;
    _validateApiKey(): any;
    _validateOrgProject(): void;
    constructor(options: ClientOptions);
    _fetchWithErrorHandling(url: string, options: any): Promise<any>;
    _preparePayload(messages: string | Array<{
        role: string;
        content: string;
    }>, options: MemoryOptions): object;
    _prepareParams(options: MemoryOptions): object;
    add(messages: string | Array<{
        role: string;
        content: string;
    }>, options?: MemoryOptions): Promise<Array<Memory>>;
    get(memoryId: string): Promise<Memory>;
    getAll(options?: SearchOptions): Promise<Array<Memory>>;
    search(query: string, options?: SearchOptions): Promise<Array<Memory>>;
    delete(memoryId: string): Promise<{
        message: string;
    }>;
    deleteAll(options?: MemoryOptions): Promise<{
        message: string;
    }>;
    history(memoryId: string): Promise<Array<MemoryHistory>>;
    users(): Promise<AllUsers>;
    deleteUser(entityId: string, entity?: {
        type: string;
    }): Promise<{
        message: string;
    }>;
    deleteUsers(): Promise<{
        message: string;
    }>;
    batchUpdate(memories: Array<MemoryUpdateBody>): Promise<string>;
    batchDelete(memories: Array<string>): Promise<string>;
    getProject(options: ProjectOptions): Promise<ProjectResponse>;
    updateProject(prompts: PromptUpdatePayload): Promise<Record<string, any>>;
    getWebhooks(): Promise<Array<Webhook>>;
    createWebhook(webhook: Webhook): Promise<Webhook>;
    updateWebhook(webhookId: string, webhook: Webhook): Promise<{
        message: string;
    }>;
    deleteWebhook(webhookId: string): Promise<{
        message: string;
    }>;
}

export { API_VERSION, type AllUsers, type Memory, MemoryClient, type MemoryData, type MemoryHistory, type MemoryOptions, type MemoryUpdateBody, type Message, type Messages, type ProjectOptions, type ProjectResponse, type PromptUpdatePayload, type SearchOptions, type User, type Webhook, MemoryClient as default };
