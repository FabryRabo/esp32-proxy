module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      mensaje: 'Método no permitido' 
    });
  }

  try {
    const datos = req.body;
    
    // Log para debugging
    console.log('📥 Datos recibidos del ESP32:', datos);

    // Reenviar a InfinityFree
    const response = await fetch('https://bilirrubinometro.infinityfreeapp.com/recibir_sensores.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Proxy/1.0'
      },
      body: JSON.stringify(datos)
    });

    const responseData = await response.json();
    
    console.log('📤 Respuesta de InfinityFree:', responseData);

    return res.status(response.status).json(responseData);

  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ 
      success: false, 
      mensaje: 'Error en el proxy: ' + error.message 
    });
  }
};
