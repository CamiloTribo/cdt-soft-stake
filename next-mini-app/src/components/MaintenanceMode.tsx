import Image from "next/image"

export default function MaintenanceMode() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/LOGO TRIBO Vault- sin fondo.png"
            alt="Tribo Vault"
            width={120}
            height={120}
            className="w-30 h-30 animate-pulse"
          />
        </div>

        {/* Título con emoji animado */}
        <h1 className="text-2xl font-bold text-white">
          🔧 <span className="animate-pulse">Mantenimiento Temporal</span>
        </h1>

        {/* Mensaje actualizado */}
        <div className="space-y-4 text-gray-300">
          <p className="text-lg font-semibold text-yellow-400">⚠️ WORLDCOIN está experimentando problemas técnicos</p>
          <p className="text-base">
            La red de <strong>WorldCoin</strong> y todas las <strong>Mini Apps</strong> están presentando errores de
            conectividad y transacciones.
          </p>
          <p className="text-sm">
            Hemos pausado temporalmente <strong>Tribo Vault</strong> para proteger tus fondos y evitar transacciones
            erróneas mientras WorldCoin soluciona estos problemas.
          </p>
          <p className="text-xs text-gray-400 bg-gray-900 p-2 rounded">
            📅 Última actualización: {new Date().toLocaleString("es-ES")}
          </p>
        </div>

        {/* Estado con animación */}
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping"></div>
            <span className="text-yellow-400 font-medium">Sistema pausado por problemas de WorldCoin</span>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            🛡️ <strong>Tus fondos están seguros</strong>
            <br />
            No se procesarán transacciones hasta que WorldCoin esté estable
          </p>
        </div>

        {/* Links sociales */}
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Mantente informado sobre el estado:</p>
          <div className="flex justify-center space-x-3">
            <a
              href="https://t.me/cryptodigitaltribe"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              📱 Telegram
            </a>
            <a
              href="https://twitter.com/tribocdt"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              🐦 Twitter
            </a>
            <a
              href="https://discord.gg/tribo"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-700 hover:bg-purple-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              💬 Discord
            </a>
          </div>
        </div>

        {/* Tiempo estimado */}
        <div className="text-xs text-gray-500 border-t border-gray-800 pt-4 space-y-1">
          <p>⏱️ Tiempo estimado: Dependiente de WorldCoin</p>
          <p className="text-yellow-400">Revisamos el estado cada 30 minutos</p>
        </div>

        {/* Versión para debug */}
        <div className="text-xs text-gray-600 mt-4">v{Date.now()} - Modo Mantenimiento Activo</div>
      </div>
    </div>
  )
}
