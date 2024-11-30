const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Para manejar archivos
const app = express();

// Configuración de la base de datos
const pool = mysql.createPool({
    host: 'team03.cdq4a4ug8td8.us-east-1.rds.amazonaws.com',
    user: 'admin', // Cambia esto según el usuario de tu base de datos
    password: 'saludybienestar', // Cambia esto según la contraseña de tu base de datos
    database: 'dbGeneral', // Nombre de la base de datos
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware para analizar datos de formularios
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configurar la carpeta 'public' para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Dashboard.html'));
});

// Ruta para recibir el formulario de contacto y guardar los datos
app.post('/contacto', (req, res) => {
    const { nombres, apellidos, tipoDocumento, numeroDocumento, genero, edad, telefono, gmail, direccion, mensaje } = req.body;

    // Verificar si los datos están completos
    if (!nombres || !apellidos || !tipoDocumento || !numeroDocumento || !genero || !edad || !telefono || !gmail || !direccion || !mensaje) {
        return res.status(400).send('Por favor completa todos los campos del formulario.');
    }

    // Cambiar a la base de datos 'dbGeneral'
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error al obtener conexión:', err.stack);
            res.status(500).send('Ocurrió un error al procesar tu consulta.');
            return;
        }

        // Insertar los datos en la tabla 'contactos'
        const query = `
            INSERT INTO contactos (nombres, apellidos, tipoDocumento, numeroDocumento, genero, edad, telefono, gmail, direccion, mensaje)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        connection.query(query, [nombres, apellidos, tipoDocumento, numeroDocumento, genero, edad, telefono, gmail, direccion, mensaje], (err, result) => {
            if (err) {
                console.error('Error al insertar datos en contactos: ' + err.stack);
                res.status(500).send('Ocurrió un error al procesar tu consulta.');
            } else {
                // Redirige a la página de inicio después de enviar el formulario
                res.redirect('/');
            }
            connection.release();
        });
    });
});

// Configurar la carpeta 'uploads' para almacenar imágenes
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer para la subida de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Ruta para agregar un evento (el formulario enviará los datos aquí)
app.post('/agregar-evento', upload.single('imagen'), (req, res) => {
    const { titulo, descripcion, fecha } = req.body;
    const imagen = req.file ? req.file.filename : null;

    // Verificar que todos los campos sean enviados
    if (!titulo || !descripcion || !fecha || !imagen) {
        return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    // Insertar en la base de datos
    const query = 'INSERT INTO eventos (titulo, descripcion, fecha, imagen) VALUES (?, ?, ?, ?)';
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error de conexión:', err.stack);
            return res.status(500).json({ error: 'Error al conectar con la base de datos.' });
        }

        connection.query(query, [titulo, descripcion, fecha, imagen], (err, result) => {
            connection.release();
            if (err) {
                console.error('Error al insertar en la base de datos:', err.stack);
                return res.status(500).json({ error: 'Error al guardar el evento.' });
            }

            // Responder con el evento creado
            res.status(200).json({
                id: result.insertId,
                titulo,
                descripcion,
                fecha,
                imagen
            });
        });
    });
});

app.post('/reservar', (req, res) => {

    const query = `
        INSERT INTO reservas (nombre, telefono, personas, fecha, hora, mensaje)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error de conexión a la base de datos:', err.stack);
            return res.status(500).json({ error: 'Error al conectar con la base de datos.' });
        }

        connection.query(query, [name, phone, person, reservationDate, time, message], (err, result) => {
            connection.release();

            if (err) {
                console.error('Error al insertar reserva:', err.stack);
                return res.status(500).json({ error: 'Error al procesar la reserva.' });
            }

            // Mensaje de éxito
            res.status(200).json({ message: 'Reserva realizada con éxito.' });
        });
    });
});

// Configuración del puerto
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
