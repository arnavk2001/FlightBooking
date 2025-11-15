// Diagnostic utility to help debug deployment issues

export const checkDeployment = () => {
  const diagnostics = {
    basePath: import.meta.env.VITE_BASE_PATH || '/bookingbot',
    apiUrl: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '(using Vite proxy /api)'),
    environment: import.meta.env.MODE,
    isProduction: import.meta.env.PROD,
    currentPath: window.location.pathname,
    currentOrigin: window.location.origin,
  }

  console.group('🔍 Deployment Diagnostics')
  console.log('Base Path:', diagnostics.basePath)
  console.log('API URL:', diagnostics.apiUrl || '(using relative paths)')
  console.log('Environment:', diagnostics.environment)
  console.log('Current Path:', diagnostics.currentPath)
  console.log('Current Origin:', diagnostics.currentOrigin)
  console.groupEnd()

  return diagnostics
}

export const testApiConnection = async () => {
  // In dev, use Vite proxy (/api), in prod use full URL or relative
  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '')
  const testUrl = apiUrl ? `${apiUrl}/health` : '/api/health'
  
  console.log('🔍 Testing API connection to:', testUrl)
  console.log('   Full URL:', testUrl)
  console.log('   API Base URL:', apiUrl || '(using relative path)')
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors', // Explicitly set CORS mode
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ API Connection Test Successful:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ API Connection Test Failed:', error)
    console.error('   Error details:', {
      message: error.message,
      name: error.name,
      apiUrl: testUrl,
      suggestion: 'Make sure backend server is running at ' + (apiUrl || 'http://localhost:8000')
    })
    
    // Provide helpful troubleshooting info
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.error('   🔧 Troubleshooting:')
      console.error('   1. Is backend running? Check: http://localhost:8000/health')
      console.error('   2. Start backend: cd backend && start-backend.bat')
      console.error('   3. Check CORS configuration in backend')
      console.error('   4. Check firewall settings')
    }
    
    return { success: false, error: error.message }
  }
}

