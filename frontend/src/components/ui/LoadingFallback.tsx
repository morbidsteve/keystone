export default function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full font-[var(--font-mono)] text-[13px] text-[var(--color-text-muted)] gap-2">
      <div className="w-[16px] h-[16px]" style={{ border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading…
    </div>
  );
}
