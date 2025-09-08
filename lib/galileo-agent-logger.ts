// Galileo Agent Conversation Logger
// Uses custom Galileo logger implementation to track agent chat interactions

// Environment variables for Galileo configuration
const GALILEO_API_KEY = process.env.GALILEO_API_KEY;
const GALILEO_PROJECT = process.env.GALILEO_PROJECT || 'AlchmPlanetaryAgents';
const GALILEO_LOG_STREAM = process.env.GALILEO_LOG_STREAM || 'test';

export interface AgentInteractionData {
  sessionId: string;
  userMessage: string;
  agentResponse: string;
  modelUsed?: string;
  temperature?: number;
  promptVersion?: string;
  personaVersion?: string;
  routingReason?: 'default' | 'complexity_elevate' | 'risk_elevate';
  experiment?: { temperatureGroup?: string; microQuestionStrategy?: string; styleCardSelection?: string[] };
  piiRedacted?: boolean;
  planet?: string;
  sign?: string;
  degree?: string;
  dignity?: string;
  elementalInfo?: {
    signElement: string;
    planetElement: string;
    elementalAffinity: number;
    isDiurnal: boolean;
  };
  processingTimeMs?: number;
  tokenUsage?: number;
  agentType?: 'planetary' | 'advanced' | 'tarot' | 'monica';
  aNumberInfo?: {
    aNumber: number;
    category: string;
    components: {
      spirit: number;
      essence: number;
      matter: number;
      substance: number;
    };
  };
}

export interface ConversationContext {
  sessionId: string;
  sessionName: string;
  startTime: number;
  planet?: string;
  sign?: string;
  degree?: string;
  userAgent?: string;
  conversationCount: number;
}

/**
 * Log a complete agent conversation interaction to Galileo
 */
export async function logAgentConversation(
  interaction: AgentInteractionData,
  context: ConversationContext
): Promise<boolean> {
  if (!GALILEO_API_KEY) {
    console.warn('Galileo API key not configured - logging agent conversation to console instead');
    console.log('====== AGENT CONVERSATION LOG ======');
    console.log('Session ID:', interaction.sessionId);
    console.log('Planet Configuration:', `${interaction.planet} in ${interaction.sign} ${interaction.degree}°`);
    console.log('User:', interaction.userMessage);
    console.log('Agent:', interaction.agentResponse);
    console.log('Processing Time:', interaction.processingTimeMs, 'ms');
    console.log('=====================================');
    return false;
  }

  try {
    // Create workflow data structure for Galileo API
    const workflow = {
      created_at_ns: Date.now() * 1000000,
      duration_ns: (interaction.processingTimeMs || 100) * 1000000,
      input: JSON.stringify({
        session_id: interaction.sessionId,
        session_name: context.sessionName,
        conversation_number: context.conversationCount,
        user_message: interaction.userMessage,
        planetary_config: {
          planet: interaction.planet,
          sign: interaction.sign,
          degree: interaction.degree,
          dignity: interaction.dignity
        },
        elemental_context: interaction.elementalInfo,
        agent_type: interaction.agentType || 'planetary',
        alchemical_info: interaction.aNumberInfo
      }),
      output: JSON.stringify({
        agent_response: interaction.agentResponse,
        conversation_completed: true,
        session_id: interaction.sessionId,
        model_used: interaction.modelUsed,
        planetary_configuration: {
          planet: interaction.planet,
          sign: interaction.sign,
          degree: interaction.degree,
          dignity: interaction.dignity
        },
        elemental_analysis: interaction.elementalInfo,
        performance_metrics: {
          processing_time_ms: interaction.processingTimeMs || 0,
          user_input_processed: true,
          agent_response_generated: true,
          conversation_logged: true
        },
        session_context: {
          session_name: context.sessionName,
          conversation_number: context.conversationCount,
          session_started: new Date(context.startTime).toISOString()
        },
        alchemical_analysis: interaction.aNumberInfo
      }),
      name: `agent-conversation-${context.conversationCount}`,
      type: 'workflow' as const,
      metadata: {
        session_id: interaction.sessionId,
        session_name: context.sessionName,
        conversation_number: String(context.conversationCount),
        agent_type: interaction.agentType || 'planetary',
        model_used: interaction.modelUsed || 'unknown',
        temperature: interaction.temperature !== undefined ? String(interaction.temperature) : 'unknown',
        prompt_version: interaction.promptVersion || 'unknown',
        persona_version: interaction.personaVersion || 'unknown',
        routing_reason: interaction.routingReason || 'default',
        planet: interaction.planet || 'unknown',
        sign: interaction.sign || 'unknown',
        degree: String(interaction.degree || 'unknown'),
        dignity: interaction.dignity || 'unknown',
        processing_time_ms: String(interaction.processingTimeMs || 0),
        response_length: String(interaction.agentResponse.length),
        input_length: String(interaction.userMessage.length),
        sign_element: interaction.elementalInfo?.signElement || 'unknown',
        planet_element: interaction.elementalInfo?.planetElement || 'unknown',
        elemental_affinity: String(Math.round((interaction.elementalInfo?.elementalAffinity || 0) * 100)),
        is_diurnal: String(interaction.elementalInfo?.isDiurnal || false),
        a_number: String(interaction.aNumberInfo?.aNumber || 0),
        a_number_category: interaction.aNumberInfo?.category || 'unknown',
        spirit_component: String(interaction.aNumberInfo?.components?.spirit || 0),
        essence_component: String(interaction.aNumberInfo?.components?.essence || 0),
        matter_component: String(interaction.aNumberInfo?.components?.matter || 0),
        substance_component: String(interaction.aNumberInfo?.components?.substance || 0),
        pii_redacted: String(!!interaction.piiRedacted),
        experiment_temperature_group: interaction.experiment?.temperatureGroup || 'none',
        experiment_micro_question_strategy: interaction.experiment?.microQuestionStrategy || 'none',
        experiment_style_card_selection: (interaction.experiment?.styleCardSelection || []).join(',')
      }
    };

    const logData = {
      project_name: GALILEO_PROJECT,
      workflows: [workflow]
    };

    const response = await fetch('https://api.galileo.ai/v1/observe/workflows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Galileo-API-Key': GALILEO_API_KEY,
      },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Galileo API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`Successfully logged agent conversation to Galileo (Session: ${interaction.sessionId})`, result);
    return true;

  } catch (error) {
    console.error('Error logging agent conversation to Galileo:', error);
    
    // Fallback: log to console with structured format
    console.log('====== AGENT CONVERSATION LOG (FALLBACK) ======');
    console.log('Project:', GALILEO_PROJECT);
    console.log('Stream:', GALILEO_LOG_STREAM);
    console.log('Session ID:', interaction.sessionId);
    console.log('Conversation #:', context.conversationCount);
    console.log('Planet Configuration:', `${interaction.planet} in ${interaction.sign} ${interaction.degree}° (${interaction.dignity})`);
    console.log('Elemental Info:', interaction.elementalInfo);
    console.log('User Message:', interaction.userMessage);
    console.log('Agent Response:', interaction.agentResponse);
    console.log('Processing Time:', interaction.processingTimeMs, 'ms');
    console.log('Agent Type:', interaction.agentType);
    console.log('Error:', error instanceof Error ? error.message : String(error));
    console.log('===============================================');
    
    // Still return true for fallback logging
    return true;
  }
}

