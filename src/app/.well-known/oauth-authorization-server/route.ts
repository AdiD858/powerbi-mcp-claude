import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
	const tenantId = process.env.POWERBI_TENANT_ID;

	if (!tenantId) {
		return NextResponse.json({ error: 'POWERBI_TENANT_ID not configured' }, { status: 500 });
	}

	return NextResponse.json({
		issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
		authorization_endpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
		token_endpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
		scopes_supported: [
			'https://analysis.windows.net/powerbi/api/.default',
			'offline_access',
		],
		response_types_supported: ['code'],
		grant_types_supported: ['authorization_code', 'refresh_token'],
		code_challenge_methods_supported: ['S256'],
		token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
	});
}
