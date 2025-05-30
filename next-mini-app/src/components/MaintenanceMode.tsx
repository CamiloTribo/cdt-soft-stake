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
            className="w-30 h-30"
          />
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-white">🔧 Mantenimiento Temporal</h1>

        {/* Mensaje */}
        <div className="space-y-4 text-gray-300">
          <p className="text-lg">Estamos experimentando problemas técnicos con nuestro proveedor de blockchain.</p>
          <p>
            Hemos pausado temporalmente todas las operaciones para proteger tus fondos y evitar transacciones erróneas.
          </p>
          <p className="text-sm text-gray-400">Trabajamos para solucionarlo lo antes posible.</p>
        </div>

        {/* Estado */}
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-400 font-medium">Sistema en mantenimiento</span>
          </div>
        </div>

        {/* Links sociales */}
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Mantente informado:</p>
          <div className="flex justify-center space-x-4">
            <a
              href="https://t.me/cryptodigitaltribe"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              📱 Telegram
            </a>
            <a
              href="https://twitter.com/tribocdt"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🐦 Twitter
            </a>
          </div>
        </div>

        {/* Tiempo estimado */}
        <div className="text-xs text-gray-500 border-t border-gray-800 pt-4">
          Tiempo estimado de resolución: 1-2 horas
        </div>
      </div>
    </div>
  )
}