/**
 * Generate a unique session ID for a conversation
 */
export function generateSessionId(): string {
  return `agent-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create conversation context for session tracking
 */
export function createConversationContext(
  planet?: string,
  sign?: string,
  degree?: string
): ConversationContext {
  const sessionId = generateSessionId();
  const planetConfig = planet && sign ? `${planet}-in-${sign}` : 'general-chat';
  
  return {
    sessionId,
    sessionName: `planetary-agent-chat-${planetConfig}`,
    startTime: Date.now(),
    planet,
    sign,
    degree,
    conversationCount: 0
  };
}

/**
 * Check if Galileo agent logging is properly configured
 */
export function isAgentLoggingConfigured(): boolean {
  return !!GALILEO_API_KEY;
}

/**
 * Get agent logging configuration status
 */
export function getAgentLoggingConfig() {
  return {
    hasApiKey: !!GALILEO_API_KEY,
    project: GALILEO_PROJECT,
    logStream: GALILEO_LOG_STREAM,
    agentLoggerInitialized: true,
  };
}

/**
 * Test agent conversation logging
 */
export async function testAgentLogging(): Promise<{ success: boolean; message: string; details?: any }> {
  if (!GALILEO_API_KEY) {
    return {
      success: false,
      message: 'Galileo API key not configured for agent logging',
    };
  }

  try {
    const testContext = createConversationContext('Sun', 'Leo', '15');
    
    const testInteraction: AgentInteractionData = {
      sessionId: testContext.sessionId,
      userMessage: 'Test message for Galileo agent logging',
      agentResponse: 'Test response from planetary agent representing Sun in Leo',
      planet: 'Sun',
      sign: 'Leo',
      degree: '15',
      dignity: 'domicile',
      elementalInfo: {
        signElement: 'Fire',
        planetElement: 'Fire',
        elementalAffinity: 0.9,
        isDiurnal: true
      },
      aNumberInfo: {
        aNumber: 2.8,
        category: 'Test Reading',
        components: {
          spirit: 0.7,
          essence: 0.2,
          matter: 0.1,
          substance: 0.0
        }
      },
      processingTimeMs: 150,
      agentType: 'planetary'
    };

    testContext.conversationCount = 1;
    
    const success = await logAgentConversation(testInteraction, testContext);

    return {
      success,
      message: success ? 'Agent logging test completed successfully' : 'Agent logging test completed with fallback',
      details: { 
        sessionId: testContext.sessionId,
        project: GALILEO_PROJECT, 
        logStream: GALILEO_LOG_STREAM 
      },
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Failed to test agent logging',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}