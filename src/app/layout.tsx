export const metadata = {
	title: 'Power BI MCP Server',
	description: 'MCP server bridging Power BI to Claude.ai',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
