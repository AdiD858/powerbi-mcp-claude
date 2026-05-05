export default function Home() {
	return (
		<main style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: 720 }}>
			<h1>Power BI MCP Server</h1>
			<p>This is an MCP server for connecting Power BI to Claude.ai.</p>
			<ul>
				<li>
					MCP endpoint: <code>/api/mcp</code>
				</li>
				<li>
					OAuth metadata: <code>/.well-known/oauth-authorization-server</code>
				</li>
			</ul>
			<p>
				Add this server as a custom connector in Claude.ai with your Azure App Registration
				OAuth credentials.
			</p>
		</main>
	);
}
