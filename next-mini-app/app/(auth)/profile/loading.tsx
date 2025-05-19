import LoadingSpinner from "@/src/components/LoadingSpinner"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <LoadingSpinner size="lg" />
    </div>
  )
}
