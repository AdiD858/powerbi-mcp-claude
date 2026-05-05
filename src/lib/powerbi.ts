import axios, { AxiosError } from 'axios';

const POWERBI_API_BASE = 'https://api.powerbi.com/v1.0/myorg';

const headers = (token: string) => ({
	Authorization: `Bearer ${token}`,
	'Content-Type': 'application/json',
});

const handleError = (err: unknown, context: string): never => {
	if (err instanceof AxiosError) {
		const status = err.response?.status;
		const data = err.response?.data;
		throw new Error(`Power BI ${context} failed (${status}): ${JSON.stringify(data)}`);
	}
	throw err;
};

export const listWorkspaces = async (token: string) => {
	try {
		const { data } = await axios.get(`${POWERBI_API_BASE}/groups`, { headers: headers(token) });
		return data.value;
	} catch (err) {
		handleError(err, 'listWorkspaces');
	}
};

export const listReports = async (token: string, workspaceId?: string) => {
	const url = workspaceId
		? `${POWERBI_API_BASE}/groups/${workspaceId}/reports`
		: `${POWERBI_API_BASE}/reports`;
	try {
		const { data } = await axios.get(url, { headers: headers(token) });
		return data.value;
	} catch (err) {
		handleError(err, 'listReports');
	}
};

export const listDatasets = async (token: string, workspaceId?: string) => {
	const url = workspaceId
		? `${POWERBI_API_BASE}/groups/${workspaceId}/datasets`
		: `${POWERBI_API_BASE}/datasets`;
	try {
		const { data } = await axios.get(url, { headers: headers(token) });
		return data.value;
	} catch (err) {
		handleError(err, 'listDatasets');
	}
};

export const executeDax = async (
	token: string,
	datasetId: string,
	query: string,
	workspaceId?: string,
) => {
	const url = workspaceId
		? `${POWERBI_API_BASE}/groups/${workspaceId}/datasets/${datasetId}/executeQueries`
		: `${POWERBI_API_BASE}/datasets/${datasetId}/executeQueries`;

	try {
		const { data } = await axios.post(
			url,
			{
				queries: [{ query }],
				serializerSettings: { includeNulls: true },
			},
			{ headers: headers(token) },
		);
		return data.results;
	} catch (err) {
		handleError(err, 'executeDax');
	}
};

export const getDatasetSchema = async (token: string, datasetId: string, workspaceId?: string) => {
	const dmvQuery = `
		SELECT [TABLE_NAME], [COLUMN_NAME], [DATA_TYPE]
		FROM $SYSTEM.DBSCHEMA_COLUMNS
		WHERE [TABLE_SCHEMA] = 'Model'
	`;
	return executeDax(token, datasetId, dmvQuery, workspaceId);
};

export const refreshDataset = async (token: string, datasetId: string, workspaceId?: string) => {
	const url = workspaceId
		? `${POWERBI_API_BASE}/groups/${workspaceId}/datasets/${datasetId}/refreshes`
		: `${POWERBI_API_BASE}/datasets/${datasetId}/refreshes`;
	try {
		await axios.post(url, { notifyOption: 'NoNotification' }, { headers: headers(token) });
		return { status: 'refresh triggered', datasetId };
	} catch (err) {
		handleError(err, 'refreshDataset');
	}
};
