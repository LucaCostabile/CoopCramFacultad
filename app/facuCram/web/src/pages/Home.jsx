import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';

export default function Home() {
  const [news, setNews] = useState([]);
  const carouselRef = useRef(null);
  const progressRef = useRef(null);
  const indexRef = useRef(null);
  const interval = 8000; // 8s

  useEffect(() => {
    api.get('/news').then(r => setNews(Array.isArray(r.data) ? r.data : [])).catch(() => setNews([]));
  }, []);

  // Animación de la barra de progreso del carrusel (usando Bootstrap CDN)
  useEffect(()=>{
    const el = carouselRef.current;
    if (!el || !(window).bootstrap) return;
    const progress = progressRef.current;
    const indexEl = indexRef.current;
    const Carousel = (window).bootstrap.Carousel;
    const carousel = Carousel.getOrCreateInstance(el, { interval, pause: 'hover' });

    function animateBar(){
      if(!progress) return;
      progress.style.transition = 'none';
      progress.style.width = '0%';
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          progress.style.transition = `width ${interval/1000}s linear`;
          progress.style.width = '100%';
        });
      });
    }
    function freezeBar(){
      if(!progress) return;
      const totalW = progress.parentElement?.getBoundingClientRect().width || 0;
      const barW = progress.getBoundingClientRect().width;
      const pct = totalW ? (barW * 100 / totalW) : 0;
      progress.style.transition = 'none';
      progress.style.width = pct + '%';
    }

    const onSlid = (e)=>{
      if(indexEl && typeof e.to === 'number') indexEl.textContent = String(e.to + 1);
      animateBar();
    };
    el.addEventListener('slid.bs.carousel', onSlid);

    // iniciar
    animateBar();

    // Pausa/reanudar al click en cards
    const cards = el.querySelectorAll('.carousel-card');
    cards.forEach((card)=>{
      let paused = false;
      card.addEventListener('click', (ev)=>{
        if ((ev.target).closest && (ev.target).closest('.read-more')) return;
        paused = !paused;
        if (paused) { carousel.pause(); freezeBar(); }
        else { carousel.cycle(); animateBar(); }
      });
    });

    // Clamp y "Ver más" para textos largos
    (function setupClamp(){
      const cards = el.querySelectorAll('.carousel-card');
      cards.forEach(card => {
        const p = card.querySelector('p');
        const more = card.querySelector('.read-more');
        if (!p || !more) return;
        const len = (p.textContent || '').trim().length;
        if (len > 380){
          p.classList.add('clamp-6');
          more.classList.remove('d-none');
          more.addEventListener('click', ()=>{
            const clamped = p.classList.toggle('clamp-6');
            p.style.whiteSpace = clamped ? 'normal' : 'pre-line';
            more.textContent = clamped ? 'Ver más' : 'Ver menos';
            if (!clamped){ carousel.pause(); freezeBar(); }
            else { carousel.cycle(); animateBar(); }
          });
        }
      });
    })();

    // Hover
    el.addEventListener('mouseenter', freezeBar);
    el.addEventListener('mouseleave', animateBar);

    return ()=>{
      el.removeEventListener('slid.bs.carousel', onSlid);
      el.removeEventListener('mouseenter', freezeBar);
      el.removeEventListener('mouseleave', animateBar);
    };
  }, [news.length]);

  // Preparar slides
  const slides = useMemo(()=> (news.length ? news : [{ id: 'empty', title: 'Sin noticias por el momento', content: '', image: null }]), [news]);

  return (
    <>
      {/* Carrusel de Noticias */}
      <section className="carrusel-noticias py-3" style={{ margin: '32px 0' }}>
        <div id="newsCarousel" className="carousel slide position-relative" data-bs-ride="carousel" data-bs-interval={interval} data-bs-pause="hover" ref={carouselRef}>
          {news.length > 0 && (
            <div className="position-absolute top-0 end-0 m-3">
              <span className="badge rounded-pill text-bg-light border" style={{ color:'#2e7d32', borderColor:'#a5d6a7' }}>
                Noticia <span id="slideIndex" ref={indexRef}>1</span> / {news.length}
              </span>
            </div>
          )}

          <div className="carousel-indicators">
            {slides.map((item, idx) => (
              <button key={item.id + '-' + idx} type="button" data-bs-target="#newsCarousel" data-bs-slide-to={idx} className={idx===0? 'active': ''} aria-current={idx===0? 'true':'false'} aria-label={`Slide ${idx+1}`}></button>
            ))}
          </div>

          <div className="carousel-inner">
            {slides.map((item, idx) => (
              <div key={item.id + '_' + idx} className={`carousel-item ${idx===0? 'active' : ''}`}>
                <div className="container">
                  <div className="row justify-content-center align-items-center g-4" style={{ minHeight: 360 }}>
                    <div className="col-12 col-md-6">
                      <div className="carousel-card">
                        <h3 className="fw-bold" style={{ color:'#2e7d32' }}>{item.title}</h3>
                        {item.content && <p className="lead mb-1" style={{ color:'#333' }}>{item.content}</p>}
                        {/* botón Ver más controlado por JS (se muestra solo si hay mucho texto) */}
                        <a className="read-more d-none" role="button">Ver más</a>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 text-center">
                      {item.image ? (
                        <img className="img-fluid shadow rounded" src={item.image.startsWith('http') ? item.image : `/storage/${item.image}`} alt="Imagen noticia" style={{ maxHeight: 260, objectFit: 'cover' }} data-fallback="/assets/logo.png" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=e.currentTarget.dataset.fallback; e.currentTarget.style.opacity='0.3'; }} />
                      ) : (
                        <img className="img-fluid shadow rounded" src="/assets/logo.png" alt="CRAM" style={{ maxHeight: 200, opacity: 0.3 }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="carousel-control-prev" type="button" data-bs-target="#newsCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Anterior</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#newsCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Siguiente</span>
          </button>

          <div className="carousel-progress mt-3">
            <div className="bar" id="carouselProgress" ref={progressRef}></div>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <main>
        <section className="informacion">
          <h2>Sobre Nosotros</h2>
          <div className="texto-imagenes">
            <div className="texto">
              <p>
                Nuestra Cooperativa fue fundada en el año 1.974, objetivo que fijaron un grupo de 25 rectificadores cuya visión se proyectaba al futuro. Honrando esto y afianzando nuestra unión, ya cumplimos 50 años ininterrumpidos de presencia en el mercado con un sostenido crecimiento, compromiso, seriedad y profesionalismo.
              </p>
              <p>
                Abasteciendo el demandante e innovador mercado automotor, atendiendo las líneas vehicular, Pesada, Agrícola, Vial, Estacionarios (bombeo y generadores), Náutica y Refrigeración industrial (Termo King), etc.
              </p>
              <p>
                Distribuidor, importador y exportador de repuestos nacionales e importados.
              </p>
              <p>
                Siempre ofreceremos una solución a cualquier aplicación y asesoraremos responsablemente sobre consultas o dudas técnicas.
              </p>
              <div className="imagen-entrada">
                <figure>
                  <img src="/assets/Entrada-CRAM.jpg" alt="Entrada Cooperativa CRAM" loading="lazy" />
                  <figcaption style={{ textAlign:'center', fontSize:'0.95em', color:'#388e3c' }}></figcaption>
                </figure>
              </div>
            </div>
            <div className="imagenes-almacenes">
              <figure>
                <img src="/assets/Almacen1.jpg" alt="Almacén CRAM 1" loading="lazy" />
                <figcaption style={{ textAlign:'center', fontSize:'0.95em', color:'#388e3c' }}></figcaption>
              </figure>
              <figure>
                <img src="/assets/Almacen2.jpg" alt="Almacén CRAM 2" loading="lazy" />
                <figcaption style={{ textAlign:'center', fontSize:'0.95em', color:'#388e3c' }}></figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="contacto">
          <h2>Datos de Contacto</h2>
          <div style={{ display:'flex', flexWrap:'wrap', gap:24, alignItems:'center' }}>
            <div>
              <p><strong>WhatsApp:</strong> <a href="https://wa.me/542616565836?text=Hola%20cooperativa%20Cram" target="_blank" rel="noopener">261 656-5836</a></p>
              <p><strong>Teléfono:</strong> 261 438-0313</p>
              <p><strong>Dirección:</strong> Rioja 1771, Ciudad de Mendoza</p>
            </div>
            <div className="mapa" style={{ flex:1, minWidth:220 }}>
              <iframe title="Mapa CRAM" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3350.5795523741444!2d-68.83766088796992!3d-32.882842073509394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x967e091f81c2c63b%3A0x3d1f52988faf14f6!2sCOOPERATIVA%20DE%20RECTIFICADORES%20CRAM!5e0!3m2!1ses!2sar!4v1752706527762!5m2!1ses!2sar" width="100%" height="220" style={{ border:0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            </div>
          </div>
        </section>

        <section className="frase-final">
          <p>“Más de 50 años distribuyendo repuestos para rectificadoras”</p>
        </section>
      </main>
    </>
  );
}
