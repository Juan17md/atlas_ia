export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <title>Sin conexión - Atlas IA</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0a0a0a;
            color: #fafafa;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: 1.5rem;
          }
          .contenedor {
            text-align: center;
            max-width: 400px;
          }
          .icono {
            width: 100px;
            height: 100px;
            margin: 0 auto 1.5rem;
            background: #1a1a1a;
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulso 2s ease-in-out infinite;
          }
          .icono svg { width: 60px; height: 60px; }
          h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }
          p {
            color: #a1a1aa;
            font-size: 0.875rem;
            line-height: 1.5;
            margin-bottom: 1.5rem;
          }
          .estado {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: #1a1a1a;
            border-radius: 2rem;
            font-size: 0.75rem;
            color: #a1a1aa;
          }
          .punto {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ef4444;
            animation: pulso 2s ease-in-out infinite;
          }
          @keyframes pulso {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </head>
      <body>
        <div className="contenedor">
          <div className="icono">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="30" stroke="#FF0000" strokeWidth="6" />
              <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2" strokeDasharray="10 5" />
              <rect x="47" y="10" width="6" height="14" rx="3" fill="white" />
              <rect x="47" y="76" width="6" height="14" rx="3" fill="white" />
            </svg>
          </div>
          <h1>Sin conexión</h1>
          <p>
            No tienes conexión a internet. Algunas funciones pueden no estar disponibles hasta que se restablezca la conexión.
          </p>
          <div className="estado">
            <span className="punto" />
            Esperando conexión...
          </div>
        </div>
      </body>
    </html>
  );
}
