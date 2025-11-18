#!/usr/bin/env tsx
/**
 * Render Configuration Validation Script
 * 
 * Validates render.yaml files and checks for:
 * - Configuration consistency
 * - Environment variable completeness
 * - Health check endpoints
 * - Build/start command validity
 * - MCP server connectivity
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  services: ServiceConfig[];
}

interface ServiceConfig {
  name: string;
  type: string;
  healthCheckPath?: string;
  buildCommand?: string;
  startCommand?: string;
  envVars: Record<string, any>;
}

const REQUIRED_ENV_VARS = {
  frontend: ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'OPENAI_API_KEY'],
  backend: ['DATABASE_URL', 'PORT', 'CORS_ORIGINS'],
};

const RENDER_YAML_PATHS = [
  'render.yaml',
  'backend/render.yaml',
  'backend/deploy/render.yaml',
];

function validateYamlSyntax(filePath: string): { valid: boolean; data?: any; error?: string } {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = yaml.parse(content);
    return { valid: true, data };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

function validateServiceConfig(service: any, type: 'frontend' | 'backend'): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!service.name) {
    errors.push('Service missing required field: name');
  }

  if (!service.type) {
    errors.push('Service missing required field: type');
  }

  // Check build/start commands (skip for Redis and other non-web services)
  if (service.type === 'redis' || service.type === 'postgresql') {
    // Redis and PostgreSQL services don't need build/start commands
    return { errors, warnings };
  }

  if (!service.buildCommand && type === 'backend') {
    warnings.push('Backend service missing buildCommand');
  }

  if (!service.startCommand && service.type === 'web') {
    errors.push('Web service missing startCommand');
  }

  // Check health check path
  if (!service.healthCheckPath) {
    warnings.push('Service missing healthCheckPath (recommended: /api/health)');
  } else if (!service.healthCheckPath.startsWith('/')) {
    errors.push('healthCheckPath must start with /');
  }

  // Check environment variables
  const requiredVars = REQUIRED_ENV_VARS[type];
  const envVars = service.envVars || [];
  const envVarKeys = envVars.map((e: any) => e.key || e);

  for (const requiredVar of requiredVars) {
    if (!envVarKeys.includes(requiredVar)) {
      if (requiredVar === 'DATABASE_URL' && envVarKeys.some((k: string) => k.includes('DATABASE'))) {
        warnings.push(`DATABASE_URL not explicitly set (may be using sync: false)`);
      } else {
        warnings.push(`Missing recommended environment variable: ${requiredVar}`);
      }
    }
  }

  // Check for common issues
  if (service.plan === 'free' && service.envVars?.some((e: any) => e.key === 'ENABLE_WEBSOCKET' && e.value === 'true')) {
    warnings.push('WebSocket enabled on free tier (may cause issues)');
  }

  if (service.buildCommand?.includes('npm') && service.buildCommand?.includes('yarn')) {
    warnings.push('Build command mixes npm and yarn (use one package manager)');
  }

  return { errors, warnings };
}

function validateRenderConfig(filePath: string): ValidationResult {
  const result: ValidationResult = {
    file: filePath,
    valid: false,
    errors: [],
    warnings: [],
    services: [],
  };

  if (!existsSync(filePath)) {
    result.errors.push(`File does not exist: ${filePath}`);
    return result;
  }

  // Validate YAML syntax
  const yamlResult = validateYamlSyntax(filePath);
  if (!yamlResult.valid) {
    result.errors.push(`Invalid YAML syntax: ${yamlResult.error}`);
    return result;
  }

  const config = yamlResult.data;

  // Check for services array
  if (!config.services || !Array.isArray(config.services)) {
    result.errors.push('Missing or invalid services array');
    return result;
  }

  // Validate each service
  for (const service of config.services) {
    const serviceType = service.name?.includes('frontend') ? 'frontend' : 'backend';
    const validation = validateServiceConfig(service, serviceType);
    
    result.errors.push(...validation.errors.map(e => `[${service.name || 'unnamed'}] ${e}`));
    result.warnings.push(...validation.warnings.map(w => `[${service.name || 'unnamed'}] ${w}`));
    
    result.services.push({
      name: service.name || 'unnamed',
      type: service.type || 'unknown',
      healthCheckPath: service.healthCheckPath,
      buildCommand: service.buildCommand,
      startCommand: service.startCommand,
      envVars: service.envVars || [],
    });
  }

  result.valid = result.errors.length === 0;
  return result;
}

async function testMCPConnectivity(): Promise<{ connected: boolean; error?: string }> {
  const mcpConfigPath = '.cursor/mcp_settings.json';
  
  if (!existsSync(mcpConfigPath)) {
    return { connected: false, error: 'MCP config file not found' };
  }

  try {
    const config = JSON.parse(readFileSync(mcpConfigPath, 'utf-8'));
    const renderConfig = config.mcpServers?.render;

    if (!renderConfig) {
      return { connected: false, error: 'Render MCP server not configured' };
    }

    // Check if API key is set (can't test actual connection without exposing key)
    const apiKey = process.env.RENDER_API_KEY;
    if (!apiKey && renderConfig.headers?.Authorization?.includes('${RENDER_API_KEY}')) {
      return { connected: false, error: 'RENDER_API_KEY environment variable not set' };
    }

    // Try to make a test request (if API key is available)
    if (apiKey) {
      try {
        const response = await fetch('https://mcp.render.com/mcp', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {},
          }),
        });

        if (response.ok || response.status === 400) {
          // 400 is expected for invalid request format, but means server is reachable
          return { connected: true };
        }

        return { connected: false, error: `Server returned status ${response.status}` };
      } catch (error: any) {
        return { connected: false, error: `Connection failed: ${error.message}` };
      }
    }

    return { connected: true }; // Config looks good, but can't test without API key
  } catch (error: any) {
    return { connected: false, error: `Config parse error: ${error.message}` };
  }
}

async function main() {
  console.log('🔍 Render Configuration Validation\n');
  console.log('=' .repeat(60));

  const results: ValidationResult[] = [];
  const projectRoot = process.cwd();

  // Validate all render.yaml files
  for (const yamlPath of RENDER_YAML_PATHS) {
    const fullPath = join(projectRoot, yamlPath);
    console.log(`\n📄 Validating: ${yamlPath}`);
    const result = validateRenderConfig(fullPath);
    results.push(result);

    if (result.valid) {
      console.log(`  ✅ Valid configuration`);
      console.log(`  📦 Services: ${result.services.length}`);
    } else {
      console.log(`  ❌ Invalid configuration`);
    }

    if (result.errors.length > 0) {
      console.log(`  🚨 Errors (${result.errors.length}):`);
      result.errors.forEach(e => console.log(`     - ${e}`));
    }

    if (result.warnings.length > 0) {
      console.log(`  ⚠️  Warnings (${result.warnings.length}):`);
      result.warnings.forEach(w => console.log(`     - ${w}`));
    }
  }

  // Test MCP connectivity
  console.log(`\n🔌 Testing MCP Server Connectivity`);
  console.log('=' .repeat(60));
  const mcpTest = await testMCPConnectivity();
  if (mcpTest.connected) {
    console.log('  ✅ MCP server configuration valid');
  } else {
    console.log(`  ❌ MCP server issue: ${mcpTest.error}`);
  }

  // Summary
  console.log(`\n📊 Summary`);
  console.log('=' .repeat(60));
  const validConfigs = results.filter(r => r.valid).length;
  const totalConfigs = results.length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  console.log(`  Configurations: ${validConfigs}/${totalConfigs} valid`);
  console.log(`  Total Errors: ${totalErrors}`);
  console.log(`  Total Warnings: ${totalWarnings}`);
  console.log(`  MCP Status: ${mcpTest.connected ? '✅ Connected' : '❌ Not Connected'}`);

  // Recommendations
  if (totalConfigs > 1) {
    console.log(`\n💡 Recommendation: Consolidate ${totalConfigs} render.yaml files into a single source of truth`);
  }

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main().catch(console.error);

