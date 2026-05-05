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

const TOOLS = [
	{
		name: 'list_workspaces',
		description: 'List all Power BI workspaces (groups) the authenticated user has access to.',
		inputSchema: { type: 'object', properties: {}, required: [] },
	},
	{
		name: 'list_reports',
		description: 'List Power BI reports. Optionally filter by workspace ID.',
		inputSchema: {
			type: 'object',
			properties: {
				workspaceId: { type: 'string', description: 'Optional Power BI workspace (group) ID' },
			},
		},
	},
	{
		name: 'list_datasets',
		description: 'List Power BI datasets. Optionally filter by workspace ID.',
		inputSchema: {
			type: 'object',
			properties: {
				workspaceId: { type: 'string', description: 'Optional Power BI workspace (group) ID' },
			},
		},
	},
	{
		name: 'get_dataset_schema',
		description: 'Get the schema (tables, columns, data types) of a Power BI dataset.',
		inputSchema: {
			type: 'object',
			properties: {
				datasetId: { type: 'string', description: 'Power BI dataset ID' },
				workspaceId: { type: 'string', description: 'Optional workspace ID' },
			},
			required: ['datasetId'],
		},
	},
	{
		name: 'execute_dax',
		description: 'Execute a DAX query against a Power BI dataset. Returns query results.',
		inputSchema: {
			type: 'object',
			properties: {
				datasetId: { type: 'string', description: 'Power BI dataset ID to query' },
				query: { type: 'string', description: 'DAX query string (e.g. EVALUATE TOPN(10, Sales))' },
				workspaceId: { type: 'string', description: 'Optional workspace ID' },
			},
			required: ['datasetId', 'query'],
		},
	},
	{
		name: 'refresh_dataset',
		description: 'Trigger a refresh of a Power BI dataset.',
		inputSchema: {
			type: 'object',
			properties: {
				datasetId: { type: 'string', description: 'Power BI dataset ID to refresh' },
				workspaceId: { type: 'string', description: 'Optional workspace ID' },
			},
			required: ['datasetId'],
		},
	},
];

function jsonrpc(id: unknown, result: unknown) {
	return Response.json({ jsonrpc: '2.0', id, result });
}

function jsonrpcError(id: unknown, code: number, message: string) {
	return Response.json({ jsonrpc: '2.0', id, error: { code, message } });
}

async function callTool(name: string, args: Record<string, string>, token: string) {
	switch (name) {
		case 'list_workspaces':
			return listWorkspaces(token);
		case 'list_reports':
			return listReports(token, args.workspaceId);
		case 'list_datasets':
			return listDatasets(token, args.workspaceId);
		case 'get_dataset_schema':
			return getDatasetSchema(token, args.datasetId, args.workspaceId);
		case 'execute_dax':
			return executeDax(token, args.datasetId, args.query, args.workspaceId);
		case 'refresh_dataset':
			return refreshDataset(token, args.datasetId, args.workspaceId);
		default:
			throw new Error(`Unknown tool: ${name}`);
	}
}

export async function POST(req: Request) {
	const auth = req.headers.get('authorization') ?? '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

	let body: { jsonrpc: string; method: string; params?: Record<string, unknown>; id: unknown };
	try {
		body = await req.json();
	} catch {
		return jsonrpcError(null, -32700, 'Parse error');
	}

	const { method, params, id } = body;

	if (method === 'initialize') {
		return jsonrpc(id, {
			protocolVersion: '2024-11-05',
			capabilities: { tools: {} },
			serverInfo: { name: 'powerbi-mcp', version: '0.1.0' },
		});
	}

	if (method === 'tools/list') {
		return jsonrpc(id, { tools: TOOLS });
	}

	if (method === 'tools/call') {
		if (!token) return jsonrpcError(id, -32001, 'Missing Authorization Bearer token');

		const toolName = params?.name as string;
		const toolArgs = (params?.arguments ?? {}) as Record<string, string>;

		try {
			const result = await callTool(toolName, toolArgs, token);
			return jsonrpc(id, {
				content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			return jsonrpcError(id, -32000, message);
		}
	}

	if (method === 'notifications/initialized') {
		return new Response(null, { status: 204 });
	}

	return jsonrpcError(id, -32601, `Method not found: ${method}`);
}

export async function GET() {
	return Response.json({ status: 'Power BI MCP server running' });
}
