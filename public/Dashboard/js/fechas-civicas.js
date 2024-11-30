// Inicialización de animaciones con AOS
AOS.init({
    duration: 1000,
    once: true,
    mirror: false
});

// Cambiar tema oscuro/normal
function toggleTheme() {
    document.body.classList.toggle('neon-mode');
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.classList.toggle('fa-moon');
    themeIcon.classList.toggle('fa-sun');

    const isDarkMode = document.body.classList.contains('neon-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// Cargar eventos al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('neon-mode');
        const themeIcon = document.querySelector('.theme-toggle i');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    await cargarEventos(); // Llama a cargar eventos al inicio
});

// Función para mostrar/ocultar el menú en dispositivos móviles
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');

    if (navLinks.classList.contains('active')) {
        navLinks.style.animation = 'slideIn 0.3s forwards';
    } else {
        navLinks.style.animation = 'slideOut 0.3s forwards';
    }
}

// Manejo del envío del formulario de eventos
document.getElementById('eventoForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitButton.disabled = true;

    try {
        const formData = new FormData(this);

        const titulo = formData.get('titulo');
        const fecha = formData.get('fecha');
        const imagenArchivo = this.querySelector('input[name="imagen"]').files[0];

        // Validaciones del formulario
        if (titulo.length < 3) {
            throw new Error('El título debe tener al menos 3 caracteres');
        }

        const fechaSeleccionada = new Date(fecha);
        const hoy = new Date(new Date().toISOString().slice(0, 10)); // Fecha sin hora
        if (fechaSeleccionada < hoy) {
            throw new Error('Solo puedes seleccionar fechas desde hoy en adelante');
        }

        if (imagenArchivo && imagenArchivo.size > 5000000) {
            throw new Error('La imagen no debe superar los 5MB');
        }

        // Realizar solicitud al servidor
        const response = await fetch('/agregar-evento', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const result = await response.json();
        if (result.error) {
            throw new Error(result.error);
        }

        // Recargar eventos después de agregar uno nuevo
        document.getElementById('eventos-container').innerHTML = '';
        await cargarEventos();

        this.reset();
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: '¡Evento agregado con éxito!'
        });
    } catch (error) {
        console.error('Error completo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message
        });
    } finally {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
});

// Función para cargar eventos desde el servidor
async function cargarEventos() {
    try {
        const response = await fetch('/obtener-eventos'); // Ruta correcta del backend
        if (!response.ok) throw new Error('Error al obtener los eventos');

        const eventos = await response.json();
        console.log('Eventos obtenidos:', eventos); // Para depuración
        mostrarEventos(eventos);
    } catch (error) {
        console.error('Error al cargar los eventos:', error);
        mostrarNotificacion('No se pudieron cargar los eventos', 'error');
    }
}

// Función para mostrar los eventos en la interfaz
function mostrarEventos(eventos) {
    const container = document.getElementById('eventos-container');
    container.innerHTML = ''; // Limpia el contenedor antes de mostrar los eventos

    eventos.forEach(evento => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.aos = 'fade-up';

        const fecha = new Date(evento.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const imagenUrl = evento.imagen ? `/uploads/${evento.imagen}` : '/assets/img/default-event.jpg';

        card.innerHTML = `
            <h3>${evento.titulo}</h3>
            <p class="descripcion">${evento.descripcion || 'Sin descripción'}</p>
            <p class="fecha">${fecha}</p>
            <img src="${imagenUrl}" alt="${evento.titulo}" 
                onerror="this.src='/assets/img/default-event.jpg'"
                style="max-width: 100%; height: auto;">
        `;
        container.appendChild(card);
    });
}

// Función para mostrar notificaciones con SweetAlert
function mostrarNotificacion(mensaje, tipo) {
    Swal.fire({
        icon: tipo,
        title: tipo === 'success' ? 'Éxito' : 'Error',
        text: mensaje,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}
