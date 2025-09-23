#!/usr/bin/env node

/**
 * Deployment Readiness Verification Script
 * Verifies that the backend is ready for Render deployment
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendDir = path.resolve(__dirname, '..')
const rootDir = path.resolve(backendDir, '..')

console.log('🔍 PLANETARY AGENTS - DEPLOYMENT READINESS VERIFICATION\n')

const allChecks = []
let passedChecks = 0

function check(description, condition, details = '') {
  const passed = condition
  const symbol = passed ? '✅' : '❌'
  console.log(`${symbol} ${description}`)
  if (details) {
    console.log(`   ${details}`)
  }
  allChecks.push({ description, passed, details })
  if (passed) passedChecks++
  return passed
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath)
  } catch {
    return false
  }
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

console.log('📦 CHECKING ESSENTIAL FILES...\n')

// Check package.json
const packageJsonPath = path.join(backendDir, 'package.json')
const packageJson = readJsonFile(packageJsonPath)
check(
  'package.json exists and is valid',
  packageJson !== null,
  packageJson ? `Version: ${packageJson.version}` : 'File missing or invalid JSON'
)

// Check required scripts
if (packageJson) {
  check(
    'Build script configured',
    packageJson.scripts && packageJson.scripts.build,
    packageJson.scripts?.build || 'Missing build script'
  )

  check(
    'Start script configured',
    packageJson.scripts && packageJson.scripts.start,
    packageJson.scripts?.start || 'Missing start script'
  )

  check(
    'Development script configured',
    packageJson.scripts && packageJson.scripts.dev,
    packageJson.scripts?.dev || 'Missing dev script'
  )
}

// Check essential dependencies
const requiredDeps = ['express', 'cors', 'helmet', 'compression', 'dotenv']
if (packageJson && packageJson.dependencies) {
  requiredDeps.forEach(dep => {
    check(
      `Dependency: ${dep}`,
      packageJson.dependencies[dep] !== undefined,
      packageJson.dependencies[dep] || 'Not found'
    )
  })
}

console.log('\n🏗️ CHECKING BUILD OUTPUT...\n')

// Check dist directory
const distPath = path.join(backendDir, 'dist')
check('Build output directory exists', fs.existsSync(distPath))

// Check main entry file
const mainEntryPath = path.join(distPath, 'index.js')
check('Main entry file built', fs.existsSync(mainEntryPath))

// Check services directory
const servicesPath = path.join(distPath, 'services')
check('Services directory built', fs.existsSync(servicesPath))

// Check routes directory
const routesPath = path.join(distPath, 'routes')
check('Routes directory built', fs.existsSync(routesPath))

console.log('\n🔧 CHECKING CONFIGURATION FILES...\n')

// Check TypeScript config
const tsconfigPath = path.join(backendDir, 'tsconfig.json')
check('TypeScript configuration exists', fileExists(tsconfigPath))

// Check environment files
const envExamplePath = path.join(backendDir, '.env.example')
check('Environment example exists', fileExists(envExamplePath))

const renderEnvPath = path.join(rootDir, 'render-backend.env')
check('Render environment config exists', fileExists(renderEnvPath))

// Check Render configuration
const renderYamlPath = path.join(backendDir, 'render.yaml')
check('Render YAML config exists', fileExists(renderYamlPath))

const renderAltYamlPath = path.join(backendDir, 'render-alternative.yaml')
check('Alternative Render configs exist', fileExists(renderAltYamlPath))

console.log('\n📚 CHECKING DOCUMENTATION...\n')

// Check deployment documentation
const deploymentReadyPath = path.join(rootDir, 'DEPLOYMENT_READY.md')
check('Deployment documentation exists', fileExists(deploymentReadyPath))

const renderGuidePath = path.join(rootDir, 'RENDER_DEPLOYMENT_GUIDE.md')
check('Render deployment guide exists', fileExists(renderGuidePath))

const deploymentOptionsPath = path.join(rootDir, 'RENDER_DEPLOYMENT_OPTIONS.md')
check('Deployment options guide exists', fileExists(deploymentOptionsPath))

console.log('\n🔍 CHECKING SOURCE CODE QUALITY...\n')

// Check for random values (should be eliminated)
const kineticsServicePath = path.join(backendDir, 'src', 'services', 'kinetics-service.ts')
if (fileExists(kineticsServicePath)) {
  const kineticsContent = fs.readFileSync(kineticsServicePath, 'utf8')
  const hasRandomValues = kineticsContent.includes('Math.random()')
  check(
    'No random values in kinetics service',
    !hasRandomValues,
    hasRandomValues
      ? 'Found Math.random() calls - should be deterministic'
      : 'All calculations are deterministic'
  )
}

// Check main index file
const indexPath = path.join(backendDir, 'src', 'index.ts')
check('Main server file exists', fileExists(indexPath))

console.log('\n🌐 CHECKING DEPLOYMENT COMPATIBILITY...\n')

// Check Node.js version compatibility
const nodeVersion = process.version
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
check(
  'Node.js version compatible',
  majorVersion >= 16,
  `Current: ${nodeVersion}, Required: >= 16.x`
)

// Check for ESM compatibility
check(
  'ES Module configuration',
  packageJson && packageJson.type === 'module',
  packageJson?.type || 'CommonJS (may need adjustment)'
)

console.log('\n📊 VERIFICATION SUMMARY...\n')

const totalChecks = allChecks.length
const successRate = Math.round((passedChecks / totalChecks) * 100)

console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks (${successRate}%)`)

if (successRate >= 90) {
  console.log('\n🎉 DEPLOYMENT READY! ✅')
  console.log('Your backend is ready for Render deployment.')
  console.log('\nNext steps:')
  console.log('1. Visit https://render.com/dashboard')
  console.log('2. Follow RENDER_DEPLOYMENT_GUIDE.md')
  console.log('3. Use render-backend.env for environment variables')
} else if (successRate >= 70) {
  console.log('\n⚠️  MOSTLY READY - Minor Issues')
  console.log('Address the failed checks above before deployment.')
} else {
  console.log('\n❌ NOT READY - Critical Issues')
  console.log('Please fix the failed checks before attempting deployment.')
}

console.log('\n📋 FAILED CHECKS:')
const failedChecks = allChecks.filter(check => !check.passed)
if (failedChecks.length === 0) {
  console.log('None! All checks passed. 🎉')
} else {
  failedChecks.forEach(check => {
    console.log(`❌ ${check.description}`)
    if (check.details) {
      console.log(`   ${check.details}`)
    }
  })
}

console.log('\n💡 DEPLOYMENT OPTIONS:')
console.log('• Standard: Use render.yaml configuration')
console.log('• Advanced: Use render-alternative.yaml for specific needs')
console.log('• Docker: Use Dockerfile.production for containerized deployment')
console.log('• Manual: Follow RENDER_DEPLOYMENT_GUIDE.md step-by-step')

console.log('\n🔗 USEFUL LINKS:')
console.log('• Render Dashboard: https://render.com/dashboard')
console.log('• Documentation: RENDER_DEPLOYMENT_OPTIONS.md')
console.log('• Environment Variables: render-backend.env')

process.exit(successRate >= 90 ? 0 : 1)
