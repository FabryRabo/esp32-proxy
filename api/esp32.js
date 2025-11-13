const mysql = require('serverless-mysql');

const db = mysql({
  config: {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306
  }
});

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
    
    console.log('📥 Datos recibidos del ESP32:', datos);

    // Validar campos requeridos
    if (!datos.valor_rgb_r || !datos.valor_rgb_g || !datos.valor_rgb_b || 
        !datos.valor_fuerza || !datos.valor_corriente || !datos.diagnostico) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan campos requeridos'
      });
    }

    // Extraer datos
    const rgb_r = parseInt(datos.valor_rgb_r);
    const rgb_g = parseInt(datos.valor_rgb_g);
    const rgb_b = parseInt(datos.valor_rgb_b);
    const fuerza = parseFloat(datos.valor_fuerza);
    const corriente = parseFloat(datos.valor_corriente);
    const diagnostico = datos.diagnostico;
    const foco_activo = datos.foco_activo || 'ninguno';
    const dispositivo_id = datos.dispositivo_id || 1;

    // Determinar nivel
    let nivel = 'normal';
    if (diagnostico.toLowerCase().includes('detectada') || diagnostico.toLowerCase().includes('detectado')) {
      nivel = 'detectado';
    } else if (diagnostico.toLowerCase().includes('posible')) {
      nivel = 'posible';
    }

    // Calcular bilirrubina
    let bilirrubina = 12.0;
    if (rgb_r <= 4 && rgb_g <= 4 && rgb_b <= 4) {
      bilirrubina = 3.0;
    } else if (rgb_r <= 4 && rgb_g <= 5 && rgb_b <= 5) {
      bilirrubina = 6.0;
    }

    // Paciente por defecto
    const paciente_id = 4;
    const usuario_id = 2;

    // Insertar en base de datos
    const result = await db.query(
      `INSERT INTO mediciones (
        paciente_id, dispositivo_id, usuario_id,
        valor_rojo, valor_verde, valor_azul,
        valor_fuerza, valor_corriente,
        nivel_bilirrubina, diagnostico, nivel,
        foco_activado, ventilador_activo, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paciente_id, dispositivo_id, usuario_id,
        rgb_r, rgb_g, rgb_b,
        fuerza, corriente,
        bilirrubina, diagnostico, nivel,
        foco_activo, 0, 'Medición desde ESP32 via Vercel'
      ]
    );

    await db.end();

    console.log('✅ Medición guardada, ID:', result.insertId);

    return res.status(201).json({
      success: true,
      mensaje: 'Medición guardada exitosamente',
      data: {
        medicion_id: result.insertId,
        paciente_id: paciente_id,
        diagnostico: diagnostico,
        nivel: nivel,
        foco_activo: foco_activo,
        nivel_bilirrubina: bilirrubina
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      success: false, 
      mensaje: 'Error al guardar medición: ' + error.message 
    });
  }
};
