// Requirement 9.5 - Loading skeleton for hydration state

interface LoadingSkeletonProps {
  columns?: number;
  categoriesPerColumn?: number;
  appsPerCategory?: number;
}

export function LoadingSkeleton({ 
  columns = 5, 
  categoriesPerColumn = 3,
  appsPerCategory = 4 
}: LoadingSkeletonProps) {
  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-5">
          {Array.from({ length: categoriesPerColumn }).map((_, catIndex) => (
            <div 
              key={catIndex} 
              className="bg-(--bg-secondary) rounded-lg p-3.5 skeleton-pulse"
            >
              {/* Category header skeleton */}
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-5 h-5 rounded bg-(--bg-tertiary)" />
                <div className="h-4 w-24 rounded bg-(--bg-tertiary)" />
              </div>
              
              {/* App items skeleton */}
              <div className="space-y-2.5">
                {Array.from({ length: appsPerCategory }).map((_, appIndex) => (
                  <div key={appIndex} className="flex items-center gap-2.5 py-1.5">
                    <div className="w-4 h-4 rounded bg-(--bg-tertiary)" />
                    <div className="w-5 h-5 rounded bg-(--bg-tertiary)" />
                    <div className="h-3 w-20 rounded bg-(--bg-tertiary)" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
