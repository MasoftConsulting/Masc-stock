/**
 * Affiché pendant le chargement d'une page (la navigation reste en place).
 * Silhouette générique : titre, rangée d'indicateurs, liste.
 */
export default function Chargement() {
  return (
    <div aria-busy="true" aria-label="Chargement" className="pt-8 md:pt-14">
      <div className="squelette h-5 w-28" />
      <div className="squelette mt-6 h-12 w-64 max-w-full" />
      <div className="squelette mt-4 h-4 w-96 max-w-full" />

      <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="squelette h-24" />
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="squelette h-20" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </div>
  );
}
