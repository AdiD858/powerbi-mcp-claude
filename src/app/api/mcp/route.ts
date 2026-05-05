import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import {
	listWorkspaces,
	listReports,
	listDatasets,
	executeDax,
	getDatasetSchema,
	refreshDataset,
} from '@/lib/powerbi';

export const runtime = 'nodejs';
export const maxDuration = 60;

function createServer() {
	const server = new McpServer({
		name: 'powerbi-mcp',
		version: '0.1.0',
	});

	server.tool(
		'list_workspaces',
		'List all Power BI workspaces (groups) the authenticated user has access to.',
		{},
		async () => {
			const token = (globalThis as any).__mcpToken;
			const workspaces = await listWorkspaces(token);
			return { content: [{ type: 'text' as const, text: JSON.stringify(workspaces, null, 2) }] };
		},
	);

	server.tool(
		'list_reports',
		'List Power BI reports. Optionally filter by workspace ID.',
		{ workspaceId: z.string().optional().describe('Optional Power BI workspace (group) ID') },
		async ({ workspaceId }) => {
			const token = (globalThis as any).__mcpToken;
			const reports = await listReports(token, workspaceId);
			return { content: [{ type: 'text' as const, text: JSON.stringify(reports, null, 2) }] };
		},
	);

	server.tool(
		'list_datasets',
		'List Power BI datasets. Optionally filter by workspace ID.',
		{ workspaceId: z.string().optional().describe('Optional Power BI workspace (group) ID') },
		async ({ workspaceId }) => {
			const token = (globalThis as any).__mcpToken;
			const datasets = await listDatasets(token, workspaceId);
			return { content: [{ type: 'text' as const, text: JSON.stringify(datasets, null, 2) }] };
		},
	);

	server.tool(
		'get_dataset_schema',
		'Get the schema (tables, columns, data types) of a Power BI dataset.',
		{
			datasetId: z.string().describe('Power BI dataset ID'),
			workspaceId: z.string().optional().describe('Optional workspace ID'),
		},
		async ({ datasetId, workspaceId }) => {
			const token = (globalThis as any).__mcpToken;
			const schema = await getDatasetSchema(token, datasetId, workspaceId);
			return { content: [{ type: 'text' as const, text: JSON.stringify(schema, null, 2) }] };
		},
	);

	server.tool(
		'execute_dax',
		'Execute a DAX query against a Power BI dataset. Returns query results.',
		{
			datasetId: z.string().describe('Power BI dataset ID to query'),
			query: z.string().describe('DAX query string (e.g. EVALUATE TOPN(10, Sales))'),
			workspaceId: z.string().optional().describe('Optional workspace ID'),
		},
		async ({ datasetId, query, workspaceId }) => {
			const token = (globalThis as any).__mcpToken;
			const results = await executeDax(token, datasetId, query, workspaceId);
			return { content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }] };
		},
	);

	server.tool(
		'refresh_dataset',
		'Trigger a refresh of a Power BI dataset.',
		{
			datasetId: z.string().describe('Power BI dataset ID to refresh'),
			workspaceId: z.string().optional().describe('Optional workspace ID'),
		},
		async ({ datasetId, workspaceId }) => {
			const token = (globalThis as any).__mcpToken;
			const result = await refreshDataset(token, datasetId, workspaceId);
			return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
		},
	);

	return server;
}

async function handleRequest(req: Request): Promise<Response> {
	// Extract Bearer token from Claude.ai and store for tool use
	const auth = req.headers.get('authorization');
	if (auth?.startsWith('Bearer ')) {
		(globalThis as any).__mcpToken = auth.slice(7);
	}

	const server = createServer();
	const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

	await server.connect(transport);

	const body = await req.text();

	// Create a fake IncomingMessage-like object for the transport
	const response = await transport.handleRequest({
		method: req.method,
		url: req.url,
		headers: Object.fromEntries(req.headers.entries()),
		body: body ? JSON.parse(body) : undefined,
	} as any);

	await server.close();

	if (response) {
		return new Response(JSON.stringify(response.body), {
			status: response.statusCode || 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ error: 'No response from MCP server' }), {
		status: 500,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function GET(req: Request) {
	return handleRequest(req);
}

export async function POST(req: Request) {
	return handleRequest(req);
}

export async function DELETE(req: Request) {
	return handleRequest(req);
}
