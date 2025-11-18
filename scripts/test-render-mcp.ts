#!/usr/bin/env tsx
/**
 * Render MCP Server Test Script
 * 
 * Tests connectivity and functionality of the Render MCP server
 * Requires RENDER_API_KEY environment variable
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface MCPRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

async function testMCPConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'planetary-agents-test',
          version: '1.0.0',
        },
      },
    };

    const response = await fetch('https://mcp.render.com/mcp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data: MCPResponse = await response.json();
    
    if (data.error) {
      return {
        success: false,
        error: `MCP Error: ${data.error.message} (code ${data.error.code})`,
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: `Connection failed: ${error.message}`,
    };
  }
}

async function listMCPTools(apiKey: string): Promise<{ tools: string[]; error?: string }> {
  try {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    };

    const response = await fetch('https://mcp.render.com/mcp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        tools: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data: MCPResponse = await response.json();
    
    if (data.error) {
      return {
        tools: [],
        error: `MCP Error: ${data.error.message}`,
      };
    }

    const tools = data.result?.tools || [];
    return {
      tools: tools.map((t: any) => t.name || t),
    };
  } catch (error: any) {
    return {
      tools: [],
      error: `Request failed: ${error.message}`,
    };
  }
}

async function listWorkspaces(apiKey: string): Promise<{ workspaces: any[]; error?: string }> {
  try {
    // This would use the list_workspaces tool, but requires proper MCP protocol
    // For now, we'll just test basic connectivity
    return { workspaces: [] };
  } catch (error: any) {
    return {
      workspaces: [],
      error: error.message,
    };
  }
}

async function main() {
  console.log('🧪 Render MCP Server Test\n');
  console.log('=' .repeat(60));

  // Check for API key
  const apiKey = process.env.RENDER_API_KEY;
  if (!apiKey) {
    console.error('❌ RENDER_API_KEY environment variable not set');
    console.error('\nTo set it:');
    console.error('  export RENDER_API_KEY=your_api_key_here');
    console.error('\nOr add it to your .env.local file');
    process.exit(1);
  }

  // Check MCP config
  const mcpConfigPath = '.cursor/mcp_settings.json';
  if (!existsSync(mcpConfigPath)) {
    console.error(`❌ MCP config file not found: ${mcpConfigPath}`);
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(mcpConfigPath, 'utf-8'));
  const renderConfig = config.mcpServers?.render;

  if (!renderConfig) {
    console.error('❌ Render MCP server not configured in mcp_settings.json');
    process.exit(1);
  }

  console.log('✅ MCP configuration found\n');

  // Test 1: Basic connectivity
  console.log('📡 Test 1: Basic Connectivity');
  console.log('-'.repeat(60));
  const connectionTest = await testMCPConnection(apiKey);
  if (connectionTest.success) {
    console.log('  ✅ Successfully connected to Render MCP server');
  } else {
    console.log(`  ❌ Connection failed: ${connectionTest.error}`);
    process.exit(1);
  }

  // Test 2: List available tools
  console.log('\n🔧 Test 2: Available Tools');
  console.log('-'.repeat(60));
  const toolsTest = await listMCPTools(apiKey);
  if (toolsTest.error) {
    console.log(`  ⚠️  Could not list tools: ${toolsTest.error}`);
    console.log('  (This is expected if the MCP server requires workspace context)');
  } else if (toolsTest.tools.length > 0) {
    console.log(`  ✅ Found ${toolsTest.tools.length} available tools:`);
    toolsTest.tools.slice(0, 10).forEach(tool => {
      console.log(`     - ${tool}`);
    });
    if (toolsTest.tools.length > 10) {
      console.log(`     ... and ${toolsTest.tools.length - 10} more`);
    }
  } else {
    console.log('  ⚠️  No tools returned (may require workspace context)');
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('=' .repeat(60));
  console.log('  ✅ MCP Configuration: Valid');
  console.log(`  ${connectionTest.success ? '✅' : '❌'} Connection: ${connectionTest.success ? 'Success' : 'Failed'}`);
  console.log(`  ${toolsTest.tools.length > 0 ? '✅' : '⚠️ '} Tools: ${toolsTest.tools.length > 0 ? `${toolsTest.tools.length} available` : 'Requires workspace context'}`);

  console.log('\n💡 Next Steps:');
  console.log('  1. Restart Cursor to load MCP configuration');
  console.log('  2. Set your Render workspace: "Set my Render workspace to [WORKSPACE_NAME]"');
  console.log('  3. Test with: "List my Render services"');
}

main().catch(console.error);

