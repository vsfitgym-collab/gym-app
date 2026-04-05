import './Skeleton.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', className = '' }: SkeletonProps) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton width={56} height={56} borderRadius={12} />
      <div className="skeleton-card-content">
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={14} />
        <div className="skeleton-card-meta">
          <Skeleton width={80} height={12} />
          <Skeleton width={60} height={12} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="skeleton-stats">
      <Skeleton width={80} height={48} borderRadius={12} />
      <Skeleton width={80} height={48} borderRadius={12} />
      <Skeleton width={80} height={48} borderRadius={12} />
    </div>
  )
}

export function SkeletonText({ lines = 2 }: { lines?: number }) {
  return (
    <div className="skeleton-text">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? '60%' : '100%'} 
          height={14} 
        />
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard">
      <Skeleton width={200} height={24} />
      <div className="skeleton-list">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      
      <Skeleton width={200} height={24} />
      <div className="skeleton-stats">
        <Skeleton width="30%" height={80} borderRadius={12} />
        <Skeleton width="30%" height={80} borderRadius={12} />
        <Skeleton width="30%" height={80} borderRadius={12} />
      </div>
    </div>
  )
}

export default Skeleton
