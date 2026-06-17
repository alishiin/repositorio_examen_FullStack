import React, { useState } from 'react';
import './faq.css';

export default function FAQ() {
  const faqs = [
    {
      id: 1,
      question: '¿Cómo puedo publicar una mascota perdida?',
      answer: 'Debes ingresar a la sección “Reportar mascota perdida”, completar el formulario con los datos de tu mascota, subir fotografías recientes y agregar la ubicación donde fue vista por última vez.'
    },
    {
      id: 2,
      question: '¿La plataforma tiene algún costo?',
      answer: 'No, publicar reportes de mascotas perdidas o encontradas es completamente gratuito para todos los usuarios.'
    },
    {
      id: 3,
      question: '¿Qué información debo incluir en la publicación?',
      answer: 'Se recomienda agregar nombre, especie, raza, color, tamaño, características distintivas, fecha de pérdida, última ubicación conocida y un número de contacto.'
    },
    {
      id: 4,
      question: '¿Puedo publicar una mascota encontrada',
      answer: 'Sí. Si encontraste una mascota, puedes crear una publicación en la sección “Mascotas encontradas” para ayudar a localizar a sus dueños.'
    },
    {
      id: 5,
      question: '¿Cómo contacto a la persona que publicó un aviso?',
      answer: 'Cada publicación incluye información de contacto proporcionada por el usuario, como teléfono, correo electrónico o mensajería interna de la plataforma.'
    },
    {
      id: 6,
      question: '¿Qué hago si mi mascota ya apareció?',
      answer: 'Puedes marcar la publicación como “Resuelta” o eliminarla desde tu perfil para informar a la comunidad que la mascota ya fue encontrada.'
    },
    {
      id: 7,
      question: '¿La plataforma funciona en todo Chile?',
      answer: 'Sí, la plataforma permite publicar y buscar mascotas perdidas o encontradas en cualquier región y ciudad de Chile.'
    },
    {
      id: 8,
      question: '¿Qué recomendaciones ayudan a encontrar una mascota más rápido?',
      answer: 'Subir fotos claras, entregar información detallada, compartir la publicación en redes sociales y mantener actualizados los datos de contacto aumenta considerablemente las posibilidades de encontrarla.'
    }
  ];

  const [expandedId, setExpandedId] = useState(null);

  const toggleFAQ = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="faq-section">
      <div className="faq-container">
        <h1 className="faq-title">Preguntas Frecuentes</h1>
        <p className="faq-subtitle">Encuentra respuestas a las preguntas más comunes sobre nuestros servicios</p>
        
        <div className="faq-list">
          {faqs.map(faq => (
            <div key={faq.id} className={`faq-item ${expandedId === faq.id ? 'active' : ''}`}>
              <button 
                className="faq-question"
                onClick={() => toggleFAQ(faq.id)}
              >
                <span>{faq.question}</span>
                <span className="faq-icon">+</span>
              </button>
              {expandedId === faq.id && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-contact">
          <h3>¿No encontraste lo que buscas?</h3>
          <p>Contáctanos directamente</p>
          <div className="contact-methods">
            <a href="tel:+098987876767" className="contact-btn">📞 +098987 876 767</a>
            <a href="mailto:info@website.com" className="contact-btn">📧 info@website.com</a>
          </div>
        </div>
      </div>
    </section>
  );
}
