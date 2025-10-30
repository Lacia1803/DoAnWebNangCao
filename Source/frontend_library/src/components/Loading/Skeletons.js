import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * Loading skeleton for book cards
 */
export const BookCardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array(count).fill(0).map((_, index) => (
        <div key={index} className="book-card-skeleton">
          <Skeleton height={300} />
          <div style={{ padding: '1rem' }}>
            <Skeleton height={24} width="80%" />
            <Skeleton height={16} width="60%" style={{ marginTop: '0.5rem' }} />
            <Skeleton height={16} width="40%" style={{ marginTop: '0.5rem' }} />
            <div style={{ marginTop: '1rem' }}>
              <Skeleton height={36} width="100%" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Loading skeleton for book list table
 */
export const BookListSkeleton = ({ rows = 5 }) => {
  return (
    <div className="skeleton-table">
      {Array(rows).fill(0).map((_, index) => (
        <div key={index} className="skeleton-row" style={{ marginBottom: '1rem' }}>
          <Skeleton height={60} />
        </div>
      ))}
    </div>
  );
};

/**
 * Loading skeleton for book details
 */
export const BookDetailSkeleton = () => {
  return (
    <div className="book-detail-skeleton">
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 300px' }}>
          <Skeleton height={450} />
        </div>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <Skeleton height={40} width="70%" />
          <Skeleton height={24} width="50%" style={{ marginTop: '1rem' }} />
          <Skeleton height={24} width="40%" style={{ marginTop: '0.5rem' }} />
          <div style={{ marginTop: '2rem' }}>
            <Skeleton height={20} width="30%" />
            <Skeleton count={4} height={16} style={{ marginTop: '0.5rem' }} />
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <Skeleton height={40} width={120} />
            <Skeleton height={40} width={120} />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading skeleton for user profile
 */
export const ProfileSkeleton = () => {
  return (
    <div className="profile-skeleton">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
        <Skeleton circle width={100} height={100} />
        <div style={{ flex: 1 }}>
          <Skeleton height={32} width="40%" />
          <Skeleton height={20} width="60%" style={{ marginTop: '0.5rem' }} />
        </div>
      </div>
      <div>
        <Skeleton height={24} width="30%" style={{ marginBottom: '1rem' }} />
        <Skeleton count={5} height={50} style={{ marginBottom: '1rem' }} />
      </div>
    </div>
  );
};

/**
 * Loading skeleton for dashboard stats
 */
export const DashboardStatsSkeleton = () => {
  return (
    <div className="stats-skeleton" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      {Array(4).fill(0).map((_, index) => (
        <div key={index} style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
          <Skeleton height={24} width="60%" />
          <Skeleton height={40} width="40%" style={{ marginTop: '1rem' }} />
          <Skeleton height={16} width="80%" style={{ marginTop: '0.5rem' }} />
        </div>
      ))}
    </div>
  );
};

/**
 * Generic loading skeleton
 */
export const GenericSkeleton = ({ width = '100%', height = 20, count = 1 }) => {
  return <Skeleton width={width} height={height} count={count} />;
};

export default {
  BookCardSkeleton,
  BookListSkeleton,
  BookDetailSkeleton,
  ProfileSkeleton,
  DashboardStatsSkeleton,
  GenericSkeleton
};
