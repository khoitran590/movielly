// Ambient drifting color field rendered behind Liquid Glass surfaces so the
// material has something to refract / adapt to.
export default function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <div
        className="aurora__blob"
        style={{
          top: '-10%', left: '-5%', width: '45vw', height: '45vw',
          background: 'radial-gradient(circle at 30% 30%, #2563eb, transparent 70%)',
          animation: 'auroraDrift1 26s ease-in-out infinite',
        }}
      />
      <div
        className="aurora__blob"
        style={{
          top: '20%', right: '-10%', width: '40vw', height: '40vw',
          background: 'radial-gradient(circle at 50% 50%, #0ea5e9, transparent 70%)',
          animation: 'auroraDrift2 32s ease-in-out infinite',
        }}
      />
      <div
        className="aurora__blob"
        style={{
          bottom: '-15%', left: '25%', width: '38vw', height: '38vw',
          background: 'radial-gradient(circle at 50% 50%, #1e3a8a, transparent 70%)',
          animation: 'auroraDrift3 29s ease-in-out infinite',
          opacity: 0.45,
        }}
      />
    </div>
  );
}
