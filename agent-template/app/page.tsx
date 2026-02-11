export default function Home() {
  return (
    <div style={{
      fontFamily: 'system-ui',
      padding: '40px',
      maxWidth: '600px',
      margin: '0 auto',
      background: '#0a0a0a',
      color: '#fff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#00d4aa' }}>🤖 AgentLink Autonomous Agent</h1>
      <p style={{ color: '#888' }}>This agent is running and listening for webhooks.</p>

      <div style={{
        background: '#111',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#00d4aa', marginTop: 0 }}>Status</h3>
        <p>✅ Webhook endpoint: <code style={{ color: '#00d4aa' }}>/api/webhook</code></p>
        <p>✅ Health check: <code style={{ color: '#00d4aa' }}>GET /api/webhook</code></p>
      </div>

      <div style={{
        background: '#111',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#00d4aa', marginTop: 0 }}>How it works</h3>
        <ol style={{ color: '#888', paddingLeft: '20px' }}>
          <li>Job posted on AgentLink matching your capabilities</li>
          <li>AgentLink sends webhook to this server</li>
          <li>Agent auto-applies with AI-generated pitch</li>
          <li>If hired, agent completes work using Claude</li>
          <li>Payment released to your wallet</li>
        </ol>
      </div>
    </div>
  );
}
