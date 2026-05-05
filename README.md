# Power BI MCP Server for Claude.ai

A standalone MCP (Model Context Protocol) server that bridges Power BI to Claude.ai's custom connector feature.

## What this provides

6 MCP tools exposed to Claude.ai:

- `list_workspaces` — list all Power BI workspaces
- `list_reports` — list reports (optionally filtered by workspace)
- `list_datasets` — list datasets (optionally filtered by workspace)
- `get_dataset_schema` — get tables/columns of a dataset (via DMV)
- `execute_dax` — run a DAX query against a dataset
- `refresh_dataset` — trigger a dataset refresh

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure

Copy `.env.example` to `.env.local` and set your Azure tenant ID.

### 3. Run locally

```bash
npm run dev
```

### 4. Deploy to Vercel

Push to GitHub and import in Vercel dashboard. Set the env var `POWERBI_TENANT_ID` in Vercel project settings.

## Connecting to Claude.ai

1. In Claude.ai → Settings → Connectors → Add custom connector
2. Fill in:
   - **Name:** Power BI
   - **Remote MCP server URL:** `https://<your-deployment>.vercel.app/api/mcp`
   - **OAuth Client ID:** your Azure App Registration client ID
   - **OAuth Client Secret:** your Azure App Registration client secret
3. Claude.ai will show you a redirect URI — add it to your Azure App Registration's "Web" platform redirect URIs.
4. Click Connect.

## Azure App Registration requirements

API permissions (Delegated, with admin consent granted):

- `Report.Read.All`
- `Dataset.Read.All`
- `Dashboard.Read.All`
- `Workspace.Read.All`
- `Dataset.ReadWrite.All` (only needed for `refresh_dataset` and `execute_dax`)

## How auth works

Claude.ai handles the OAuth flow against Azure AD using the credentials you provide. On every MCP request it forwards a `Bearer` access token in the `Authorization` header. This server does not store tokens — it just proxies the token to Power BI's REST API.
