export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#4ebd0a] animate-spin"></div>
        <div className="absolute inset-3 rounded-full border-t-2 border-r-2 border-[#4ebd0a]/70 animate-spin animation-delay-150"></div>
        <div className="absolute inset-6 rounded-full border-t-2 border-r-2 border-[#4ebd0a]/40 animate-spin animation-delay-300"></div>
      </div>
    </div>
  )
}
